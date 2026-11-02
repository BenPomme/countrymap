'use client'

import { useCallback, useEffect, useId, useRef, useState, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import {
  Check,
  Copy,
  Download,
  Loader2,
  MessageCircle,
  RotateCcw,
  Share2,
  X,
} from 'lucide-react'
import { trackEvent } from '@/lib/analytics/events'
import { generateVisualShareCard } from './shareCard'
import {
  buildShareFilename,
  buildWhatsAppShareUrl,
  isNativeShareCancellation,
  normalizeShareCopy,
  resolveShareContentId,
  sanitizeAnalyticsValue,
} from './shareState'
import { useDialogFocus } from './useDialogFocus'

interface VisualShareProps {
  targetRef?: RefObject<HTMLElement>
  title: string
  description: string
  url?: string
  className?: string
  sourceName?: string
  sourceVintage?: string
  sourceUrl?: string
  stat?: string
  detail?: string
  contentId?: string
  placement?: string
  onOpenChange?: (open: boolean) => void
}

type CaptureState = 'idle' | 'capturing' | 'ready' | 'error'
type CopyState = 'idle' | 'image' | 'url' | 'error'

const SHARE_CARD_TIMEOUT_MS = 20000

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error('Share card generation timed out'))
    }, timeoutMs)

    promise.then(
      (value) => {
        window.clearTimeout(timer)
        resolve(value)
      },
      (error: unknown) => {
        window.clearTimeout(timer)
        reject(error)
      },
    )
  })
}

function track(name: string, params: Record<string, string | number | boolean | undefined>): void {
  try {
    trackEvent(name, params)
  } catch {
    // Measurement must never block sharing.
  }
}

export default function VisualShare({
  targetRef,
  title,
  description,
  url,
  className = '',
  sourceName = 'The World Truth country dataset',
  sourceVintage = 'Vintage not stated for this measure',
  sourceUrl,
  stat,
  detail,
  contentId,
  placement = 'share_dialog',
  onOpenChange,
}: VisualShareProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [captureState, setCaptureState] = useState<CaptureState>('idle')
  const [imageBlob, setImageBlob] = useState<Blob | null>(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [copyState, setCopyState] = useState<CopyState>('idle')
  const [statusMessage, setStatusMessage] = useState('')
  const [canNativeShare, setCanNativeShare] = useState(false)
  const generationRef = useRef(0)
  const previewUrlRef = useRef('')
  const statusTimerRef = useRef<number | null>(null)
  const dialogTitleId = useId()
  const dialogDescriptionId = useId()

  const closeDialog = useCallback(() => {
    setIsOpen(false)
    onOpenChange?.(false)
  }, [onOpenChange])
  const dialogRef = useDialogFocus(isOpen, closeDialog)

  const showStatus = useCallback((message: string, clearAfter = 0) => {
    if (statusTimerRef.current !== null) window.clearTimeout(statusTimerRef.current)
    statusTimerRef.current = null
    setStatusMessage(message)
    if (clearAfter > 0) {
      statusTimerRef.current = window.setTimeout(() => {
        setStatusMessage('')
        statusTimerRef.current = null
      }, clearAfter)
    }
  }, [])

  const clearPreview = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = ''
    }
    setPreviewUrl('')
  }, [])

  useEffect(() => {
    setCanNativeShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function')
  }, [])

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
      if (statusTimerRef.current !== null) window.clearTimeout(statusTimerRef.current)
    }
  }, [])

  const resolvedContentId = resolveShareContentId(contentId)
  const resolvedPlacement = sanitizeAnalyticsValue(placement, 'share_dialog')
  const resolvedUrl = url || (typeof window !== 'undefined' ? window.location.href : '')

  const prepareCard = useCallback(async () => {
    const generation = generationRef.current + 1
    generationRef.current = generation
    setImageBlob(null)
    clearPreview()
    setCaptureState('capturing')
    setCopyState('idle')
    showStatus('Building your share card.')

    try {
      const destination = url || (typeof window !== 'undefined' ? window.location.href : '')
      const card = await withTimeout(
        generateVisualShareCard({
          title,
          description,
          url: destination,
          stat,
          detail,
          sourceName,
          sourceVintage,
          target: targetRef?.current ?? null,
        }),
        SHARE_CARD_TIMEOUT_MS,
      )
      if (generationRef.current !== generation) return

      clearPreview()
      const nextPreviewUrl = URL.createObjectURL(card)
      previewUrlRef.current = nextPreviewUrl
      setImageBlob(card)
      setPreviewUrl(nextPreviewUrl)
      setCaptureState('ready')
      showStatus('Share card ready.')
    } catch {
      if (generationRef.current !== generation) return
      setImageBlob(null)
      clearPreview()
      setCaptureState('error')
      showStatus('We could not build the share image. Try again or share the link.')
      track('share_error', {
        content_id: resolvedContentId,
        placement: resolvedPlacement,
        method: 'image_generation',
        status: 'capture_failed',
      })
    }
  }, [
    clearPreview,
    description,
    detail,
    resolvedContentId,
    resolvedPlacement,
    showStatus,
    sourceName,
    sourceVintage,
    stat,
    targetRef,
    title,
    url,
  ])

  const handleOpen = () => {
    setIsOpen(true)
    onOpenChange?.(true)
    track('share_intent', {
      content_id: resolvedContentId,
      placement: resolvedPlacement,
      method: 'dialog',
    })
    void prepareCard()
  }

  const handleCopy = async () => {
    if (!imageBlob) return

    try {
      if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') {
        throw new Error('Image clipboard is unavailable')
      }
      await navigator.clipboard.write([new ClipboardItem({ [imageBlob.type]: imageBlob })])
      setCopyState('image')
      showStatus('Share image copied.', 2500)
      track('share_copy', {
        content_id: resolvedContentId,
        placement: resolvedPlacement,
        method: 'image_clipboard',
        status: 'success',
      })
    } catch {
      try {
        if (!navigator.clipboard?.writeText) throw new Error('Text clipboard is unavailable')
        await navigator.clipboard.writeText(resolvedUrl)
        setCopyState('url')
        showStatus('Link copied. The image was not copied.', 3000)
        track('share_copy', {
          content_id: resolvedContentId,
          placement: resolvedPlacement,
          method: 'url_fallback',
          status: 'success',
        })
      } catch {
        setCopyState('error')
        showStatus('Could not copy. Use Download or copy the address bar.')
        track('share_error', {
          content_id: resolvedContentId,
          placement: resolvedPlacement,
          method: 'clipboard',
          status: 'copy_failed',
        })
      }
    }
  }

  const handleDownload = () => {
    if (!imageBlob) return
    let objectUrl = ''

    try {
      objectUrl = URL.createObjectURL(imageBlob)
      const anchor = document.createElement('a')
      anchor.href = objectUrl
      anchor.download = buildShareFilename(title)
      document.body.appendChild(anchor)
      try {
        anchor.click()
      } finally {
        anchor.remove()
      }
      showStatus('Download requested. Check your browser downloads.', 3500)
      track('share_handoff', {
        content_id: resolvedContentId,
        placement: resolvedPlacement,
        method: 'download',
        status: 'requested',
      })
    } catch {
      showStatus('Could not start the download. Try Copy or use the page link.')
      track('share_error', {
        content_id: resolvedContentId,
        placement: resolvedPlacement,
        method: 'download',
        status: 'download_failed',
      })
    } finally {
      if (objectUrl) {
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
      }
    }
  }

  const handleWhatsApp = () => {
    try {
      window.open(
        buildWhatsAppShareUrl(description, resolvedUrl),
        '_blank',
        'noopener,noreferrer',
      )
      showStatus('WhatsApp handoff requested. If no tab opens, allow pop-ups or use Copy.', 3500)
      track('share_handoff', {
        content_id: resolvedContentId,
        placement: resolvedPlacement,
        method: 'whatsapp',
        status: 'requested',
      })
    } catch {
      showStatus('WhatsApp could not open. Use Copy or the page link.')
      track('share_error', {
        content_id: resolvedContentId,
        placement: resolvedPlacement,
        method: 'whatsapp',
        status: 'handoff_failed',
      })
    }
  }

  const handleNativeShare = async () => {
    if (!imageBlob || !canNativeShare) return

    try {
      const file = new File([imageBlob], buildShareFilename(title), { type: 'image/png' })
      const canShareFile =
        typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })

      if (canShareFile) {
        await navigator.share({
          title: normalizeShareCopy(title),
          text: normalizeShareCopy(description),
          url: resolvedUrl,
          files: [file],
        })
      } else {
        await navigator.share({
          title: normalizeShareCopy(title),
          text: normalizeShareCopy(description),
          url: resolvedUrl,
        })
      }
      showStatus('Shared.', 2500)
      track('share_handoff', {
        content_id: resolvedContentId,
        placement: resolvedPlacement,
        method: canShareFile ? 'native_file' : 'native_link',
        status: 'success',
      })
    } catch (error) {
      if (isNativeShareCancellation(error)) {
        showStatus('Share cancelled.')
        track('share_cancel', {
          content_id: resolvedContentId,
          placement: resolvedPlacement,
          method: 'native',
          status: 'cancelled',
        })
        return
      }
      showStatus('Native share did not complete. Try WhatsApp or Download.')
      track('share_error', {
        content_id: resolvedContentId,
        placement: resolvedPlacement,
        method: 'native',
        status: 'failed',
      })
    }
  }

  const dialog =
    isOpen && typeof document !== 'undefined'
      ? createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <button
              type="button"
              aria-label="Close share dialog"
              className="absolute inset-0 cursor-default bg-[#192947]/65"
              onClick={closeDialog}
            />
            <div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={dialogTitleId}
              aria-describedby={dialogDescriptionId}
              tabIndex={-1}
              className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-[#192947]/15 bg-[#fff9e8] p-5 text-[#192947] shadow-2xl md:p-7"
            >
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#294cc4]">Share this find</p>
                  <h2 id={dialogTitleId} className="mt-1 text-2xl font-black tracking-tight">
                    A clear card for this find
                  </h2>
                  <p id={dialogDescriptionId} className="mt-2 text-sm leading-6 text-[#192947]/70">
                    The card includes the title, source vintage and the exact link to this page.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeDialog}
                  className="rounded-full p-2 text-[#192947]/60 transition-colors hover:bg-[#192947]/10 hover:text-[#192947] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294cc4] motion-reduce:transition-none"
                  aria-label="Close share dialog"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>

              <div
                className="mb-5 overflow-hidden rounded-2xl border border-[#192947]/15 bg-white"
                aria-busy={captureState === 'capturing'}
              >
                {captureState === 'capturing' && (
                  <div className="flex h-56 flex-col items-center justify-center gap-3 text-[#192947]/65">
                    <Loader2 className="h-8 w-8 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                    <span className="text-sm font-semibold">Building a readable share card...</span>
                  </div>
                )}
                {captureState === 'ready' && previewUrl && (
                  <img
                    src={previewUrl}
                    alt={`Share card preview: ${normalizeShareCopy(title)}`}
                    className="block h-auto w-full"
                  />
                )}
                {captureState === 'error' && (
                  <div className="flex min-h-56 flex-col items-center justify-center gap-3 px-6 text-center">
                    <p className="font-bold">The image could not be generated.</p>
                    <p className="max-w-md text-sm text-[#192947]/70">
                      Retry the image, or close this dialog and use the page link.
                    </p>
                    <button
                      type="button"
                      onClick={() => void prepareCard()}
                      className="inline-flex items-center gap-2 rounded-full bg-[#294cc4] px-4 py-2 text-sm font-bold text-white hover:bg-[#1f3ca0] motion-reduce:transition-none"
                    >
                      <RotateCcw className="h-4 w-4" aria-hidden="true" />
                      Try again
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleWhatsApp}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#246e55] px-4 py-3 font-bold text-white transition-colors hover:bg-[#1c5944] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#246e55] motion-reduce:transition-none"
                >
                  <MessageCircle className="h-5 w-5" aria-hidden="true" />
                  WhatsApp
                </button>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => void handleCopy()}
                    disabled={!imageBlob}
                    className="flex items-center justify-center gap-2 rounded-xl border border-[#192947]/20 bg-white px-4 py-3 font-bold text-[#192947] transition-colors hover:bg-[#ffda62]/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294cc4] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
                  >
                    {copyState === 'image' || copyState === 'url' ? (
                      <Check className="h-5 w-5 text-[#246e55]" aria-hidden="true" />
                    ) : (
                      <Copy className="h-5 w-5" aria-hidden="true" />
                    )}
                    {copyState === 'image' ? 'Image copied' : copyState === 'url' ? 'Link copied' : 'Copy'}
                  </button>
                  <button
                    type="button"
                    onClick={handleDownload}
                    disabled={!imageBlob}
                    className="flex items-center justify-center gap-2 rounded-xl border border-[#192947]/20 bg-white px-4 py-3 font-bold text-[#192947] transition-colors hover:bg-[#ffda62]/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294cc4] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
                  >
                    <Download className="h-5 w-5" aria-hidden="true" />
                    Download
                  </button>
                </div>

                {canNativeShare && (
                  <button
                    type="button"
                    onClick={() => void handleNativeShare()}
                    disabled={!imageBlob}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#192947] px-4 py-3 font-bold text-white transition-colors hover:bg-[#0f1c33] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294cc4] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
                  >
                    <Share2 className="h-5 w-5" aria-hidden="true" />
                    More sharing options
                  </button>
                )}
              </div>

              <div
                className={`mt-4 min-h-6 rounded-lg px-3 py-2 text-sm font-semibold ${
                  captureState === 'error' || copyState === 'error'
                    ? 'bg-[#dc654e]/12 text-[#9c3726]'
                    : 'bg-[#294cc4]/8 text-[#294cc4]'
                }`}
                role="status"
                aria-live="polite"
              >
                {statusMessage}
              </div>

              <div className="mt-5 border-t border-[#192947]/10 pt-4 text-xs leading-5 text-[#192947]/65">
                <p>
                  <span className="font-bold text-[#192947]">Source:</span> {normalizeShareCopy(sourceName)}
                  {' | '}
                  <span className="font-bold text-[#192947]">Vintage:</span> {normalizeShareCopy(sourceVintage)}
                </p>
                {sourceUrl && /^https?:\/\//.test(sourceUrl) && (
                  <a
                    href={sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-block text-[#294cc4] underline decoration-[#294cc4]/30 underline-offset-2"
                  >
                    Open the source
                  </a>
                )}
                <p className="mt-2 break-all font-mono text-[11px] text-[#192947]/55">{resolvedUrl}</p>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className={`inline-flex items-center justify-center gap-2 rounded-full bg-[#294cc4] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#1f3ca0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294cc4] motion-reduce:transition-none ${className}`}
      >
        <Share2 className="h-4 w-4" aria-hidden="true" />
        Share
      </button>

      {dialog}
    </>
  )
}

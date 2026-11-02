'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { trackEvent } from '@/lib/analytics/events'
import { buildChallengeUrl, normalizeGiftCode } from '@/lib/truthle/gifts'
import { createTruthleSharePromo, getStoredSharePromo, recordShare, type SharePromo } from '@/lib/truthle/storage'
import SharePromoCard from './SharePromoCard'
import { generateResultCard } from './shareCardImage'
import {
  buildShareCopy,
  clipboardFailureStatus,
  GAME_TITLES,
  isGiftUsableForDay,
  shareCardFileName,
  shareFailureKind,
  type ShareResultData,
} from './resultShare'

interface ResultSharePanelProps extends ShareResultData {
  onFirstShare?: () => void
}

type MessageTone = 'neutral' | 'success' | 'error' | 'pending'

function messageClass(tone: MessageTone): string {
  if (tone === 'success') return 'text-[#246e55]'
  if (tone === 'error') return 'text-[#a33f2c]'
  if (tone === 'pending') return 'text-[#294cc4]'
  return 'text-[#59647a]'
}

function triggerDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  try {
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = fileName
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
  } finally {
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
}

export default function ResultSharePanel({
  game,
  day,
  score,
  correct,
  total,
  streak,
  onFirstShare,
}: ResultSharePanelProps) {
  const result = useMemo<ShareResultData>(() => ({ game, day, score, correct, total, streak }), [game, day, score, correct, total, streak])

  const [promo, setPromo] = useState<SharePromo | null>(null)
  const [now, setNow] = useState(Date.now())
  const [giftBusy, setGiftBusy] = useState(false)
  const [cardBlob, setCardBlob] = useState<Blob | null>(null)
  const [cardBusy, setCardBusy] = useState(false)
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [messageTone, setMessageTone] = useState<MessageTone>('neutral')
  const [fallbackText, setFallbackText] = useState('')
  const [storedGiftExpired, setStoredGiftExpired] = useState(false)
  const fallbackRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setCardBlob(null)
    setFallbackText('')
    setMessage('')
    setMessageTone('neutral')
  }, [result])

  useEffect(() => {
    setPromo(null)
    setStoredGiftExpired(false)
    setFallbackText('')
    const stored = getStoredSharePromo()
    if (!stored) return
    const storedCode = normalizeGiftCode(stored.code)
    if (!storedCode) return
    if (isGiftUsableForDay(stored.expiresAt, day)) setPromo({ ...stored, code: storedCode })
    else setStoredGiftExpired(true)
  }, [day])

  useEffect(() => {
    if (!fallbackText) return
    const timer = window.setTimeout(() => {
      fallbackRef.current?.focus()
      fallbackRef.current?.select()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [fallbackText])

  useEffect(() => {
    if (!promo) return
    const timer = window.setInterval(() => setNow(Date.now()), 30000)
    return () => window.clearInterval(timer)
  }, [promo])

  const shareUrl = useMemo(() => buildChallengeUrl({ game, day }), [day, game])
  const plainText = useMemo(() => buildShareCopy(result, shareUrl), [result, shareUrl])
  const giftUrl = useMemo(
    () => (promo ? buildChallengeUrl({ game, day, code: promo.code }) : null),
    [day, game, promo],
  )
  const giftText = promo && giftUrl
    ? buildShareCopy(result, giftUrl, { code: promo.code, expiresAt: promo.expiresAt })
    : null

  const setStatus = (nextMessage: string, tone: MessageTone = 'neutral') => {
    setMessage(nextMessage)
    setMessageTone(tone)
  }

  const recordShareAction = () => {
    try {
      const { isFirstShare } = recordShare()
      if (isFirstShare) onFirstShare?.()
    } catch {
      // Local badge bookkeeping must not rewrite a completed browser action.
    }
  }

  const copyText = async (text: string, method: string, successMessage: string) => {
    if (busyAction) return
    setBusyAction(method)
    setFallbackText('')
    setStatus('Copying...', 'pending')
    trackEvent('share_intent', { game, puzzle_day: day, method })
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable')
      await navigator.clipboard.writeText(text)
      trackEvent('share_copy', { game, puzzle_day: day, method, status: 'success' })
      recordShareAction()
      setStatus(successMessage, 'success')
    } catch (error) {
      trackEvent('share_error', { game, puzzle_day: day, method, status: clipboardFailureStatus(error) })
      setFallbackText(text)
      setStatus('Your browser did not confirm a copy. Select the message below and copy it manually.', 'error')
    } finally {
      setBusyAction(null)
    }
  }

  const sharePlainResult = async () => {
    if (busyAction) return
    if (!navigator.share) {
      await copyText(plainText, 'clipboard', 'Result copied. Paste it into a message when you are ready.')
      return
    }

    trackEvent('share_intent', { game, puzzle_day: day, method: 'native' })
    setBusyAction('native')
    setFallbackText('')
    try {
      await navigator.share({ title: `${GAME_TITLES[game]} ${day}`, text: plainText, url: shareUrl })
      recordShareAction()
      trackEvent('share_handoff', { game, puzzle_day: day, method: 'native', status: 'handed_off' })
      setStatus('Share sheet closed. This page cannot confirm delivery; check the other app if you want to verify it was sent.', 'success')
    } catch (error) {
      const kind = shareFailureKind(error)
      trackEvent(kind === 'cancel' ? 'share_cancel' : 'share_error', { game, puzzle_day: day, method: 'native', status: kind })
      if (kind === 'cancel') {
        setStatus('Share cancelled. Nothing was sent. Your result is still here.', 'neutral')
      } else {
        setFallbackText(plainText)
        setStatus('Your browser could not open the share sheet. Use the message below, or try again.', 'error')
      }
    } finally {
      setBusyAction(null)
    }
  }

  const shareGift = async () => {
    if (!giftText || !giftUrl || busyAction) return
    if (!navigator.share) {
      await copyText(giftText, 'clipboard_gift', 'Gift message copied. Send the message when you are ready.')
      return
    }

    trackEvent('share_intent', { game, puzzle_day: day, method: 'native_gift' })
    setBusyAction('native_gift')
    setFallbackText('')
    try {
      await navigator.share({ title: `Free Extra Attempt for ${GAME_TITLES[game]}`, text: giftText, url: giftUrl })
      recordShareAction()
      trackEvent('share_handoff', { game, puzzle_day: day, method: 'native_gift', status: 'handed_off' })
      setStatus('Share sheet closed. This page cannot confirm delivery. The prepared gift remains available here.', 'success')
    } catch (error) {
      const kind = shareFailureKind(error)
      trackEvent(kind === 'cancel' ? 'share_cancel' : 'share_error', { game, puzzle_day: day, method: 'native_gift', status: kind })
      if (kind === 'cancel') {
        setStatus('Gift share cancelled. Nothing was sent and your prepared gift was kept.', 'neutral')
      } else {
        setFallbackText(giftText)
        setStatus('Your browser could not open the gift share sheet. The prepared gift is still here.', 'error')
      }
    } finally {
      setBusyAction(null)
    }
  }

  const openWhatsApp = (text: string, method: 'whatsapp' | 'whatsapp_gift') => {
    trackEvent('share_intent', { game, puzzle_day: day, method })
    try {
      const opened = window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
      if (!opened) {
        trackEvent('share_error', { game, puzzle_day: day, method, status: 'blocked' })
        setFallbackText(text)
        setStatus('Your browser blocked the WhatsApp tab. Use the message below instead.', 'error')
        return
      }
      try {
        opened.opener = null
      } catch {
        // The handoff already opened even if this browser restricts opener changes.
      }
      recordShareAction()
      trackEvent('share_handoff', { game, puzzle_day: day, method, status: 'opened' })
      setFallbackText('')
      setStatus('WhatsApp opened in a new tab. This page cannot confirm whether the message was sent.', 'neutral')
    } catch {
      trackEvent('share_error', { game, puzzle_day: day, method, status: 'blocked' })
      setFallbackText(text)
      setStatus('WhatsApp could not be opened. Use the message below instead.', 'error')
    }
  }

  const prepareImage = async (): Promise<Blob | null> => {
    if (cardBlob) return cardBlob
    if (cardBusy) return null
    setCardBusy(true)
    setStatus('Building your square result image...', 'pending')
    try {
      const blob = await generateResultCard(result, shareUrl)
      setCardBlob(blob)
      setStatus('Image ready. Tap Share image or Download PNG.', 'success')
      return blob
    } catch {
      trackEvent('share_error', { game, puzzle_day: day, method: 'image', status: 'generation' })
      setFallbackText(plainText)
      setStatus('The image could not be created in this browser. Use the result text below or try again.', 'error')
      return null
    } finally {
      setCardBusy(false)
    }
  }

  const shareImage = async () => {
    if (busyAction) return
    if (!cardBlob) {
      const prepared = await prepareImage()
      if (prepared) setStatus('Image ready. Tap Share image again to open your share sheet.', 'pending')
      return
    }

    let file: File | null = null
    let canShareFile = false
    try {
      file = new File([cardBlob], shareCardFileName(game, day), { type: 'image/png' })
      canShareFile = typeof navigator.share === 'function'
        && typeof navigator.canShare === 'function'
        && navigator.canShare({ files: [file] })
    } catch {
      trackEvent('share_error', { game, puzzle_day: day, method: 'native_image', status: 'unavailable' })
    }
    if (!file || !canShareFile) {
      setFallbackText(plainText)
      setStatus('This browser cannot attach an image to a share sheet. Download the PNG or use the result text below.', 'error')
      return
    }

    trackEvent('share_intent', { game, puzzle_day: day, method: 'native_image' })
    setBusyAction('native_image')
    try {
      await navigator.share({ title: `${GAME_TITLES[game]} ${day}`, text: plainText, url: shareUrl, files: [file] })
      recordShareAction()
      trackEvent('share_handoff', { game, puzzle_day: day, method: 'native_image', status: 'handed_off' })
      setStatus('Image share sheet closed. This page cannot confirm delivery. The PNG remains available here.', 'success')
    } catch (error) {
      const kind = shareFailureKind(error)
      trackEvent(kind === 'cancel' ? 'share_cancel' : 'share_error', { game, puzzle_day: day, method: 'native_image', status: kind })
      if (kind === 'cancel') {
        setStatus('Image share cancelled. Nothing was sent and the image is still ready here.', 'neutral')
      } else {
        setFallbackText(plainText)
        setStatus('The image could not be shared. Download the PNG or use the result text below.', 'error')
      }
    } finally {
      setBusyAction(null)
    }
  }

  const downloadImage = async () => {
    if (busyAction) return
    const blob = cardBlob || await prepareImage()
    if (!blob) return

    try {
      triggerDownload(blob, shareCardFileName(game, day))
      setStatus('PNG download started. This page cannot confirm where your browser saved it.', 'neutral')
    } catch {
      setFallbackText(plainText)
      trackEvent('share_error', { game, puzzle_day: day, method: 'image_download', status: 'download' })
      setStatus('The PNG download could not start. Use the result text below instead.', 'error')
    }
  }

  const prepareGift = async (intent: 'share' | 'copy') => {
    if (giftBusy || busyAction) return
    setGiftBusy(true)
    setFallbackText('')
    setStatus('Preparing one friend Extra Attempt for today...', 'pending')
    try {
      const created = await createTruthleSharePromo()
      const createdCode = normalizeGiftCode(created?.code)
      if (!created || !createdCode || !isGiftUsableForDay(created.expiresAt, day)) {
        trackEvent('reward_mint', { game, puzzle_day: day, status: 'failed' })
        setStatus('The friend gift or its expiry could not be confirmed. Choose a gift action to try again.', 'error')
        return
      }

      setPromo({ ...created, code: createdCode })
      setNow(Date.now())
      trackEvent('reward_mint', { game, puzzle_day: day, status: 'success' })
      const nextAction = intent === 'share' ? 'Share gift' : 'Copy gift'
      setStatus(`Friend gift prepared. Tap ${nextAction} to continue. Nothing has been sent or copied yet.`, 'success')
    } catch {
      trackEvent('reward_mint', { game, puzzle_day: day, status: 'failed' })
      setStatus('The friend gift could not be prepared. Choose a gift action to try again.', 'error')
    } finally {
      setGiftBusy(false)
    }
  }

  const giftExpired = promo ? !isGiftUsableForDay(promo.expiresAt, day, now) : false

  return (
    <section className="twt-panel mx-auto w-full max-w-2xl p-5 text-left sm:p-6" aria-labelledby="share-result-heading">
      <p className="twt-kicker">Share first</p>
      <h3 id="share-result-heading" className="twt-display mt-1 text-2xl font-black text-[#192947]">Send today&apos;s challenge</h3>
      <p className="mt-1 text-sm text-[#59647a]">Your scorecard never includes today&apos;s answers. Every share opens the same game and day.</p>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <button type="button" onClick={() => void sharePlainResult()} disabled={busyAction !== null} className="twt-button min-h-11">
          {busyAction === 'native' ? 'Opening share sheet...' : 'Share result'}
        </button>
        <button
          type="button"
          onClick={() => void copyText(plainText, 'clipboard', 'Result copied. Paste it into a message when you are ready.')}
          disabled={busyAction !== null}
          className="twt-button-secondary min-h-11"
        >
          Copy result
        </button>
        <button type="button" onClick={() => openWhatsApp(plainText, 'whatsapp')} className="twt-button-secondary min-h-11">
          Share on WhatsApp
        </button>
        <button type="button" onClick={() => void shareImage()} disabled={cardBusy || busyAction !== null} className="twt-button-secondary min-h-11">
          {cardBusy ? 'Building image...' : cardBlob ? 'Share image' : 'Prepare image'}
        </button>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
        <button type="button" onClick={() => void downloadImage()} disabled={cardBusy} className="font-semibold text-[#294cc4] underline">
          Download PNG
        </button>
        {cardBlob && <span className="text-[#59647a]">Square image ready</span>}
      </div>

      <p role="status" aria-live="polite" className={`mt-3 min-h-5 text-sm ${messageClass(messageTone)}`}>
        {message}
      </p>

      {fallbackText && (
        <div className="mt-2">
          <label htmlFor={`share-fallback-${game}`} className="text-xs font-bold text-[#192947]">Select and copy this message</label>
          <textarea
            id={`share-fallback-${game}`}
            readOnly
            value={fallbackText}
            rows={6}
            onFocus={(event) => event.currentTarget.select()}
            className="mt-1 w-full rounded-xl border border-[#d8d2c2] bg-white p-3 font-mono text-xs text-[#192947]"
          />
        </div>
      )}

      <div className="mt-5 border-t border-[#d8d2c2] pt-5">
        <h4 className="font-black text-[#192947]">Friend Extra Attempt</h4>
        <p className="mt-1 text-sm text-[#59647a]">Create one single-use gift for a friend and today only. Choose a gift action to mint it. Nothing is minted when you open your result.</p>

        {!promo || giftExpired ? (
          <div className="mt-3">
            {storedGiftExpired && !giftExpired && (
              <p className="mb-2 text-sm text-[#a33f2c]">A stored friend gift is no longer usable. Choose a gift action to prepare a new one.</p>
            )}
            {giftExpired && <p className="mb-2 text-sm text-[#a33f2c]">The prepared gift expired. It was not sent by this page.</p>}
            <div className="grid gap-2 sm:grid-cols-2">
              <button type="button" onClick={() => void prepareGift('share')} disabled={giftBusy || busyAction !== null} className="twt-button-secondary min-h-11">
                {giftBusy ? 'Preparing gift...' : 'Share new friend gift'}
              </button>
              <button type="button" onClick={() => void prepareGift('copy')} disabled={giftBusy || busyAction !== null} className="twt-button-secondary min-h-11">
                {giftBusy ? 'Preparing gift...' : 'Copy new friend gift'}
              </button>
            </div>
            <p className="mt-2 text-xs text-[#59647a]">The gift is shown here first. You choose how to send or copy it in a second step.</p>
          </div>
        ) : (
          <>
            <SharePromoCard promo={promo} />
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <button type="button" onClick={() => void shareGift()} disabled={busyAction !== null} className="twt-button-secondary min-h-11">
                {busyAction === 'native_gift' ? 'Opening gift share...' : 'Share gift'}
              </button>
              <button
                type="button"
                onClick={() => giftText && void copyText(giftText, 'clipboard_gift', 'Gift copied. Send the message when you are ready.')}
                disabled={busyAction !== null}
                className="twt-button-secondary min-h-11"
              >
                Copy gift
              </button>
              <button type="button" onClick={() => giftText && openWhatsApp(giftText, 'whatsapp_gift')} className="twt-button-secondary min-h-11 sm:col-span-2">
                Send gift on WhatsApp
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  )
}

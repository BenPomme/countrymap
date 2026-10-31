'use client'

import { useCallback, useEffect, useState } from 'react'
import { generateShareText } from '@/lib/truthle/scoring'
import { recordShare } from '@/lib/truthle/storage'
import {
  generateShareCardBlob,
  shareCardFileName,
  canShareFiles,
  downloadBlob,
  isShareAbortError,
  preloadShareCardLogo,
} from '@/lib/truthle/shareCard'
import { mintSharePromo, getStoredSharePromo, type SharePromo } from '@/lib/truthle/storage'
import SharePromoCard from '@/components/truthle/SharePromoCard'
import { T } from '@/lib/truthle/monetizeCopy'

interface ShareResultsButtonProps {
  score: number
  results: boolean[]
  streak: number
  truthleDay: number
  onFirstShare?: () => void
  className?: string
}

export default function ShareResultsButton({
  score,
  results,
  streak,
  truthleDay,
  onFirstShare,
  className: _className = 'bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-semibold py-3 px-8 rounded-lg transition-colors shadow-lg mb-6',
}: ShareResultsButtonProps) {
  const [copied, setCopied] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [promo, setPromo] = useState<SharePromo | null>(null)
  const [promoError, setPromoError] = useState(false)

  useEffect(() => {
    preloadShareCardLogo()
    const stored = getStoredSharePromo()
    if (stored) setPromo(stored)
    else mintSharePromo().then((p) => { if (p) setPromo(p); else setPromoError(true) })
  }, [])

  const afterShare = useCallback(() => {
    setPromoError(false)
    mintSharePromo().then((p) => { if (p) setPromo(p); else setPromoError(true) })
  }, [])

  const shareResults = useCallback(async () => {
    if (sharing) return
    const shareText = generateShareText(score, results, streak, truthleDay)
    setSharing(true)
    try {
      const { isFirstShare } = recordShare()
      if (isFirstShare) onFirstShare?.()

      let cardBlob: Blob | null = null
      try {
        cardBlob = await generateShareCardBlob({
          truthleDay,
          score,
          results,
          streak,
        })
      } catch (cardError) {
        console.error('Failed to generate share card:', cardError)
      }

      const copyText = async () => {
        await navigator.clipboard.writeText(shareText)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }

      if (cardBlob) {
        const file = new File([cardBlob], shareCardFileName(truthleDay), { type: 'image/png' })
        if (canShareFiles(file)) {
          try {
            await navigator.share({
              title: `Truthle #${truthleDay}`,
              text: shareText,
              files: [file],
            })
            afterShare()
            return
          } catch (error) {
            if (isShareAbortError(error)) return
            console.error('File share failed:', error)
          }
        }
        downloadBlob(cardBlob, shareCardFileName(truthleDay))
        try {
          await copyText()
          afterShare()
        } catch {
          console.error('Failed to copy share text')
        }
        return
      }

      if (navigator.share) {
        try {
          await navigator.share({
            title: `Truthle #${truthleDay}`,
            text: shareText,
          })
          afterShare()
          return
        } catch (error) {
          if (isShareAbortError(error)) return
        }
      }

      await copyText()
      afterShare()
    } catch (e) {
      try {
        await navigator.clipboard.writeText(shareText)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
        afterShare()
      } catch {
        console.error('Failed to share:', e)
      }
    } finally {
      setSharing(false)
    }
  }, [score, results, streak, truthleDay, sharing, onFirstShare, afterShare])

  const [linkCopied, setLinkCopied] = useState(false)
  const withCode = (t: string) => (promo ? `${T.truthCodeGift(promo.code)}\n\n${t}` : t)
  const shareWhatsApp = useCallback(() => {
    const text = withCode(generateShareText(score, results, streak, truthleDay))
    const { isFirstShare } = recordShare()
    if (isFirstShare) onFirstShare?.()
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer')
    afterShare()
  }, [score, results, streak, truthleDay, onFirstShare, afterShare, promo])
  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(withCode(generateShareText(score, results, streak, truthleDay)))
      setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2000)
      const { isFirstShare } = recordShare()
      if (isFirstShare) onFirstShare?.()
      afterShare()
    } catch { /* ignore */ }
  }, [score, results, streak, truthleDay, onFirstShare, afterShare, promo])

  return (
    <>
      <p className="mb-1 text-sm font-semibold text-gray-800">Send a friend a free Extra Attempt</p>
      {promo && <SharePromoCard promo={promo} />}
      {promoError && !promo && <p className="mb-2 text-xs text-rose-600">Couldn't create your friend code — share anyway, then tap again to retry.</p>}
      <div className="mb-2 flex w-full max-w-sm flex-col gap-2">
        <button onClick={shareWhatsApp} className="w-full text-base font-bold py-3 px-6 rounded-lg bg-green-600 hover:bg-green-700 text-white shadow">WhatsApp</button>
        <button onClick={copyLink} className="w-full text-base font-semibold py-3 px-6 rounded-lg border-2 border-blue-600 text-blue-700 hover:bg-blue-50">{linkCopied ? '\u2713 Copied' : 'Copy link & code'}</button>
      </div>
      {linkCopied && <p className="mb-2 text-xs text-emerald-700">Link copied. Send it so a friend gets a free Extra Attempt.</p>}
      <button onClick={shareResults} disabled={sharing} className="mb-4 text-xs text-gray-500 underline">
        {sharing ? 'Sharing...' : copied ? '\u2713 Copied!' : 'Share score only'}
      </button>
    </>
  )
}

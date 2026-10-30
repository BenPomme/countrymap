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
  className = 'bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-semibold py-3 px-8 rounded-lg transition-colors shadow-lg mb-6',
}: ShareResultsButtonProps) {
  const [copied, setCopied] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [promo, setPromo] = useState<SharePromo | null>(null)

  useEffect(() => {
    preloadShareCardLogo()
    setPromo(getStoredSharePromo())
  }, [])

  const afterShare = useCallback(() => {
    mintSharePromo().then((p) => { if (p) setPromo(p) })
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

  return (
    <>
      <button onClick={shareResults} disabled={sharing} className={className}>
        {sharing ? 'Sharing...' : copied ? '\u2713 Copied!' : 'Share Results'}
      </button>
      {promo && <SharePromoCard promo={promo} />}
    </>
  )
}

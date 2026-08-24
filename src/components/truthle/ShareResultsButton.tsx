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

  useEffect(() => {
    preloadShareCardLogo()
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
            return
          } catch (error) {
            if (isShareAbortError(error)) return
            console.error('File share failed:', error)
          }
        }
        downloadBlob(cardBlob, shareCardFileName(truthleDay))
        try {
          await copyText()
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
          return
        } catch (error) {
          if (isShareAbortError(error)) return
        }
      }

      await copyText()
    } catch (e) {
      try {
        await navigator.clipboard.writeText(shareText)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch {
        console.error('Failed to share:', e)
      }
    } finally {
      setSharing(false)
    }
  }, [score, results, streak, truthleDay, sharing, onFirstShare])

  return (
    <button onClick={shareResults} disabled={sharing} className={className}>
      {sharing ? 'Sharing...' : copied ? '\u2713 Copied!' : 'Share Results'}
    </button>
  )
}

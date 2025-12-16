'use client'

import { useState, useEffect } from 'react'
import { ensureAnonymousAuth } from '@/lib/firebase/config'

// Offertoro configuration
// Sign up at https://www.offertoro.com/publishers and get your publisher ID
const OFFERTORO_PUBID = process.env.NEXT_PUBLIC_OFFERTORO_PUBID || ''
const OFFERTORO_APPID = process.env.NEXT_PUBLIC_OFFERTORO_APPID || '1' // Default app ID

interface OfferWallProps {
  onClose?: () => void
}

export default function OfferWall({ onClose }: OfferWallProps) {
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function init() {
      try {
        const user = await ensureAnonymousAuth()
        setUserId(user.uid)
      } catch (e) {
        console.error('Auth error:', e)
        setError('Failed to authenticate. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  if (!OFFERTORO_PUBID) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <p className="text-yellow-800 font-medium">Offer Wall Not Configured</p>
        <p className="text-yellow-600 text-sm mt-2">
          Set NEXT_PUBLIC_OFFERTORO_PUBID in your environment variables.
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-800">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
        >
          Retry
        </button>
      </div>
    )
  }

  // Offertoro iframe URL
  // Documentation: https://www.offertoro.com/publishers/api
  const offerWallUrl = `https://www.offertoro.com/ifr/show/${OFFERTORO_PUBID}/${userId}/${OFFERTORO_APPID}`

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white">
          <span className="text-xl">🎁</span>
          <span className="font-semibold">Earn Truthle Coins</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Info banner */}
      <div className="bg-amber-50 px-4 py-2 text-sm text-amber-800 flex items-center gap-2">
        <span>💡</span>
        <span>Complete offers below to earn coins. Rewards are credited within minutes.</span>
      </div>

      {/* Offer wall iframe */}
      <iframe
        src={offerWallUrl}
        width="100%"
        height="600"
        frameBorder="0"
        scrolling="yes"
        className="border-0"
        title="Offertoro Offer Wall"
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
      />

      {/* Footer */}
      <div className="bg-gray-50 px-4 py-3 text-xs text-gray-500 text-center">
        <p>Offers provided by Offertoro. Coin rewards vary by offer.</p>
        <p className="mt-1">
          Having issues? Contact{' '}
          <a href="mailto:support@theworldtruth.com" className="text-emerald-600 hover:underline">
            support@theworldtruth.com
          </a>
        </p>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useRef } from 'react'
import { ADSENSE_CONFIG } from '@/lib/constants/ads'
import { useConsent } from '@/lib/analytics/useConsent'
import { useEmbeddedAppMode } from '@/lib/useEmbeddedAppMode'
import { emitAdStatus, isAdEligible } from '@/lib/ads/state'

declare global {
  interface Window {
    adsbygoogle: unknown[]
  }
}

interface AdUnitProps {
  slotId: string
  format?: 'auto' | 'rectangle' | 'horizontal' | 'vertical'
  responsive?: boolean
  className?: string
  style?: React.CSSProperties
}

export default function AdUnit({
  slotId,
  format = 'auto',
  responsive = true,
  className = '',
  style,
}: AdUnitProps) {
  const embeddedMode = useEmbeddedAppMode()
  const consent = useConsent()
  const adRef = useRef<HTMLModElement>(null)
  const requestedSlot = useRef<string | null>(null)
  const eligible = isAdEligible({ consent, embedded: embeddedMode, slotId })

  useEffect(() => {
    if (!eligible) {
      requestedSlot.current = null
      return
    }
    if (requestedSlot.current === slotId) return
    if (typeof window === 'undefined') return

    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
      requestedSlot.current = slotId
    } catch (error) {
      emitAdStatus({ slotId, status: 'error' })
      console.error('AdSense error:', error)
    }
  }, [eligible, slotId])

  if (!eligible) return null

  return (
    <div className="w-full flex justify-center" aria-hidden="true">
      <ins
        ref={adRef}
        className={`adsbygoogle ${className}`}
        style={style || { display: 'block' }}
        data-ad-client={ADSENSE_CONFIG.clientId}
        data-ad-slot={slotId}
        data-ad-format={format}
        data-full-width-responsive={responsive ? 'true' : 'false'}
        {...(ADSENSE_CONFIG.testMode && { 'data-adtest': 'on' })}
      />
    </div>
  )
}

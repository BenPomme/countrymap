'use client'

import { useEffect, useRef } from 'react'
import { ADSENSE_CONFIG } from '@/lib/constants/ads'

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
  const adRef = useRef<HTMLModElement>(null)
  const isLoaded = useRef(false)

  useEffect(() => {
    // Don't load if no slot ID configured
    if (!slotId) return

    // Don't load twice
    if (isLoaded.current) return

    try {
      // Push ad to queue
      if (typeof window !== 'undefined' && window.adsbygoogle) {
        window.adsbygoogle.push({})
        isLoaded.current = true
      }
    } catch (error) {
      console.error('AdSense error:', error)
    }
  }, [slotId])

  // Show placeholder if no slot ID configured
  if (!slotId) {
    return (
      <div
        className={`bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 text-sm ${className}`}
        style={style || { minHeight: 90 }}
      >
        <span>Ad Space</span>
      </div>
    )
  }

  return (
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
  )
}

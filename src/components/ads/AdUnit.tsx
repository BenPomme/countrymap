'use client'

import { useEffect, useRef } from 'react'
import { ADSENSE_CONFIG } from '@/lib/constants/ads'
import { useEmbeddedAppMode } from '@/lib/useEmbeddedAppMode'

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
  const adRef = useRef<HTMLModElement>(null)
  const isLoaded = useRef(false)

  useEffect(() => {
    if (embeddedMode) return
    if (!slotId) return
    if (isLoaded.current) return
    if (typeof window === 'undefined') return

    try {
      // Always enqueue — script may load later and will drain the queue.
      // Previous code only pushed when window.adsbygoogle already existed,
      // so most page loads never requested a fill.
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
      isLoaded.current = true
    } catch (error) {
      console.error('AdSense error:', error)
    }
  }, [embeddedMode, slotId])

  if (embeddedMode) {
    return null
  }

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

  const reservedHeight =
    typeof style?.height === 'number'
      ? style.height
      : typeof style?.minHeight === 'number'
        ? style.minHeight
        : 90

  return (
    <div
      className="w-full flex justify-center"
      style={{
        minHeight: reservedHeight,
        backgroundColor: 'rgba(15, 23, 42, 0.03)',
      }}
      aria-hidden="true"
    >
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

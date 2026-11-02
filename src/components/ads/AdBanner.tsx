'use client'

import { useEffect, useRef, useState } from 'react'
import AdUnit from './AdUnit'
import { AD_SLOTS } from '@/lib/constants/ads'
import { useEmbeddedAppMode } from '@/lib/useEmbeddedAppMode'

export type AdFillState = 'waiting' | 'filled' | 'unfilled'

export function normalizeAdFillState(value: string | null | undefined): AdFillState {
  const normalized = value?.trim().toLowerCase()
  if (normalized === 'filled') return 'filled'
  if (normalized === 'unfilled') return 'unfilled'
  return 'waiting'
}

export function shouldRenderAdBanner(options: {
  embedded: boolean
  disabled: boolean
  slotId?: string
  fillState: AdFillState
}): boolean {
  return !options.embedded && !options.disabled && Boolean(options.slotId) && options.fillState !== 'unfilled'
}

interface AdBannerProps {
  slotId?: string
  className?: string
  hideOnMobile?: boolean
  disabled?: boolean
}

/**
 * Horizontal banner ad (728x90 desktop, 320x50 mobile).
 * The slot reserves space only while a fill is possible, then removes itself
 * and its supplied spacing when ads are disabled or reported unfilled.
 */
export default function AdBanner({
  slotId = AD_SLOTS.headerBanner,
  className = '',
  hideOnMobile = false,
  disabled = false,
}: AdBannerProps) {
  const embeddedMode = useEmbeddedAppMode()
  const containerRef = useRef<HTMLDivElement>(null)
  const [fillState, setFillState] = useState<AdFillState>('waiting')
  const enabled = Boolean(slotId) && !disabled && !embeddedMode

  useEffect(() => {
    if (!enabled) {
      setFillState('unfilled')
      return
    }

    setFillState('waiting')
    const container = containerRef.current
    if (!container || typeof MutationObserver === 'undefined') return

    let observer: MutationObserver | null = null

    const stopWatching = () => {
      observer?.disconnect()
      observer = null
    }

    const inspectStatus = () => {
      const ad = container.querySelector<HTMLElement>('ins.adsbygoogle')
      const nextState = normalizeAdFillState(ad?.getAttribute('data-ad-status'))
      if (nextState === 'waiting') return
      setFillState(nextState)
      if (nextState === 'unfilled') stopWatching()
    }

    observer = new MutationObserver(inspectStatus)
    observer.observe(container, {
      attributes: true,
      attributeFilter: ['data-ad-status'],
      childList: true,
      subtree: true,
    })
    inspectStatus()

    return stopWatching
  }, [enabled, slotId])

  if (
    !shouldRenderAdBanner({
      embedded: embeddedMode,
      disabled,
      slotId,
      fillState,
    })
  ) {
    return null
  }

  return (
    <div
      ref={containerRef}
      className={`w-full justify-center py-2 ${hideOnMobile ? 'hidden md:flex' : 'flex'} ${className}`}
      style={{ minHeight: 90 }}
      aria-hidden="true"
    >
      <AdUnit
        slotId={slotId}
        format="horizontal"
        responsive={true}
        style={{
          display: 'block',
          width: '100%',
          maxWidth: 728,
          height: 90,
        }}
      />
    </div>
  )
}

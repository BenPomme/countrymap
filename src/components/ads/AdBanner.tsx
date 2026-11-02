'use client'

import { useEffect, useRef, useState } from 'react'
import AdUnit from './AdUnit'
import { AD_SLOTS } from '@/lib/constants/ads'
import { useConsent } from '@/lib/analytics/useConsent'
import { useEmbeddedAppMode } from '@/lib/useEmbeddedAppMode'
import {
  AD_STATUS_EVENT,
  AD_WAIT_TIMEOUT_MS,
  isAdEligible,
  isAdStatusForSlot,
  normalizeAdFillState,
  reduceAdFillState,
  shouldShowAdBanner,
  type AdFillState,
  type AdStatusDetail,
} from '@/lib/ads/state'

export { normalizeAdFillState, shouldRenderAdBanner } from '@/lib/ads/state'
export type { AdFillState } from '@/lib/ads/state'

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
  const consent = useConsent()
  const containerRef = useRef<HTMLDivElement>(null)
  const [fillState, setFillState] = useState<AdFillState>('waiting')
  const eligible = isAdEligible({
    consent,
    embedded: embeddedMode,
    disabled,
    slotId,
  })

  useEffect(() => {
    if (!eligible) {
      setFillState('waiting')
      return
    }

    setFillState('waiting')
    const container = containerRef.current
    if (!container) return

    let observer: MutationObserver | null = null
    let waitTimer: ReturnType<typeof setTimeout> | null = null

    const applyUpdate = (
      update: { type: 'timeout' } | { type: 'status'; status: string | null | undefined }
    ) => {
      setFillState((current) => reduceAdFillState(current, update))
    }

    const stopWatching = () => {
      observer?.disconnect()
      observer = null
      if (waitTimer) {
        clearTimeout(waitTimer)
        waitTimer = null
      }
    }

    const inspectStatus = () => {
      const ad = container.querySelector<HTMLElement>('ins.adsbygoogle')
      const nextState = normalizeAdFillState(ad?.getAttribute('data-ad-status'))
      if (nextState === 'waiting') return
      applyUpdate({ type: 'status', status: nextState })
    }

    if (typeof MutationObserver !== 'undefined') {
      observer = new MutationObserver(inspectStatus)
      observer.observe(container, {
        attributes: true,
        attributeFilter: ['data-ad-status'],
        childList: true,
        subtree: true,
      })
    }

    waitTimer = setTimeout(() => {
      applyUpdate({ type: 'timeout' })
    }, AD_WAIT_TIMEOUT_MS)

    const onAdStatus = (event: Event) => {
      const detail = (event as CustomEvent<AdStatusDetail>).detail
      if (!detail || !isAdStatusForSlot(detail, slotId)) return
      applyUpdate({ type: 'status', status: detail.status })
      if (detail.status === 'error') stopWatching()
    }

    window.addEventListener(AD_STATUS_EVENT, onAdStatus)
    inspectStatus()

    return () => {
      stopWatching()
      window.removeEventListener(AD_STATUS_EVENT, onAdStatus)
    }
  }, [eligible, slotId])

  if (!eligible) return null

  const visible = shouldShowAdBanner({ eligible, fillState })

  return (
    <div
      ref={containerRef}
      className={`w-full justify-center py-2 ${hideOnMobile ? 'hidden md:flex' : 'flex'} ${className}`}
      style={
        visible
          ? { minHeight: fillState === 'waiting' ? 90 : undefined }
          : {
              height: 0,
              minHeight: 0,
              padding: 0,
              margin: 0,
              borderWidth: 0,
              overflow: 'hidden',
              backgroundColor: 'transparent',
            }
      }
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

'use client'

import AdUnit from './AdUnit'
import { AD_SLOTS } from '@/lib/constants/ads'

interface AdBannerProps {
  slotId?: string
  className?: string
  hideOnMobile?: boolean
}

/**
 * Horizontal banner ad (728x90 desktop, 320x50 mobile)
 * Best for: Below headers, between content sections
 */
export default function AdBanner({
  slotId = AD_SLOTS.headerBanner,
  className = '',
  hideOnMobile = false,
}: AdBannerProps) {
  return (
    <div
      className={`w-full flex justify-center py-2 ${hideOnMobile ? 'hidden md:flex' : ''} ${className}`}
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

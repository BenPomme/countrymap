'use client'

import AdUnit from './AdUnit'
import { AD_SLOTS } from '@/lib/constants/ads'

interface AdSidebarProps {
  slotId?: string
  className?: string
  size?: 'square' | 'vertical'
}

/**
 * Sidebar ad (300x250 square or 300x600 vertical)
 * Best for: Sidebars, within content panels
 */
export default function AdSidebar({
  slotId = AD_SLOTS.sidebarSquare,
  className = '',
  size = 'square',
}: AdSidebarProps) {
  const height = size === 'square' ? 250 : 600

  return (
    <div className={`flex justify-center ${className}`}>
      <AdUnit
        slotId={slotId}
        format={size === 'square' ? 'rectangle' : 'vertical'}
        responsive={false}
        style={{
          display: 'block',
          width: 300,
          height: height,
        }}
      />
    </div>
  )
}

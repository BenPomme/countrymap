'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getCoins } from '@/lib/truthle/storage'

interface CoinBalanceProps {
  className?: string
  showShopLink?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function CoinBalance({ className = '', showShopLink = true, size = 'md' }: CoinBalanceProps) {
  const [coins, setCoins] = useState<number | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setCoins(getCoins())
  }, [])

  // Don't render anything on server or before mount
  if (!mounted) {
    return null
  }

  const sizeClasses = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-3 py-1.5',
    lg: 'px-4 py-2 text-lg',
  }

  const iconSizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-xl',
  }

  const content = (
    <div className={`flex items-center gap-1.5 bg-amber-100 rounded-full ${sizeClasses[size]} ${className}`}>
      <span className={iconSizes[size]}>🪙</span>
      <span className="font-bold text-amber-700">{(coins || 0).toLocaleString()}</span>
      {showShopLink && (
        <svg className="w-3.5 h-3.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      )}
    </div>
  )

  if (showShopLink) {
    return (
      <Link href="/truthle/shop" className="hover:opacity-80 transition-opacity" title="Visit Truthle Shop">
        {content}
      </Link>
    )
  }

  return content
}

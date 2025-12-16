'use client'

import Link from 'next/link'
import RewardShop from '@/components/truthle/RewardShop'

export default function ShopPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/truthle" className="text-gray-600 hover:text-gray-900 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="text-sm font-medium">Back to Truthle</span>
          </Link>
          <nav className="flex gap-4 text-sm">
            <Link href="/" className="text-gray-600 hover:text-gray-900">Home</Link>
            <Link href="/charts" className="text-gray-600 hover:text-gray-900">Charts</Link>
            <Link href="/discoveries" className="text-gray-600 hover:text-gray-900">Discoveries</Link>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main>
        <RewardShop />
      </main>

      {/* Footer */}
      <footer className="mt-auto py-6 text-center text-sm text-gray-500">
        <p>
          Truthle Shop is part of{' '}
          <Link href="/" className="text-emerald-600 hover:underline">
            The World Truth Map
          </Link>
        </p>
      </footer>
    </div>
  )
}

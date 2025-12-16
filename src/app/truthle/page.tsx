'use client'

import Link from 'next/link'
import type { Country } from '@/types/country'
import TruthleGame from '@/components/truthle/TruthleGame'
import { AdBanner } from '@/components/ads'
import { AD_SLOTS } from '@/lib/constants/ads'
import countriesData from '../../../data/countries.json'

// Import countries at build time (same as main page)
const countries = countriesData as Country[]

export default function TruthlePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/" className="text-gray-600 hover:text-gray-900 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="text-sm font-medium">World Truth Map</span>
          </Link>
          <nav className="flex gap-4 text-sm">
            <Link href="/charts" className="text-gray-600 hover:text-gray-900">Charts</Link>
            <Link href="/discoveries" className="text-gray-600 hover:text-gray-900">Discoveries</Link>
            <Link href="/quiz" className="text-gray-600 hover:text-gray-900">Quiz</Link>
          </nav>
        </div>
      </header>

      {/* Ad Banner */}
      <AdBanner slotId={AD_SLOTS.truthleBanner} hideOnMobile={true} className="bg-gray-50 border-b border-gray-100" />

      {/* Main content */}
      <main className="max-w-4xl mx-auto py-8">
        <TruthleGame countries={countries} />
      </main>

      {/* Footer */}
      <footer className="mt-auto py-6 text-center text-sm text-gray-500">
        <p>
          Truthle is part of{' '}
          <Link href="/" className="text-emerald-600 hover:underline">
            The World Truth Map
          </Link>
        </p>
        <p className="mt-1">
          Compare countries across 89 statistics •{' '}
          <Link href="/discoveries" className="text-emerald-600 hover:underline">
            Explore 1,300+ correlations
          </Link>
        </p>
      </footer>
    </div>
  )
}

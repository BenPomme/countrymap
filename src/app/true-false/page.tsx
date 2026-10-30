'use client'

import Link from 'next/link'
import TrueFalseGame from '@/components/truthle/TrueFalseGame'
import { countries } from '@/lib/data/loadCountries'
import { useEmbeddedAppMode } from '@/lib/useEmbeddedAppMode'

export default function TrueFalsePage() {
  const embedded = useEmbeddedAppMode()
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white">
      {!embedded && (
        <header className="bg-white shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center text-sm">
            <Link href="/" className="text-gray-600 hover:text-gray-900 font-medium">← World Truth Map</Link>
            <nav className="flex gap-3">
              <Link href="/truthle" className="text-emerald-700 font-semibold">Truthle</Link>
              <Link href="/quiz" className="text-gray-600 hidden sm:block">Quiz</Link>
            </nav>
          </div>
        </header>
      )}
      <main className="max-w-4xl mx-auto py-6">
        <TrueFalseGame countries={countries} />
      </main>
      {!embedded && (
        <footer className="py-6 text-center text-sm text-gray-500">
          True or False: World is part of <Link href="/truthle" className="text-emerald-600 hover:underline">Truthle</Link> by{' '}
          <Link href="/" className="text-emerald-600 hover:underline">The World Truth</Link>
        </footer>
      )}
    </div>
  )
}

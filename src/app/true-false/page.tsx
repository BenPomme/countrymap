'use client'

import Link from 'next/link'
import TrueFalseGame from '@/components/truthle/TrueFalseGame'
import { countries } from '@/lib/data/loadCountries'
import { useEmbeddedAppMode } from '@/lib/useEmbeddedAppMode'
import { AdBanner } from '@/components/ads'
import { AD_SLOTS } from '@/lib/constants/ads'

export default function TrueFalsePage() {
  const embedded = useEmbeddedAppMode()
  return (
    <div className="twt-shell min-h-screen bg-[#fff9e8] text-[#192947]">
      {!embedded && (
        <AdBanner slotId={AD_SLOTS.truthleBanner} hideOnMobile={false} className="border-b border-[#d8d2c2] bg-[#f4efe2]" />
      )}
      <main className={`twt-container mx-auto max-w-5xl ${embedded ? 'py-4' : 'py-6 sm:py-10'}`}>
        <TrueFalseGame countries={countries} />
        {!embedded && (
          <p className="mx-auto mt-8 max-w-xl text-center text-sm leading-6 text-[#59647a]">
            Prefer multiple choice?{' '}
            <Link href="/truthle/" className="font-semibold text-[#294cc4] underline">
              Play Truthle
            </Link>{' '}
            or{' '}
            <Link href="/" className="font-semibold text-[#294cc4] underline">
              explore the country maps
            </Link>
            .
          </p>
        )}
      </main>
    </div>
  )
}

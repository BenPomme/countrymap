'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import TruthleGame from '@/components/truthle/TruthleGame'
import { AdBanner } from '@/components/ads'
import { AD_SLOTS } from '@/lib/constants/ads'
import { countries } from '@/lib/data/loadCountries'
import { variableEntries } from '@/lib/seo/catalog'
import { useEmbeddedAppMode } from '@/lib/useEmbeddedAppMode'

export default function TruthlePage() {
  const embeddedMode = useEmbeddedAppMode()

  return (
    <div className="twt-shell min-h-screen">
      {!embeddedMode && (
        <AdBanner slotId={AD_SLOTS.truthleBanner} hideOnMobile={false} className="bg-[#f4efe2] border-b border-[#d8d2c2]" />
      )}

      <main className={`twt-container ${embeddedMode ? 'py-4' : 'py-6 sm:py-10'}`}>
        <TrueFalsePromo />
        <TruthleGame countries={countries} />
        <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-[#59647a]">
          Truthle uses the same country data as{' '}
          <Link href="/" className="font-semibold text-[#294cc4] underline">
            The World Truth Map
          </Link>
          . Browse all {variableEntries.length} statistics at your own pace.
        </p>
      </main>
    </div>
  )
}

function TrueFalsePromo() {
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    const onState = (event: Event) => {
      const state = (event as CustomEvent<string>).detail
      setHidden(state === 'playing' || state === 'answered')
    }
    window.addEventListener('truthle:state', onState)
    return () => window.removeEventListener('truthle:state', onState)
  }, [])

  if (hidden) return null

  return (
    <div className="mx-auto mb-4 max-w-2xl">
      <Link
        href="/true-false/"
        className="block rounded-xl border border-[#b9c8e8] bg-[#eef3ff] px-4 py-2.5 text-center font-semibold text-[#192947] hover:bg-[#e3ebff]"
      >
        New: True or False World. Try today&apos;s daily claims.
      </Link>
    </div>
  )
}

import Link from 'next/link'
import TruthleGame from '@/components/truthle/TruthleGame'
import TruthleAbout from '@/components/truthle/TruthleAbout'
import DailyGameShell from '@/components/truthle/DailyGameShell'
import { AdBanner } from '@/components/ads'
import { AD_SLOTS } from '@/lib/constants/ads'
import { countries } from '@/lib/data/loadCountries'
import { variableEntries } from '@/lib/seo/catalog'

export default function TruthlePage() {
  return (
    <div className="twt-shell min-h-screen">
      <AdBanner slotId={AD_SLOTS.truthleBanner} hideOnMobile={false} className="bg-[#f4efe2] border-b border-[#d8d2c2]" />

      <DailyGameShell
        playAwarePromo={<TrueFalsePromo />}
        footer={(
          <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-[#59647a]">
            Truthle uses the same country data as{' '}
            <Link href="/" className="font-semibold text-[#294cc4] underline">
              The World Truth Map
            </Link>
            . Browse all {variableEntries.length} statistics at your own pace.
          </p>
        )}
      >
        <TruthleGame countries={countries} />
      </DailyGameShell>
      <TruthleAbout />
    </div>
  )
}

function TrueFalsePromo() {
  return (
    <div className="mx-auto mb-4 max-w-2xl">
      <Link
        href="/true-false/"
        className="block rounded-xl border border-[#b9c8e8] bg-[#eef3ff] px-4 py-2.5 text-center font-semibold text-[#192947] hover:bg-[#e3ebff]"
      >
        Also play True or False: World. Five sourced calls each day.
      </Link>
    </div>
  )
}

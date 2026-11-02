import Link from 'next/link'
import TrueFalseGame from '@/components/truthle/TrueFalseGame'
import TrueFalseAbout from '@/components/truthle/TrueFalseAbout'
import DailyGameShell from '@/components/truthle/DailyGameShell'
import { countries } from '@/lib/data/loadCountries'
import { AdBanner } from '@/components/ads'
import { AD_SLOTS } from '@/lib/constants/ads'

export default function TrueFalsePage() {
  return (
    <div className="twt-shell min-h-screen bg-[#fff9e8] text-[#192947]">
      <AdBanner slotId={AD_SLOTS.truthleBanner} hideOnMobile={false} className="border-b border-[#d8d2c2] bg-[#f4efe2]" />
      <DailyGameShell
        mainClassName="mx-auto max-w-5xl"
        hideFooterWhenEmbedded
        footer={(
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
      >
        <TrueFalseGame countries={countries} />
      </DailyGameShell>
      <TrueFalseAbout />
    </div>
  )
}

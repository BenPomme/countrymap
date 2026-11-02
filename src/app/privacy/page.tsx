import type { Metadata } from 'next'
import Link from 'next/link'
import PrivacyPreferencesButton from './PrivacyPreferencesButton'

export const metadata: Metadata = {
  title: 'Privacy Policy | The World Truth Map',
  description:
    'How The World Truth Map handles optional Google Analytics, Google Ads and AdSense, consent choices, and saved game progress.',
  alternates: {
    canonical: '/privacy/',
  },
  openGraph: {
    title: 'Privacy Policy | The World Truth Map',
    description:
      'How The World Truth Map handles optional analytics, advertising, consent choices, and saved game progress.',
    url: 'https://theworldtruth.com/privacy/',
    siteName: 'The World Truth Map',
    locale: 'en_US',
    type: 'website',
  },
}

export default function PrivacyPolicyPage() {
  return (
    <main className="twt-shell min-h-screen bg-[#fff9e8] px-4 py-12 text-slate-900 md:px-6 md:py-16">
      <div className="twt-container mx-auto max-w-4xl">
        <p className="twt-kicker text-sm font-bold uppercase tracking-wide text-blue-800">
          Privacy
        </p>
        <h1 className="twt-display mt-3 text-4xl font-bold tracking-tight text-slate-950 md:text-5xl">
          Privacy policy
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-700">
          The World Truth Map works without optional measurement. Google Analytics, Google Ads and
          AdSense stay off until you make a privacy choice. Your saved game progress and credits do
          not depend on allowing them.
        </p>
        <div className="mt-6">
          <PrivacyPreferencesButton />
        </div>

        <div className="twt-panel mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-9">
          <div className="twt-prose space-y-10 text-slate-700">
            <section aria-labelledby="privacy-device-data">
              <h2 id="privacy-device-data" className="text-2xl font-bold text-slate-950">
                Data stored for the site to work
              </h2>
              <p className="mt-3 leading-7">
                The site stores your privacy choice in your browser so it can remember your answer.
                Game features also use browser storage and the site account services needed to save
                progress, retries and credits. Those core features are separate from optional
                analytics and advertising.
              </p>
            </section>

            <section aria-labelledby="privacy-analytics">
              <h2 id="privacy-analytics" className="text-2xl font-bold text-slate-950">
                Optional analytics
              </h2>
              <p className="mt-3 leading-7">
                If you allow analytics, Google Analytics may receive a limited set of events about
                game starts, completions, sharing, referrals, rewards and checkout returns. The site
                only sends named events and approved parameters. Email addresses, account IDs, gift
                codes, arbitrary text, full URLs and query strings are not sent in these events.
              </p>
              <p className="mt-3 leading-7">
                Page locations and referrers are reduced to their origin and path before Google
                Analytics receives them. Query strings and fragments are removed. You can read more
                in{' '}
                <a
                  className="font-semibold text-blue-800 underline"
                  href="https://policies.google.com/technologies/partner-sites"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Google&apos;s explanation of how it uses information from partner sites
                </a>
                .
              </p>
            </section>

            <section aria-labelledby="privacy-advertising">
              <h2 id="privacy-advertising" className="text-2xl font-bold text-slate-950">
                Optional advertising
              </h2>
              <p className="mt-3 leading-7">
                If you allow advertising, Google Ads and AdSense may use cookies or local storage
                for ad delivery and measurement. The site loads Google tags only after the relevant
                choice and passes the selected consent state to them. If you reject optional
                storage, the advertising library is not loaded by this site.
              </p>
              <p className="mt-3 leading-7">
                You can also review personalized advertising controls in{' '}
                <a
                  className="font-semibold text-blue-800 underline"
                  href="https://myadcenter.google.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Google My Ad Center
                </a>
                .
              </p>
            </section>

            <section aria-labelledby="privacy-choices">
              <h2 id="privacy-choices" className="text-2xl font-bold text-slate-950">
                Your choices and withdrawal
              </h2>
              <p className="mt-3 leading-7">
                Analytics and advertising are off by default. The site also honors the Global
                Privacy Control signal by treating it as a rejection of optional storage. You can
                change or withdraw either choice at any time with the privacy choices control on
                this page. Withdrawal does not remove game progress or earned credits.
              </p>
            </section>

            <section aria-labelledby="privacy-links">
              <h2 id="privacy-links" className="text-2xl font-bold text-slate-950">
                External links and policy updates
              </h2>
              <p className="mt-3 leading-7">
                Some pages link to other websites with their own privacy practices. This page
                describes the current site behavior and will be revised if that behavior changes;
                it does not display a build-time or visit-time update date.
              </p>
              <p className="mt-3 leading-7">
                For questions about this policy or a privacy request, use the contact route listed on
                the site. You can return to the{' '}
                <Link className="font-semibold text-blue-800 underline" href="/">
                  world map
                </Link>{' '}
                at any time.
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}

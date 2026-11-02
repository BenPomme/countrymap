import Link from 'next/link'
import type { Metadata } from 'next'
import { getAllClaims } from '@/lib/seo/claims'

export const metadata: Metadata = {
  title: 'True or False: World | Free Daily Country Stats Quiz',
  description: 'Five sourced true-or-false claims about countries and world statistics each available UTC day. One free run, with recorded figures and source notes where available.',
  openGraph: {
    title: 'True or False: World | Five sourced calls about the world',
    description: 'Read five claims built from country statistics, call each one true or false and check the recorded figures.',
    url: 'https://theworldtruth.com/true-false/',
    siteName: 'The World Truth',
    images: [{ url: 'https://theworldtruth.com/og/true-false.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'True or False: World | Five sourced calls about the world',
    description: 'Five claims built from country statistics. Call each one true or false, then check the figures.',
    images: ['https://theworldtruth.com/og/true-false.png'],
  },
  alternates: { canonical: 'https://theworldtruth.com/true-false/' },
}

const trueFalseFaqs = [
  {
    q: 'Is True or False: World free?',
    a: 'Your first run each UTC day is free. After that run, an Extra Attempt may be offered as a one-time EUR0.99 purchase charged in EUR. It is not a subscription and adds one more run for that day without replacing your first result or streak. A valid single-use friend code can cover the Extra Attempt at checkout and expires at 23:59:59 UTC on the day it was created.',
  },
  {
    q: 'Are there always five claims?',
    a: 'Every available round contains exactly five claims. If five claims cannot be prepared with suitable recorded source details, the page shows the round as unavailable rather than adding unsourced statements.',
  },
  {
    q: 'How can I check a claim?',
    a: 'After each call, the page shows the recorded figures behind the claim and the source, year, coverage and known limitations that are available. If a source detail is missing, the page does not invent one.',
  },
  {
    q: 'How often does the set change?',
    a: 'A new set is prepared for each UTC day, and everyone receives the same five claims for that day. The round resets at 00:00 UTC.',
  },
  {
    q: 'Can I revisit earlier claims?',
    a: 'Yes. The claims archive groups answered claims by topic. Source details are shown where recorded, although some archived figures do not yet have a confirmed source.',
  },
]

export default function TrueFalseLayout({ children }: { children: React.ReactNode }) {
  const claims = getAllClaims()
  const topics = new Map<string, { slug: string; count: number }>()
  for (const claim of claims) {
    const topic = topics.get(claim.variableName)
    if (topic) topic.count++
    else topics.set(claim.variableName, { slug: claim.slug, count: 1 })
  }
  const topTopics = Array.from(topics.entries()).sort((a, b) => b[1].count - a[1].count).slice(0, 12)
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: trueFalseFaqs.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  }

  return (
    <>
      {children}
      <section className="bg-[#fff9e8] pb-12 pt-10 text-[#192947] sm:pb-16" aria-labelledby="true-false-guide-title">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
        <div className="twt-container">
          <div className="twt-panel overflow-hidden">
            <div className="grid lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]">
              <div className="p-6 sm:p-8 lg:p-10">
                <p className="twt-kicker">Daily game guide</p>
                <h2 id="true-false-guide-title" className="twt-display mt-2 max-w-2xl text-3xl font-black leading-tight sm:text-4xl">
                  Five sourced calls, one daily set
                </h2>
                <p className="twt-prose mt-4">
                  True or False: World turns country and world statistics into five clear calls. Read each claim, decide whether it is true or false, then inspect the figures and source details behind the answer.
                </p>

                <div className="mt-7 grid gap-6 sm:grid-cols-2">
                  <div>
                    <h3 className="twt-display text-xl font-black">How a round works</h3>
                    <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-[#43516b]">
                      <li>Read a claim about countries or world statistics.</li>
                      <li>Choose True or False and see the recorded figures straight away.</li>
                      <li>Finish all five calls to record your score and streak.</li>
                    </ol>
                  </div>
                  <div>
                    <h3 className="twt-display text-xl font-black">A stricter kind of true or false</h3>
                    <p className="mt-3 text-sm leading-6 text-[#43516b]">
                      These are not loose general-knowledge statements. Each available round uses exactly five claims built from recorded country data, with the available source trail shown after every call.
                    </p>
                  </div>
                </div>
              </div>

              <aside className="border-t-2 border-[#192947] bg-[#eef3ff] p-6 sm:p-8 lg:border-l-2 lg:border-t-0 lg:p-10" aria-labelledby="true-false-topics-title">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#294cc4]">From the archive</p>
                <h3 id="true-false-topics-title" className="twt-display mt-2 text-2xl font-black leading-tight">
                  Browse answered claims by topic
                </h3>
                <ul className="mt-4 grid gap-x-4 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-1">
                  {topTopics.map(([name, topic]) => (
                    <li key={name}>
                      <Link href={`/true-false/claims/${topic.slug}/`} className="font-semibold text-[#294cc4] underline decoration-[#294cc4]/35 underline-offset-2 hover:decoration-[#294cc4]">
                        {name}
                      </Link>{' '}
                      <span className="text-[#59647a]">({topic.count})</span>
                    </li>
                  ))}
                </ul>
                <Link href="/true-false/claims/" className="twt-button-secondary mt-5 w-full text-center">
                  See all {claims.length} claims
                </Link>
              </aside>
            </div>

            <div className="border-t-2 border-[#192947] p-6 sm:p-8 lg:p-10">
              <p className="twt-kicker">Straight answers</p>
              <h2 className="twt-display mt-2 text-3xl font-black">True or False: World FAQ</h2>
              <div className="mt-5 grid gap-x-10 gap-y-6 md:grid-cols-2">
                {trueFalseFaqs.map((item) => (
                  <div key={item.q}>
                    <h3 className="text-base font-black text-[#192947]">{item.q}</h3>
                    <p className="mt-2 text-sm leading-6 text-[#43516b]">{item.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

import SeoAbout from '@/components/seo/SeoAbout'
import Link from 'next/link'
import { getAllClaims } from '@/lib/seo/claims'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Play True or False: World — Free Daily Country Stats Quiz',
  description: 'Play now: 5 true-or-false claims about countries and world stats, the same for everyone today. Free, no signup. Then browse hundreds of answered claims by topic.',
  openGraph: {
    title: 'True or False: World — Can you get 5/5 today?',
    description: '5 claims about the world. True or false? Same for everyone, new every day.',
    url: 'https://theworldtruth.com/true-false/',
    siteName: 'The World Truth',
    images: [{ url: 'https://theworldtruth.com/og/true-false.png', width: 1200, height: 630 }],
  },
  twitter: { card: 'summary_large_image', title: 'True or False: World — Can you get 5/5 today?', description: '5 claims about the world. True or false? New every day.', images: ['https://theworldtruth.com/og/true-false.png'] },
  alternates: { canonical: 'https://theworldtruth.com/true-false/' },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const claims = getAllClaims()
  const topics = new Map<string, { slug: string; count: number }>()
  for (const c of claims) {
    const t = topics.get(c.variableName)
    if (t) t.count++
    else topics.set(c.variableName, { slug: c.slug, count: 1 })
  }
  const topList = Array.from(topics.entries()).sort((a, b) => b[1].count - a[1].count).slice(0, 18)
  return (
    <>
      {children}
      <SeoAbout
        h1="True or False: World, a free daily country stats quiz"
        intro="Five claims about countries and world stats. Same set for everyone today. Call each one true or false, see the real numbers, and share your score."
        steps={[
          'Read the claim, for example a comparison between two countries.',
          'Tap True or False. The real figures appear right after.',
          'Finish all 5 for your score and streak, then share it.',
        ]}
        faqs={[
          { q: 'Is True or False: World free?', a: 'Yes. One free run per day, no signup. Share for a friend code, or buy an Extra Attempt (€0.99) for another shot.' },
          { q: 'How often do the claims change?', a: 'Every day. Everyone gets the same 5 claims.' },
          { q: 'Where can I see past claims?', a: `The claims archive has ${claims.length} answered claims grouped by topic, each with its data source.` },
        ]}
      >
        <h2 className="mt-8 text-xl font-bold text-gray-900">Browse answered claims by topic</h2>
        <ul className="mt-2 grid sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
          {topList.map(([name, t]) => (
            <li key={name}><Link href={`/true-false/claims/${t.slug}/`} className="text-sky-700 hover:underline">{name}</Link> <span className="text-gray-500">({t.count})</span></li>
          ))}
        </ul>
        <Link href="/true-false/claims/" className="inline-block mt-3 font-semibold text-sky-700 underline">See all {claims.length} claims →</Link>
      </SeoAbout>
    </>
  )
}

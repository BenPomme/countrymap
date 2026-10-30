import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getAllClaims, getClaim, claimsForVariable } from '@/lib/seo/claims'
import { countrySlug } from '@/lib/seo/slugs'
import { AdBanner } from '@/components/ads'
import { AD_SLOTS } from '@/lib/constants/ads'

export function generateStaticParams() {
  return getAllClaims().map((c) => ({ slug: c.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const c = getClaim(params.slug)
  if (!c) return {}
  const title = `True or False: ${c.text.replace(/\.$/, '')}?`
  const description = `${c.answer ? 'True' : 'False'}. ${c.a.country.name}: ${c.a.formatted} vs ${c.b.country.name}: ${c.b.formatted} (${c.variableName}). Play the daily True or False: World game.`
  const url = `https://theworldtruth.com/true-false/claims/${c.slug}/`
  return { title, description, alternates: { canonical: url }, openGraph: { title, description, url, images: ['https://theworldtruth.com/og/true-false.png'] } }
}

export default function ClaimPage({ params }: { params: { slug: string } }) {
  const c = getClaim(params.slug)
  if (!c) notFound()
  const verdict = c.answer ? 'TRUE' : 'FALSE'
  const explanation = `${c.a.country.name} has ${c.a.formatted} (rank #${c.rankA} of ${c.total}) and ${c.b.country.name} has ${c.b.formatted} (rank #${c.rankB} of ${c.total}) for ${c.variableName.toLowerCase()}.`
  const more = claimsForVariable(c.variableId, 6).filter((x) => x.slug !== c.slug)
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      { '@type': 'Question', name: `True or false: ${c.text}`, acceptedAnswer: { '@type': 'Answer', text: `${verdict}. ${explanation}` } },
      { '@type': 'Question', name: `Which country has more ${c.variableName.toLowerCase()}, ${c.a.country.name} or ${c.b.country.name}?`, acceptedAnswer: { '@type': 'Answer', text: `${c.a.value > c.b.value ? c.a.country.name : c.b.country.name} has the higher value. ${explanation}` } },
    ],
  }
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <header className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex justify-between text-sm">
          <Link href="/" className="font-bold text-gray-900">The World Truth</Link>
          <nav className="flex gap-3">
            <Link href="/true-false/" className="text-sky-700 font-semibold">Daily True or False</Link>
            <Link href="/true-false/claims/">All claims</Link>
          </nav>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-8">
        <p className="text-xs uppercase tracking-widest text-sky-600 font-semibold">True or False?</p>
        <h1 className="text-3xl font-extrabold mt-2 text-gray-900">{c.text}</h1>
        <details className="mt-6 bg-white rounded-2xl shadow p-5">
          <summary className="cursor-pointer font-bold text-sky-700">Reveal the answer</summary>
          <p className={`text-4xl font-extrabold mt-4 ${c.answer ? 'text-emerald-600' : 'text-rose-600'}`}>{verdict}</p>
          <p className="mt-3 text-gray-700">{explanation}</p>
        </details>
        <div className="grid grid-cols-2 gap-3 mt-6">
          {[{ r: c.a, rank: c.rankA }, { r: c.b, rank: c.rankB }].map(({ r, rank }) => (
            <Link key={r.country.iso3} href={`/country/${countrySlug(r.country.name)}/`} className="bg-white rounded-xl shadow-sm p-4 hover:shadow">
              <div className="font-semibold">{r.country.name}</div>
              <div className="text-sm text-gray-500">Rank #{rank} of {c.total}</div>
            </Link>
          ))}
        </div>
        <Link href="/true-false/" className="block mt-8 w-full py-4 rounded-2xl bg-sky-600 text-white text-lg font-bold text-center shadow">
          Play today&apos;s 5 True or False claims →
        </Link>
        <AdBanner slotId={AD_SLOTS.mapPageBanner} className="my-8" />
        <p className="mt-2 text-sm">
          See the full ranking: <Link href={`/map/${c.variableSlug}/`} className="text-sky-700 underline">{c.variableName} by country</Link>
        </p>
        {more.length > 0 && (
          <section className="mt-8">
            <h2 className="font-bold text-lg">More {c.variableName.toLowerCase()} claims</h2>
            <ul className="mt-2 space-y-1 list-disc pl-5">
              {more.map((m) => <li key={m.slug}><Link href={`/true-false/claims/${m.slug}/`} className="text-sky-700 hover:underline">{m.text}</Link></li>)}
            </ul>
          </section>
        )}
      </main>
    </div>
  )
}

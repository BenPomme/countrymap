import Link from 'next/link'
import { notFound } from 'next/navigation'
import { VARIABLES } from '@/lib/constants/variables'
import {
  countries,
  getVariableBySlug,
  rankCountries,
  ranksHighFirst,
  relatedVariableSlugs,
  variableEntries,
} from '@/lib/seo/catalog'
import { countrySlug } from '@/lib/seo/slugs'
import StatMap from './StatMap'
import EmbedSnippet from './EmbedSnippet'
import { AdBanner, AdSidebar } from '@/components/ads'
import { AD_SLOTS } from '@/lib/constants/ads'
import ContextualOffers from '@/components/affiliate/ContextualOffers'
import DealQuiz from '@/components/affiliate/DealQuiz'
import type { ColorVariable } from '@/types/country'
import { claimsForVariable } from '@/lib/seo/claims'
import { sourceNote } from '@/lib/seo/sourceNotes'

export function generateStaticParams() {
  return variableEntries.map((entry) => ({ slug: entry.slug }))
}

function sourceBlurb(variableId: ColorVariable): string {
  const config = VARIABLES[variableId]
  const desc = config.description || config.name
  const weak = /penis|breast|iq|porn|onlyfans|consanguinity|dating app/i.test(
    `${config.name} ${desc}`
  )
  if (weak) {
    return `${desc} Figures like this are estimated and coverage varies by country. Treat rankings as directional, not lab-grade.`
  }
  return desc
}

export default function StatPage({ params }: { params: { slug: string } }) {
  const entry = getVariableBySlug(params.slug)
  if (!entry) notFound()

  const config = VARIABLES[entry.id]
  const ranked = rankCountries(entry.id)
  const leader = ranked[0]
  const related = relatedVariableSlugs(entry.id, 5)
  const higher = ranksHighFirst(config)
  const question = `Which country has the ${higher ? 'highest' : 'lowest'} ${config.name.toLowerCase()}?`
  const answer = leader
    ? `${leader.country.name} ranks #1 for ${config.name.toLowerCase()} at ${leader.formatted}, among ${ranked.length} countries on The World Truth Map.`
    : `Compare ${config.name.toLowerCase()} across countries.`

  const note = sourceNote(entry.id)
  const faqs = [
    {
      q: question,
      a: answer,
    },
    {
      q: `How is ${config.name.toLowerCase()} measured?`,
      a: note ? `${sourceBlurb(entry.id)} Source: ${note.source}. Data year: ${note.vintage}.` : sourceBlurb(entry.id),
    },
    ...(note ? note.notes.map((n, i) => ({ q: i === 0 ? `Which places are included in the ${config.name.toLowerCase()} ranking?` : `Why might this ranking differ from other sources?`, a: n })) : []),
    {
      q: `How many countries have data for ${config.name.toLowerCase()}?`,
      a: `${ranked.length} of ${countries.length} countries on this map have a value for ${config.name.toLowerCase()}.`,
    },
  ]

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: `${config.name} by country`,
    description: answer,
    url: `https://theworldtruth.com/map/${entry.slug}/`,
    creator: { '@type': 'Organization', name: 'The World Truth' },
    variableMeasured: config.name,
  }

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />

      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="font-bold text-gray-900">
            The World Truth Map
          </Link>
          <nav className="flex gap-4 text-sm text-gray-600">
            <Link href={`/?var=${encodeURIComponent(entry.id)}`}>Open map</Link>
            <Link href="/truthle">Truthle</Link>
            <Link href="/discoveries">Discoveries</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 pb-20 md:pb-6">
        <p className="text-sm text-blue-700 font-medium mb-3">{config.category}</p>
        <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">{question}</h1>
        <p className="text-lg md:text-xl text-gray-800 mb-4">{answer}</p>

        <DealQuiz slug={entry.slug} category={config.category} name={config.name} />

        <AdBanner slotId={AD_SLOTS.mapPageBanner} className="my-6" />

        <StatMap countries={countries} colorVariable={entry.id} />

        <EmbedSnippet slug={entry.slug} />

        <section className="mt-10 bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{config.name} by country</h2>
          <p className="text-gray-700 mb-3">{sourceBlurb(entry.id)}</p>
          {note && (
            <div className="mb-6 rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-gray-800">
              <p><strong>Source:</strong>{' '}<a href={note.url} rel="nofollow noopener" target="_blank" className="text-blue-700 underline">{note.source}</a></p>
              <p className="mt-1"><strong>Data year:</strong> {note.vintage}</p>
              <ul className="mt-2 list-disc pl-5 space-y-1">{note.notes.map((n) => <li key={n}>{n}</li>)}</ul>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="py-2 pr-3">Rank</th>
                  <th className="py-2 pr-3">Country</th>
                  <th className="py-2 text-right">{config.name}</th>
                </tr>
              </thead>
              <tbody>
                {ranked.slice(0, 10).map((row, index) => (
                  <tr key={row.country.iso3} className="border-b border-gray-100">
                    <td className="py-2 pr-3 text-gray-500">#{index + 1}</td>
                    <td className="py-2 pr-3">
                      <Link
                        className="text-blue-700 hover:underline"
                        href={`/country/${countrySlug(row.country.name)}/`}
                      >
                        {row.country.name}
                      </Link>
                    </td>
                    <td className="py-2 text-right font-medium">{row.formatted}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {ranked.length > 10 && (
            <details id="full-table" className="mt-3">
              <summary className="cursor-pointer text-blue-700 font-medium py-2">Show all {ranked.length} countries</summary>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <tbody>
                {ranked.slice(10).map((row, j) => (
                  <tr key={row.country.iso3} className="border-b border-gray-100">
                    <td className="py-2 pr-3 text-gray-500">#{j + 11}</td>
                    <td className="py-2 pr-3">
                      <Link
                        className="text-blue-700 hover:underline"
                        href={`/country/${countrySlug(row.country.name)}/`}
                      >
                        {row.country.name}
                      </Link>
                    </td>
                    <td className="py-2 text-right font-medium">{row.formatted}</td>
                  </tr>
                ))}
                  </tbody>
                </table>
              </div>
            </details>
          )}
        </section>

        <div className="mt-6 flex justify-center">
          <AdSidebar slotId={AD_SLOTS.mapPageSquare} size="square" />
        </div>

        <ContextualOffers slug={entry.slug} category={config.category} name={config.name} />

        <section className="mt-10 bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">FAQ</h2>
          <dl className="space-y-6">
            {faqs.map((item) => (
              <div key={item.q}>
                <dt className="font-semibold text-gray-900">{item.q}</dt>
                <dd className="text-gray-700 mt-1">{item.a}</dd>
              </div>
            ))}
          </dl>
        </section>


        {claimsForVariable(entry.id).length > 0 && (
          <section className="mt-10 bg-sky-50 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-3">True or False?</h2>
            <ul className="space-y-2">
              {claimsForVariable(entry.id).map((c) => (
                <li key={c.slug}><Link href={`/true-false/claims/${c.slug}/`} className="text-sky-700 hover:underline">{c.text}</Link></li>
              ))}
            </ul>
            <Link href="/true-false/" className="inline-block mt-3 text-sm font-semibold text-sky-700">Play today&apos;s daily True or False →</Link>
          </section>
        )}

        {related.length > 0 && (
          <section className="mt-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Related statistics</h2>
            <ul className="grid md:grid-cols-2 gap-3">
              {related.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/map/${item.slug}/`}
                    className="block bg-white rounded-xl px-4 py-3 hover:bg-blue-50 text-blue-800"
                  >
                    {item.name} by country
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>

      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-gray-200 px-3 py-2 flex gap-2 text-sm">
        <a href="#deal-quiz" className="flex-1 text-center rounded-lg bg-amber-500 text-white font-medium py-2">🎯 Play deal quiz</a>
        <Link href="/truthle" className="flex-1 text-center rounded-lg border border-gray-300 text-gray-800 font-medium py-2">Play Truthle</Link>
      </div>
    </div>
  )
}

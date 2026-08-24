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
import type { ColorVariable } from '@/types/country'

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

  const faqs = [
    {
      q: question,
      a: answer,
    },
    {
      q: `How is ${config.name.toLowerCase()} measured?`,
      a: sourceBlurb(entry.id),
    },
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

      <main className="max-w-5xl mx-auto px-4 py-10">
        <p className="text-sm text-blue-700 font-medium mb-3">{config.category}</p>
        <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">{question}</h1>
        <p className="text-lg md:text-xl text-gray-800 mb-8">{answer}</p>

        <StatMap countries={countries} colorVariable={entry.id} />

        <EmbedSnippet slug={entry.slug} />

        <section className="mt-10 bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{config.name} by country</h2>
          <p className="text-gray-700 mb-6">{sourceBlurb(entry.id)}</p>
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
                {ranked.map((row, index) => (
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
        </section>

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
    </div>
  )
}

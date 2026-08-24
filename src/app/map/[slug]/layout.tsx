import type { Metadata } from 'next'
import { VARIABLES } from '@/lib/constants/variables'
import { getVariableBySlug, variableEntries, rankCountries, ranksHighFirst, topCountry } from '@/lib/seo/catalog'

export const dynamicParams = false

export function generateStaticParams() {
  return variableEntries.map((entry) => ({ slug: entry.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const entry = getVariableBySlug(params.slug)
  if (!entry) {
    return { title: 'Statistic not found | The World Truth Map' }
  }

  const config = VARIABLES[entry.id]
  const leader = topCountry(entry.id)
  const ranked = rankCountries(entry.id)
  const higher = ranksHighFirst(config)
  const question = `Which country has the ${higher ? 'highest' : 'lowest'} ${config.name.toLowerCase()}?`
  const answer = leader
    ? `${leader.country.name} ranks #1 for ${config.name.toLowerCase()} at ${leader.formatted}, among ${ranked.length} countries.`
    : `Compare ${config.name.toLowerCase()} across countries on The World Truth Map.`

  const og = `https://theworldtruth.com/og/map/${entry.slug}.png`

  return {
    title: `${question} ${config.name} by Country`,
    description: answer,
    keywords: [
      `${config.name} by country`,
      `which country has the ${higher ? 'highest' : 'lowest'} ${config.name}`,
      `${config.name} map`,
      `${config.name} ranking`,
      'world statistics',
    ],
    alternates: { canonical: `https://theworldtruth.com/map/${entry.slug}/` },
    openGraph: {
      title: question,
      description: answer,
      url: `https://theworldtruth.com/map/${entry.slug}/`,
      siteName: 'The World Truth Map',
      type: 'article',
      images: [{ url: og, width: 1200, height: 630, alt: `${config.name} world map` }],
    },
    twitter: {
      card: 'summary_large_image',
      title: question,
      description: answer,
      images: [og],
    },
  }
}

export default function MapStatLayout({ children }: { children: React.ReactNode }) {
  return children
}

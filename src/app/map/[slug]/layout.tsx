import type { Metadata } from 'next'
import { VARIABLES } from '@/lib/constants/variables'
import { mapLongform } from '@/lib/seo/mapLongform'
import { getMetricProvenance } from '@/lib/seo/provenance'
import {
  countries,
  getVariableBySlug,
  rankCountries,
  variableEntries,
} from '@/lib/seo/catalog'
import { buildMapCardCopy, mapOgAssetPath } from '../../../../scripts/og-card-helpers'

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
  const ranked = rankCountries(entry.id)
  const lf = mapLongform(entry.slug)
  const card = buildMapCardCopy({
    config,
    ranked,
    totalCountryCount: countries.length,
    provenance: getMetricProvenance(entry.id),
    longform: lf,
  })
  const canonical = `https://theworldtruth.com/map/${entry.slug}/`
  const og = `https://theworldtruth.com${mapOgAssetPath(entry.slug)}`

  return {
    title: card.title,
    description: card.description,
    keywords: card.keywords,
    alternates: { canonical },
    openGraph: {
      title: card.ogTitle,
      description: card.description,
      url: canonical,
      siteName: 'The World Truth Map',
      type: 'article',
      images: [{ url: og, width: 1200, height: 630, alt: `${config.name} world map` }],
    },
    twitter: {
      card: 'summary_large_image',
      title: card.ogTitle,
      description: card.description,
      images: [og],
    },
  }
}

export default function MapStatLayout({ children }: { children: React.ReactNode }) {
  return children
}

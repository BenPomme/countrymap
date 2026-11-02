import type { Metadata } from 'next'
import { allCountrySlugs, findCountryBySlug } from '@/lib/seo/catalog'
import { countrySlug } from '@/lib/seo/slugs'
import { VARIABLES } from '@/lib/constants/variables'
import '@/lib/constants/extraVariables'

const statisticCount = Object.keys(VARIABLES).length

export async function generateStaticParams() {
  return allCountrySlugs().map((slug) => ({ slug }))
}

// Generate metadata for each country
export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const slug = params.slug
  const country = findCountryBySlug(slug)

  if (!country) {
    return {
      title: 'Country Not Found | The World Truth Map',
    }
  }

  // Get flag emoji
  const flag = String.fromCodePoint(
    ...country.iso2
      .toUpperCase()
      .split('')
      .map((char) => 127397 + char.charCodeAt(0))
  )

  const title = `${country.name} Statistics & Rankings | The World Truth Map`
  const canonicalSlug = countrySlug(country.name)
  const canonical = `https://theworldtruth.com/country/${canonicalSlug}/`
  const description = `${flag} See how ${country.name} ranks globally across ${statisticCount} statistics: GDP, happiness, crime, health, lifestyle and more. Compare ${country.name} with other countries.`

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    keywords: [
      `${country.name} statistics`,
      `${country.name} rankings`,
      `${country.name} facts`,
      `${country.name} data`,
      `${country.name} country profile`,
      `${country.name} vs other countries`,
      `${country.name} GDP`,
      `${country.name} population`,
      `${country.name} happiness index`,
      `${country.name} crime rate`,
      `${country.name} life expectancy`,
    ],
    openGraph: {
      title: `${flag} ${country.name} - Country Statistics & World Rankings`,
      description: `How does ${country.name} rank globally? See rankings for GDP, happiness, safety, health and ${statisticCount} statistics.`,
      url: canonical,
      siteName: 'The World Truth Map',
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${flag} ${country.name} Statistics & Rankings`,
      description: `How does ${country.name} rank? GDP, happiness, crime and ${statisticCount} statistics compared globally.`,
    },
  }
}

export default function CountryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

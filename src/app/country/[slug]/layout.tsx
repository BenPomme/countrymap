import type { Metadata } from 'next'
import countriesData from '@/../../data/countries.json'
import type { Country } from '@/types/country'

// Generate static params for all countries
export async function generateStaticParams() {
  return (countriesData as Country[]).map((country) => ({
    slug: country.name.toLowerCase().replace(/\s+/g, '-'),
  }))
}

// Generate metadata for each country
export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const slug = params.slug
  const country = (countriesData as Country[]).find(
    (c) => c.name.toLowerCase().replace(/\s+/g, '-') === slug.toLowerCase()
  )

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
  const description = `${flag} See how ${country.name} ranks globally across 90 statistics: GDP, happiness, crime, health, lifestyle & more. Compare ${country.name} with other countries.`

  return {
    title,
    description,
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
      description: `How does ${country.name} rank globally? See rankings for GDP, happiness, safety, health & 80+ more statistics.`,
      url: `https://theworldtruth.com/country/${slug}`,
      siteName: 'The World Truth Map',
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${flag} ${country.name} Statistics & Rankings`,
      description: `How does ${country.name} rank? GDP, happiness, crime & 80+ stats compared globally.`,
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

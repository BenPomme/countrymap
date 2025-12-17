import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Analytics from '@/components/Analytics'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'The World Truth Map | Compare Countries by 90 Statistics',
  description: 'Compare 164 countries by 90 stats: penis size, height, metal bands, beer consumption, happiness, IQ, GDP, divorce rates & more. Which country has the most metal bands? Discover 1,300+ correlations!',
  keywords: [
    // Core features
    'world statistics map',
    'country comparison tool',
    'global data visualization',
    'country rankings',
    'data correlations',
    // HIGH-VOLUME: Body Stats (VERY SEARCHED)
    'average penis size by country',
    'penis size map',
    'biggest penis by country',
    'average breast size by country',
    'breast cup size by country',
    'average height by country',
    'tallest countries in the world',
    'shortest countries',
    'obesity rate by country',
    // HIGH-VOLUME: Metal & Music (VIRAL)
    'metal bands per capita',
    'which country has the most metal bands',
    'Finland metal bands',
    'why Finland has so many metal bands',
    'heavy metal by country',
    // HIGH-VOLUME: Alcohol & Consumption
    'beer consumption by country',
    'which country drinks the most beer',
    'wine consumption by country',
    'alcohol consumption by country',
    'coffee consumption by country',
    'tea consumption by country',
    'chocolate consumption by country',
    // HIGH-VOLUME: Happiness & Quality of Life
    'happiest countries in the world',
    'happiness index by country',
    'safest countries in the world',
    'most dangerous countries',
    'best countries to live',
    // HIGH-VOLUME: Relationships & Sex
    'divorce rate by country',
    'highest divorce rate',
    'LGBT acceptance by country',
    'gay friendly countries',
    'dating app usage by country',
    'sexual partners by country',
    'age of first sex by country',
    // Religion & Demographics
    'world map by religion',
    'muslim countries map',
    'christian countries',
    'ethnic diversity by country',
    'median age by country',
    'immigration rate by country',
    'vegetarian countries',
    'vegan population by country',
    // Economy & Wealth
    'GDP per capita by country',
    'richest countries',
    'poorest countries',
    'tax rates by country',
    'billionaires per capita',
    'millionaires by country',
    // Intelligence & Education
    'average IQ by country',
    'IQ map world',
    'smartest countries',
    'PISA scores by country',
    'literacy rate by country',
    // Governance
    'democracy index by country',
    'most corrupt countries',
    'press freedom by country',
    // Crime & Safety
    'crime rate by country',
    'homicide rate by country',
    'gun ownership by country',
    // Health
    'life expectancy by country',
    'suicide rate by country',
    'diabetes rate by country',
    // Transport & Environment
    'CO2 emissions per capita',
    'electric car adoption by country',
    // Truthle - Daily Quiz
    'truthle',
    'daily world quiz',
    'geography trivia game',
    'world facts quiz',
    'country comparison quiz',
  ],
  authors: [{ name: 'The World Truth' }],
  creator: 'The World Truth',
  publisher: 'The World Truth',
  metadataBase: new URL('https://theworldtruth.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'The World Truth Map | Compare 164 Countries by 90 Statistics',
    description: 'Which country has the biggest? Compare penis size, height, metal bands, beer consumption, happiness, IQ & 80+ stats. 1,300+ correlations!',
    url: 'https://theworldtruth.com',
    siteName: 'The World Truth Map',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'The World Truth Map - Compare 164 Countries by 89 Statistics',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The World Truth Map | 90 Statistics, 164 Countries',
    description: 'Finland has the most metal bands! Compare penis size, height, beer consumption, happiness & 80+ stats. Which country ranks #1?',
    creator: '@theworldtruth',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        '@id': 'https://theworldtruth.com/#webapp',
        name: 'The World Truth Map',
        description: 'Interactive world map comparing 164 countries across 90 statistics including penis size, height, metal bands per capita, beer consumption, happiness, IQ, and more. Explore 1,300+ data correlations.',
        url: 'https://theworldtruth.com',
        applicationCategory: 'Reference',
        operatingSystem: 'Any',
        browserRequirements: 'Requires JavaScript',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
        featureList: [
          'Interactive world map with 89 statistics',
          'Country comparison charts',
          'Correlation discovery tool',
          'Quiz game with world facts',
          'Visual sharing for social media'
        ],
      },
      {
        '@type': 'Dataset',
        '@id': 'https://theworldtruth.com/#dataset',
        name: 'World Country Statistics Dataset',
        description: 'Comprehensive dataset of 164 countries with 90 variables covering body stats (penis size, height), lifestyle (metal bands, beer, coffee), economy, health, demographics, education, and more.',
        url: 'https://theworldtruth.com',
        license: 'https://creativecommons.org/licenses/by/4.0/',
        variableMeasured: [
          'Penis size by country', 'Average height', 'Metal bands per capita',
          'Beer consumption', 'Wine consumption', 'Happiness index', 'IQ scores',
          'GDP per capita', 'Divorce rate', 'LGBT acceptance', 'Obesity rate',
          'Crime rates', 'Life expectancy', 'Coffee consumption', 'Tax rates'
        ],
        spatialCoverage: 'World',
        temporalCoverage: '2022/2024',
      },
      {
        '@type': 'Organization',
        '@id': 'https://theworldtruth.com/#organization',
        name: 'The World Truth',
        url: 'https://theworldtruth.com',
        logo: 'https://theworldtruth.com/og-image.png',
      },
      {
        '@type': 'WebSite',
        '@id': 'https://theworldtruth.com/#website',
        url: 'https://theworldtruth.com',
        name: 'The World Truth Map',
        publisher: { '@id': 'https://theworldtruth.com/#organization' },
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://theworldtruth.com/charts/?search={search_term_string}',
          'query-input': 'required name=search_term_string'
        }
      }
    ]
  }

  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#2563eb" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* Google AdSense */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6325580740065771"
          crossOrigin="anonymous"
        />
      </head>
      <body className={inter.className}>
        <Analytics />
        {children}
      </body>
    </html>
  )
}

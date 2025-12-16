import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Analytics from '@/components/Analytics'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'The World Truth Map | Compare Countries by 89 Statistics',
  description: 'Interactive world map comparing 164 countries across 89 statistics: IQ, happiness, GDP, taxes, crime, health, relationships, and more. Discover 1,300+ correlations between country data.',
  keywords: [
    // Core features
    'world statistics map',
    'country comparison tool',
    'global data visualization',
    'country rankings',
    'data correlations',
    // Religion & Demographics
    'world map by religion',
    'muslim countries map',
    'christian countries',
    'ethnic diversity by country',
    'population density map',
    'median age by country',
    'immigration rate by country',
    // Economy & Wealth
    'GDP per capita map',
    'richest countries',
    'poorest countries',
    'country debt to GDP',
    'tax rates by country',
    'corporate tax comparison',
    'unemployment rate map',
    'inflation rate by country',
    'Gini index inequality',
    'billionaires per capita',
    // Governance
    'democracy index by country',
    'corruption index map',
    'press freedom map',
    'economic freedom index',
    // Crime & Safety
    'crime rate by country',
    'safest countries',
    'homicide rate map',
    'gun ownership by country',
    // Health
    'life expectancy by country',
    'obesity rate by country',
    'smoking rate by country',
    'cancer rate by country',
    'diabetes rate by country',
    'suicide rate by country',
    'mental health by country',
    'air pollution map',
    // Intelligence & Education
    'average IQ by country',
    'IQ map',
    'PISA scores by country',
    'literacy rate map',
    'university enrollment',
    // Lifestyle
    'happiness index by country',
    'happiest countries',
    'alcohol consumption by country',
    'coffee consumption by country',
    'meat consumption by country',
    'vegetarian rate by country',
    // Physical
    'average height by country',
    'tallest countries',
    // Relationships
    'divorce rate by country',
    'fertility rate by country',
    'marriage age by country',
    'LGBT acceptance by country',
    'teen pregnancy rate',
    // Transport & Environment
    'car ownership by country',
    'CO2 emissions per capita',
    'recycling rate by country',
    'forest coverage map',
    // Truthle - Daily Quiz
    'truthle',
    'daily world quiz',
    'geography trivia game',
    'world facts quiz',
  ],
  authors: [{ name: 'The World Truth' }],
  creator: 'The World Truth',
  publisher: 'The World Truth',
  metadataBase: new URL('https://theworldtruth.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'The World Truth Map | Compare 164 Countries by 89 Statistics',
    description: 'Compare countries by IQ, GDP, taxes, happiness, crime, health & 80+ more stats. Discover 1,300+ surprising correlations. Free interactive map.',
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
    title: 'The World Truth Map | 89 Statistics, 164 Countries',
    description: 'Compare countries by IQ, GDP, taxes, happiness, crime & 80+ more. Discover 1,300+ correlations. Which stats are connected? 🌍📊',
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
        description: 'Interactive world map comparing 164 countries across 89 statistics including IQ, GDP, taxes, crime, health, and more. Explore 1,300+ data correlations.',
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
        description: 'Comprehensive dataset of 164 countries with 89 variables covering economy, health, demographics, education, lifestyle, governance, transport, and environment.',
        url: 'https://theworldtruth.com',
        license: 'https://creativecommons.org/licenses/by/4.0/',
        variableMeasured: [
          'GDP per capita', 'Government debt', 'Tax rates', 'Unemployment',
          'Life expectancy', 'IQ scores', 'Crime rates', 'Happiness index',
          'CO2 emissions', 'Corruption index', 'Press freedom'
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

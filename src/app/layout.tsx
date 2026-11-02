import type { Metadata } from 'next'
import { Suspense } from 'react'
import './globals.css'
import Analytics from '@/components/Analytics'
import AdSenseLoader from '@/components/ads/AdSenseLoader'
import ConsentManager from '@/components/analytics/ConsentManager'
import AppBridgeLifecycle from '@/components/bridge/AppBridgeLifecycle'
import SiteFooter from '@/components/site/SiteFooter'
import SiteHeader from '@/components/site/SiteHeader'
import { VARIABLES } from '@/lib/constants/variables'
import '@/lib/constants/extraVariables'
import { countries } from '@/lib/data/loadCountries'
import correlationsData from '../../data/correlations.json'

const countryCount = countries.length
const statisticCount = Object.keys(VARIABLES).length
const correlationCount = correlationsData.correlations.length

export const metadata: Metadata = {
  title: 'The World Truth Map | Daily World Quizzes & Country Stats',
  description: `Play free daily world quizzes and compare ${countryCount} countries across ${statisticCount} statistics, from happiness and health to beer and metal bands. Explore ${correlationCount.toLocaleString('en-US')} correlations.`,
  keywords: [
    'world statistics map',
    'country comparison tool',
    'global data visualization',
    'country rankings',
    'data correlations',
    'average penis size by country',
    'penis size map',
    'biggest penis by country',
    'average breast size by country',
    'breast cup size by country',
    'average height by country',
    'tallest countries in the world',
    'shortest countries',
    'obesity rate by country',
    'metal bands per capita',
    'which country has the most metal bands',
    'Finland metal bands',
    'why Finland has so many metal bands',
    'heavy metal by country',
    'beer consumption by country',
    'which country drinks the most beer',
    'wine consumption by country',
    'alcohol consumption by country',
    'coffee consumption by country',
    'tea consumption by country',
    'chocolate consumption by country',
    'happiest countries in the world',
    'happiness index by country',
    'safest countries in the world',
    'most dangerous countries',
    'best countries to live',
    'divorce rate by country',
    'highest divorce rate',
    'LGBT acceptance by country',
    'gay friendly countries',
    'dating app usage by country',
    'sexual partners by country',
    'age of first sex by country',
    'world map by religion',
    'muslim countries map',
    'christian countries',
    'ethnic diversity by country',
    'median age by country',
    'immigration rate by country',
    'vegetarian countries',
    'vegan population by country',
    'GDP per capita by country',
    'richest countries',
    'poorest countries',
    'tax rates by country',
    'billionaires per capita',
    'millionaires by country',
    'average IQ by country',
    'IQ map world',
    'smartest countries',
    'PISA scores by country',
    'literacy rate by country',
    'democracy index by country',
    'most corrupt countries',
    'press freedom by country',
    'crime rate by country',
    'homicide rate by country',
    'gun ownership by country',
    'life expectancy by country',
    'suicide rate by country',
    'diabetes rate by country',
    'CO2 emissions per capita',
    'electric car adoption by country',
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
    title: `The World Truth Map | ${countryCount} Countries, ${statisticCount} Statistics`,
    description: `Compare ${countryCount} countries across ${statisticCount} statistics and explore ${correlationCount.toLocaleString('en-US')} correlations. Play the free daily world quizzes too.`,
    url: 'https://theworldtruth.com/',
    siteName: 'The World Truth Map',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: `The World Truth Map: ${countryCount} countries and ${statisticCount} statistics`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `The World Truth Map | ${statisticCount} Statistics, ${countryCount} Countries`,
    description: `Compare countries across ${statisticCount} statistics, explore ${correlationCount.toLocaleString('en-US')} correlations and play free daily world quizzes.`,
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
        description: `Interactive world map comparing ${countryCount} countries across ${statisticCount} statistics, with ${correlationCount.toLocaleString('en-US')} data correlations and daily world quizzes.`,
        url: 'https://theworldtruth.com/',
        applicationCategory: 'Reference',
        operatingSystem: 'Any',
        browserRequirements: 'Requires JavaScript',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
        featureList: [
          `Interactive world map with ${statisticCount} statistics`,
          `Country comparison charts for ${countryCount} countries`,
          'Correlation discovery tool',
          'Quiz game with world facts',
          'Visual sharing for social media',
        ],
      },
      {
        '@type': 'Organization',
        '@id': 'https://theworldtruth.com/#organization',
        name: 'The World Truth',
        url: 'https://theworldtruth.com/',
        logo: 'https://theworldtruth.com/og-image.png',
      },
      {
        '@type': 'WebSite',
        '@id': 'https://theworldtruth.com/#website',
        url: 'https://theworldtruth.com/',
        name: 'The World Truth Map',
        publisher: { '@id': 'https://theworldtruth.com/#organization' },
      },
    ],
  }

  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#2563eb" />
        <meta name="google-adsense-account" content="ca-pub-6325580740065771" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen font-sans antialiased">
        <SiteHeader />
        {children}
        <SiteFooter />
        <Suspense fallback={null}>
          <AppBridgeLifecycle />
        </Suspense>
        <Analytics />
        <AdSenseLoader />
        <ConsentManager />
      </body>
    </html>
  )
}

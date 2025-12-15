import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'The World Truth Map | Compare Countries by 50+ Statistics',
  description: 'Interactive world map comparing countries by IQ, happiness, height, wealth, democracy, religion, crime rates, LGBT acceptance, and 50+ more statistics. Explore correlations and country rankings.',
  keywords: [
    'world map by religion',
    'countries by religion',
    'muslim countries map',
    'christian countries',
    'democracy index by country',
    'country comparison',
    'crime rate by country',
    'safest countries',
    'most dangerous countries',
    'homicide rate map',
    'GDP per capita map',
    'richest countries',
    'poorest countries',
    'gender equality index',
    'women rights by country',
    'war zones map',
    'countries at war',
    'world statistics',
    'global data visualization',
    'country rankings',
    'religion statistics',
    'democracy rankings',
    'poverty map',
    'world data',
    // New statistics
    'average IQ by country',
    'IQ map',
    'happiness index by country',
    'happiest countries',
    'average height by country',
    'tallest countries',
    'obesity rate by country',
    'alcohol consumption by country',
    'coffee consumption by country',
    'LGBT acceptance by country',
    'divorce rate by country',
    'fertility rate by country',
    'life expectancy by country',
    'suicide rate by country',
    'ethnic diversity by country',
    'median age by country',
    'corruption index map',
    'press freedom map',
    'gun ownership by country',
    'country data correlations',
  ],
  authors: [{ name: 'The World Truth' }],
  creator: 'The World Truth',
  publisher: 'The World Truth',
  metadataBase: new URL('https://theworldtruth.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'The World Truth Map | Compare Countries by 50+ Statistics',
    description: 'Interactive world map comparing countries by IQ, happiness, height, wealth, democracy, religion, and 50+ more statistics. Explore correlations and rankings.',
    url: 'https://theworldtruth.com',
    siteName: 'The World Truth Map',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'The World Truth Map - Compare Countries Globally',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The World Truth Map | Compare Countries by 50+ Statistics',
    description: 'Interactive world map comparing countries by IQ, happiness, height, democracy, religion, and 50+ more. Explore custom correlations.',
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
    '@type': 'WebApplication',
    name: 'The World Truth Map',
    description: 'Interactive world map comparing countries by IQ, happiness, height, democracy, religion, crime rates, and 50+ more statistics. Explore custom correlations.',
    url: 'https://theworldtruth.com',
    applicationCategory: 'Reference',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    author: {
      '@type': 'Organization',
      name: 'The World Truth',
    },
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
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}

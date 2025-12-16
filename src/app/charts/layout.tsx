import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Country Charts & Rankings | Compare 89 Statistics - World Truth Map',
  description: 'Interactive charts comparing countries by GDP, IQ, taxes, crime, happiness & 80+ more statistics. Bar charts, scatter plots, and correlation explorer.',
  keywords: [
    'country rankings',
    'country charts',
    'GDP comparison',
    'country statistics charts',
    'scatter plot countries',
    'correlation explorer',
    'bar chart countries',
    'compare countries',
    'data visualization',
  ],
  openGraph: {
    title: 'Country Charts & Rankings - 89 Statistics Visualized',
    description: 'Compare countries with interactive charts: GDP, IQ, taxes, crime & more. Discover correlations between statistics.',
    url: 'https://theworldtruth.com/charts/',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Country Rankings & Charts 📊',
    description: 'Interactive charts comparing 164 countries by 89 statistics. Find patterns in world data.',
  },
  alternates: {
    canonical: '/charts/',
  },
}

export default function ChartsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

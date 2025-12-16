import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Discover 1,300+ Correlations Between Country Statistics | World Truth Map',
  description: 'Explore surprising correlations: IQ vs GDP (+0.82), Corruption vs Economic Freedom (+0.92), Life Expectancy vs Median Age (+0.91). Find hidden patterns in 89 country statistics.',
  keywords: [
    'country data correlations',
    'statistics correlations',
    'IQ GDP correlation',
    'data patterns',
    'country comparisons',
    'economic correlations',
    'health correlations',
    'world data analysis',
  ],
  openGraph: {
    title: 'Discover 1,300+ Surprising Correlations in Country Data',
    description: 'Did you know corruption correlates +0.92 with economic freedom? Explore 1,300+ data correlations across 89 country statistics.',
    url: 'https://theworldtruth.com/discoveries/',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: '1,300+ Surprising Correlations in Country Data 🔍',
    description: 'IQ vs GDP: +0.82 | Corruption vs Freedom: +0.92 | Explore hidden patterns in world statistics',
  },
  alternates: {
    canonical: '/discoveries/',
  },
}

export default function DiscoveriesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

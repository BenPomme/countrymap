import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Country Data Discoveries: 1,321 Correlations | The World Truth',
  description:
    'Explore 1,321 measured associations from 4,186 country data pairs across 92 variables. Inspect each sample and open a direct pair link.',
  keywords: [
    'country data correlations',
    'statistics correlations',
    'data patterns',
    'country comparisons',
    'economic correlations',
    'health correlations',
    'world data analysis',
  ],
  openGraph: {
    title: '1,321 Country Data Discoveries',
    description:
      'Browse 1,321 measured associations from 4,186 tested pairs across 92 country variables, with sample sizes and direct pair links.',
    url: 'https://theworldtruth.com/discoveries/',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Country Data Discoveries',
    description:
      'Explore 1,321 measured country associations across 92 variables. Each pair includes its sample size and a direct link.',
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

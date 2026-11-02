import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Country Charts: 93 Statistics and Rankings | The World Truth',
  description:
    'Compare 93 country statistics with rankings, scatter plots and a custom correlation explorer. Every chart selection has its own link.',
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
    title: 'Country Charts and Rankings Across 93 Statistics',
    description:
      'Compare countries with interactive charts for 93 measures, including rankings, a wealth and democracy view and a custom correlation explorer.',
    url: 'https://theworldtruth.com/charts/',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Country Rankings and Charts',
    description:
      'Interactive charts compare countries across 93 measures. Find patterns and keep the exact chart selection in a direct link.',
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

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Country Correlations & Rankings | The World Truth Map',
  description: 'Explore custom correlations between any country statistics: IQ vs wealth, happiness vs religion, height vs GDP, and more. Interactive charts for 50+ variables.',
  keywords: [
    'country rankings',
    'country correlations',
    'IQ by country chart',
    'happiness rankings',
    'height by country chart',
    'democracy rankings',
    'GDP rankings',
    'safest countries ranking',
    'most democratic countries',
    'richest countries list',
    'poorest countries list',
    'gender equality rankings',
    'homicide rate rankings',
    'country statistics charts',
    'world data charts',
    'penis size by country',
    'alcohol consumption chart',
    'coffee consumption ranking',
    'LGBT acceptance chart',
    'obesity rate rankings',
    'suicide rate by country',
    'fertility rate chart',
  ],
  openGraph: {
    title: 'Country Correlations & Rankings | The World Truth Map',
    description: 'Explore custom correlations between 50+ country statistics. Create your own data comparisons.',
    url: 'https://theworldtruth.com/charts',
  },
}

export default function ChartsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

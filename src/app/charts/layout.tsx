import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Country Rankings & Charts | The World Truth Map',
  description: 'Compare country rankings by democracy score, GDP per capita, gender equality, homicide rates and religion. Interactive charts and data visualizations for global statistics.',
  keywords: [
    'country rankings',
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
  ],
  openGraph: {
    title: 'Country Rankings & Charts | The World Truth Map',
    description: 'Compare country rankings by democracy, GDP, gender equality, crime rates and more.',
    url: 'https://www.theworldtruth.com/charts',
  },
}

export default function ChartsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

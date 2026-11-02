import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { absolute: 'Truthle - Free Daily World Facts Quiz | 5 Sourced Questions' },
  description: 'Five sourced country and world statistics questions in each available daily round, with one free attempt, source notes and an optional one-time EUR0.99 Extra Attempt.',
  keywords: [
    'truthle',
    'daily quiz',
    'world facts quiz',
    'country quiz',
    'daily trivia',
    'wordle for geography',
    'world statistics game',
    'daily challenge',
    'geography game',
    'country trivia',
  ],
  openGraph: {
    title: 'Truthle - Daily World Facts Quiz',
    description: 'Five sourced questions about countries and world statistics. Same daily set, one free attempt and source notes after each answer.',
    url: 'https://theworldtruth.com/truthle/',
    siteName: 'The World Truth',
    images: [
      {
        url: 'https://theworldtruth.com/og/truthle.png',
        width: 1200,
        height: 630,
        alt: 'Truthle - Daily World Facts Quiz',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Truthle - Daily World Facts Quiz',
    description: 'Five sourced world facts questions, the same for everyone. Source notes appear after you answer.',
    images: ['https://theworldtruth.com/og/truthle.png'],
  },
  alternates: {
    canonical: 'https://theworldtruth.com/truthle/',
  },
}

export default function TruthleLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

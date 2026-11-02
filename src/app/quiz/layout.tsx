import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'The Truth Quiz: Country Data Questions | The World Truth',
  description:
    'Play up to 20 country data questions drawn from measures that pass the current provenance check. Optional timer, streak bonuses and shareable results.',
  keywords: [
    'world quiz',
    'country quiz',
    'geography quiz',
    'trivia game',
    'world knowledge test',
    'country statistics quiz',
    'country data quiz',
    'country facts',
  ],
  openGraph: {
    title: 'The Truth Quiz: How Well Do You Know the World?',
    description:
      'Answer up to 20 country data questions from measures that pass the current provenance check. Add a timer or play without one.',
    url: 'https://theworldtruth.com/quiz/',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'The Truth Quiz from The World Truth',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Truth Quiz',
    description:
      'Up to 20 country data questions from measures that pass the current provenance check. Share your result when the round ends.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: '/quiz/',
  },
}

export default function QuizLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

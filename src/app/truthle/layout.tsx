import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Truthle - Daily World Facts Quiz | Test Your Global Knowledge',
  description: 'Play Truthle, the daily world facts quiz! 10 questions about countries, statistics, and global data. Same questions for everyone, one chance per day. Can you beat your friends?',
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
    description: 'Can you ace today\'s 10 world facts questions? Play Truthle - same questions for everyone, one attempt per day!',
    url: 'https://theworldtruth.com/truthle/',
    images: [
      {
        url: '/truthle.png',
        width: 512,
        height: 512,
        alt: 'Truthle - Daily World Facts Quiz',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'Truthle 🌍 Daily World Facts Quiz',
    description: 'Can you beat today\'s 10 questions? Same quiz for everyone, one chance per day!',
    images: ['/truthle.png'],
  },
  alternates: {
    canonical: '/truthle/',
  },
}

export default function TruthleLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

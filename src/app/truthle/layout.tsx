import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Truthle - Daily World Facts Quiz | Test Your Global Knowledge',
  description: 'Play Truthle, the daily world facts quiz! 10 questions about countries, statistics, and global data. Same questions for everyone, one chance per day. Earn coins, unlock badges, and compete with friends!',
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
    'quiz rewards',
    'streak bonus',
  ],
  openGraph: {
    title: 'Truthle - Daily World Facts Quiz',
    description: 'Can you ace today\'s 10 world facts questions? Play Truthle - same questions for everyone, one attempt per day!',
    url: 'https://theworldtruth.com/truthle/',
    siteName: 'The World Truth',
    images: [
      {
        url: 'https://theworldtruth.com/truthle.png',
        width: 512,
        height: 512,
        alt: 'Truthle - Daily World Facts Quiz',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'Truthle - Daily World Facts Quiz',
    description: 'Can you beat today\'s 10 questions? Same quiz for everyone, one chance per day!',
    images: ['https://theworldtruth.com/truthle.png'],
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

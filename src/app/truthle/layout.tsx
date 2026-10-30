import SeoAbout from '@/components/seo/SeoAbout'
import type { Metadata } from 'next'
import { MONETIZE_COPY } from '@/lib/truthle/monetizeCopy'

export const metadata: Metadata = {
  title: 'Truthle - Daily World Facts Quiz | Test Your Global Knowledge',
  description: 'Play Truthle, the daily world facts quiz! 5 quick questions about countries, statistics, and global data. Same questions for everyone, one chance per day. Earn coins, unlock badges, and share with friends!',
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
    description: 'Can you ace today\'s 5 world facts questions? Play Truthle - same questions for everyone, one attempt per day!',
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
    description: 'Can you beat today\'s 5 questions? Same quiz for everyone, one chance per day!',
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
  return (
    <>
      {children}
      <SeoAbout
        h1="Truthle: the free daily world facts quiz"
        intro="Truthle is a free daily quiz with 5 questions about countries and world statistics. Everyone gets the same questions each day, and you get one free attempt. Questions are built from the country data on The World Truth Map."
        steps={[
          'Read each question about a country or world statistic.',
          'Pick your answer. You see if you were right and the real figure right away.',
          'Finish all 5 to get your score, streak and result squares.',
          'Share your result. Sharing also gives you a free Extra Attempt code for a friend.',
          'Come back tomorrow for a new set. Want another run today? Extra Attempt (€0.99) gives one more full run; your first score stays on the leaderboard.',
        ]}
        faqs={[
          { q: 'What is Truthle?', a: 'Truthle is a free daily world facts quiz from The World Truth: 5 questions per day about countries and world statistics, the same for everyone.' },
          { q: 'Is Truthle like Wordle?', a: 'It borrows the Wordle format: one puzzle per day, the same for everyone, with a shareable result grid. But Truthle is not a word game. You answer 5 questions about country statistics instead of guessing a word.' },
          { q: 'Is Truthle the same as Trustle or Truthling?', a: 'No. Truthle (theworldtruth.com/truthle) is a separate game about world facts and country data. Trustle, Truthling and other similarly named games are unrelated products.' },
          { q: 'How many questions are in Truthle?', a: '5 questions per day. A new set unlocks every day.' },
          { q: 'Is Truthle free?', a: 'Yes. Every daily game is free with one attempt. An optional Extra Attempt costs €0.99, or a friend can share a free Extra Attempt code with you.' },
          ...MONETIZE_COPY.en.faq,
          { q: 'Where does the data come from?', a: 'Questions use the country datasets behind The World Truth Map. Each map page lists its source.' },
        ]}
      />
    </>
  )
}

import SeoAbout from '@/components/seo/SeoAbout'
import type { Metadata } from 'next'
import { MONETIZE_COPY } from '@/lib/truthle/monetizeCopy'

export const metadata: Metadata = {
  title: { absolute: 'Truthle - Free Daily World Facts Quiz | Sourced Questions' },
  description: 'Up to five sourced country and world statistics questions each day, with one free attempt. Source notes, honest limits and an optional EUR0.99 Extra Attempt.',
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
    description: 'Play up to five sourced questions about countries and world statistics. Same daily set, one free attempt and source notes after each answer.',
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
    description: 'Up to five sourced world facts questions, the same for everyone. Source notes appear after you answer.',
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
        intro="Truthle is a free daily quiz built from sourced country and world statistics. Everyone gets the same eligible questions each day, and you get one free attempt. The number of questions can be up to five, depending on how many sourced questions are available."
        steps={[
          'Read each question about a country or world statistic.',
          'Pick your answer. You see whether you were right, the real figure and any available source notes.',
          'Finish the eligible set to get your score, correct count and streak.',
          'Share your result without spoiling answers. A friend gift is prepared only when you explicitly ask for one.',
          'Come back after 00:00 UTC for the next set. A one-time EUR0.99 Extra Attempt gives one more optional run today.',
        ]}
        faqs={[
          { q: 'What is Truthle?', a: 'Truthle is a free daily world facts quiz from The World Truth. It uses sourced country and world statistics, with the same eligible set for everyone each UTC day.' },
          { q: 'Is Truthle like Wordle?', a: 'It borrows the one-puzzle-per-day and spoiler-free sharing format. Truthle is not a word game: you answer questions about country statistics instead of guessing a word.' },
          { q: 'How many questions are in Truthle?', a: 'Up to five sourced questions each day. Some days may have fewer. If no eligible sourced questions can be built, the round is shown as unavailable instead of inventing questions.' },
          { q: 'Where do the questions and sources come from?', a: 'Questions use the country datasets behind The World Truth Map. After you answer, Truthle shows the available source, year, coverage and known limitations for that question. If a detail is not recorded, the page says so.' },
          { q: 'Is Truthle free?', a: 'Yes. The daily set is free with one attempt. An optional Extra Attempt costs EUR0.99 once, with no subscription. A friend code is validated by the server at checkout and is never confirmed by the page alone.' },
          { q: 'What happens if I already played today?', a: 'Your saved result and streak remain available. You can share without spoiling answers or, when eligible, use an existing Extra Attempt. Your primary score is kept separately from a retry run.' },
          ...MONETIZE_COPY.en.faq,
        ]}
      />
    </>
  )
}

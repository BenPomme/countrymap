import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'The Truth Quiz | Test Your World Knowledge - 89 Statistics',
  description: 'Can you guess which country has the highest IQ? Most billionaires? Best happiness? Challenge yourself with 20 questions from 89 country statistics.',
  keywords: [
    'world quiz',
    'country quiz',
    'geography quiz',
    'trivia game',
    'world knowledge test',
    'country statistics quiz',
    'fun facts quiz',
    'IQ quiz',
    'GDP quiz',
    'country facts',
  ],
  openGraph: {
    title: 'The Truth Quiz - Can You Beat 20 World Statistics Questions?',
    description: 'Which country has the highest IQ? Most crime? Best happiness? Test your knowledge across 89 statistics!',
    url: 'https://theworldtruth.com/quiz/',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'The Truth Quiz - Test Your World Knowledge',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Truth Quiz 🧠 Can You Beat 20/20?',
    description: 'Which country has the highest IQ? Most billionaires? Test your knowledge!',
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

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'The Truth Quiz | Test Your World Knowledge',
  description: 'Challenge yourself with 20 questions about countries around the world. Test your knowledge on happiness, coffee consumption, life expectancy, and more!',
  keywords: [
    'world quiz',
    'country quiz',
    'geography quiz',
    'trivia game',
    'world knowledge test',
    'country statistics quiz',
    'fun facts quiz',
  ],
  openGraph: {
    title: 'The Truth Quiz | Test Your World Knowledge',
    description: 'Challenge yourself with 20 questions about countries. Can you beat the quiz?',
    url: 'https://theworldtruth.com/quiz',
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
    title: 'The Truth Quiz | Test Your World Knowledge',
    description: 'Challenge yourself with 20 questions about countries. Can you beat the quiz?',
    images: ['/og-image.png'],
  },
}

export default function QuizLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

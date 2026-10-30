import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'True or False World Quiz — Free Daily Country Stats Game',
  description: 'Guess true or false on 5 country and world stats. Same quiz for everyone daily. Build streaks and share your score. Free, no signup.',
  openGraph: {
    title: 'True or False: World — Can you get 5/5 today?',
    description: '5 claims about the world. True or false? Same for everyone, new every day.',
    url: 'https://theworldtruth.com/true-false/',
    siteName: 'The World Truth',
    images: [{ url: 'https://theworldtruth.com/og/true-false.png', width: 1200, height: 630 }],
  },
  twitter: { card: 'summary_large_image', title: 'True or False: World — Can you get 5/5 today?', description: '5 claims about the world. True or false? New every day.', images: ['https://theworldtruth.com/og/true-false.png'] },
  alternates: { canonical: 'https://theworldtruth.com/true-false/' },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}

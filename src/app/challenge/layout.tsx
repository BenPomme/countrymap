import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Challenge Link | Truthle and True or False',
  description: 'Open a Truthle or True or False challenge link, check the UTC puzzle day and continue without using a friend Extra Attempt code.',
  alternates: { canonical: 'https://theworldtruth.com/challenge/' },
  robots: { index: false, follow: true },
}

export default function ChallengeLayout({ children }: { children: React.ReactNode }) {
  return children
}

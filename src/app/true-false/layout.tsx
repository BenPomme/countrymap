import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'True or False: World | Free Daily Country Stats Quiz',
  description: 'Five sourced true-or-false claims about countries and world statistics each available UTC day. One free run, with recorded figures and source notes where available.',
  openGraph: {
    title: 'True or False: World | Five sourced calls about the world',
    description: 'Read five claims built from country statistics, call each one true or false and check the recorded figures.',
    url: 'https://theworldtruth.com/true-false/',
    siteName: 'The World Truth',
    images: [{ url: 'https://theworldtruth.com/og/true-false.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'True or False: World | Five sourced calls about the world',
    description: 'Five claims built from country statistics. Call each one true or false, then check the figures.',
    images: ['https://theworldtruth.com/og/true-false.png'],
  },
  alternates: { canonical: 'https://theworldtruth.com/true-false/' },
}

export default function TrueFalseLayout({ children }: { children: React.ReactNode }) {
  return children
}

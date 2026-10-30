import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'True or False: World — Daily Country Facts Game | Truthle',
  description: '5 true-or-false claims about countries, politics and world stats every day. Same claims for everyone. Keep your streak and share your score.',
  openGraph: {
    title: 'True or False: World — Daily',
    description: '5 claims about the world. True or false? Same for everyone, new every day.',
    url: 'https://theworldtruth.com/true-false/',
    siteName: 'The World Truth',
    images: [{ url: 'https://theworldtruth.com/og/truthle.png', width: 1200, height: 630 }],
  },
  twitter: { card: 'summary_large_image', title: 'True or False: World', images: ['https://theworldtruth.com/og/truthle.png'] },
  alternates: { canonical: 'https://theworldtruth.com/true-false/' },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}

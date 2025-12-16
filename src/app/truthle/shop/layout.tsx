import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Truthle Shop - Earn Rewards & Unlock Badges | The World Truth',
  description: 'Earn Truthle Coins by playing the daily world facts quiz! Unlock exclusive badges, themes, powerups, and profile customizations. Free virtual rewards for geography enthusiasts.',
  keywords: [
    'truthle rewards',
    'world quiz rewards',
    'geography game badges',
    'daily quiz prizes',
    'virtual rewards',
    'truthle coins',
    'quiz powerups',
    'streak rewards',
    'world facts game',
    'free quiz rewards'
  ],
  openGraph: {
    title: 'Truthle Shop - Earn Rewards & Unlock Badges',
    description: 'Earn Truthle Coins by playing the daily world facts quiz! Unlock exclusive badges, themes, and powerups.',
    type: 'website',
    url: 'https://theworldtruth.com/truthle/shop',
    siteName: 'The World Truth',
    images: [
      {
        url: 'https://theworldtruth.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Truthle Shop - Earn Rewards',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Truthle Shop - Earn Rewards & Unlock Badges',
    description: 'Earn Truthle Coins by playing the daily world facts quiz!',
    images: ['https://theworldtruth.com/og-image.png'],
  },
  alternates: {
    canonical: 'https://theworldtruth.com/truthle/shop',
  },
}

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

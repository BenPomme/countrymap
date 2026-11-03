import type { Metadata } from 'next'
import { getAmazonStorefrontLabel } from '@/lib/affiliate/rewards'

const storefront = getAmazonStorefrontLabel()

export const metadata: Metadata = {
  title: 'Rewards and Codes | Truthle Coins, Shop and Friend Gifts',
  description: `Find the real rewards available now: daily games, the existing Truthle Coins shop, one-use friend Extra Attempt codes and ordinary ${storefront} picks.`,
  keywords: [
    'truthle rewards',
    'truthle coins',
    'truthle shop',
    'friend extra attempt',
    'truthle challenge link',
    `${storefront.toLowerCase()} picks`,
  ],
  openGraph: {
    title: 'Rewards and Codes | The World Truth',
    description: 'Play the daily games, spend Truthle Coins in the existing shop, and learn how one-use friend Extra Attempt codes work.',
    url: 'https://theworldtruth.com/rewards/',
    siteName: 'The World Truth',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Rewards and Codes' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Rewards and Codes | The World Truth',
    description: 'Daily games, Truthle Coins, the existing shop and one-use friend Extra Attempt codes.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: 'https://theworldtruth.com/rewards/' },
}

export default function RewardsLayout({ children }: { children: React.ReactNode }) {
  return children
}

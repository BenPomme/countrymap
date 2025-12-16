import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Data Discoveries - The World Truth Map',
  description: 'Explore surprising correlations between country statistics across health, economy, demographics, and more.',
}

export default function DiscoveriesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

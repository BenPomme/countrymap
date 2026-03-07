import type { ReactNode } from 'react'
import DiscoveriesLayout from '../../src/app/discoveries/layout'

export default function AppDiscoveriesLayout({ children }: { children: ReactNode }) {
  return <DiscoveriesLayout>{children}</DiscoveriesLayout>
}

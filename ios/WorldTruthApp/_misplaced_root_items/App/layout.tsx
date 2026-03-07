import type { ReactNode } from 'react'
import RootLayout, { metadata } from '../src/app/layout'

export { metadata }

export default function AppLayout({ children }: { children: ReactNode }) {
  return <RootLayout>{children}</RootLayout>
}

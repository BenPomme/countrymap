import type { ReactNode } from 'react'
import CountryLayout, { generateStaticParams } from '../../../src/app/country/[slug]/layout'

export { generateStaticParams }

export default function AppCountryLayout({ children }: { children: ReactNode }) {
  return <CountryLayout>{children}</CountryLayout>
}

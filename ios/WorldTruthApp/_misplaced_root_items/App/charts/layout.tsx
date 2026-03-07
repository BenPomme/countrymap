import type { ReactNode } from 'react'
import ChartsLayout from '../../src/app/charts/layout'

export default function AppChartsLayout({ children }: { children: ReactNode }) {
  return <ChartsLayout>{children}</ChartsLayout>
}

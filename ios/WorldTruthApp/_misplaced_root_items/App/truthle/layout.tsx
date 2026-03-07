import type { ReactNode } from 'react'
import TruthleLayout from '../../src/app/truthle/layout'

export default function AppTruthleLayout({ children }: { children: ReactNode }) {
  return <TruthleLayout>{children}</TruthleLayout>
}

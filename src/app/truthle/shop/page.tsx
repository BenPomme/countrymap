'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import RewardShop from '@/components/truthle/RewardShop'
import { useEmbeddedAppMode } from '@/lib/useEmbeddedAppMode'

export default function ShopPage() {
  const embeddedMode = useEmbeddedAppMode()

  return (
    <div className="twt-shell">
      <main className="pb-12">
        {!embeddedMode && (
          <div className="twt-container pt-6">
            <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm font-bold text-twt-ink/65">
              <Link href="/truthle/" className="inline-flex items-center gap-1.5 hover:text-twt-blue">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Truthle
              </Link>
              <span aria-hidden="true">/</span>
              <span aria-current="page">Rewards shop</span>
            </nav>
          </div>
        )}
        <RewardShop />
      </main>
    </div>
  )
}

'use client'

import type { ReactNode } from 'react'
import AffiliateShelf from '@/components/affiliate/AffiliateShelf'
import type { UnlockGame } from '@/lib/affiliate/dailyUnlocks'

interface Props {
  game: UnlockGame
  date: string
  perfect: boolean
  /** Extra Attempt pay CTA, shown without hiding the ordinary picks. */
  cta?: ReactNode
}

/**
 * Results card for ordinary, score-independent recommendations.
 * The perfect prop remains for caller compatibility and is never used to
 * gate the shelf or create eligibility state.
 */
export default function DailyUnlockCard({ game, date, perfect, cta }: Props) {
  void perfect

  return (
    <div className="w-full max-w-sm mx-auto space-y-4 text-left">
      {cta && (
        <div className="rounded-xl border border-[#d7c9a6] bg-white p-3">
          <p className="mb-2 text-xs font-semibold text-[#43516b]">Want another go at today&apos;s game?</p>
          {cta}
        </div>
      )}

      <AffiliateShelf
        placement={`daily-${game}`}
        heading="Everyday picks"
        intro="Ordinary Amazon UK search recommendations. They are visible whatever your score."
        limit={4}
        date={date}
      />
    </div>
  )
}

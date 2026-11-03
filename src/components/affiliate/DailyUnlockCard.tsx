'use client'

import type { ReactNode } from 'react'
import DailyAmazonPicks from '@/components/affiliate/DailyAmazonPicks'
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
    <div className="w-full space-y-4 text-left">
      {cta && (
        <div className="rounded-xl border border-[#d7c9a6] bg-white p-3">
          <p className="mb-2 text-xs font-semibold text-[#43516b]">Want another go at today&apos;s game?</p>
          {cta}
        </div>
      )}

      <DailyAmazonPicks
        placement={`daily-${game}`}
        variant="compact"
        date={date}
      />
    </div>
  )
}

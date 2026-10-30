'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { amazonSearchUrl } from '@/lib/constants/affiliates'
import {
  AMAZON_DISCLOSURE, getDailyUnlockTheme, isDailyUnlocked, markDailyUnlocked, type UnlockGame,
} from '@/lib/affiliate/dailyUnlocks'

interface Props {
  game: UnlockGame
  date: string
  perfect: boolean
  /** Extra Attempt pay CTA (primary on the locked card). */
  cta?: ReactNode
}

/** Results card: 5/5 unlocks today's curated Amazon picks; otherwise a locked teaser + Extra Attempt CTA. */
export default function DailyUnlockCard({ game, date, perfect, cta }: Props) {
  const [unlocked, setUnlocked] = useState(perfect)
  useEffect(() => {
    if (perfect) markDailyUnlocked(game, date)
    setUnlocked(perfect || isDailyUnlocked(game, date))
  }, [game, date, perfect])

  const theme = getDailyUnlockTheme(date)
  const affiliate = !!amazonSearchUrl('x')

  if (unlocked && affiliate) {
    return (
      <div className="w-full max-w-sm mx-auto rounded-2xl border-2 border-emerald-400 bg-emerald-50 p-4 text-left">
        <p className="font-bold text-emerald-900">🔓 Unlocked: today's World Truth picks</p>
        <ul className="mt-3 grid gap-2">
          {theme.picks.map((p) => (
            <li key={p.query}>
              <a href={amazonSearchUrl(p.query) || '#'} target="_blank" rel="sponsored nofollow noopener noreferrer"
                className="block px-3 py-2 rounded-lg bg-white border hover:border-emerald-400 text-blue-700 text-sm">🛒 {p.label} →</a>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[11px] text-gray-500">{AMAZON_DISCLOSURE}</p>
        {cta && <div className="mt-3">{cta}</div>}
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm mx-auto rounded-2xl border-2 border-amber-300 bg-amber-50 p-4">
      <p className="font-bold text-gray-900">🔒 Score 5/5 to unlock today's World Truth picks</p>
      {affiliate && (
        <ul className="mt-2 grid gap-1 text-sm text-gray-400 select-none" aria-hidden="true">
          {theme.picks.slice(0, 3).map((p) => <li key={p.query} className="blur-[3px]">🛒 {p.label}</li>)}
        </ul>
      )}
      {cta && (
        <div className="mt-3">
          <p className="text-xs text-gray-600 mb-1">Want another shot at today's unlock?</p>
          {cta}
        </div>
      )}
    </div>
  )
}

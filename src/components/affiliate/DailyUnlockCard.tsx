'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { amazonSearchUrl } from '@/lib/constants/affiliates'
import {
  AMAZON_DISCLOSURE, STORE_CODE, STORE_URL, STORE_DISCLOSURE, storeCodeTeaser, getDailyUnlockTheme, isDailyUnlocked, markDailyUnlocked, type UnlockGame,
} from '@/lib/affiliate/dailyUnlocks'

interface Props {
  game: UnlockGame
  date: string
  perfect: boolean
  /** Extra Attempt pay CTA (primary on the locked card). */
  cta?: ReactNode
}

/** Results card: 5/5 unlocks today's exclusive Lien & Cie code (+ secondary Amazon picks); otherwise a locked teaser + Extra Attempt CTA. */
export default function DailyUnlockCard({ game, date, perfect, cta }: Props) {
  const [unlocked, setUnlocked] = useState(perfect)
  useEffect(() => {
    if (perfect) markDailyUnlocked(game, date)
    setUnlocked(perfect || isDailyUnlocked(game, date))
  }, [game, date, perfect])

  const theme = getDailyUnlockTheme(date)
  const affiliate = !!amazonSearchUrl('x')
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try { await navigator.clipboard.writeText(STORE_CODE); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch { /* ignore */ }
  }

  if (unlocked) {
    return (
      <div className="w-full max-w-sm mx-auto rounded-2xl border-2 border-emerald-400 bg-emerald-50 p-4 text-left">
        <p className="font-bold text-emerald-900">🔓 Unlocked: today&apos;s exclusive code</p>
        <div className="mt-3 rounded-xl bg-white border-2 border-dashed border-emerald-400 p-3 text-center">
          <p className="font-mono text-3xl font-extrabold tracking-widest text-gray-900 select-all">{STORE_CODE}</p>
          <div className="mt-2 flex gap-2 justify-center">
            <button type="button" onClick={copy} className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700">
              {copied ? '✓ Copied' : '📋 Copy code'}
            </button>
            {STORE_URL && (
              <a href={STORE_URL} target="_blank" rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg border border-emerald-600 text-emerald-700 text-sm font-semibold hover:bg-emerald-100">Shop Lien &amp; Cie →</a>
            )}
          </div>
          <p className="mt-2 text-[11px] text-gray-500">{STORE_DISCLOSURE}</p>
        </div>
        {affiliate && (
          <>
            <p className="mt-4 text-sm font-semibold text-gray-700">Also today: World Truth picks</p>
            <ul className="mt-3 grid gap-2">
              {theme.picks.map((p) => (
                <li key={p.query}>
                  <a href={amazonSearchUrl(p.query) || '#'} target="_blank" rel="sponsored nofollow noopener noreferrer"
                    className="block px-3 py-2 rounded-lg bg-white border hover:border-emerald-400 text-blue-700 text-sm">🛒 {p.label} →</a>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[11px] text-gray-500">{AMAZON_DISCLOSURE}</p>
          </>
        )}
        {cta && <div className="mt-3">{cta}</div>}
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm mx-auto rounded-2xl border-2 border-amber-300 bg-amber-50 p-4">
      <p className="font-bold text-gray-900">🔒 Score 5/5 to unlock today&apos;s exclusive code</p>
      <p className="mt-2 font-mono text-2xl font-extrabold tracking-widest text-gray-400 select-none blur-[2px]" aria-hidden="true">{storeCodeTeaser()}</p>
      {cta && (
        <div className="mt-3">
          <p className="text-xs text-gray-600 mb-1">Want another shot at today&apos;s code?</p>
          {cta}
        </div>
      )}
    </div>
  )
}

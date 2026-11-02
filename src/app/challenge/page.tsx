'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { trackEvent } from '@/lib/analytics/events'
import { parseChallengeSearch, type ChallengeState } from './challengeState'
import {
  normalizeGiftCode,
  rememberChallenge,
  type ChallengeGame,
} from '@/lib/truthle/gifts'

const GAME_DETAILS: Record<ChallengeGame, { label: string; href: string; description: string }> = {
  truthle: {
    label: 'Truthle',
    href: '/truthle/',
    description: 'Five world facts questions.',
  },
  'true-false': {
    label: 'True or False: World',
    href: '/true-false/',
    description: 'Five country claims.',
  },
}

function GameChoices() {
  return (
    <div className="mt-5 flex flex-col gap-3 sm:flex-row">
      {(Object.keys(GAME_DETAILS) as ChallengeGame[]).map((game) => (
        <Link
          key={game}
          href={GAME_DETAILS[game].href}
          className="inline-flex flex-1 justify-center rounded-xl border border-[#d7c9a6] bg-white px-4 py-3 text-sm font-bold text-[#294cc4] hover:border-[#294cc4]"
        >
          Play today&apos;s {GAME_DETAILS[game].label}
        </Link>
      ))}
    </div>
  )
}

export default function ChallengePage() {
  const [state, setState] = useState<ChallengeState | null>(null)
  const [codeInput, setCodeInput] = useState('')
  const [codeNotice, setCodeNotice] = useState<string | null>(null)
  const tracked = useRef(false)

  useEffect(() => {
    if (tracked.current) return
    tracked.current = true

    const parsed = parseChallengeSearch(window.location.search)
    setState(parsed)

    if (parsed.status === 'current' && parsed.game && parsed.day) {
      const remembered = rememberChallenge({
        game: parsed.game,
        day: parsed.day,
        ...(parsed.code ? { code: parsed.code } : {}),
      })

      if (parsed.codeRejected) {
        setCodeNotice('The friend code in this link has an invalid format. It was not saved.')
      } else if (parsed.code && remembered) {
        setCodeNotice('The friend code is saved for this browser tab. It is applied only at checkout when you request an Extra Attempt.')
      } else if (parsed.code) {
        setCodeInput(parsed.code)
        setCodeNotice('This browser could not save the friend code. Enter it below before you continue.')
      }
    }

    trackEvent('referral_open', {
      game: parsed.game ?? 'none',
      puzzle_day: parsed.day ?? 'none',
      status: parsed.status,
    })
  }, [])

  function saveEnteredCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (state?.status !== 'current' || !state.game || !state.day) return

    const code = normalizeGiftCode(codeInput)
    if (!code) {
      setCodeNotice('Enter a code using letters, numbers, hyphens or underscores.')
      return
    }

    const remembered = rememberChallenge({ game: state.game, day: state.day, code })
    if (remembered) {
      setCodeInput('')
      setCodeNotice('The friend code is saved for this browser tab. It is applied only at checkout when you request an Extra Attempt.')
    } else {
      setCodeNotice('This browser could not save the code. Check browser storage settings and try again.')
    }
  }

  const game = state?.game ? GAME_DETAILS[state.game] : null

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-emerald-50 text-[#192947]">
      <header className="border-b border-[#d7e4e8] bg-white/90">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4">
          <Link href="/" className="text-sm font-semibold text-[#294cc4] hover:underline">The World Truth</Link>
          <Link href="/rewards/" className="text-sm font-semibold hover:underline">Rewards and codes</Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10">
        <section className="rounded-3xl border border-[#c9dce2] bg-white p-6 shadow-sm md:p-9" aria-live="polite">
          {!state ? (
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#294cc4]">Challenge link</p>
              <h1 className="mt-2 text-3xl font-black">Checking this challenge link...</h1>
              <p className="mt-3 text-sm leading-6 text-[#43516b]">No code is being created or used while this page loads.</p>
            </div>
          ) : state.status === 'invalid' ? (
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#a33b2c]">Link status</p>
              <h1 className="mt-2 text-3xl font-black">This challenge link is not recognised</h1>
              <p className="mt-3 text-sm leading-6 text-[#43516b]">
                {state.invalidReason === 'day'
                  ? 'The puzzle day is missing or invalid. A valid link uses a real UTC date in YYYY-MM-DD format.'
                  : 'The game is missing or unsupported. Use a challenge link for Truthle or True or False: World.'}
              </p>
              {state.codeRejected && (
                <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-[#6b4b13]">
                  The friend code in this link has an invalid format. It was not saved.
                </p>
              )}
              <GameChoices />
            </div>
          ) : state.status === 'past' && game ? (
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6b5a31]">Past puzzle day</p>
              <h1 className="mt-2 text-3xl font-black">This puzzle day has passed</h1>
              <p className="mt-3 text-sm leading-6 text-[#43516b]">
                {state.day} was a previous UTC puzzle day. Past daily puzzles are not playable from this link.
              </p>
              <Link
                href={game.href}
                className="mt-5 inline-flex rounded-xl bg-[#192947] px-5 py-3 text-sm font-bold text-white hover:bg-[#294cc4]"
              >
                Play today&apos;s {game.label}
              </Link>
            </div>
          ) : state.status === 'future' && game ? (
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#294cc4]">Future puzzle day</p>
              <h1 className="mt-2 text-3xl font-black">This puzzle day has not opened yet</h1>
              <p className="mt-3 text-sm leading-6 text-[#43516b]">
                {state.day} is a future UTC puzzle day. This daily challenge cannot be played before then.
              </p>
              <Link
                href={game.href}
                className="mt-5 inline-flex rounded-xl bg-[#192947] px-5 py-3 text-sm font-bold text-white hover:bg-[#294cc4]"
              >
                Play today&apos;s {game.label}
              </Link>
            </div>
          ) : game && state.day ? (
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-800">Current puzzle day</p>
              <h1 className="mt-2 text-3xl font-black">{game.label} challenge is ready</h1>
              <p className="mt-3 text-sm leading-6 text-[#43516b]">
                {state.day} UTC. {game.description} Continue to the game, or save an optional friend Extra Attempt code for this browser tab.
              </p>

              {codeNotice && (
                <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-[#6b4b13]">
                  {codeNotice}
                </p>
              )}

              <Link
                href={game.href}
                className="mt-5 inline-flex rounded-xl bg-[#192947] px-5 py-3 text-sm font-bold text-white hover:bg-[#294cc4]"
              >
                Continue to {game.label}
              </Link>

              <form onSubmit={saveEnteredCode} className="mt-8 rounded-2xl border border-[#d7c9a6] bg-[#fffdf6] p-4">
                <label htmlFor="friend-code" className="block text-sm font-bold text-[#192947]">
                  Friend Extra Attempt code
                </label>
                <p className="mt-1 text-xs leading-5 text-[#5f6b7c]">
                  Optional. Enter the code from the friend who shared it. Codes are not checked on this page.
                </p>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <input
                    id="friend-code"
                    name="friend-code"
                    type="text"
                    value={codeInput}
                    onChange={(event) => setCodeInput(event.target.value)}
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    placeholder="WT-ABC123"
                    className="min-w-0 flex-1 rounded-xl border border-[#c9b98f] bg-white px-3 py-2 text-sm uppercase tracking-wide text-[#192947] outline-none focus:border-[#294cc4]"
                  />
                  <button type="submit" className="rounded-xl bg-[#294cc4] px-4 py-2 text-sm font-bold text-white hover:bg-[#192947]">
                    Save code for this tab
                  </button>
                </div>
                <p className="mt-3 text-xs leading-5 text-[#5f6b7c]">
                  The code is applied only at checkout when an Extra Attempt is requested. It can still be rejected if it expired or was already used. Opening this page does not use it.
                </p>
              </form>
            </div>
          ) : (
            <div>
              <h1 className="text-3xl font-black">This challenge link is not recognised</h1>
              <GameChoices />
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

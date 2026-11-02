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
        setCodeNotice('Friend code saved. It is checked when you request an Extra Attempt.')
      } else if (parsed.code) {
        setCodeInput(parsed.code)
        setCodeNotice('The friend code could not be saved. Enter it below before you continue.')
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
      setCodeNotice('Friend code saved. It is checked when you request an Extra Attempt.')
    } else {
      setCodeNotice('The code could not be saved. Try again.')
    }
  }

  const game = state?.game ? GAME_DETAILS[state.game] : null

  return (
    <main id="main-content" className="twt-container max-w-3xl py-10 sm:py-14">
        <section className="twt-panel bg-white p-6 md:p-9" aria-live="polite">
          {!state ? (
            <div>
              <p className="twt-kicker">Challenge link</p>
              <h1 className="twt-display mt-2 text-3xl">Checking this challenge link...</h1>
              <p className="mt-3 text-sm leading-6 text-twt-ink/70">No code is used when you open this page.</p>
            </div>
          ) : state.status === 'invalid' ? (
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-twt-coral">Link status</p>
              <h1 className="twt-display mt-2 text-3xl">This challenge link is not recognised</h1>
              <p className="mt-3 text-sm leading-6 text-twt-ink/70">
                {state.invalidReason === 'day'
                  ? 'The puzzle day is missing or invalid. A valid link includes a real UTC date.'
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
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-twt-ink/60">Past puzzle day</p>
              <h1 className="twt-display mt-2 text-3xl">This puzzle day has passed</h1>
              <p className="mt-3 text-sm leading-6 text-twt-ink/70">
                {state.day} was a previous UTC puzzle day. Past daily puzzles are not playable from this link.
              </p>
              <Link
                href={game.href}
                className="twt-button mt-5"
              >
                Play today&apos;s {game.label}
              </Link>
            </div>
          ) : state.status === 'future' && game ? (
            <div>
              <p className="twt-kicker">Future puzzle day</p>
              <h1 className="twt-display mt-2 text-3xl">This puzzle day has not opened yet</h1>
              <p className="mt-3 text-sm leading-6 text-twt-ink/70">
                {state.day} is a future UTC puzzle day. This daily challenge cannot be played before then.
              </p>
              <Link
                href={game.href}
                className="twt-button mt-5"
              >
                Play today&apos;s {game.label}
              </Link>
            </div>
          ) : game && state.day ? (
            <div>
              <p className="twt-kicker !text-twt-green">Current puzzle day</p>
              <h1 className="twt-display mt-2 text-3xl">{game.label} challenge is ready</h1>
              <p className="mt-3 text-sm leading-6 text-twt-ink/70">
                This round is for {state.day} UTC. {game.description}
              </p>

              {codeNotice && (
                <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-[#6b4b13]">
                  {codeNotice}
                </p>
              )}

              <Link
                href={game.href}
                className="twt-button mt-5"
              >
                Continue to {game.label}
              </Link>

              <form onSubmit={saveEnteredCode} className="mt-8 rounded-2xl border-2 border-twt-ink/10 bg-twt-paper p-4">
                <label htmlFor="friend-code" className="block text-sm font-bold text-twt-ink">
                  Friend Extra Attempt code
                </label>
                <p className="mt-1 text-xs leading-5 text-twt-ink/65">
                  Optional. Enter the code from the friend who shared it.
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
                    className="min-w-0 flex-1 rounded-xl border border-twt-ink/25 bg-white px-3 py-2 text-sm uppercase tracking-wide text-twt-ink outline-none focus:border-twt-blue"
                  />
                  <button type="submit" className="rounded-xl bg-twt-blue px-4 py-2 text-sm font-bold text-white hover:bg-twt-ink">
                    Save code
                  </button>
                </div>
                <p className="mt-3 text-xs leading-5 text-twt-ink/65">
                  The code is checked when you request an Extra Attempt. It can still be rejected if it expired or was already used. Opening this page does not use it.
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
  )
}

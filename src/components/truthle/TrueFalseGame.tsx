'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import type { Country } from '@/types/country'
import { generateTrueFalseClaims, loadTF, recordTF, type TFState, type TrueFalseClaim } from '@/lib/truthle/trueFalse'
import { getTruthleDay } from '@/lib/truthle/generator'
import { getCloudRetryStatus, consumeCloudRetry, createRetryCheckout, getStoredSharePromo } from '@/lib/truthle/storage'
import { getCompletionStreak, getDisplayStreak, getUtcDay } from '@/lib/truthle/dailyLifecycle'
import { getQuizProvenance, type QuestionProvenanceFields } from '@/lib/truthle/questionProvenance'
import { getRememberedChallenge, normalizeGiftCode } from '@/lib/truthle/gifts'
import { trackEvent } from '@/lib/analytics/events'
import CheckoutBanner from '@/components/truthle/CheckoutBanner'
import ResultScorecard from '@/components/truthle/ResultScorecard'
import ResultSharePanel from '@/components/truthle/ResultSharePanel'
import QuestionProvenance, { type ProvenanceItem } from '@/components/truthle/QuestionProvenance'
import UtcCountdown from '@/components/truthle/UtcCountdown'
import RewardsTeaser from '@/components/truthle/RewardsTeaser'
import DailyUnlockCard from '@/components/affiliate/DailyUnlockCard'
import { getMillisecondsUntilNextUtcDay } from '@/components/truthle/resultShare'
import { getVariableById } from '@/lib/seo/catalog'
import { AdUnit } from '@/components/ads'
import { T } from '@/lib/truthle/monetizeCopy'
import { AD_SLOTS } from '@/lib/constants/ads'

type Phase = 'loading' | 'intro' | 'playing' | 'done' | 'unavailable' | 'error'
type EnrichedClaim = TrueFalseClaim & Partial<QuestionProvenanceFields>
type CloudRetry = Awaited<ReturnType<typeof getCloudRetryStatus>>

interface ClaimProvenance extends QuestionProvenanceFields {
  featuredEligible: boolean
  quizEligible: true
}

interface PlayableClaim extends TrueFalseClaim {
  provenance: ClaimProvenance
}

interface ClaimSelection {
  questions: PlayableClaim[]
  error: string | null
}

interface RetryView {
  state: 'loading' | 'ready' | 'unknown'
  credits: number
  canConsume: boolean
  consumed: boolean
}

const INITIAL_RETRY: RetryView = { state: 'loading', credits: 0, canConsume: false, consumed: false }

function count(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0
}

function safeLimitations(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return Array.from(new Set(value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)))
}

function getClaimProvenance(claim: TrueFalseClaim): ClaimProvenance | null {
  const enriched = claim as EnrichedClaim
  if (Array.isArray(enriched.provenance) && enriched.provenance.length > 0) {
    const items = enriched.provenance
    if (!items.every((item) => item?.quizEligible === true)) return null
    return {
      ...(enriched.sourceUrl ? { sourceUrl: enriched.sourceUrl } : {}),
      ...(enriched.sourceName ? { sourceName: enriched.sourceName } : {}),
      ...(enriched.year ? { year: enriched.year } : {}),
      ...(typeof enriched.coverage === 'number' && Number.isFinite(enriched.coverage) ? { coverage: enriched.coverage } : {}),
      limitations: safeLimitations(enriched.limitations),
      provenance: items,
      featuredEligible: items.some((item) => item.featuredEligible === true),
      quizEligible: true,
    }
  }
  const provenance = getQuizProvenance(claim.mapSlugVar)
  return provenance ? { ...provenance, provenance: [provenance], quizEligible: true } : null
}

export function selectQuestions(countries: Country[], day: string): ClaimSelection {
  if (!day) return { questions: [], error: null }
  try {
    const questions = generateTrueFalseClaims(countries, day).flatMap((claim) => {
      const provenance = getClaimProvenance(claim)
      return provenance ? [{ ...claim, provenance }] : []
    })
    return { questions, error: null }
  } catch {
    return { questions: [], error: 'Today\'s questions could not be prepared safely.' }
  }
}

export type SavedResultRestore =
  | { kind: 'not-today' }
  | { kind: 'restored'; results: boolean[] }
  | { kind: 'unusable'; reason: 'missing-breakdown' | 'count-mismatch' | 'invalid-breakdown' }

export function restoreSavedResult(stats: TFState, day: string, total: number): SavedResultRestore {
  if (stats.lastDate !== day) return { kind: 'not-today' }
  if (!Array.isArray(stats.lastResults) || stats.lastResults.length === 0) {
    return { kind: 'unusable', reason: 'missing-breakdown' }
  }
  if (stats.lastResults.length !== total) return { kind: 'unusable', reason: 'count-mismatch' }
  if (!stats.lastResults.every((result) => typeof result === 'boolean')) {
    return { kind: 'unusable', reason: 'invalid-breakdown' }
  }
  return { kind: 'restored', results: stats.lastResults.slice() }
}

export function retryView(status: CloudRetry): RetryView {
  const ready = status.source === 'backend'
  const credits = count(status.paidCredits)
  return {
    state: ready ? 'ready' : 'unknown',
    credits,
    canConsume: ready && status.canConsume && !status.consumed,
    consumed: ready && status.consumed,
  }
}

export interface RecipientContext {
  referred: boolean
  shareCode?: string
}

export function classifyRecipientChallenge(
  day: string,
  remembered: { day: string; code?: string } | null,
  ownGiftCode: string | null | undefined,
): RecipientContext {
  if (remembered?.day !== day) return { referred: false }
  if (!remembered.code) return { referred: true }
  const shareCode = normalizeGiftCode(remembered.code)
  if (!shareCode) return { referred: false }
  if (normalizeGiftCode(ownGiftCode) === shareCode) return { referred: false }
  return { referred: true, shareCode }
}

function recipientContext(day: string): RecipientContext {
  try {
    return classifyRecipientChallenge(day, getRememberedChallenge('true-false'), getStoredSharePromo()?.code)
  } catch {
    return { referred: false }
  }
}

function StatePanel({ kicker, title, children }: { kicker: string; title: string; children: ReactNode }) {
  return (
    <section className="twt-panel mx-auto w-full max-w-xl p-6 text-left sm:p-8" aria-live="polite">
      <p className="twt-kicker">{kicker}</p>
      <h1 className="twt-display mt-2 text-3xl font-black text-[#192947]">{title}</h1>
      <div className="twt-prose mt-3 text-[#43516b]">{children}</div>
    </section>
  )
}

export default function TrueFalseGame({ countries }: { countries: Country[] }) {
  const [day, setDay] = useState('')
  const dayNumber = day ? getTruthleDay(day) : 0
  const selection = useMemo(() => selectQuestions(countries, day), [countries, day])
  const questions = selection.questions

  const [phase, setPhase] = useState<Phase>('loading')
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState<boolean | null>(null)
  const [results, setResults] = useState<boolean[]>([])
  const [stats, setStats] = useState<TFState | null>(null)
  const [isExtra, setIsExtra] = useState(false)
  const [loadError, setLoadError] = useState('The game could not be loaded safely.')
  const [msg, setMsg] = useState<string | null>(null)
  const [retryStatus, setRetryStatus] = useState<RetryView>(INITIAL_RETRY)
  const [retryBusy, setRetryBusy] = useState(false)
  const [retryRecovery, setRetryRecovery] = useState(false)
  const [retryNotice, setRetryNotice] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  const answerLock = useRef(false)
  const completionTracked = useRef(false)
  const referralTracked = useRef(false)
  const retryRequest = useRef(0)

  useEffect(() => () => {
    retryRequest.current += 1
  }, [])

  useEffect(() => {
    setDay(getUtcDay())
  }, [])

  useEffect(() => {
    if (!day) return
    let timer = 0
    const arm = () => {
      timer = window.setTimeout(() => {
        const nextDay = getUtcDay()
        if (nextDay === day) {
          arm()
          return
        }
        setPhase('loading')
        setDay(nextDay)
      }, getMillisecondsUntilNextUtcDay() + 250)
    }
    arm()
    return () => window.clearTimeout(timer)
  }, [day])

  useEffect(() => {
    if (!day) return
    setPhase('loading')
    setIdx(0)
    setPicked(null)
    setResults([])
    setStats(null)
    setIsExtra(false)
    setMsg(null)
    setRetryStatus(INITIAL_RETRY)
    setRetryRecovery(false)
    setRetryNotice(null)
    answerLock.current = false
    completionTracked.current = false
    referralTracked.current = false

    try {
      const saved = loadTF()
      setStats(saved)
      if (selection.error) {
        setLoadError(selection.error)
        setPhase('error')
        return
      }
      if (questions.length === 0) {
        setPhase('unavailable')
        return
      }
      const restored = restoreSavedResult(saved, day, questions.length)
      if (restored.kind === 'restored') {
        setResults(restored.results)
        setPhase('done')
        return
      }
      if (restored.kind === 'unusable') {
        setLoadError(restored.reason === 'missing-breakdown'
          ? 'A saved result for today exists, but its answer breakdown is missing. Its score cannot be shown safely. A new scored first run was not started.'
          : 'A saved result for today could not be matched safely to today\'s questions. A new scored first run was not started.')
        setPhase('error')
        return
      }
      setPhase('intro')
    } catch {
      setLoadError('Saved progress could not be read safely. No new result was recorded.')
      setPhase('error')
    }
  }, [day, reloadToken, selection, questions.length])

  const loadRetryStatus = useCallback(async (showLoading = true): Promise<RetryView> => {
    const request = ++retryRequest.current
    if (showLoading) setRetryStatus({ ...INITIAL_RETRY, state: 'loading' })
    let next: RetryView
    try {
      next = retryView(await getCloudRetryStatus())
    } catch {
      next = { ...INITIAL_RETRY, state: 'unknown' }
    }
    if (request === retryRequest.current) setRetryStatus(next)
    return next
  }, [])

  const refreshRetryStatus = useCallback(async () => {
    await loadRetryStatus(true)
  }, [loadRetryStatus])

  const checkoutVerified = useCallback((_credits: number) => {
    setRetryRecovery(false)
    setRetryNotice(null)
    void refreshRetryStatus()
  }, [refreshRetryStatus])

  useEffect(() => {
    if (phase === 'done') void refreshRetryStatus()
  }, [phase, refreshRetryStatus])

  const beginPlay = useCallback((extra: boolean) => {
    answerLock.current = false
    completionTracked.current = false
    setIsExtra(extra)
    setIdx(0)
    setPicked(null)
    setResults([])
    setMsg(null)
    setRetryNotice(null)
    setRetryRecovery(false)
    setPhase('playing')
    try {
      trackEvent('game_start', { game: 'true-false', puzzle_day: day, placement: extra ? 'extra' : 'primary' })
    } catch {
      // Consent or transport failures must not block play.
    }
  }, [day])

  const finish = useCallback((finalResults: boolean[]) => {
    if (completionTracked.current) return
    if (finalResults.length !== questions.length || finalResults.length === 0) {
      setMsg('This result is incomplete. No score was saved.')
      return
    }
    completionTracked.current = true
    try {
      const recorded = recordTF(day, finalResults, isExtra)
      setStats(recorded)
      setResults(finalResults)
      setPicked(null)
      setPhase('done')
      const correct = finalResults.filter(Boolean).length
      try {
        trackEvent('game_complete', {
          game: 'true-false',
          puzzle_day: day,
          score: correct,
          correct,
          placement: isExtra ? 'extra' : 'primary',
        })
        if (!referralTracked.current) {
          if (recipientContext(day).referred) {
            referralTracked.current = true
            trackEvent('referral_game_complete', {
              game: 'true-false',
              puzzle_day: day,
              score: correct,
              correct,
            })
          }
        }
      } catch {
        // Measurement is optional and never changes a completed game.
      }
    } catch {
      completionTracked.current = false
      setMsg('This result could not be saved. No new score was recorded.')
    }
  }, [day, isExtra, questions.length])

  const start = () => beginPlay(false)

  const answer = (value: boolean) => {
    if (phase !== 'playing' || picked !== null || answerLock.current) return
    const claim = questions[idx]
    if (!claim) return
    answerLock.current = true
    setPicked(value)
    setResults((current) => current.length === idx ? [...current, value === claim.answer] : current)
  }

  const next = () => {
    if (picked === null || phase !== 'playing') return
    if (idx + 1 < questions.length) {
      setIdx((current) => current + 1)
      setPicked(null)
      answerLock.current = false
      return
    }
    finish(results)
  }

  const startExtraAttempt = async () => {
    if (retryBusy) return
    setRetryBusy(true)
    setRetryNotice(null)
    try {
      const consumed = await consumeCloudRetry()
      if (consumed.success) {
        beginPlay(true)
        return
      }
      const nextStatus = await loadRetryStatus(false)
      const unknown = nextStatus.state === 'unknown' || nextStatus.consumed
      setRetryRecovery(unknown)
      setRetryNotice(unknown
        ? 'We could not confirm the Extra Attempt. Your result is still here. Try again to recover the same attempt. The server reuses this request, so it will not charge twice.'
        : 'No Extra Attempt is available right now. Your first result is unchanged.')
    } catch {
      setRetryRecovery(true)
      setRetryNotice('We could not confirm the Extra Attempt. Your result is still here. Try again to recover the same attempt without a second charge.')
    } finally {
      setRetryBusy(false)
    }
  }

  const buyExtra = async () => {
    if (retryBusy) return
    setRetryBusy(true)
    setRetryNotice(null)
    try {
      const shareCode = recipientContext(day).shareCode
      const checkout = await createRetryCheckout(1, 'true-false', shareCode ? { shareCode } : undefined)
      if (checkout.url) {
        window.location.assign(checkout.url)
        return
      }
      setRetryNotice(checkout.error || 'Checkout is unavailable right now.')
    } catch {
      setRetryNotice('Checkout is unavailable right now.')
    } finally {
      setRetryBusy(false)
    }
  }

  const score = results.filter(Boolean).length
  const displayStreak = stats ? getDisplayStreak(stats, day) : 0
  const completionStreak = stats ? getCompletionStreak(stats, day) : 1
  const bestStreak = count(stats?.maxStreak)
  const played = count(stats?.played)
  const canUseExtra = retryStatus.canConsume || retryRecovery

  if (phase === 'loading') {
    return (
      <>
        <CheckoutBanner game="true-false" onVerified={checkoutVerified} />
        <StatePanel kicker="Daily game" title="Checking today's claims">
          <p>No score is recorded while saved progress and source eligibility are checked.</p>
        </StatePanel>
      </>
    )
  }

  if (phase === 'error') {
    return (
      <>
        <CheckoutBanner game="true-false" onVerified={checkoutVerified} />
        <StatePanel kicker="Game status" title="This round is not available safely">
          <p>{loadError}</p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button type="button" className="twt-button" onClick={() => setReloadToken((value) => value + 1)}>
              Check saved progress again
            </button>
            <Link href="/true-false/claims/" className="twt-button-secondary text-center">
              Browse the claims archive
            </Link>
          </div>
        </StatePanel>
      </>
    )
  }

  if (phase === 'unavailable') {
    return (
      <>
        <CheckoutBanner game="true-false" onVerified={checkoutVerified} />
        <StatePanel kicker="Source check" title="No eligible claims today">
          <p>Today&apos;s claims do not yet have enough verified source information. Please check back later or explore a map.</p>
          <p>Source details are shown where recorded. Many archived metrics still have unknown provenance.</p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Link href="/true-false/claims/" className="twt-button text-center">
              Browse archived claims
            </Link>
            <Link href="/map/press-freedom/" className="twt-button-secondary text-center">
              Explore the maps
            </Link>
          </div>
        </StatePanel>
      </>
    )
  }

  if (phase === 'intro') {
    return (
      <>
        <CheckoutBanner game="true-false" onVerified={checkoutVerified} />
        <section className="twt-panel mx-auto w-full max-w-xl p-6 text-left sm:p-8">
          <p className="twt-kicker">Daily true or false · Day {dayNumber}</p>
          <h1 className="twt-display mt-2 text-4xl font-black text-[#192947]">True or False: World</h1>
          <p className="twt-prose mt-4 text-[#43516b]">
            {questions.length} eligible {questions.length === 1 ? 'claim' : 'claims'} about countries and world statistics. Everyone gets the same set for the UTC day.
          </p>
          <p className="mt-3 text-sm leading-6 text-[#59647a]">
            Reveal the recorded source, year, coverage and limitations after every call. Some archived metrics have unknown provenance, so not every archive entry is used here.
          </p>
          {stats && played > 0 && (
            <div className="mt-5 grid grid-cols-3 gap-2 text-center text-sm">
              <div className="rounded-xl border border-[#e7dfc8] bg-white p-3"><span className="block text-xl font-black text-[#dc654e]">{displayStreak}</span>Streak</div>
              <div className="rounded-xl border border-[#e7dfc8] bg-white p-3"><span className="block text-xl font-black text-[#192947]">{bestStreak}</span>Best</div>
              <div className="rounded-xl border border-[#e7dfc8] bg-white p-3"><span className="block text-xl font-black text-[#192947]">{played}</span>Played</div>
            </div>
          )}
          <button type="button" onClick={start} className="twt-button mt-6 min-h-14 w-full text-lg">
            Play today&apos;s set
          </button>
          <p className="mt-3 text-xs leading-5 text-[#59647a]">One free first run. An Extra Attempt may be available after you finish.</p>
        </section>
        <div className="mx-auto mt-4 w-full max-w-xl">
          <RewardsTeaser />
        </div>
      </>
    )
  }

  if (phase === 'playing') {
    const claim = questions[idx]
    if (!claim) {
      return (
        <StatePanel kicker="Game status" title="Claim unavailable">
          <p>This claim could not be opened safely. No score was saved for it.</p>
          <button type="button" className="twt-button mt-5" onClick={() => setReloadToken((value) => value + 1)}>
            Check saved progress again
          </button>
        </StatePanel>
      )
    }
    const correct = picked !== null && picked === claim.answer
    const mapSlug = getVariableById(claim.mapSlugVar)?.slug
    const provenanceItems: ProvenanceItem[] = claim.provenance.provenance.map((item, index) => ({
      label: claim.provenance.provenance.length === 1 ? claim.variableName : `Recorded source ${index + 1}`,
      sourceUrl: item.sourceUrl,
      sourceName: item.sourceName,
      year: item.year,
      coverage: item.coverage,
      limitations: item.limitations,
    }))
    const itemLimitations = new Set(claim.provenance.provenance.flatMap((item) => item.limitations))
    const sharedLimitations = claim.provenance.limitations.filter((item) => !itemLimitations.has(item))
    if (sharedLimitations.length > 0) {
      provenanceItems.push({ label: 'Question limitations', limitations: sharedLimitations })
    }
    return (
      <>
        <CheckoutBanner game="true-false" onVerified={checkoutVerified} />
        <section className="mx-auto w-full max-w-xl">
          <div className="flex items-center justify-between gap-4 text-sm font-semibold text-[#59647a]">
            <span>Claim {idx + 1} of {questions.length}</span>
            <span className="flex gap-1" aria-label={`${results.length} of ${questions.length} answered`}>
              {questions.map((_, index) => (
                <span
                  key={index}
                  className={`h-2.5 w-2.5 rounded-full ${index < results.length ? (results[index] ? 'bg-[#246e55]' : 'bg-[#dc654e]') : index === idx ? 'bg-[#294cc4]' : 'bg-[#d8d2c2]'}`}
                />
              ))}
            </span>
          </div>

          <div className="twt-panel mt-4 p-6 text-left sm:p-8">
            <p className="twt-kicker">{claim.variableName}</p>
            <p className="twt-display mt-3 text-2xl font-black leading-snug text-[#192947] sm:text-3xl">{claim.claim}</p>
          </div>

          {picked === null ? (
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button type="button" onClick={() => answer(true)} className="min-h-16 rounded-2xl bg-[#246e55] px-4 py-4 text-xl font-black text-white shadow hover:bg-[#174c3a] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#294cc4]">
                True
              </button>
              <button type="button" onClick={() => answer(false)} className="min-h-16 rounded-2xl bg-[#dc654e] px-4 py-4 text-xl font-black text-white shadow hover:bg-[#a33f2c] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#294cc4]">
                False
              </button>
            </div>
          ) : (
            <div className={`mt-5 rounded-2xl border-2 p-5 text-left ${correct ? 'border-[#246e55] bg-[#eef8f3]' : 'border-[#dc654e] bg-[#fff0ec]'}`} aria-live="polite">
              <p className="text-lg font-black text-[#192947]">
                {correct ? 'Correct.' : 'Not quite.'} This claim is {claim.answer ? 'true' : 'false'}.
              </p>
              <p className="mt-2 leading-7 text-[#43516b]">{claim.fact}</p>
              <QuestionProvenance
                items={provenanceItems}
                mapHref={mapSlug ? `/map/${mapSlug}/` : undefined}
              />
              <button type="button" onClick={next} className="twt-button mt-5 min-h-12 w-full">
                {idx + 1 < questions.length ? 'Next claim' : 'See results'}
              </button>
              {msg && <p className="mt-2 text-sm text-[#a33f2c]" role="alert">{msg}</p>}
            </div>
          )}
        </section>
      </>
    )
  }

  return (
    <>
      <CheckoutBanner game="true-false" onVerified={checkoutVerified} />
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
        <ResultScorecard
          game="true-false"
          day={day}
          score={score}
          correct={score}
          total={questions.length}
          streak={completionStreak}
          secondaryNote={isExtra
            ? 'This Extra Attempt does not replace your first saved result or add another streak day.'
            : 'Your one free first run is saved for this UTC day.'}
        />

        <ResultSharePanel
          game="true-false"
          day={day}
          score={score}
          correct={score}
          total={questions.length}
          streak={completionStreak}
        />

        <RewardsTeaser />

        <DailyUnlockCard
          game="true-false"
          date={day}
          perfect={questions.length > 0 && score === questions.length}
        />

        <UtcCountdown />

        <section className="twt-panel p-6 text-left sm:p-8" aria-label="Extra Attempt">
          <p className="twt-kicker">Optional Extra Attempt</p>
          <p className="mt-2 text-sm leading-6 text-[#43516b]">{T.extraAttemptBlurb} The same server entitlement can be used in either daily game.</p>
          <p className="mt-1 text-xs leading-5 text-[#59647a]">An Extra Attempt never replaces your first result, adds streak days or duplicates first-completion rewards.</p>

          <div className="mt-4">
            {retryStatus.state === 'loading' && !retryRecovery ? (
              <button type="button" disabled className="twt-button-secondary min-h-12 w-full disabled:opacity-60">
                Checking Extra Attempt availability...
              </button>
            ) : canUseExtra ? (
              <button type="button" disabled={retryBusy} onClick={() => void startExtraAttempt()} className="twt-button min-h-12 w-full disabled:opacity-60">
                {retryBusy
                  ? 'Confirming Extra Attempt...'
                  : retryRecovery
                    ? 'Recover Extra Attempt'
                    : retryStatus.credits > 0
                      ? `Use an Extra Attempt (${retryStatus.credits} left)`
                      : 'Use an Extra Attempt'}
              </button>
            ) : retryStatus.state === 'unknown' ? (
              <button type="button" disabled={retryBusy} onClick={() => void refreshRetryStatus()} className="twt-button-secondary min-h-12 w-full disabled:opacity-60">
                Check Extra Attempt
              </button>
            ) : (
              <button type="button" disabled={retryBusy} onClick={() => void buyExtra()} className="twt-button min-h-12 w-full disabled:opacity-60">
                {retryBusy ? 'Opening checkout...' : `${T.extraAttemptButton} · €0.99`}
              </button>
            )}
          </div>
          {retryNotice && <p className="mt-3 text-sm leading-6 text-[#a33f2c]" role="status">{retryNotice}</p>}
          {msg && <p className="mt-3 text-sm leading-6 text-[#a33f2c]" role="alert">{msg}</p>}
        </section>

        <div>
          <p className="mb-2 text-xs text-[#59647a]">{T.adCaptions[0]}</p>
          <AdUnit slotId={AD_SLOTS.truthleResults} format="rectangle" />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Link href="/truthle/" className="twt-button-secondary text-center">Play Truthle</Link>
          <Link href="/map/press-freedom/" className="twt-button-secondary text-center">Explore maps</Link>
        </div>
        <div className="pb-8 text-center">
          <Link href="/true-false/claims/" className="text-sm font-semibold text-[#294cc4] underline">Browse the claims archive</Link>
          <p className="mt-2 text-xs leading-5 text-[#59647a]">Source details are shown where recorded. Many archived metrics have unknown provenance.</p>
          <p className="mt-1 text-xs text-[#59647a]">New eligible questions unlock at 00:00 UTC.</p>
        </div>
      </div>
    </>
  )
}

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import type { Country } from '@/types/country'
import { trackEvent } from '@/lib/analytics/events'
import { generateDailyQuestions, getTruthleDay, type TruthleQuestion } from '@/lib/truthle/generator'
import { calculateScore, type TruthleScore } from '@/lib/truthle/scoring'
import { calculateCoinsEarned, getNextStreakMilestone, type CoinBreakdown } from '@/lib/truthle/coins'
import { getCompletionStreak, getDisplayStreak, getUtcDay } from '@/lib/truthle/dailyLifecycle'
import {
  addCoins,
  consumeCloudRetry,
  createRetryCheckout,
  getCloudRetryStatus,
  getCoins,
  getLocalState,
  getStoredSharePromo,
  hasPlayedToday,
  saveAttempt,
  saveRetryAttempt,
  updateAchievementStats,
} from '@/lib/truthle/storage'
import { getRememberedChallenge } from '@/lib/truthle/gifts'
import { getVariableById } from '@/lib/seo/catalog'
import { T } from '@/lib/truthle/monetizeCopy'
import CheckoutBanner from '@/components/truthle/CheckoutBanner'
import QuestionProvenance, { type ProvenanceItem } from '@/components/truthle/QuestionProvenance'
import ResultScorecard from '@/components/truthle/ResultScorecard'
import ResultSharePanel from '@/components/truthle/ResultSharePanel'
import UtcCountdown from '@/components/truthle/UtcCountdown'
import RewardsTeaser from '@/components/truthle/RewardsTeaser'
import { AdSidebar } from '@/components/ads'
import { AD_SLOTS } from '@/lib/constants/ads'
import { useEmbeddedAppMode } from '@/lib/useEmbeddedAppMode'
import { onNativeBridgeMessage, postBridgeMessage } from '@/lib/bridge/webBridge'
import type { IOSToWebBridgeMessage } from '@/lib/bridge/types'
import { ensureAnonymousAuth } from '@/lib/firebase/config'

type Phase = 'loading' | 'ready' | 'playing' | 'answered' | 'result' | 'unavailable' | 'error'

interface TruthleGameProps {
  countries: Country[]
}

type SourcedQuestion = TruthleQuestion & {
  sourceUrl?: string
  sourceName?: string
  year?: string
  coverage?: number
  limitations?: string[]
  provenance?: Array<{
    sourceUrl?: string
    sourceName?: string
    year?: string
    coverage?: number
    limitations?: string[]
  }>
}

interface DisplayResult {
  score: number
  results: boolean[]
  times: number[]
  streak: number
  isRetry: boolean
  scoreDetail?: TruthleScore | null
}

const COIN_LABELS: Record<keyof CoinBreakdown, string> = {
  dailyPlay: 'Daily play',
  correctAnswers: 'Correct answers',
  speedBonus: 'Speed bonus',
  perfectBonus: 'Perfect round',
  streakBonus: 'Streak bonus',
  firstPlayBonus: 'First play bonus',
  shareBonus: 'Share bonus',
}

const RETRY_PENDING_KEY = 'truthle_retry_consume_pending_v1'
const REFERRAL_CONTEXT_KEY = 'truthle_referral_context_v1'

function readSessionRecord(key: string): Record<string, unknown> | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : null
  } catch {
    return null
  }
}

function hasPendingRetry(day: string): boolean {
  return readSessionRecord(RETRY_PENDING_KEY)?.day === day
}

function setPendingRetry(day: string, pending: boolean): void {
  if (typeof window === 'undefined') return
  try {
    if (pending) window.sessionStorage.setItem(RETRY_PENDING_KEY, JSON.stringify({ day }))
    else window.sessionStorage.removeItem(RETRY_PENDING_KEY)
  } catch {
    // A session storage failure must not start a second paid checkout.
  }
}

function markReferralContext(day: string): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(REFERRAL_CONTEXT_KEY, JSON.stringify({ day }))
  } catch {
    // Referral analytics are optional; the game and checkout are not.
  }
}

function hasReferralContext(day: string): boolean {
  return readSessionRecord(REFERRAL_CONTEXT_KEY)?.day === day
}

function clearReferralContext(): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.removeItem(REFERRAL_CONTEXT_KEY)
  } catch {
    // Best effort cleanup only.
  }
}

function provenanceItems(question: SourcedQuestion): ProvenanceItem[] {
  const supplied = question.provenance ?? []
  if (supplied.length > 0) {
    return supplied.map((item, index) => ({
      ...(supplied.length > 1 ? { label: `Source ${index + 1}` } : {}),
      sourceUrl: item.sourceUrl,
      sourceName: item.sourceName,
      year: item.year,
      coverage: item.coverage,
      limitations: item.limitations,
    }))
  }
  if (question.sourceUrl || question.sourceName || question.year || question.limitations?.length) {
    return [{
      sourceUrl: question.sourceUrl,
      sourceName: question.sourceName,
      year: question.year,
      coverage: question.coverage,
      limitations: question.limitations,
    }]
  }
  return []
}

function mapHref(question: SourcedQuestion): string | undefined {
  if (!question.variablePath) return undefined
  const entry = getVariableById(question.variablePath)
  return entry ? `/map/${entry.slug}/` : undefined
}

export default function TruthleGame({ countries }: TruthleGameProps) {
  const embeddedMode = useEmbeddedAppMode()
  const [day, setDay] = useState(() => getUtcDay())
  const [initToken, setInitToken] = useState(0)
  const [phase, setPhase] = useState<Phase>('loading')
  const [resultSource, setResultSource] = useState<'restored' | 'completed'>('completed')
  const [questions, setQuestions] = useState<SourcedQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [results, setResults] = useState<boolean[]>([])
  const [times, setTimes] = useState<number[]>([])
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [questionStartTime, setQuestionStartTime] = useState(0)
  const [result, setResult] = useState<DisplayResult | null>(null)
  const [displayStreak, setDisplayStreak] = useState(0)
  const [coinsEarned, setCoinsEarned] = useState<{ total: number; breakdown: CoinBreakdown } | null>(null)
  const [coinBalance, setCoinBalance] = useState(0)
  const [isRetryRun, setIsRetryRun] = useState(false)
  const [hasRetryAvailable, setHasRetryAvailable] = useState(false)
  const [retryPending, setRetryPending] = useState(false)
  const [retryConsuming, setRetryConsuming] = useState(false)
  const [retryRequesting, setRetryRequesting] = useState(false)
  const [retryMessage, setRetryMessage] = useState<string | null>(null)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [authenticatedUserId, setAuthenticatedUserId] = useState<string | null>(null)
  const [referralRun, setReferralRun] = useState(false)
  const [errorText, setErrorText] = useState('')
  const retryConsumeRef = useRef(false)
  const submittingRef = useRef(false)
  const startedAnalyticsRef = useRef(new Set<string>())
  const completedAnalyticsRef = useRef(new Set<string>())

  const truthleDay = getTruthleDay(day)

  const postTruthleState = useCallback((state: string, stateScore?: number) => {
    postBridgeMessage({
      type: 'truthle_state',
      payload: {
        state,
        score: stateScore,
        truthleDay,
        hasRetryAvailable,
        userId: authenticatedUserId || undefined,
        timestamp: new Date().toISOString(),
      },
    })
  }, [authenticatedUserId, hasRetryAvailable, truthleDay])

  const refreshRetryStatus = useCallback(async (statusDay = day) => {
    const status = await getCloudRetryStatus()
    const sameDay = !status.date || status.date === statusDay
    const canRetry = (sameDay && status.canConsume) || hasPendingRetry(statusDay)
    setHasRetryAvailable(canRetry)

    if (embeddedMode) {
      postBridgeMessage({
        type: 'retry_status_changed',
        payload: {
          granted: status.granted,
          consumed: status.consumed,
          source: status.source,
          timestamp: new Date().toISOString(),
        },
      })
    }

    return canRetry
  }, [day, embeddedMode])

  const wait = (ms: number) => new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })

  const pollRetryStatus = useCallback(async () => {
    for (let attempt = 0; attempt < 6; attempt += 1) {
      if (await refreshRetryStatus(day)) return true
      await wait(2000)
    }
    return false
  }, [day, refreshRetryStatus])

  useEffect(() => {
    let cancelled = false

    async function init() {
      setPhase('loading')
      setErrorText('')
      setResult(null)
      setCoinsEarned(null)
      setSelectedAnswer(null)
      setResults([])
      setTimes([])
      setIsRetryRun(false)
      setRetryMessage(null)
      setCoinBalance(getCoins())

      const activeDay = getUtcDay()
      if (activeDay !== day) {
        setDay(activeDay)
        return
      }

      try {
        const generated = generateDailyQuestions(countries, day) as SourcedQuestion[]
        let played = false
        let attempt: Awaited<ReturnType<typeof hasPlayedToday>>['attempt']

        try {
          const check = await hasPlayedToday()
          played = check.played
          attempt = check.attempt
        } catch {
          // Local progress remains usable if the cloud check is unavailable.
        }

        try {
          const user = await ensureAnonymousAuth()
          if (!cancelled) setAuthenticatedUserId(user.uid)
        } catch {
          if (!cancelled) setAuthenticatedUserId(null)
        }

        if (cancelled) return

        const state = getLocalState()
        const currentStreak = getDisplayStreak(state, day)
        setQuestions(generated)
        setDisplayStreak(currentStreak)
        const pending = hasPendingRetry(day)
        setRetryPending(pending)

        if (played && attempt) {
          const restoredState = getLocalState()
          const restoredStreak = getDisplayStreak(restoredState, day) || Math.max(1, attempt.streak || 0)
          setResult({
            score: attempt.score,
            results: attempt.results ?? [],
            times: attempt.times ?? [],
            streak: restoredStreak,
            isRetry: false,
          })
          setResultSource('restored')
          setPhase('result')
          if (generated.length > 0) await refreshRetryStatus(day)
          else setRetryMessage("Extra Attempt is unavailable because today's sourced question set could not be loaded.")
          return
        }

        if (generated.length === 0) {
          setPhase('unavailable')
          return
        }

        setPhase('ready')
      } catch {
        if (!cancelled) {
          setErrorText("We could not load today's round. No score or coins were changed.")
          setPhase('error')
        }
      }
    }

    void init()
    return () => {
      cancelled = true
    }
  }, [countries, day, initToken, refreshRetryStatus])

  useEffect(() => {
    const checkRollover = () => {
      const currentDay = getUtcDay()
      if (currentDay !== day) setDay(currentDay)
    }
    const onVisibility = () => {
      if (document.visibilityState === 'visible') checkRollover()
    }
    const timer = window.setInterval(checkRollover, 30000)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [day])

  const chromeState = phase === 'result'
    ? (resultSource === 'restored' ? 'already_played' : 'finished')
    : phase

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('truthle:state', { detail: chromeState }))
  }, [chromeState])

  useEffect(() => {
    postTruthleState(chromeState, result?.score)
  }, [chromeState, postTruthleState, result?.score])

  useEffect(() => {
    if (!embeddedMode) return
    const unsubscribe = onNativeBridgeMessage(async (message: IOSToWebBridgeMessage) => {
      if (message.type !== 'rewarded_result') return
      setRetryRequesting(false)

      if (message.payload.status === 'closed') {
        setRetryMessage('Ad was closed before completion.')
        return
      }
      if (message.payload.status === 'failed') {
        setRetryMessage(message.payload.reason || 'Rewarded ad failed. Please try again later.')
        return
      }

      setRetryMessage('Reward completed. Verifying the retry entitlement...')
      const granted = await pollRetryStatus()
      if (granted) {
        setRetryMessage('Extra Attempt unlocked. You can start one more run today.')
        postTruthleState('retry_unlocked')
      } else {
        setRetryMessage('The reward is still pending. Check the Extra Attempt again in a moment.')
      }
    })
    return unsubscribe
  }, [embeddedMode, pollRetryStatus, postTruthleState])

  const beginRun = useCallback((retry: boolean) => {
    const runKey = `${day}:${retry ? 'retry' : 'primary'}`
    if (!startedAnalyticsRef.current.has(runKey)) {
      startedAnalyticsRef.current.add(runKey)
      trackEvent('game_start', { game: 'truthle', puzzle_day: day })
    }
    setCurrentIndex(0)
    setResults([])
    setTimes([])
    setSelectedAnswer(null)
    setResult(null)
    setCoinsEarned(null)
    setIsRetryRun(retry)
    setRetryMessage(null)
    setPhase('playing')
    setQuestionStartTime(Date.now())
  }, [day])

  const startPrimaryRun = useCallback(() => {
    beginRun(false)
  }, [beginRun])

  const handleAnswer = useCallback((answerIndex: number) => {
    if (phase !== 'playing') return
    const question = questions[currentIndex]
    if (!question) return
    const elapsed = (Date.now() - questionStartTime) / 1000
    setSelectedAnswer(answerIndex)
    setResults((previous) => [...previous, answerIndex === question.correctAnswer])
    setTimes((previous) => [...previous, elapsed])
    setPhase('answered')
  }, [currentIndex, phase, questionStartTime, questions])

  const nextQuestion = useCallback(() => {
    if (phase !== 'answered') return
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((previous) => previous + 1)
      setSelectedAnswer(null)
      setPhase('playing')
      setQuestionStartTime(Date.now())
    }
  }, [currentIndex, phase, questions.length])

  const finishRun = useCallback(async () => {
    if (submittingRef.current) return
    submittingRef.current = true

    try {
      const finalResults = [...results]
      const finalTimes = [...times]
      if (finalResults.length === 0) {
        setErrorText('This run has no saved answers to score. Start the round again when you are ready.')
        setPhase('error')
        return
      }

      const localBefore = getLocalState()
      const completionStreak = isRetryRun
        ? Math.max(1, displayStreak)
        : getCompletionStreak({
            lastPlayedDate: localBefore.lastPlayedDate,
            currentStreak: localBefore.streak,
          }, day)
      const detail = calculateScore(finalResults, finalTimes, completionStreak)
      let shownScore = detail.totalScore
      let shownResults = finalResults
      let shownTimes = finalTimes
      let shownStreak = Math.max(1, completionStreak)
      let scoreDetail: TruthleScore | null = isRetryRun ? detail : null
      let earned: { total: number; breakdown: CoinBreakdown } | null = null

      if (isRetryRun) {
        const saved = await saveRetryAttempt(detail.totalScore, finalResults, finalTimes, shownStreak)
        if (!saved.success) {
          setRetryMessage('Your retry result is visible, but cloud saving could not be confirmed. Your primary result was not changed.')
        }
      } else {
        const beforeCoins = getCoins()
        const fastAnswers = finalTimes.filter((time) => time < 3).length
        const isPerfect = finalResults.every(Boolean)
        const isFirstPlay = localBefore.gamesPlayed === 0
        const calculatedCoins = calculateCoinsEarned(
          finalResults.filter(Boolean).length,
          fastAnswers,
          completionStreak,
          isPerfect,
          isFirstPlay,
          false,
        )
        const saved = await saveAttempt(detail.totalScore, finalResults, finalTimes)

        if (!saved.success) {
          setErrorText('We could not confirm that your result was saved. No coins were added. Reopen Truthle to check your saved state before trying again.')
          setPhase('error')
          return
        }

        if (saved.isFirstCompletion) {
          shownStreak = saved.streak
          scoreDetail = detail
          const afterCoins = getCoins()
          if (afterCoins === beforeCoins) {
            const nextBalance = addCoins(calculatedCoins.total)
            setCoinBalance(nextBalance)
            updateAchievementStats(isPerfect, fastAnswers)
          } else {
            setCoinBalance(afterCoins)
          }
          earned = calculatedCoins
        } else {
          const savedState = getLocalState()
          if (savedState.todayScore !== null) {
            shownScore = savedState.todayScore
            shownResults = savedState.todayResults ?? finalResults
            shownTimes = savedState.todayTimes ?? finalTimes
          }
          shownStreak = getDisplayStreak(savedState, day) || completionStreak
          setCoinBalance(getCoins())
        }
      }

      const finalResult: DisplayResult = {
        score: shownScore,
        results: shownResults,
        times: shownTimes,
        streak: shownStreak,
        isRetry: isRetryRun,
        scoreDetail,
      }
      setResult(finalResult)
      setResultSource('completed')
      setDisplayStreak(shownStreak)
      setCoinsEarned(earned)
      setPhase('result')

      const runKey = `${day}:${isRetryRun ? 'retry' : 'primary'}`
      if (!completedAnalyticsRef.current.has(runKey)) {
        completedAnalyticsRef.current.add(runKey)
        trackEvent('game_complete', {
          game: 'truthle',
          puzzle_day: day,
          score: shownScore,
          correct: shownResults.filter(Boolean).length,
        })
        postBridgeMessage({
          type: 'session_completed',
          payload: {
            route: '/truthle',
            sessionType: isRetryRun ? 'truthle_retry' : 'truthle_primary',
            reason: 'completed',
            score: shownScore,
            timestamp: new Date().toISOString(),
          },
        })
      }

      if (isRetryRun && referralRun && !completedAnalyticsRef.current.has(`referral:${day}`)) {
        completedAnalyticsRef.current.add(`referral:${day}`)
        trackEvent('referral_game_complete', {
          game: 'truthle',
          puzzle_day: day,
          score: shownScore,
          correct: shownResults.filter(Boolean).length,
        })
        clearReferralContext()
        setReferralRun(false)
      }
    } catch {
      setErrorText('We could not finish this result. No new run was started. Reopen Truthle to check what was saved before trying again.')
      setPhase('error')
    } finally {
      submittingRef.current = false
    }
  }, [day, displayStreak, isRetryRun, referralRun, results, times])

  const startExtraAttempt = useCallback(async () => {
    if (retryConsumeRef.current) return
    if (questions.length === 0) {
      setRetryMessage("Extra Attempt is unavailable because today's sourced question set could not be loaded.")
      return
    }

    retryConsumeRef.current = true
    setRetryConsuming(true)
    setRetryMessage('Checking your Extra Attempt. Nothing is charged twice.')
    setPendingRetry(day, true)
    setRetryPending(true)

    try {
      const consumed = await consumeCloudRetry()
      if (!consumed.success) {
        setRetryMessage('The Extra Attempt could not be confirmed. Check Extra Attempt again. Your result and primary score are unchanged.')
        setHasRetryAvailable(true)
        postBridgeMessage({
          type: 'retry_consumed',
          payload: { success: false, timestamp: new Date().toISOString() },
        })
        return
      }

      setPendingRetry(day, false)
      setRetryPending(false)
      setHasRetryAvailable(false)
      setReferralRun(hasReferralContext(day))
      postBridgeMessage({
        type: 'retry_consumed',
        payload: { success: true, timestamp: new Date().toISOString() },
      })
      beginRun(true)
    } catch {
      setRetryMessage('The Extra Attempt check was interrupted. Check Extra Attempt again. Your result is unchanged.')
      setHasRetryAvailable(true)
      postBridgeMessage({
        type: 'retry_consumed',
        payload: { success: false, timestamp: new Date().toISOString() },
      })
    } finally {
      retryConsumeRef.current = false
      setRetryConsuming(false)
    }
  }, [beginRun, day, questions.length])

  const buyExtraAttempt = useCallback(async () => {
    if (checkoutLoading || retryPending || retryConsumeRef.current) return
    setCheckoutLoading(true)
    setRetryMessage(null)

    try {
      let shareCode: string | undefined
      const remembered = getRememberedChallenge('truthle')
      const ownPromo = getStoredSharePromo()
      if (remembered && remembered.day === day && remembered.code && remembered.code !== ownPromo?.code) {
        shareCode = remembered.code
      }

      const checkout = await createRetryCheckout(1, 'truthle', shareCode ? { shareCode } : {})
      if (checkout.url) {
        if (shareCode) markReferralContext(day)
        window.location.assign(checkout.url)
        return
      }

      setRetryMessage(checkout.error || 'Checkout is unavailable right now. No charge was made.')
    } catch {
      setRetryMessage('Checkout could not be started. No charge was made. Try again in a moment.')
    } finally {
      setCheckoutLoading(false)
    }
  }, [checkoutLoading, day, retryPending])

  const requestRewardedRetry = useCallback(() => {
    if (!embeddedMode || retryRequesting || retryPending) return
    setRetryRequesting(true)
    setRetryMessage('Requesting the rewarded ad...')
    postBridgeMessage({
      type: 'request_rewarded_retry',
      payload: {
        route: '/truthle',
        date: day,
        truthleDay,
        timestamp: new Date().toISOString(),
      },
    })
  }, [day, embeddedMode, retryPending, retryRequesting, truthleDay])

  const handleVerifiedCheckout = useCallback((credits: number) => {
    setRetryMessage(`${credits} Extra Attempt ${credits === 1 ? 'credit is' : 'credits are'} verified. Use it below when you are ready.`)
    void refreshRetryStatus(day)
  }, [day, refreshRetryStatus])

  const resultCorrect = result?.results.filter(Boolean).length ?? 0
  const resultTotal = result?.results.length ?? 0
  const hasResultBreakdown = resultTotal > 0
  const resultSecondaryNote = result?.isRetry
    ? 'Extra Attempt. Your first saved result remains your daily result and streak.'
    : resultSource === 'restored'
      ? 'Restored from your saved daily result.'
      : 'Saved as today\'s result. One completion counts per UTC day.'
  const coinLines = coinsEarned
    ? (Object.entries(coinsEarned.breakdown) as Array<[keyof CoinBreakdown, number]>)
        .filter(([, value]) => value > 0)
    : []
  const currentQuestion = questions[currentIndex]

  return (
    <div className="mx-auto w-full max-w-2xl">
      <CheckoutBanner game="truthle" onVerified={handleVerifiedCheckout} />

      <header className="mb-5 text-left">
        <p className="twt-kicker">The World Truth daily game</p>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
          <h1 className="twt-display text-4xl font-black text-[#192947] sm:text-5xl">Truthle</h1>
          <Link href="/rewards/" className="text-sm font-bold text-[#294cc4] underline">
            {coinBalance} coins
          </Link>
        </div>
        <p className="mt-2 text-base leading-7 text-[#49556b]">
          Sourced world facts, the same round for everyone, one free attempt each UTC day.
        </p>
      </header>

      {phase === 'loading' && (
        <section className="twt-panel p-6 text-left" role="status" aria-live="polite" aria-busy="true">
          <p className="twt-kicker">Loading</p>
          <h2 className="twt-display mt-2 text-2xl font-black">Preparing today&apos;s sourced round</h2>
          <p className="twt-prose mt-2">Checking saved progress and eligible questions. No answer is submitted while this loads.</p>
        </section>
      )}

      {phase === 'ready' && (
        <section className="twt-panel p-6 text-left sm:p-8">
          <p className="twt-kicker">Today&apos;s round</p>
          <h2 className="twt-display mt-2 text-3xl font-black text-[#192947]">
            {questions.length} sourced {questions.length === 1 ? 'question' : 'questions'} ready
          </h2>
          <p className="twt-prose mt-2">
            The set is fixed for today. Source, year, coverage and known limits appear after you answer each question.
          </p>
          {displayStreak > 0 && (
            <p className="mt-3 text-sm font-semibold text-[#246e55]">Current round streak: {displayStreak} {displayStreak === 1 ? 'day' : 'days'}.</p>
          )}
          <button type="button" onClick={startPrimaryRun} className="twt-button mt-5 min-h-12 w-full sm:w-auto">
            Start today&apos;s round
          </button>
          <p className="mt-3 text-xs text-[#59647a]">One free attempt. A new set unlocks at 00:00 UTC.</p>
        </section>
      )}

      {(phase === 'playing' || phase === 'answered') && currentQuestion && (
        <section className="twt-panel p-5 text-left sm:p-7" aria-labelledby="truthle-question">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="twt-kicker">Question {currentIndex + 1} of {questions.length}</p>
            <p className="text-xs font-bold uppercase tracking-wide text-[#59647a]">{currentQuestion.categoryIcon} {currentQuestion.category}</p>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#e7dfc8]" role="progressbar" aria-valuemin={1} aria-valuemax={questions.length} aria-valuenow={currentIndex + 1}>
            <div className="h-full rounded-full bg-[#294cc4]" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
          </div>
          <h2 id="truthle-question" className="twt-display mt-5 text-2xl font-black leading-tight text-[#192947] sm:text-3xl">
            {currentQuestion.question}
          </h2>
          <div className="mt-5 space-y-2">
            {currentQuestion.options.map((option, index) => {
              const isPicked = selectedAnswer === index
              const isCorrect = index === currentQuestion.correctAnswer
              const revealed = phase === 'answered'
              const tone = revealed && isCorrect
                ? 'border-[#246e55] bg-[#eef8f3] text-[#174c3a]'
                : revealed && isPicked
                  ? 'border-[#dc654e] bg-[#fff1ed] text-[#7d2e1f]'
                  : 'border-[#d8d2c2] bg-[#fffdf5] text-[#192947] hover:border-[#294cc4]'
              return (
                <button
                  key={`${currentQuestion.id}-${option}`}
                  type="button"
                  onClick={() => handleAnswer(index)}
                  disabled={revealed}
                  aria-pressed={isPicked}
                  className={`min-h-12 w-full rounded-xl border-2 px-4 py-3 text-left text-base font-semibold transition ${tone} disabled:cursor-default`}
                >
                  <span className="mr-2 font-black text-[#294cc4]">{String.fromCharCode(65 + index)}.</span>
                  {option}
                </button>
              )
            })}
          </div>

          {phase === 'answered' && (
            <div className="mt-5 rounded-xl border border-[#d8d2c2] bg-[#fff9e8] p-4" role="status" aria-live="polite">
              <p className={`font-black ${selectedAnswer === currentQuestion.correctAnswer ? 'text-[#246e55]' : 'text-[#a33f2c]'}`}>
                {selectedAnswer === currentQuestion.correctAnswer ? 'Correct.' : 'Not this time.'}
              </p>
              <p className="mt-1 text-sm font-semibold text-[#192947]">Answer: {currentQuestion.options[currentQuestion.correctAnswer]}</p>
              <p className="mt-2 text-sm leading-6 text-[#49556b]">{currentQuestion.explanation}</p>
              <QuestionProvenance items={provenanceItems(currentQuestion)} mapHref={mapHref(currentQuestion)} />
              <button
                type="button"
                onClick={() => {
                  if (currentIndex < questions.length - 1) nextQuestion()
                  else void finishRun()
                }}
                className="twt-button mt-4 min-h-11 w-full sm:w-auto"
              >
                {currentIndex < questions.length - 1 ? 'Next question' : 'See result'}
              </button>
            </div>
          )}
        </section>
      )}

      {phase === 'unavailable' && (
        <section className="twt-panel p-6 text-left sm:p-8">
          <p className="twt-kicker">Round unavailable</p>
          <h2 className="twt-display mt-2 text-3xl font-black text-[#192947]">No eligible sourced questions today</h2>
          <p className="twt-prose mt-2">
            Today&apos;s question set could not be built from sources that meet the game requirements. No substitute or invented question is shown.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" onClick={() => setInitToken((value) => value + 1)} className="twt-button min-h-11">Check again</button>
            <Link href="/true-false/" className="twt-button-secondary inline-flex min-h-11 items-center px-4">Try True or False</Link>
          </div>
        </section>
      )}

      {phase === 'error' && (
        <section className="twt-panel border-[#dc654e] p-6 text-left sm:p-8" role="alert">
          <p className="twt-kicker !text-[#a33f2c]">Round interrupted</p>
          <h2 className="twt-display mt-2 text-3xl font-black text-[#192947]">We could not complete this step</h2>
          <p className="twt-prose mt-2">{errorText}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            {results.length > 0 && (
              <button type="button" onClick={() => void finishRun()} className="twt-button min-h-11">Try saving this result again</button>
            )}
            <button type="button" onClick={() => setInitToken((value) => value + 1)} className="twt-button-secondary min-h-11 px-4">Reload today&apos;s round</button>
          </div>
        </section>
      )}

      {phase === 'result' && result && (
        <div className="space-y-4">
          {hasResultBreakdown && (
            <ResultSharePanel
              game="truthle"
              day={day}
              score={result.score}
              correct={resultCorrect}
              total={resultTotal}
              streak={result.streak}
            />
          )}

          {hasResultBreakdown ? (
            <ResultScorecard
              game="truthle"
              day={day}
              score={result.score}
              correct={resultCorrect}
              total={resultTotal}
              streak={result.streak}
              secondaryNote={resultSecondaryNote}
            />
          ) : (
            <section className="twt-panel p-6 text-left" aria-label="Saved result">
              <p className="twt-kicker">Saved result</p>
              <h2 className="twt-display mt-2 text-3xl font-black text-[#192947]">{result.score.toLocaleString('en-GB')} points</h2>
              <p className="mt-2 text-sm font-semibold text-[#246e55]">Round streak: {result.streak} {result.streak === 1 ? 'day' : 'days'}</p>
              <p className="twt-prose mt-2">This saved result did not include an answer breakdown. Its score and streak are shown without guessing the missing details.</p>
            </section>
          )}

          <section className="twt-panel p-5 text-left sm:p-6" aria-labelledby="coin-result-heading">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="twt-kicker">Your coins</p>
                <h3 id="coin-result-heading" className="twt-display mt-1 text-2xl font-black text-[#192947]">Balance: {coinBalance}</h3>
              </div>
              <Link href="/rewards/" className="text-sm font-bold text-[#294cc4] underline">Open rewards</Link>
            </div>
            {coinsEarned && coinsEarned.total > 0 ? (
              <>
                <p className="mt-2 font-semibold text-[#246e55]">You earned {coinsEarned.total} coins for this first completion.</p>
                <ul className="mt-2 grid gap-1 text-sm text-[#49556b] sm:grid-cols-2">
                  {coinLines.map(([key, value]) => <li key={key}>{COIN_LABELS[key]}: +{value}</li>)}
                </ul>
              </>
            ) : (
              <p className="mt-2 text-sm text-[#49556b]">No new coins were added. Coins for a daily round are awarded once.</p>
            )}
            {getNextStreakMilestone(displayStreak) && (
              <p className="mt-2 text-xs text-[#59647a]">
                Next streak milestone: {getNextStreakMilestone(displayStreak)?.days} days for {getNextStreakMilestone(displayStreak)?.reward} coins.
              </p>
            )}
          </section>

          <RewardsTeaser />

          {result.scoreDetail && (
            <section className="twt-panel p-5 text-left" aria-label="Score detail">
              <p className="twt-kicker">Score detail</p>
              <p className="mt-2 text-sm leading-6 text-[#49556b]">
                Base {result.scoreDetail.baseScore}, speed {result.scoreDetail.speedBonus}, streak {result.scoreDetail.streakBonus}. Average answer time {result.scoreDetail.averageTime.toFixed(1)} seconds.
              </p>
            </section>
          )}

          <UtcCountdown />

          <section className="twt-panel p-5 text-left sm:p-6" aria-labelledby="extra-attempt-heading">
            <p className="twt-kicker">Optional</p>
            <h3 id="extra-attempt-heading" className="twt-display mt-1 text-2xl font-black text-[#192947]">Extra Attempt</h3>
            <p className="twt-prose mt-2">{T.extraAttemptBlurb}</p>

            {result.isRetry ? (
              <p className="mt-3 rounded-xl border border-[#d8d2c2] bg-[#fffdf5] p-3 text-sm text-[#49556b]">
                This Extra Attempt is complete. Your first saved result remains your daily result and streak, and no further checkout is offered here.
              </p>
            ) : questions.length === 0 ? (
              <p className="mt-3 rounded-xl border border-[#d8d2c2] bg-[#fffdf5] p-3 text-sm text-[#49556b]">
                Extra Attempt is unavailable because today&apos;s sourced question set could not be loaded. No checkout is offered.
              </p>
            ) : retryPending ? (
              <button
                type="button"
                onClick={() => void startExtraAttempt()}
                disabled={retryConsuming}
                className="twt-button mt-4 min-h-11 w-full disabled:opacity-60"
              >
                {retryConsuming ? 'Checking Extra Attempt...' : 'Check Extra Attempt again'}
              </button>
            ) : hasRetryAvailable ? (
              <button
                type="button"
                onClick={() => void startExtraAttempt()}
                disabled={retryConsuming}
                className="twt-button mt-4 min-h-11 w-full disabled:opacity-60"
              >
                Use your Extra Attempt
              </button>
            ) : embeddedMode ? (
              <button
                type="button"
                onClick={requestRewardedRetry}
                disabled={retryRequesting}
                className="twt-button mt-4 min-h-11 w-full disabled:opacity-60"
              >
                {retryRequesting ? 'Requesting reward...' : 'Get an Extra Attempt with a rewarded ad'}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void buyExtraAttempt()}
                disabled={checkoutLoading}
                className="twt-button mt-4 min-h-11 w-full disabled:opacity-60"
              >
                {checkoutLoading ? 'Opening checkout...' : `${T.extraAttemptButton} for EUR0.99`}
              </button>
            )}

            {retryMessage && <p className="mt-3 text-sm leading-6 text-[#49556b]" role="status" aria-live="polite">{retryMessage}</p>}
            <p className="mt-3 text-xs leading-5 text-[#59647a]">
              After checkout, the trusted verification banner checks the payment server before an attempt is added. A gift code you created cannot be used for your own Extra Attempt.
            </p>
          </section>

          {!embeddedMode && <AdSidebar slotId={AD_SLOTS.truthleResults} className="mt-4" />}
        </div>
      )}
    </div>
  )
}

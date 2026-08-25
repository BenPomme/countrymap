'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Country } from '@/types/country'
import { generateDailyQuestions, getTodayDateString, getTruthleDay, TRUTHLE_QUESTIONS_PER_DAY, TruthleQuestion } from '@/lib/truthle/generator'
import { calculateScore, estimatePercentile, getGrade, TruthleScore } from '@/lib/truthle/scoring'
import ShareResultsButton from '@/components/truthle/ShareResultsButton'
import {
  hasPlayedToday,
  saveAttempt,
  saveRetryAttempt,
  getLocalState,
  getStats,
  addCoins,
  getCoins,
  updateAchievementStats,
  getCloudRetryStatus,
  consumeCloudRetry,
} from '@/lib/truthle/storage'
import { calculateCoinsEarned, isStreakMilestone, getNextStreakMilestone, CoinBreakdown } from '@/lib/truthle/coins'
import { AdSidebar } from '@/components/ads'
import { AD_SLOTS } from '@/lib/constants/ads'
import Image from 'next/image'
import Link from 'next/link'
import { useEmbeddedAppMode } from '@/lib/useEmbeddedAppMode'
import { onNativeBridgeMessage, postBridgeMessage } from '@/lib/bridge/webBridge'
import type { IOSToWebBridgeMessage } from '@/lib/bridge/types'
import { ensureAnonymousAuth } from '@/lib/firebase/config'

type GameState = 'loading' | 'ready' | 'playing' | 'answered' | 'finished' | 'already_played'

interface TruthleGameProps {
  countries: Country[]
}

const EMPTY_COIN_BREAKDOWN: CoinBreakdown = {
  dailyPlay: 0,
  correctAnswers: 0,
  speedBonus: 0,
  perfectBonus: 0,
  streakBonus: 0,
  firstPlayBonus: 0,
  shareBonus: 0,
}

export default function TruthleGame({ countries }: TruthleGameProps) {
  const embeddedMode = useEmbeddedAppMode()
  const [gameState, setGameState] = useState<GameState>('loading')
  const [questions, setQuestions] = useState<TruthleQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [results, setResults] = useState<boolean[]>([])
  const [times, setTimes] = useState<number[]>([])
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [questionStartTime, setQuestionStartTime] = useState<number>(0)
  const [score, setScore] = useState<TruthleScore | null>(null)
  const [previousAttempt, setPreviousAttempt] = useState<{ score: number; results: boolean[]; streak: number } | null>(null)
  const [streak, setStreak] = useState(0)
  const [coinsEarned, setCoinsEarned] = useState<{ total: number; breakdown: CoinBreakdown } | null>(null)
  const [coinBalance, setCoinBalance] = useState(0)
  const [showBadgeUnlock, setShowBadgeUnlock] = useState<string | null>(null)
  const handleFirstShare = () => {
    setShowBadgeUnlock('Social Butterfly')
    setTimeout(() => setShowBadgeUnlock(null), 3000)
  }

  const [playedToday, setPlayedToday] = useState(false)
  const [hasRetryAvailable, setHasRetryAvailable] = useState(false)
  const [retryRequesting, setRetryRequesting] = useState(false)
  const [retryMessage, setRetryMessage] = useState<string | null>(null)
  const [isRetryRun, setIsRetryRun] = useState(false)
  const [authenticatedUserId, setAuthenticatedUserId] = useState<string | null>(null)

  const truthleDay = getTruthleDay()

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

  const refreshRetryStatus = useCallback(async () => {
    if (!embeddedMode) return false

    const status = await getCloudRetryStatus()
    const canRetry = status.canConsume

    setHasRetryAvailable(canRetry)

    postBridgeMessage({
      type: 'retry_status_changed',
      payload: {
        granted: status.granted,
        consumed: status.consumed,
        source: status.source,
        timestamp: new Date().toISOString(),
      },
    })

    return canRetry
  }, [embeddedMode])

  const wait = (ms: number) => new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })

  const pollRetryStatus = useCallback(async () => {
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const canRetry = await refreshRetryStatus()
      if (canRetry) return true
      await wait(2000)
    }

    return false
  }, [refreshRetryStatus])

  useEffect(() => {
    let cancelled = false

    async function init() {
      setCoinBalance(getCoins())

      try {
        const user = await ensureAnonymousAuth()
        if (!cancelled) {
          setAuthenticatedUserId(user.uid)
        }
      } catch (error) {
        console.error('Failed to ensure auth for Truthle bridge:', error)
      }

      const { played, attempt } = await hasPlayedToday()
      if (cancelled) return

      if (played && attempt) {
        setPreviousAttempt({
          score: attempt.score,
          results: attempt.results,
          streak: attempt.streak,
        })
        setStreak(attempt.streak)
        setPlayedToday(true)

        if (embeddedMode) {
          await refreshRetryStatus()
        }

        setGameState('already_played')
        return
      }

      const dailyQuestions = generateDailyQuestions(countries)
      setQuestions(dailyQuestions)

      const localState = getLocalState()
      setStreak(localState.streak)

      setGameState('ready')
    }

    init()

    return () => {
      cancelled = true
    }
  }, [countries, embeddedMode, refreshRetryStatus])

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

      setRetryMessage('Reward completed. Verifying retry entitlement...')
      const granted = await pollRetryStatus()

      if (granted) {
        setRetryMessage('Retry unlocked. You can play one extra run today.')
        postTruthleState('retry_unlocked')
      } else {
        setRetryMessage('Reward processed, but retry is still pending. Please try again in a moment.')
      }
    })

    return unsubscribe
  }, [embeddedMode, pollRetryStatus, postTruthleState])

  useEffect(() => {
    postTruthleState(gameState, score?.totalScore)
  }, [gameState, postTruthleState, score])

  useEffect(() => {
    if (gameState !== 'finished' || !score) return

    postBridgeMessage({
      type: 'session_completed',
      payload: {
        route: '/truthle',
        sessionType: isRetryRun ? 'truthle_retry' : 'truthle_primary',
        reason: 'completed',
        score: score.totalScore,
        timestamp: new Date().toISOString(),
      },
    })
  }, [gameState, isRetryRun, score])

  const startGame = useCallback(async () => {
    if (playedToday && hasRetryAvailable && !isRetryRun) {
      const consumed = await consumeCloudRetry()
      if (!consumed.success) {
        setRetryMessage('Retry token is no longer available. Please watch another rewarded ad.')
        setHasRetryAvailable(false)
        postBridgeMessage({
          type: 'retry_consumed',
          payload: {
            success: false,
            timestamp: new Date().toISOString(),
          },
        })
        return
      }

      setIsRetryRun(true)
      setHasRetryAvailable(false)
      setRetryMessage(null)

      postBridgeMessage({
        type: 'retry_consumed',
        payload: {
          success: true,
          timestamp: new Date().toISOString(),
        },
      })
    }

    setCurrentIndex(0)
    setResults([])
    setTimes([])
    setSelectedAnswer(null)
    setScore(null)
    setCoinsEarned(null)
    setGameState('playing')
    setQuestionStartTime(Date.now())
  }, [hasRetryAvailable, isRetryRun, playedToday])

  const requestRewardedRetry = useCallback(() => {
    if (!embeddedMode || retryRequesting) return

    setRetryRequesting(true)
    setRetryMessage('Requesting rewarded ad...')

    postBridgeMessage({
      type: 'request_rewarded_retry',
      payload: {
        route: '/truthle',
        date: getTodayDateString(),
        truthleDay,
        timestamp: new Date().toISOString(),
      },
    })
  }, [embeddedMode, retryRequesting, truthleDay])

  const handleAnswer = useCallback((answerIndex: number) => {
    if (gameState !== 'playing') return

    const timeElapsed = (Date.now() - questionStartTime) / 1000
    const currentQuestion = questions[currentIndex]
    const isCorrect = answerIndex === currentQuestion.correctAnswer

    setSelectedAnswer(answerIndex)
    setResults(prev => [...prev, isCorrect])
    setTimes(prev => [...prev, timeElapsed])
    setGameState('answered')
  }, [gameState, questionStartTime, questions, currentIndex])

  const nextQuestion = useCallback(async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1)
      setSelectedAnswer(null)
      setGameState('playing')
      setQuestionStartTime(Date.now())
    } else {
      setGameState('finished')

      const localState = getLocalState()
      const newStreak = localState.lastPlayedDate
        ? (new Date(getTodayDateString()).getTime() - new Date(localState.lastPlayedDate).getTime()) / (1000 * 60 * 60 * 24) === 1
          ? localState.streak + 1
          : localState.streak
        : 1

      const finalResults = [...results]
      const finalTimes = [...times]
      const calculatedScore = calculateScore(finalResults, finalTimes, newStreak)

      setScore(calculatedScore)
      setStreak(newStreak)

      if (!isRetryRun) {
        const fastAnswers = finalTimes.filter(t => t < 3).length
        const isPerfect = finalResults.every(r => r)
        const isFirstPlay = localState.gamesPlayed === 0

        const earnedCoins = calculateCoinsEarned(
          calculatedScore.correctCount,
          fastAnswers,
          newStreak,
          isPerfect,
          isFirstPlay,
          false
        )

        setCoinsEarned(earnedCoins)

        const newBalance = addCoins(earnedCoins.total)
        setCoinBalance(newBalance)

        updateAchievementStats(isPerfect, fastAnswers)

        await saveAttempt(calculatedScore.totalScore, finalResults, finalTimes)
      } else {
        setCoinsEarned({ total: 0, breakdown: EMPTY_COIN_BREAKDOWN })
        await saveRetryAttempt(calculatedScore.totalScore, finalResults, finalTimes, newStreak)
      }
    }
  }, [currentIndex, questions.length, results, times, isRetryRun])

  const getTimeUntilNext = () => {
    const now = new Date()
    const tomorrow = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
      0, 0, 0
    ))
    const diff = tomorrow.getTime() - now.getTime()

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  const [countdown, setCountdown] = useState(getTimeUntilNext())

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(getTimeUntilNext())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  if (gameState === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
        <p className="mt-4 text-gray-600">Loading today&apos;s Truthle...</p>
      </div>
    )
  }

  if (gameState === 'ready') {
    const stats = getStats()
    const nextMilestone = getNextStreakMilestone(stats.currentStreak)

    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-center px-4">
        {embeddedMode ? (
          <Link
            href="/truthle/shop"
            className="mb-5 flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2 text-amber-800 shadow-sm transition-transform hover:scale-[1.02]"
          >
            <span className="text-lg">🪙</span>
            <span className="font-bold">{coinBalance.toLocaleString()}</span>
            <span className="text-sm font-medium text-amber-700">Shop</span>
          </Link>
        ) : (
          <div className="absolute top-4 right-4 flex items-center gap-2 bg-amber-100 px-3 py-1.5 rounded-full">
            <span className="text-lg">🪙</span>
            <span className="font-bold text-amber-700">{coinBalance.toLocaleString()}</span>
            <Link href="/truthle/shop" className="text-amber-600 hover:text-amber-800 ml-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        )}

        <Image src="/truthle.png" alt="Truthle" width={120} height={120} className="mb-4" />
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Truthle</h1>
        <p className="text-gray-600 mb-1">Daily World Facts Quiz</p>
        <p className="text-sm text-gray-500 mb-2">#{truthleDay} • {TRUTHLE_QUESTIONS_PER_DAY} Questions</p>
        {isRetryRun && (
          <p className="text-sm text-blue-600 font-medium mb-4">Retry run active (ad reward)</p>
        )}

        {stats.gamesPlayed > 0 && (
          <div className="flex gap-6 mb-6 text-center">
            <div>
              <div className="text-2xl font-bold text-emerald-600">{stats.currentStreak}</div>
              <div className="text-xs text-gray-500">Streak</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{stats.bestStreak}</div>
              <div className="text-xs text-gray-500">Best</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{stats.gamesPlayed}</div>
              <div className="text-xs text-gray-500">Played</div>
            </div>
          </div>
        )}

        {nextMilestone && stats.gamesPlayed > 0 && !isRetryRun && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg px-4 py-2 mb-4">
            <p className="text-sm text-amber-700">
              🎯 {nextMilestone.days - stats.currentStreak} days to {nextMilestone.days}-day streak
              <span className="font-bold ml-1">+{nextMilestone.reward} 🪙</span>
            </p>
          </div>
        )}

        <button
          onClick={startGame}
          className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 px-8 rounded-lg text-lg transition-colors shadow-lg hover:shadow-xl"
        >
          {isRetryRun ? 'Play Retry Run' : 'Play Today\'s Truthle'}
        </button>

        <p className="text-xs text-gray-400 mt-6">
          5 questions · Same for everyone · One attempt per day
        </p>
      </div>
    )
  }

  if (gameState === 'already_played' && previousAttempt) {
    const percentile = estimatePercentile(previousAttempt.score)
    const correctCount = previousAttempt.results.filter(r => r).length
    const grade = getGrade(correctCount, previousAttempt.results.length || TRUTHLE_QUESTIONS_PER_DAY)

    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-center px-4 relative">
        {embeddedMode ? (
          <Link
            href="/truthle/shop"
            className="mb-5 flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2 text-amber-800 shadow-sm transition-transform hover:scale-[1.02]"
          >
            <span className="text-lg">🪙</span>
            <span className="font-bold">{coinBalance.toLocaleString()}</span>
            <span className="text-sm font-medium text-amber-700">Shop</span>
          </Link>
        ) : (
          <div className="absolute top-4 right-4 flex items-center gap-2 bg-amber-100 px-3 py-1.5 rounded-full">
            <span className="text-lg">🪙</span>
            <span className="font-bold text-amber-700">{coinBalance.toLocaleString()}</span>
            <Link href="/truthle/shop" className="text-amber-600 hover:text-amber-800 ml-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        )}

        <Image src="/truthle.png" alt="Truthle" width={80} height={80} className="mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">You&apos;ve already played today!</h2>
        <p className="text-sm text-gray-500 mb-4">Truthle #{truthleDay}</p>

        <div className="text-6xl mb-2">{grade.emoji}</div>
        <div className="text-4xl font-bold text-gray-900 mb-1">
          {previousAttempt.score.toLocaleString()}
        </div>
        <div className="text-emerald-600 font-medium mb-4">Top {percentile}%</div>

        <div className="flex gap-1 mb-4">
          {previousAttempt.results.map((r, i) => (
            <div
              key={i}
              className={`w-8 h-8 rounded ${r ? 'bg-emerald-500' : 'bg-red-500'}`}
            />
          ))}
        </div>

        <p className="text-gray-600 mb-2">{correctCount}/{previousAttempt.results.length || TRUTHLE_QUESTIONS_PER_DAY} correct</p>
        {previousAttempt.streak > 1 && (
          <p className="text-orange-500 font-medium mb-4">🔥 {previousAttempt.streak} day streak</p>
        )}

        <div className="flex gap-3 mb-4">
          <ShareResultsButton
            score={previousAttempt.score}
            results={previousAttempt.results}
            streak={previousAttempt.streak}
            truthleDay={truthleDay}
            onFirstShare={handleFirstShare}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
          />
          <Link
            href="/truthle/shop"
            className="bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            Shop
          </Link>
        </div>

        {embeddedMode && (
          <div className="mb-4 w-full max-w-sm">
            <button
              onClick={hasRetryAvailable ? startGame : requestRewardedRetry}
              disabled={retryRequesting}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors"
            >
              {hasRetryAvailable
                ? 'Use Rewarded Retry'
                : retryRequesting
                ? 'Opening rewarded ad...'
                : 'Watch Ad for One Retry'}
            </button>
            {retryMessage && (
              <p className="text-sm text-purple-700 mt-2">{retryMessage}</p>
            )}
          </div>
        )}

        <div className="text-gray-500 text-sm">
          <p>Next Truthle in</p>
          <p className="text-2xl font-mono font-bold text-gray-700">{countdown}</p>
        </div>

        <div className="mt-6">
          <AdSidebar slotId={AD_SLOTS.truthleResults} size="square" />
        </div>
      </div>
    )
  }

  if (gameState === 'playing' || gameState === 'answered') {
    const currentQuestion = questions[currentIndex]

    return (
      <div className="max-w-lg mx-auto px-4">
        <div className="flex gap-1 mb-6">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`h-2 flex-1 rounded ${
                i < currentIndex
                  ? results[i]
                    ? 'bg-emerald-500'
                    : 'bg-red-500'
                  : i === currentIndex
                  ? 'bg-blue-500'
                  : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        <div className="flex justify-between items-center mb-4">
          <span className="text-sm text-gray-500">
            Question {currentIndex + 1}/{questions.length}
          </span>
          <span className="text-sm px-2 py-1 bg-gray-100 rounded">
            {currentQuestion.categoryIcon} {currentQuestion.category}
          </span>
        </div>

        <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
          {currentQuestion.question}
        </h2>

        <div className="space-y-3 mb-6">
          {currentQuestion.options.map((option, i) => {
            let buttonClass = 'w-full py-3 px-4 rounded-lg border-2 transition-all text-left font-medium '

            if (gameState === 'answered') {
              if (i === currentQuestion.correctAnswer) {
                buttonClass += 'bg-emerald-100 border-emerald-500 text-emerald-700'
              } else if (i === selectedAnswer) {
                buttonClass += 'bg-red-100 border-red-500 text-red-700'
              } else {
                buttonClass += 'bg-gray-50 border-gray-200 text-gray-400'
              }
            } else {
              buttonClass += 'bg-white border-gray-200 hover:border-blue-400 hover:bg-blue-50 text-gray-700'
            }

            return (
              <button
                key={i}
                onClick={() => handleAnswer(i)}
                disabled={gameState === 'answered'}
                className={buttonClass}
              >
                {option}
              </button>
            )
          })}
        </div>

        {gameState === 'answered' && (
          <div className="bg-gray-50 rounded-lg p-4 mb-3">
            <p className="text-sm text-gray-700">{currentQuestion.explanation}</p>
          </div>
        )}

        {/* No backend miss-rate stats yet — factual explainer above; clear share nudge instead. */}
        {gameState === 'answered' && (
          <p className="text-sm text-center text-blue-600 mb-4">
            {selectedAnswer !== currentQuestion.correctAnswer
              ? 'Tough one — finish the 5 and Share your score. Friends play the same quiz today.'
              : 'Nice! Finish the 5 and Share — same quiz for everyone today.'}
          </p>
        )}

        {gameState === 'answered' && (
          <button
            onClick={nextQuestion}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            {currentIndex < questions.length - 1 ? 'Next Question' : 'See Results'}
          </button>
        )}
      </div>
    )
  }

  if (gameState === 'finished' && score) {
    const percentile = estimatePercentile(score.totalScore)
    const grade = getGrade(score.correctCount, score.totalQuestions)
    const isMilestone = isStreakMilestone(streak)

    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-center px-4">
        <Image src="/truthle.png" alt="Truthle" width={80} height={80} className="mb-4" />

        <div className="text-6xl mb-2">{grade.emoji}</div>
        <h2 className="text-xl font-semibold text-gray-700 mb-1">{grade.message}</h2>
        <p className="text-sm text-gray-500 mb-4">Truthle #{truthleDay}</p>

        <div className="text-5xl font-bold text-gray-900 mb-1">
          {score.totalScore.toLocaleString()}
        </div>
        <div className="text-emerald-600 font-medium text-lg mb-4">Top {percentile}%</div>

        <div className="flex gap-1 mb-4">
          {results.map((r, i) => (
            <div
              key={i}
              className={`w-8 h-8 rounded ${r ? 'bg-emerald-500' : 'bg-red-500'}`}
            />
          ))}
        </div>

        <div className="flex gap-6 mb-6 text-center">
          <div>
            <div className="text-xl font-bold text-gray-800">{score.correctCount}/{score.totalQuestions}</div>
            <div className="text-xs text-gray-500">Correct</div>
          </div>
          <div>
            <div className="text-xl font-bold text-gray-800">{score.averageTime.toFixed(1)}s</div>
            <div className="text-xs text-gray-500">Avg Time</div>
          </div>
          {streak > 0 && (
            <div>
              <div className="text-xl font-bold text-orange-500">🔥 {streak}</div>
              <div className="text-xs text-gray-500">Streak</div>
            </div>
          )}
        </div>

        {isRetryRun && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 mb-4 text-sm text-blue-700">
            This was your rewarded retry run.
          </div>
        )}

        <ShareResultsButton
          score={score.totalScore}
          results={results}
          streak={streak}
          truthleDay={truthleDay}
          onFirstShare={handleFirstShare}
        />

        {coinsEarned && coinsEarned.total > 0 && (
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg p-4 mb-6 w-full max-w-xs">
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="text-2xl">🪙</span>
              <span className="text-2xl font-bold text-amber-600">+{coinsEarned.total}</span>
              <span className="text-amber-600 font-medium">coins earned!</span>
            </div>
            <div className="text-xs text-amber-700 space-y-1">
              {coinsEarned.breakdown.dailyPlay > 0 && (
                <div className="flex justify-between">
                  <span>Daily play</span>
                  <span>+{coinsEarned.breakdown.dailyPlay}</span>
                </div>
              )}
              {coinsEarned.breakdown.correctAnswers > 0 && (
                <div className="flex justify-between">
                  <span>Correct answers</span>
                  <span>+{coinsEarned.breakdown.correctAnswers}</span>
                </div>
              )}
              {coinsEarned.breakdown.speedBonus > 0 && (
                <div className="flex justify-between">
                  <span>Speed bonus</span>
                  <span>+{coinsEarned.breakdown.speedBonus}</span>
                </div>
              )}
              {coinsEarned.breakdown.perfectBonus > 0 && (
                <div className="flex justify-between font-medium">
                  <span>Perfect score!</span>
                  <span>+{coinsEarned.breakdown.perfectBonus}</span>
                </div>
              )}
              {coinsEarned.breakdown.streakBonus > 0 && (
                <div className="flex justify-between font-medium">
                  <span>{isMilestone ? `🎉 ${streak}-day milestone!` : 'Streak bonus'}</span>
                  <span>+{coinsEarned.breakdown.streakBonus}</span>
                </div>
              )}
              {coinsEarned.breakdown.firstPlayBonus > 0 && (
                <div className="flex justify-between font-medium">
                  <span>🎁 Welcome bonus!</span>
                  <span>+{coinsEarned.breakdown.firstPlayBonus}</span>
                </div>
              )}
            </div>
            <div className="mt-3 pt-3 border-t border-amber-200 flex items-center justify-between">
              <span className="text-sm text-amber-700">Total balance:</span>
              <span className="font-bold text-amber-600">{coinBalance.toLocaleString()} 🪙</span>
            </div>
            <Link
              href="/truthle/shop"
              className="mt-3 block w-full bg-amber-500 hover:bg-amber-600 text-white font-medium py-2 rounded-lg transition-colors text-center"
            >
              Visit Shop
            </Link>
          </div>
        )}

        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-sm text-left w-full max-w-xs">
          <div className="flex justify-between mb-1">
            <span className="text-gray-600">Base score</span>
            <span className="font-medium">{score.baseScore}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span className="text-gray-600">Speed bonus</span>
            <span className="font-medium text-blue-600">+{score.speedBonus}</span>
          </div>
          {score.streakBonus > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Streak bonus</span>
              <span className="font-medium text-orange-500">+{score.streakBonus}</span>
            </div>
          )}
        </div>

        {showBadgeUnlock && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-full shadow-lg animate-bounce z-50">
            <span className="text-xl mr-2">🦋</span>
            <span className="font-semibold">Badge Unlocked: {showBadgeUnlock}!</span>
          </div>
        )}

        <div className="text-gray-500 text-sm">
          <p>Next Truthle in</p>
          <p className="text-2xl font-mono font-bold text-gray-700">{countdown}</p>
        </div>

        <div className="mt-6">
          <AdSidebar slotId={AD_SLOTS.truthleResults} size="square" />
        </div>
      </div>
    )
  }

  return null
}

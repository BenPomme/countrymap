import { calculateCoinsEarned, type CoinBreakdown } from './coins'
import { getCompletionStreak } from './dailyLifecycle'
import type { TruthleLocalState } from './localState'

const EMPTY_BREAKDOWN: CoinBreakdown = {
  dailyPlay: 0,
  correctAnswers: 0,
  speedBonus: 0,
  perfectBonus: 0,
  streakBonus: 0,
  firstPlayBonus: 0,
  shareBonus: 0,
}

export interface DailyCompletionResult {
  state: TruthleLocalState
  streak: number
  isFirstCompletion: boolean
  coinsAwarded: number
  coinBreakdown: CoinBreakdown
}

export function completeDailyAttempt(
  state: TruthleLocalState,
  score: number,
  results: boolean[],
  times: number[],
  day: string
): DailyCompletionResult {
  const isFirstCompletion = state.lastPlayedDate !== day || state.todayScore === null
  const streak = getCompletionStreak({
    lastPlayedDate: state.lastPlayedDate,
    currentStreak: state.streak,
  }, day)

  if (!isFirstCompletion) {
    return {
      state,
      streak,
      isFirstCompletion: false,
      coinsAwarded: 0,
      coinBreakdown: { ...EMPTY_BREAKDOWN },
    }
  }

  const correctCount = results.filter(Boolean).length
  const fastAnswers = times.filter((time) => time < 3).length
  const isPerfect = results.length > 0 && results.every(Boolean)
  const isFirstPlay = state.gamesPlayed === 0
  const coins = calculateCoinsEarned(
    correctCount,
    fastAnswers,
    streak,
    isPerfect,
    isFirstPlay,
    false
  )

  return {
    state: {
      ...state,
      lastPlayedDate: day,
      todayScore: score,
      todayResults: [...results],
      todayTimes: [...times],
      streak,
      bestStreak: Math.max(state.bestStreak, streak),
      gamesPlayed: state.gamesPlayed + 1,
      totalCorrect: state.totalCorrect + correctCount,
      coins: state.coins + coins.total,
      totalCoinsEarned: state.totalCoinsEarned + coins.total,
    },
    streak,
    isFirstCompletion: true,
    coinsAwarded: coins.total,
    coinBreakdown: { ...coins.breakdown },
  }
}

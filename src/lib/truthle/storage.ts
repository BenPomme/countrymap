import { db, ensureAnonymousAuth } from '@/lib/firebase/config'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { getTodayDateString } from './generator'

export interface TruthleAttempt {
  score: number
  results: boolean[]
  times: number[]
  streak: number
  timestamp: unknown
}

export interface TruthleLocalState {
  lastPlayedDate: string | null
  todayScore: number | null
  todayResults: boolean[] | null
  todayTimes: number[] | null
  streak: number
  bestStreak: number
  gamesPlayed: number
  totalCorrect: number
}

const LOCAL_STORAGE_KEY = 'truthle_state'

// Get local state from localStorage
export function getLocalState(): TruthleLocalState {
  if (typeof window === 'undefined') {
    return {
      lastPlayedDate: null,
      todayScore: null,
      todayResults: null,
      todayTimes: null,
      streak: 0,
      bestStreak: 0,
      gamesPlayed: 0,
      totalCorrect: 0,
    }
  }

  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) {
    console.error('Error reading local state:', e)
  }

  return {
    lastPlayedDate: null,
    todayScore: null,
    todayResults: null,
    todayTimes: null,
    streak: 0,
    bestStreak: 0,
    gamesPlayed: 0,
    totalCorrect: 0,
  }
}

// Save local state to localStorage
export function saveLocalState(state: TruthleLocalState): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state))
  } catch (e) {
    console.error('Error saving local state:', e)
  }
}

// Check if user has played today (local check first, then Firebase)
export async function hasPlayedToday(): Promise<{ played: boolean; attempt?: TruthleAttempt }> {
  const today = getTodayDateString()

  // Check local first
  const localState = getLocalState()
  if (localState.lastPlayedDate === today && localState.todayScore !== null) {
    return {
      played: true,
      attempt: {
        score: localState.todayScore,
        results: localState.todayResults || [],
        times: localState.todayTimes || [],
        streak: localState.streak,
        timestamp: null,
      }
    }
  }

  // Check Firebase
  try {
    const user = await ensureAnonymousAuth()
    const attemptRef = doc(db, 'truthle', 'daily', today, user.uid)
    const attemptSnap = await getDoc(attemptRef)

    if (attemptSnap.exists()) {
      const data = attemptSnap.data() as TruthleAttempt

      // Sync to local storage
      const newLocalState: TruthleLocalState = {
        ...localState,
        lastPlayedDate: today,
        todayScore: data.score,
        todayResults: data.results,
        todayTimes: data.times,
        streak: data.streak,
      }
      saveLocalState(newLocalState)

      return { played: true, attempt: data }
    }
  } catch (e) {
    console.error('Error checking Firebase:', e)
    // Fall back to local-only if Firebase fails
  }

  return { played: false }
}

// Calculate current streak
function calculateStreak(lastPlayedDate: string | null, currentStreak: number): number {
  if (!lastPlayedDate) return 1

  const today = new Date(getTodayDateString())
  const lastPlayed = new Date(lastPlayedDate)
  const diffDays = Math.floor((today.getTime() - lastPlayed.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 1) {
    // Played yesterday, continue streak
    return currentStreak + 1
  } else if (diffDays === 0) {
    // Already played today (shouldn't happen)
    return currentStreak
  } else {
    // Streak broken
    return 1
  }
}

// Save today's attempt
export async function saveAttempt(
  score: number,
  results: boolean[],
  times: number[]
): Promise<{ success: boolean; streak: number }> {
  const today = getTodayDateString()
  const localState = getLocalState()

  // Calculate streak
  const streak = calculateStreak(localState.lastPlayedDate, localState.streak)
  const correctCount = results.filter(r => r).length

  // Update local state
  const newLocalState: TruthleLocalState = {
    lastPlayedDate: today,
    todayScore: score,
    todayResults: results,
    todayTimes: times,
    streak,
    bestStreak: Math.max(localState.bestStreak, streak),
    gamesPlayed: localState.gamesPlayed + 1,
    totalCorrect: localState.totalCorrect + correctCount,
  }
  saveLocalState(newLocalState)

  // Save to Firebase
  try {
    const user = await ensureAnonymousAuth()
    const attemptRef = doc(db, 'truthle', 'daily', today, user.uid)

    await setDoc(attemptRef, {
      score,
      results,
      times,
      streak,
      timestamp: serverTimestamp(),
    })

    return { success: true, streak }
  } catch (e) {
    console.error('Error saving to Firebase:', e)
    // Still return success since we saved locally
    return { success: true, streak }
  }
}

// Get stats for display
export function getStats(): {
  gamesPlayed: number
  currentStreak: number
  bestStreak: number
  averageScore: number
  averageCorrect: number
} {
  const localState = getLocalState()

  return {
    gamesPlayed: localState.gamesPlayed,
    currentStreak: localState.streak,
    bestStreak: localState.bestStreak,
    averageScore: localState.gamesPlayed > 0
      ? Math.round(localState.totalCorrect / localState.gamesPlayed * 100)
      : 0,
    averageCorrect: localState.gamesPlayed > 0
      ? Math.round(localState.totalCorrect / localState.gamesPlayed * 10) / 10
      : 0,
  }
}

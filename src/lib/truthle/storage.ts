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
  // Coins & Rewards
  coins: number
  totalCoinsEarned: number
  ownedItems: string[]  // IDs of owned rewards
  equippedTheme: string | null
  equippedBadge: string | null
  equippedFrame: string | null
  equippedTitle: string | null
  // Powerup inventory
  streakFreezes: number
  hints: number
  fiftyFifties: number
  timeExtenders: number
  doubleCoinsActive: boolean
  // Achievement tracking
  perfectGames: number
  fastAnswersTotal: number
  unlockedAchievements: string[]
  // Email signup
  emailSignupBonusClaimed: boolean
  // Share tracking
  totalShares: number
  lastShareDate: string | null
}

const LOCAL_STORAGE_KEY = 'truthle_state'

// Default state factory
function getDefaultState(): TruthleLocalState {
  return {
    lastPlayedDate: null,
    todayScore: null,
    todayResults: null,
    todayTimes: null,
    streak: 0,
    bestStreak: 0,
    gamesPlayed: 0,
    totalCorrect: 0,
    // Coins & Rewards
    coins: 0,
    totalCoinsEarned: 0,
    ownedItems: [],
    equippedTheme: null,
    equippedBadge: null,
    equippedFrame: null,
    equippedTitle: null,
    // Powerup inventory
    streakFreezes: 0,
    hints: 0,
    fiftyFifties: 0,
    timeExtenders: 0,
    doubleCoinsActive: false,
    // Achievement tracking
    perfectGames: 0,
    fastAnswersTotal: 0,
    unlockedAchievements: [],
    // Email signup
    emailSignupBonusClaimed: false,
    // Share tracking
    totalShares: 0,
    lastShareDate: null,
  }
}

// Get local state from localStorage
export function getLocalState(): TruthleLocalState {
  if (typeof window === 'undefined') {
    return getDefaultState()
  }

  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (stored) {
      // Merge with defaults to handle missing fields from older versions
      const parsed = JSON.parse(stored)
      return { ...getDefaultState(), ...parsed }
    }
  } catch (e) {
    console.error('Error reading local state:', e)
  }

  return getDefaultState()
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

  // Update local state (spread existing state to preserve coins & rewards)
  const newLocalState: TruthleLocalState = {
    ...localState,
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

// ============================================
// COIN & REWARDS MANAGEMENT
// ============================================

// Get current coin balance
export function getCoins(): number {
  return getLocalState().coins
}

// Add coins (from gameplay, rewards, etc.)
export function addCoins(amount: number): number {
  const state = getLocalState()
  const newCoins = state.coins + amount
  saveLocalState({
    ...state,
    coins: newCoins,
    totalCoinsEarned: state.totalCoinsEarned + amount,
  })
  return newCoins
}

// Spend coins (for purchases)
export function spendCoins(amount: number): boolean {
  const state = getLocalState()
  if (state.coins < amount) {
    return false
  }
  saveLocalState({
    ...state,
    coins: state.coins - amount,
  })
  return true
}

// Check if user owns a reward
export function ownsItem(itemId: string): boolean {
  return getLocalState().ownedItems.includes(itemId)
}

// Add owned item
export function addOwnedItem(itemId: string): void {
  const state = getLocalState()
  if (!state.ownedItems.includes(itemId)) {
    saveLocalState({
      ...state,
      ownedItems: [...state.ownedItems, itemId],
    })
  }
}

// Purchase a reward
export function purchaseReward(itemId: string, price: number): { success: boolean; error?: string } {
  const state = getLocalState()

  // Check if already owned
  if (state.ownedItems.includes(itemId)) {
    return { success: false, error: 'Already owned' }
  }

  // Check balance
  if (state.coins < price) {
    return { success: false, error: 'Not enough coins' }
  }

  // Make purchase
  saveLocalState({
    ...state,
    coins: state.coins - price,
    ownedItems: [...state.ownedItems, itemId],
  })

  return { success: true }
}

// Equip a theme/badge/frame/title
export function equipItem(itemId: string, slot: 'theme' | 'badge' | 'frame' | 'title'): boolean {
  const state = getLocalState()

  // Check if owned (allow null to unequip)
  if (itemId && !state.ownedItems.includes(itemId)) {
    return false
  }

  const updates: Partial<TruthleLocalState> = {}
  switch (slot) {
    case 'theme':
      updates.equippedTheme = itemId || null
      break
    case 'badge':
      updates.equippedBadge = itemId || null
      break
    case 'frame':
      updates.equippedFrame = itemId || null
      break
    case 'title':
      updates.equippedTitle = itemId || null
      break
  }

  saveLocalState({ ...state, ...updates })
  return true
}

// Get equipped items
export function getEquippedItems(): {
  theme: string | null
  badge: string | null
  frame: string | null
  title: string | null
} {
  const state = getLocalState()
  return {
    theme: state.equippedTheme,
    badge: state.equippedBadge,
    frame: state.equippedFrame,
    title: state.equippedTitle,
  }
}

// ============================================
// POWERUP MANAGEMENT
// ============================================

// Add powerups to inventory
export function addPowerup(type: 'streakFreeze' | 'hint' | 'fiftyFifty' | 'timeExtender' | 'doubleCoins', count: number = 1): void {
  const state = getLocalState()
  const updates: Partial<TruthleLocalState> = {}

  switch (type) {
    case 'streakFreeze':
      updates.streakFreezes = state.streakFreezes + count
      break
    case 'hint':
      updates.hints = state.hints + count
      break
    case 'fiftyFifty':
      updates.fiftyFifties = state.fiftyFifties + count
      break
    case 'timeExtender':
      updates.timeExtenders = state.timeExtenders + count
      break
    case 'doubleCoins':
      updates.doubleCoinsActive = true
      break
  }

  saveLocalState({ ...state, ...updates })
}

// Use a powerup
export function usePowerup(type: 'streakFreeze' | 'hint' | 'fiftyFifty' | 'timeExtender' | 'doubleCoins'): boolean {
  const state = getLocalState()

  switch (type) {
    case 'streakFreeze':
      if (state.streakFreezes <= 0) return false
      saveLocalState({ ...state, streakFreezes: state.streakFreezes - 1 })
      return true
    case 'hint':
      if (state.hints <= 0) return false
      saveLocalState({ ...state, hints: state.hints - 1 })
      return true
    case 'fiftyFifty':
      if (state.fiftyFifties <= 0) return false
      saveLocalState({ ...state, fiftyFifties: state.fiftyFifties - 1 })
      return true
    case 'timeExtender':
      if (state.timeExtenders <= 0) return false
      saveLocalState({ ...state, timeExtenders: state.timeExtenders - 1 })
      return true
    case 'doubleCoins':
      if (!state.doubleCoinsActive) return false
      saveLocalState({ ...state, doubleCoinsActive: false })
      return true
  }
}

// Get powerup inventory
export function getPowerups(): {
  streakFreezes: number
  hints: number
  fiftyFifties: number
  timeExtenders: number
  doubleCoinsActive: boolean
} {
  const state = getLocalState()
  return {
    streakFreezes: state.streakFreezes,
    hints: state.hints,
    fiftyFifties: state.fiftyFifties,
    timeExtenders: state.timeExtenders,
    doubleCoinsActive: state.doubleCoinsActive,
  }
}

// ============================================
// ACHIEVEMENT TRACKING
// ============================================

// Update achievement stats after a game
export function updateAchievementStats(isPerfect: boolean, fastAnswers: number): void {
  const state = getLocalState()
  saveLocalState({
    ...state,
    perfectGames: state.perfectGames + (isPerfect ? 1 : 0),
    fastAnswersTotal: state.fastAnswersTotal + fastAnswers,
  })
}

// Get achievement stats
export function getAchievementStats(): {
  perfectGames: number
  fastAnswersTotal: number
  totalCoinsEarned: number
  ownedItemsCount: number
} {
  const state = getLocalState()
  return {
    perfectGames: state.perfectGames,
    fastAnswersTotal: state.fastAnswersTotal,
    totalCoinsEarned: state.totalCoinsEarned,
    ownedItemsCount: state.ownedItems.length,
  }
}

// ============================================
// EMAIL SIGNUP BONUS
// ============================================

// Check if email signup bonus has been claimed
export function hasClaimedEmailBonus(): boolean {
  return getLocalState().emailSignupBonusClaimed
}

// Claim email signup bonus (100 coins + Verified Player badge)
export function claimEmailSignupBonus(): { success: boolean; coins: number } {
  const state = getLocalState()

  if (state.emailSignupBonusClaimed) {
    return { success: false, coins: 0 }
  }

  const bonusCoins = 100

  saveLocalState({
    ...state,
    emailSignupBonusClaimed: true,
    coins: state.coins + bonusCoins,
    totalCoinsEarned: state.totalCoinsEarned + bonusCoins,
    // Unlock Verified Player badge
    ownedItems: state.ownedItems.includes('badge_verified')
      ? state.ownedItems
      : [...state.ownedItems, 'badge_verified'],
    unlockedAchievements: state.unlockedAchievements.includes('email_verified')
      ? state.unlockedAchievements
      : [...state.unlockedAchievements, 'email_verified'],
  })

  return { success: true, coins: bonusCoins }
}

// ============================================
// SHARE TRACKING
// ============================================

// Record a share action
export function recordShare(): { isFirstShare: boolean; newTotal: number } {
  const state = getLocalState()
  const today = getTodayDateString()
  const isFirstShare = state.totalShares === 0
  const newTotal = state.totalShares + 1

  const updates: Partial<TruthleLocalState> = {
    totalShares: newTotal,
    lastShareDate: today,
  }

  // Award Social Butterfly badge on first share
  if (isFirstShare) {
    updates.ownedItems = state.ownedItems.includes('badge_social_butterfly')
      ? state.ownedItems
      : [...state.ownedItems, 'badge_social_butterfly']
    updates.unlockedAchievements = state.unlockedAchievements.includes('first_share')
      ? state.unlockedAchievements
      : [...state.unlockedAchievements, 'first_share']
  }

  saveLocalState({ ...state, ...updates })

  return { isFirstShare, newTotal }
}

// Get share stats
export function getShareStats(): { totalShares: number; lastShareDate: string | null } {
  const state = getLocalState()
  return {
    totalShares: state.totalShares,
    lastShareDate: state.lastShareDate,
  }
}

// ============================================
// CLOUD SYNC (OFFER WALL EARNINGS)
// ============================================

/**
 * Sync coins from Firestore (earned via offer wall)
 * The cloud function credits coins to Firestore when users complete offers.
 * This function fetches those coins and adds them to local balance.
 */
export async function syncCloudCoins(): Promise<number> {
  try {
    const user = await ensureAnonymousAuth()
    const walletRef = doc(db, 'users', user.uid, 'wallet', 'balance')
    const walletDoc = await getDoc(walletRef)

    if (!walletDoc.exists()) {
      return 0
    }

    const cloudCoins = walletDoc.data()?.coins || 0

    if (cloudCoins > 0) {
      // Add cloud coins to local balance
      const state = getLocalState()
      const newBalance = state.coins + cloudCoins

      // Update local state
      saveLocalState({
        ...state,
        coins: newBalance,
        totalCoinsEarned: state.totalCoinsEarned + cloudCoins,
      })

      // Clear cloud balance (move to local)
      // Note: In production, you might want to keep a ledger instead
      await setDoc(walletRef, { coins: 0, lastSynced: serverTimestamp() }, { merge: true })

      console.log(`Synced ${cloudCoins} coins from cloud`)
      return cloudCoins
    }

    return 0
  } catch (e) {
    console.error('Error syncing cloud coins:', e)
    return 0
  }
}

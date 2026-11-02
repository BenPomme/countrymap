import { db, ensureAnonymousAuth, functionsClient } from '@/lib/firebase/config'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { getCompletionStreak, getDisplayStreak, getUtcDay } from './dailyLifecycle'
import {
  CommerceRequestError,
  createCommerceService,
  type CheckoutStatus,
  type CommerceStorage,
  type CommerceTransport,
} from './commerce'
import {
  getDefaultTruthleState,
  sanitizeTruthleState,
  type TruthleLocalState,
} from './localState'

export type { TruthleLocalState } from './localState'

export interface TruthleAttempt {
  score: number
  results: boolean[]
  times: number[]
  streak: number
  timestamp: unknown
}

export interface TruthleRetryStatus {
  date: string
  granted: boolean
  consumed: boolean
  canConsume: boolean
  paidCredits?: number
  source: 'backend' | 'none'
}

const LOCAL_STORAGE_KEY = 'truthle_state'

// Default state factory
function getDefaultState(): TruthleLocalState {
  return getDefaultTruthleState()
}

// Get local state from localStorage
export function getLocalState(): TruthleLocalState {
  if (typeof window === 'undefined') {
    return getDefaultState()
  }

  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (stored) {
      return sanitizeTruthleState(JSON.parse(stored))
    }
  } catch {
    console.error('Error reading local state')
  }

  return getDefaultState()
}

// Save local state to localStorage
export function saveLocalState(state: TruthleLocalState): void {
  if (typeof window === 'undefined') return

  try {
    const safeState = sanitizeTruthleState(state)
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(safeState))
    // Keep header CoinBalance pills in sync after awards/spends.
    window.dispatchEvent(new CustomEvent('truthle:coins', { detail: safeState.coins }))
  } catch {
    console.error('Error saving local state')
  }
}

// Check if user has played today (local check first, then Firebase)
export async function hasPlayedToday(): Promise<{ played: boolean; attempt?: TruthleAttempt }> {
  const today = getUtcDay()

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
  } catch {
    console.error('Error checking Firebase')
    // Fall back to local-only if Firebase fails
  }

  return { played: false }
}

// Save today's attempt
export async function saveAttempt(
  score: number,
  results: boolean[],
  times: number[]
): Promise<{ success: boolean; streak: number; isFirstCompletion: boolean }> {
  const today = getUtcDay()
  const localState = getLocalState()
  const isFirstCompletion = localState.lastPlayedDate !== today || localState.todayScore === null

  if (!isFirstCompletion) {
    return {
      success: true,
      streak: getCompletionStreak({
        lastPlayedDate: localState.lastPlayedDate,
        currentStreak: localState.streak,
      }, today),
      isFirstCompletion: false,
    }
  }

  // Calculate streak
  const streak = getCompletionStreak({
    lastPlayedDate: localState.lastPlayedDate,
    currentStreak: localState.streak,
  }, today)
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

    return { success: true, streak, isFirstCompletion: true }
  } catch {
    console.error('Error saving to Firebase')
    // Still return success since we saved locally
    return { success: true, streak, isFirstCompletion: true }
  }
}

// Save retry attempt (keeps primary daily attempt immutable)
export async function saveRetryAttempt(
  score: number,
  results: boolean[],
  times: number[],
  streak: number
): Promise<{ success: boolean }> {
  const today = getUtcDay()

  try {
    const user = await ensureAnonymousAuth()
    const retryRef = doc(db, 'users', user.uid, 'truthle_retries', today)

    await setDoc(retryRef, {
      score,
      results,
      times,
      streak,
      timestamp: serverTimestamp(),
    })

    return { success: true }
  } catch {
    console.error('Error saving retry attempt')
    return { success: false }
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
    currentStreak: getDisplayStreak({
      lastPlayedDate: localState.lastPlayedDate,
      currentStreak: localState.streak,
    }),
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
  const today = getUtcDay()
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
// RETRY ENTITLEMENTS (IAP + REWARDED ADS)
// ============================================

export async function getCloudRetryStatus(): Promise<TruthleRetryStatus> {
  try {
    await ensureAnonymousAuth()
    const callable = httpsCallable<unknown, TruthleRetryStatus>(functionsClient, 'getTruthleRetryStatus')
    const response = await callable({})
    return response.data
  } catch {
    console.error('Error getting retry status')
    return {
      date: getUtcDay(),
      granted: false,
      consumed: false,
      canConsume: false,
      source: 'none',
    }
  }
}

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`${label} timed out. Please try again.`)), ms)
    p.then((v) => { clearTimeout(t); resolve(v) }, (e) => { clearTimeout(t); reject(e) })
  })
}

const commerceStorage: CommerceStorage = {
  getItem(key) {
    if (typeof window === 'undefined') return null
    try { return localStorage.getItem(key) } catch { return null }
  },
  setItem(key, value) {
    if (typeof window === 'undefined') return
    try { localStorage.setItem(key, value) } catch { /* Best effort persistence. */ }
  },
  removeItem(key) {
    if (typeof window === 'undefined') return
    try { localStorage.removeItem(key) } catch { /* Best effort persistence. */ }
  },
}

const DEFINITIVE_FIREBASE_CODES = [
  'invalid-argument',
  'failed-precondition',
  'not-found',
  'permission-denied',
  'unauthenticated',
  'already-exists',
  'out-of-range',
]

function callableError(error: unknown): CommerceRequestError {
  const code = typeof (error as { code?: unknown })?.code === 'string'
    ? (error as { code: string }).code
    : ''
  const definitive = DEFINITIVE_FIREBASE_CODES.some((suffix) => code.endsWith(suffix))
  return new CommerceRequestError('Commerce request failed', definitive)
}

async function callCommerce<TRequest, TResponse>(
  name: string,
  request: TRequest,
  label: string
): Promise<TResponse> {
  const callable = httpsCallable<TRequest, TResponse>(functionsClient, name, { timeout: 20000 })
  try {
    const response = await withTimeout(callable(request), 22000, label)
    return response.data
  } catch (error) {
    throw callableError(error)
  }
}

const firebaseCommerceTransport: CommerceTransport = {
  async authenticate() {
    try {
      await withTimeout(ensureAnonymousAuth(), 10000, 'Sign-in')
    } catch {
      throw new CommerceRequestError('Sign-in unavailable', false)
    }
  },
  createRetryCheckout(request) {
    return callCommerce('createTruthleRetryCheckout', request, 'Checkout')
  },
  getCheckoutStatus(request) {
    return callCommerce('getTruthleCheckoutStatus', request, 'Checkout status')
  },
  consumeRetry(request) {
    return callCommerce('consumeTruthleRetry', request, 'Extra attempt')
  },
  claimWallet(request) {
    return callCommerce('claimTruthleWallet', request, 'Wallet claim')
  },
  redeemReward(request) {
    return callCommerce('redeemCoins', request, 'Reward redemption')
  },
}

const commerceService = createCommerceService({
  storage: commerceStorage,
  transport: firebaseCommerceTransport,
  applyWalletClaim: ({ coins }) => {
    if (coins > 0) addCoins(coins)
  },
})

export interface TruthleCheckoutStatus {
  status: CheckoutStatus
  credits: number
  error?: string
}

export async function getTruthleCheckoutStatus({ sessionId }: { sessionId: string }): Promise<TruthleCheckoutStatus> {
  try {
    return await commerceService.getCheckoutStatus(sessionId)
  } catch {
    return { status: 'failed', credits: 0, error: 'Checkout status unavailable' }
  }
}

export async function consumeCloudRetry(): Promise<{ success: boolean; remainingRetries: number }> {
  try {
    return await commerceService.consumeRetry()
  } catch {
    console.error('Error consuming retry entitlement')
    return { success: false, remainingRetries: 0 }
  }
}

export async function createRetryCheckout(
  quantity = 1,
  returnTo: 'truthle' | 'true-false' = 'truthle',
  options: { shareCode?: string } = {}
): Promise<{ url: string | null; id?: string; error?: string }> {
  try {
    const result = await commerceService.createRetryCheckout(quantity, returnTo, options.shareCode)
    return { url: result.url, id: result.id }
  } catch {
    console.error('Error creating checkout')
    return { url: null, error: 'Checkout unavailable' }
  }
}

// ============================================
// CLOUD SYNC (OFFER WALL EARNINGS)
// ============================================

/**
 * Claims offer-wall coins through the server. The same durable request ID is
 * reused after a lost response and the local claim receipt prevents duplicate adds.
 */
export async function syncCloudCoins(): Promise<number> {
  const claim = await commerceService.claimWallet()
  return claim.applied ? claim.coins : 0
}

export async function claimTruthleWallet({ requestId }: { requestId: string }): Promise<{
  claimId: string
  coins: number
  applied: boolean
}> {
  return commerceService.claimWallet(requestId)
}

export async function redeemCloudReward({ rewardId }: { rewardId: string }): Promise<{
  redemptionId: string
  newBalance: number
}> {
  return commerceService.redeemReward(rewardId)
}

// ============================================
// SHARE → FRIEND PROMO CODE (free Extra Attempt)
// ============================================

export interface SharePromo { code: string; expiresAt: string }

function sharePromoKey(): string {
  return `wt_share_promo_v1_${getUtcDay()}`
}

export function getStoredSharePromo(): SharePromo | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(sharePromoKey())
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<SharePromo>
    return typeof parsed.code === 'string' && parsed.code.length > 0 && typeof parsed.expiresAt === 'string'
      ? { code: parsed.code, expiresAt: parsed.expiresAt }
      : null
  } catch { return null }
}

let mintInFlight: Promise<SharePromo | null> | null = null
// Explicit share action only. Server enforces one code per authenticated user per UTC day.
export function mintSharePromo(): Promise<SharePromo | null> {
  const cached = getStoredSharePromo()
  if (cached) return Promise.resolve(cached)
  if (mintInFlight) return mintInFlight
  mintInFlight = (async () => {
    try {
      await withTimeout(ensureAnonymousAuth(), 10000, 'Sign-in')
      let deviceKey = localStorage.getItem('wt_device_key')
      if (!deviceKey) { deviceKey = Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem('wt_device_key', deviceKey) }
      const callable = httpsCallable<{ deviceKey: string }, SharePromo>(functionsClient, 'mintTruthleSharePromo', { timeout: 20000 })
      const res = await withTimeout(callable({ deviceKey }), 22000, 'Promo')
      if (!res.data?.code) return null
      localStorage.setItem(sharePromoKey(), JSON.stringify(res.data))
      return res.data
    } catch {
      console.error('Error minting share promo')
      return null
    } finally { mintInFlight = null }
  })()
  return mintInFlight
}

export function createTruthleSharePromo(): Promise<SharePromo | null> {
  return mintSharePromo()
}

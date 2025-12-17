/**
 * Truthle Coins System
 * Virtual currency earned through gameplay, redeemable for virtual rewards only
 */

// Coin earning rates
export const COIN_REWARDS = {
  // Gameplay rewards
  dailyPlay: 10,           // Just for playing
  perfectScore: 50,        // All 10 correct
  correctAnswer: 5,        // Per correct answer
  speedBonus: 2,           // Per fast answer (<3s)

  // Streak rewards
  streak3: 25,             // 3-day streak
  streak7: 75,             // Weekly streak
  streak14: 200,           // 2-week streak
  streak30: 500,           // Monthly streak
  streak100: 2000,         // 100-day streak (legendary)

  // Special rewards
  firstPlay: 100,          // Welcome bonus
  shareResult: 15,         // Sharing to social
  referral: 200,           // When referred friend plays first game
  emailSignup: 100,        // Email signup/link bonus

  // Offer wall rewards (estimated, actual values come from provider)
  watchAd: 5,              // Rewarded video ad
  completeSurvey: 50,      // Survey completion (varies)
  downloadApp: 100,        // App install offer (varies)
}

// Calculate coins earned from a game session
export function calculateCoinsEarned(
  correctCount: number,
  fastAnswers: number,  // answers under 3 seconds
  streak: number,
  isPerfect: boolean,
  isFirstPlay: boolean,
  didShare: boolean
): { total: number; breakdown: CoinBreakdown } {
  const breakdown: CoinBreakdown = {
    dailyPlay: COIN_REWARDS.dailyPlay,
    correctAnswers: correctCount * COIN_REWARDS.correctAnswer,
    speedBonus: fastAnswers * COIN_REWARDS.speedBonus,
    perfectBonus: isPerfect ? COIN_REWARDS.perfectScore : 0,
    streakBonus: getStreakBonus(streak),
    firstPlayBonus: isFirstPlay ? COIN_REWARDS.firstPlay : 0,
    shareBonus: didShare ? COIN_REWARDS.shareResult : 0,
  }

  const total = Object.values(breakdown).reduce((sum, val) => sum + val, 0)

  return { total, breakdown }
}

// Get streak milestone bonus
function getStreakBonus(streak: number): number {
  if (streak >= 100) return COIN_REWARDS.streak100
  if (streak >= 30) return COIN_REWARDS.streak30
  if (streak >= 14) return COIN_REWARDS.streak14
  if (streak >= 7) return COIN_REWARDS.streak7
  if (streak >= 3) return COIN_REWARDS.streak3
  return 0
}

// Check if streak is a milestone
export function isStreakMilestone(streak: number): boolean {
  return [3, 7, 14, 30, 100].includes(streak)
}

// Get next streak milestone
export function getNextStreakMilestone(streak: number): { days: number; reward: number } | null {
  const milestones = [
    { days: 3, reward: COIN_REWARDS.streak3 },
    { days: 7, reward: COIN_REWARDS.streak7 },
    { days: 14, reward: COIN_REWARDS.streak14 },
    { days: 30, reward: COIN_REWARDS.streak30 },
    { days: 100, reward: COIN_REWARDS.streak100 },
  ]

  return milestones.find(m => m.days > streak) || null
}

export interface CoinBreakdown {
  dailyPlay: number
  correctAnswers: number
  speedBonus: number
  perfectBonus: number
  streakBonus: number
  firstPlayBonus: number
  shareBonus: number
}

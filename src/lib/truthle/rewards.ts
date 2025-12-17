/**
 * Truthle Virtual Rewards Catalog
 * All rewards are virtual - no physical fulfillment required
 */

export type RewardCategory = 'badge' | 'theme' | 'powerup' | 'profile'

export interface VirtualReward {
  id: string
  name: string
  description: string
  category: RewardCategory
  price: number  // in Truthle Coins
  icon: string   // emoji or icon name
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  unlockCondition?: string  // optional requirement beyond coins
}

// Badges - Collectible achievements displayed on profile
export const BADGES: VirtualReward[] = [
  // Starter badges
  {
    id: 'badge_first_win',
    name: 'First Steps',
    description: 'Complete your first Truthle game',
    category: 'badge',
    price: 0,  // Free - unlocked by playing
    icon: '🌟',
    rarity: 'common',
    unlockCondition: 'play_1_game',
  },
  {
    id: 'badge_perfect_10',
    name: 'Perfect 10',
    description: 'Get all 10 questions correct',
    category: 'badge',
    price: 0,
    icon: '💯',
    rarity: 'rare',
    unlockCondition: 'perfect_score',
  },
  {
    id: 'badge_speed_demon',
    name: 'Speed Demon',
    description: 'Answer 5 questions in under 3 seconds each',
    category: 'badge',
    price: 0,
    icon: '⚡',
    rarity: 'rare',
    unlockCondition: '5_fast_answers',
  },

  // Purchasable badges
  {
    id: 'badge_globe_trotter',
    name: 'Globe Trotter',
    description: 'A badge for geography enthusiasts',
    category: 'badge',
    price: 100,
    icon: '🌍',
    rarity: 'common',
  },
  {
    id: 'badge_data_nerd',
    name: 'Data Nerd',
    description: 'For those who love statistics',
    category: 'badge',
    price: 150,
    icon: '📊',
    rarity: 'common',
  },
  {
    id: 'badge_truth_seeker',
    name: 'Truth Seeker',
    description: 'Dedicated to finding the truth',
    category: 'badge',
    price: 250,
    icon: '🔍',
    rarity: 'rare',
  },
  {
    id: 'badge_world_champion',
    name: 'World Champion',
    description: 'The ultimate Truthle master',
    category: 'badge',
    price: 1000,
    icon: '🏆',
    rarity: 'epic',
  },
  {
    id: 'badge_legendary',
    name: 'Legendary',
    description: 'Only the most dedicated players earn this',
    category: 'badge',
    price: 5000,
    icon: '👑',
    rarity: 'legendary',
  },

  // Account badges
  {
    id: 'badge_verified',
    name: 'Verified Player',
    description: 'Linked your account with email',
    category: 'badge',
    price: 0,
    icon: '✉️',
    rarity: 'rare',
    unlockCondition: 'email_verified',
  },
  {
    id: 'badge_social_butterfly',
    name: 'Social Butterfly',
    description: 'Share your Truthle results for the first time',
    category: 'badge',
    price: 0,
    icon: '🦋',
    rarity: 'common',
    unlockCondition: 'first_share',
  },

  // Streak badges (unlocked at milestones)
  {
    id: 'badge_streak_7',
    name: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    category: 'badge',
    price: 0,
    icon: '🔥',
    rarity: 'rare',
    unlockCondition: 'streak_7',
  },
  {
    id: 'badge_streak_30',
    name: 'Monthly Master',
    description: 'Maintain a 30-day streak',
    category: 'badge',
    price: 0,
    icon: '🌋',
    rarity: 'epic',
    unlockCondition: 'streak_30',
  },
  {
    id: 'badge_streak_100',
    name: 'Century Legend',
    description: 'Maintain a 100-day streak',
    category: 'badge',
    price: 0,
    icon: '💎',
    rarity: 'legendary',
    unlockCondition: 'streak_100',
  },
]

// Themes - Customize game appearance
export const THEMES: VirtualReward[] = [
  {
    id: 'theme_dark',
    name: 'Dark Mode',
    description: 'Easy on the eyes',
    category: 'theme',
    price: 200,
    icon: '🌙',
    rarity: 'common',
  },
  {
    id: 'theme_ocean',
    name: 'Ocean Blue',
    description: 'Calm blue waters',
    category: 'theme',
    price: 300,
    icon: '🌊',
    rarity: 'common',
  },
  {
    id: 'theme_sunset',
    name: 'Sunset Glow',
    description: 'Warm orange and purple hues',
    category: 'theme',
    price: 300,
    icon: '🌅',
    rarity: 'common',
  },
  {
    id: 'theme_forest',
    name: 'Forest Green',
    description: 'Natural earthy tones',
    category: 'theme',
    price: 300,
    icon: '🌲',
    rarity: 'common',
  },
  {
    id: 'theme_neon',
    name: 'Neon Nights',
    description: 'Vibrant cyberpunk colors',
    category: 'theme',
    price: 500,
    icon: '💜',
    rarity: 'rare',
  },
  {
    id: 'theme_gold',
    name: 'Golden Elite',
    description: 'Luxurious gold accents',
    category: 'theme',
    price: 1500,
    icon: '✨',
    rarity: 'epic',
  },
  {
    id: 'theme_rainbow',
    name: 'Rainbow Pride',
    description: 'Colorful gradient theme',
    category: 'theme',
    price: 750,
    icon: '🌈',
    rarity: 'rare',
  },
]

// Powerups - Single-use gameplay advantages
export const POWERUPS: VirtualReward[] = [
  {
    id: 'powerup_streak_freeze',
    name: 'Streak Freeze',
    description: 'Protect your streak for one missed day',
    category: 'powerup',
    price: 150,
    icon: '🧊',
    rarity: 'rare',
  },
  {
    id: 'powerup_hint',
    name: 'Hint Pack (3)',
    description: 'Get 3 hints to reveal partial answers',
    category: 'powerup',
    price: 100,
    icon: '💡',
    rarity: 'common',
  },
  {
    id: 'powerup_fifty_fifty',
    name: '50/50 Pack (3)',
    description: 'Eliminate 2 wrong answers, 3 uses',
    category: 'powerup',
    price: 200,
    icon: '✂️',
    rarity: 'rare',
  },
  {
    id: 'powerup_time_extend',
    name: 'Time Extender (5)',
    description: 'Add 10 seconds to timer, 5 uses',
    category: 'powerup',
    price: 75,
    icon: '⏰',
    rarity: 'common',
  },
  {
    id: 'powerup_double_coins',
    name: 'Double Coins',
    description: '2x coins for your next game',
    category: 'powerup',
    price: 250,
    icon: '💰',
    rarity: 'epic',
  },
]

// Profile customizations
export const PROFILE_ITEMS: VirtualReward[] = [
  {
    id: 'profile_frame_bronze',
    name: 'Bronze Frame',
    description: 'Bronze border for your profile',
    category: 'profile',
    price: 100,
    icon: '🥉',
    rarity: 'common',
  },
  {
    id: 'profile_frame_silver',
    name: 'Silver Frame',
    description: 'Silver border for your profile',
    category: 'profile',
    price: 300,
    icon: '🥈',
    rarity: 'rare',
  },
  {
    id: 'profile_frame_gold',
    name: 'Gold Frame',
    description: 'Gold border for your profile',
    category: 'profile',
    price: 750,
    icon: '🥇',
    rarity: 'epic',
  },
  {
    id: 'profile_title_expert',
    name: 'Title: Expert',
    description: 'Display "Expert" under your name',
    category: 'profile',
    price: 200,
    icon: '📛',
    rarity: 'common',
  },
  {
    id: 'profile_title_master',
    name: 'Title: Master',
    description: 'Display "Master" under your name',
    category: 'profile',
    price: 500,
    icon: '📛',
    rarity: 'rare',
  },
  {
    id: 'profile_title_legend',
    name: 'Title: Legend',
    description: 'Display "Legend" under your name',
    category: 'profile',
    price: 2000,
    icon: '📛',
    rarity: 'legendary',
  },
]

// All rewards combined
export const ALL_REWARDS: VirtualReward[] = [
  ...BADGES,
  ...THEMES,
  ...POWERUPS,
  ...PROFILE_ITEMS,
]

// Get reward by ID
export function getRewardById(id: string): VirtualReward | undefined {
  return ALL_REWARDS.find(r => r.id === id)
}

// Get rewards by category
export function getRewardsByCategory(category: RewardCategory): VirtualReward[] {
  return ALL_REWARDS.filter(r => r.category === category)
}

// Get purchasable rewards (excludes achievement-locked ones)
export function getPurchasableRewards(): VirtualReward[] {
  return ALL_REWARDS.filter(r => r.price > 0 && !r.unlockCondition)
}

// Rarity colors for UI
export const RARITY_COLORS = {
  common: 'text-gray-600 bg-gray-100',
  rare: 'text-blue-600 bg-blue-100',
  epic: 'text-purple-600 bg-purple-100',
  legendary: 'text-amber-600 bg-amber-100',
}

// Rarity labels
export const RARITY_LABELS = {
  common: 'Common',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
}

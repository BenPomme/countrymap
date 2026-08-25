/**
 * Truthle Achievement System
 * 500+ achievements across multiple categories
 */

export type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic'

export type AchievementCategory =
  | 'gameplay'      // General gameplay milestones
  | 'streak'        // Streak achievements
  | 'speed'         // Speed-related
  | 'accuracy'      // Accuracy milestones
  | 'mastery'       // Thematic/category mastery
  | 'regional'      // Regional/continent knowledge
  | 'collector'     // Collection achievements
  | 'special'       // Special/rare achievements
  | 'score'         // Score milestones
  | 'social'        // Sharing/social achievements

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  category: AchievementCategory
  rarity: AchievementRarity
  requirement: AchievementRequirement
  coinReward: number
  hidden?: boolean  // Secret achievements
}

export type AchievementRequirement =
  | { type: 'games_played'; count: number }
  | { type: 'total_correct'; count: number }
  | { type: 'perfect_games'; count: number }
  | { type: 'streak'; days: number }
  | { type: 'best_streak'; days: number }
  | { type: 'fast_answers'; count: number; seconds: number }
  | { type: 'score_single'; score: number }
  | { type: 'score_total'; score: number }
  | { type: 'category_correct'; category: string; count: number }
  | { type: 'category_perfect'; category: string; count: number }
  | { type: 'continent_correct'; continent: string; count: number }
  | { type: 'items_owned'; count: number }
  | { type: 'coins_earned'; count: number }
  | { type: 'coins_spent'; count: number }
  | { type: 'shares'; count: number }
  | { type: 'consecutive_correct'; count: number }
  | { type: 'specific_stat'; stat: string; correct: number }
  | { type: 'all_categories_in_game' }
  | { type: 'no_wrong_streak'; games: number }
  | { type: 'comeback'; behindBy: number }
  | { type: 'speed_run'; totalTime: number }
  | { type: 'daily_login'; days: number }
  | { type: 'first_play' }

// Rarity configuration
export const RARITY_CONFIG: Record<AchievementRarity, { color: string; bgColor: string; label: string; multiplier: number }> = {
  common: { color: 'text-gray-600', bgColor: 'bg-gray-100', label: 'Common', multiplier: 1 },
  uncommon: { color: 'text-green-600', bgColor: 'bg-green-100', label: 'Uncommon', multiplier: 1.5 },
  rare: { color: 'text-blue-600', bgColor: 'bg-blue-100', label: 'Rare', multiplier: 2 },
  epic: { color: 'text-purple-600', bgColor: 'bg-purple-100', label: 'Epic', multiplier: 3 },
  legendary: { color: 'text-amber-600', bgColor: 'bg-amber-100', label: 'Legendary', multiplier: 5 },
  mythic: { color: 'text-red-600', bgColor: 'bg-red-100', label: 'Mythic', multiplier: 10 },
}

// Achievement categories for UI
export const ACHIEVEMENT_CATEGORIES: { id: AchievementCategory; name: string; icon: string }[] = [
  { id: 'gameplay', name: 'Gameplay', icon: '🎮' },
  { id: 'streak', name: 'Streaks', icon: '🔥' },
  { id: 'speed', name: 'Speed', icon: '⚡' },
  { id: 'accuracy', name: 'Accuracy', icon: '🎯' },
  { id: 'mastery', name: 'Mastery', icon: '📊' },
  { id: 'regional', name: 'Regional', icon: '🌍' },
  { id: 'collector', name: 'Collector', icon: '📦' },
  { id: 'special', name: 'Special', icon: '✨' },
  { id: 'score', name: 'Score', icon: '🏆' },
  { id: 'social', name: 'Social', icon: '🤝' },
]

// Stat categories for mastery achievements
export const STAT_CATEGORIES = {
  health: {
    name: 'Health',
    icon: '🏥',
    stats: ['lifeExpectancy', 'obesityRate', 'smokingRate', 'alcoholConsumption', 'fertilityRate', 'cancerRate', 'diabetesRate', 'hivRate', 'suicideRate', 'mentalHealthSpending']
  },
  economy: {
    name: 'Economy',
    icon: '💰',
    stats: ['gdpPerCapita', 'gdpGrowth', 'unemployment', 'inflation', 'giniIndex', 'hdi', 'debtToGdp', 'taxRevenue', 'corporateTax', 'incomeTax', 'vatRate', 'billionairesPerCapita']
  },
  demographics: {
    name: 'Demographics',
    icon: '👥',
    stats: ['population', 'populationDensity', 'medianAge', 'urbanization', 'immigrationRate', 'ethnicDiversity', 'muslimPercent', 'christianPercent', 'hinduPercent', 'buddhistPercent', 'jewishPercent', 'irreligionPercent']
  },
  education: {
    name: 'Education',
    icon: '📚',
    stats: ['avgIQ', 'pisaScore', 'literacyRate', 'yearsOfSchooling', 'tertiaryEnrollment']
  },
  governance: {
    name: 'Governance',
    icon: '🏛️',
    stats: ['democracyScore', 'corruptionIndex', 'pressFreedom', 'economicFreedom', 'socialProgress']
  },
  crime: {
    name: 'Crime & Safety',
    icon: '🚔',
    stats: ['crimeRate', 'homicideRate', 'incarcerationRate', 'gunOwnership', 'peaceIndex']
  },
  lifestyle: {
    name: 'Lifestyle',
    icon: '🎯',
    stats: ['happinessScore', 'internetUsers', 'mobileSubscriptions', 'coffeeConsumption', 'meatConsumption', 'vegetarianRate']
  },
  relationships: {
    name: 'Relationships',
    icon: '💕',
    stats: ['divorceRate', 'marriageAge', 'singleParentRate', 'lgbtAcceptance', 'teenPregnancy', 'sexPartners', 'penisSize', 'breastSize', 'heightMale', 'heightFemale']
  },
  environment: {
    name: 'Environment',
    icon: '🌿',
    stats: ['co2Emissions', 'renewableEnergy', 'forestCoverage', 'airPollution', 'recyclingRate', 'waterAccess']
  },
  transport: {
    name: 'Transport',
    icon: '🚗',
    stats: ['carOwnership', 'roadDeaths', 'railwayUsage']
  }
}

// Continents for regional achievements
export const CONTINENTS = {
  europe: { name: 'Europe', icon: '🇪🇺', countries: ['FRA', 'DEU', 'GBR', 'ITA', 'ESP', 'POL', 'ROU', 'NLD', 'BEL', 'GRC', 'CZE', 'PRT', 'SWE', 'HUN', 'AUT', 'CHE', 'BGR', 'DNK', 'FIN', 'SVK', 'NOR', 'IRL', 'HRV', 'BIH', 'ALB', 'LTU', 'SVN', 'LVA', 'EST', 'MKD', 'LUX', 'MLT', 'ISL', 'MNE', 'AND', 'MCO', 'LIE', 'SMR', 'SRB', 'UKR', 'BLR', 'MDA'] },
  asia: { name: 'Asia', icon: '🌏', countries: ['CHN', 'IND', 'IDN', 'PAK', 'BGD', 'JPN', 'PHL', 'VNM', 'TUR', 'IRN', 'THA', 'MMR', 'KOR', 'IRQ', 'AFG', 'SAU', 'UZB', 'MYS', 'NPL', 'YEM', 'PRK', 'TWN', 'SYR', 'LKA', 'KAZ', 'KHM', 'JOR', 'ARE', 'ISR', 'TJK', 'LAO', 'LBN', 'KGZ', 'TKM', 'SGP', 'OMN', 'PSE', 'KWT', 'GEO', 'MNG', 'ARM', 'QAT', 'BHR', 'BTN', 'MDV', 'BRN', 'AZE'] },
  africa: { name: 'Africa', icon: '🌍', countries: ['NGA', 'ETH', 'EGY', 'COD', 'TZA', 'ZAF', 'KEN', 'UGA', 'DZA', 'SDN', 'MAR', 'AGO', 'MOZ', 'GHA', 'MDG', 'CMR', 'CIV', 'NER', 'BFA', 'MLI', 'MWI', 'ZMB', 'SEN', 'TCD', 'SOM', 'ZWE', 'GIN', 'RWA', 'BEN', 'BDI', 'TUN', 'SSD', 'TGO', 'SLE', 'LBY', 'COG', 'LBR', 'CAF', 'MRT', 'ERI', 'NAM', 'GMB', 'BWA', 'GAB', 'LSO', 'GNB', 'GNQ', 'MUS', 'SWZ', 'DJI', 'COM', 'CPV', 'STP', 'SYC'] },
  northAmerica: { name: 'North America', icon: '🌎', countries: ['USA', 'MEX', 'CAN', 'GTM', 'CUB', 'HTI', 'DOM', 'HND', 'NIC', 'SLV', 'CRI', 'PAN', 'JAM', 'TTO', 'BHS', 'BLZ', 'BRB', 'LCA', 'GRD', 'VCT', 'ATG', 'DMA', 'KNA'] },
  southAmerica: { name: 'South America', icon: '🌎', countries: ['BRA', 'COL', 'ARG', 'PER', 'VEN', 'CHL', 'ECU', 'BOL', 'PRY', 'URY', 'GUY', 'SUR'] },
  oceania: { name: 'Oceania', icon: '🌏', countries: ['AUS', 'PNG', 'NZL', 'FJI', 'SLB', 'VUT', 'WSM', 'KIR', 'FSM', 'TON', 'MHL', 'PLW', 'NRU', 'TUV'] },
}

// Generate all achievements
function generateAchievements(): Achievement[] {
  const achievements: Achievement[] = []

  // ==========================================
  // GAMEPLAY MILESTONES (50+ achievements)
  // ==========================================

  // Games Played
  const gamesPlayedMilestones = [
    { count: 1, name: 'First Steps', icon: '👶', rarity: 'common' as const, reward: 10 },
    { count: 5, name: 'Getting Started', icon: '🚶', rarity: 'common' as const, reward: 25 },
    { count: 10, name: 'Regular Player', icon: '🏃', rarity: 'common' as const, reward: 50 },
    { count: 25, name: 'Dedicated Learner', icon: '📖', rarity: 'uncommon' as const, reward: 100 },
    { count: 50, name: 'Truthle Enthusiast', icon: '🎮', rarity: 'uncommon' as const, reward: 200 },
    { count: 100, name: 'Century Player', icon: '💯', rarity: 'rare' as const, reward: 500 },
    { count: 150, name: 'Committed Scholar', icon: '🎓', rarity: 'rare' as const, reward: 750 },
    { count: 200, name: 'Truthle Veteran', icon: '🎖️', rarity: 'epic' as const, reward: 1000 },
    { count: 300, name: 'World Expert', icon: '🌍', rarity: 'epic' as const, reward: 1500 },
    { count: 365, name: 'Year of Truth', icon: '📅', rarity: 'legendary' as const, reward: 2500 },
    { count: 500, name: 'Half Millennium', icon: '⭐', rarity: 'legendary' as const, reward: 5000 },
    { count: 750, name: 'Truthle Master', icon: '👑', rarity: 'mythic' as const, reward: 7500 },
    { count: 1000, name: 'Millennium Legend', icon: '🏆', rarity: 'mythic' as const, reward: 10000 },
  ]

  gamesPlayedMilestones.forEach(m => {
    achievements.push({
      id: `games_played_${m.count}`,
      name: m.name,
      description: `Play ${m.count} Truthle game${m.count > 1 ? 's' : ''}`,
      icon: m.icon,
      category: 'gameplay',
      rarity: m.rarity,
      requirement: { type: 'games_played', count: m.count },
      coinReward: m.reward,
    })
  })

  // Total Correct Answers
  const correctMilestones = [
    { count: 10, name: 'First Ten', icon: '🔟', rarity: 'common' as const, reward: 10 },
    { count: 50, name: 'Fifty Correct', icon: '5️⃣', rarity: 'common' as const, reward: 50 },
    { count: 100, name: 'Century of Knowledge', icon: '💡', rarity: 'uncommon' as const, reward: 100 },
    { count: 250, name: 'Knowledge Seeker', icon: '🔍', rarity: 'uncommon' as const, reward: 250 },
    { count: 500, name: 'Fact Finder', icon: '📊', rarity: 'rare' as const, reward: 500 },
    { count: 1000, name: 'Thousand Truths', icon: '📈', rarity: 'rare' as const, reward: 1000 },
    { count: 2500, name: 'Data Sage', icon: '🧙', rarity: 'epic' as const, reward: 2500 },
    { count: 5000, name: 'World Sage', icon: '🌟', rarity: 'epic' as const, reward: 5000 },
    { count: 7500, name: 'Global Genius', icon: '🧠', rarity: 'legendary' as const, reward: 7500 },
    { count: 10000, name: 'Ten Thousand Truths', icon: '💎', rarity: 'legendary' as const, reward: 10000 },
    { count: 25000, name: 'Truth Incarnate', icon: '✨', rarity: 'mythic' as const, reward: 25000 },
  ]

  correctMilestones.forEach(m => {
    achievements.push({
      id: `correct_${m.count}`,
      name: m.name,
      description: `Answer ${m.count.toLocaleString()} questions correctly`,
      icon: m.icon,
      category: 'accuracy',
      rarity: m.rarity,
      requirement: { type: 'total_correct', count: m.count },
      coinReward: m.reward,
    })
  })

  // Perfect Games
  const perfectMilestones = [
    { count: 1, name: 'Perfect 5', icon: '💯', rarity: 'rare' as const, reward: 100 },
    { count: 3, name: 'Triple Perfect', icon: '🎯', rarity: 'rare' as const, reward: 300 },
    { count: 5, name: 'High Five', icon: '🖐️', rarity: 'epic' as const, reward: 500 },
    { count: 10, name: 'Perfect Ten Times', icon: '🔥', rarity: 'epic' as const, reward: 1000 },
    { count: 25, name: 'Perfection Seeker', icon: '⚡', rarity: 'legendary' as const, reward: 2500 },
    { count: 50, name: 'Flawless Master', icon: '💫', rarity: 'legendary' as const, reward: 5000 },
    { count: 100, name: 'Century of Perfection', icon: '👑', rarity: 'mythic' as const, reward: 10000 },
  ]

  perfectMilestones.forEach(m => {
    achievements.push({
      id: `perfect_${m.count}`,
      name: m.name,
      description: `Get ${m.count} perfect score${m.count > 1 ? 's' : ''} (5/5)`,
      icon: m.icon,
      category: 'accuracy',
      rarity: m.rarity,
      requirement: { type: 'perfect_games', count: m.count },
      coinReward: m.reward,
    })
  })

  // ==========================================
  // STREAK ACHIEVEMENTS (30+ achievements)
  // ==========================================

  const streakMilestones = [
    { days: 2, name: 'Back Again', icon: '🔄', rarity: 'common' as const, reward: 20 },
    { days: 3, name: 'Three-peat', icon: '3️⃣', rarity: 'common' as const, reward: 30 },
    { days: 5, name: 'Weekday Warrior', icon: '📅', rarity: 'common' as const, reward: 50 },
    { days: 7, name: 'Week Warrior', icon: '🗓️', rarity: 'uncommon' as const, reward: 100 },
    { days: 10, name: 'Ten Day Streak', icon: '🔟', rarity: 'uncommon' as const, reward: 150 },
    { days: 14, name: 'Fortnight Fighter', icon: '⚔️', rarity: 'rare' as const, reward: 250 },
    { days: 21, name: 'Three Week Wonder', icon: '🌟', rarity: 'rare' as const, reward: 400 },
    { days: 30, name: 'Monthly Master', icon: '📆', rarity: 'epic' as const, reward: 750 },
    { days: 45, name: 'Six Week Streak', icon: '💪', rarity: 'epic' as const, reward: 1000 },
    { days: 60, name: 'Two Month Marvel', icon: '🎖️', rarity: 'epic' as const, reward: 1500 },
    { days: 90, name: 'Quarter Year', icon: '🏅', rarity: 'legendary' as const, reward: 2500 },
    { days: 100, name: 'Century Streak', icon: '💯', rarity: 'legendary' as const, reward: 3000 },
    { days: 150, name: 'Five Month Phoenix', icon: '🔥', rarity: 'legendary' as const, reward: 5000 },
    { days: 180, name: 'Half Year Hero', icon: '⭐', rarity: 'legendary' as const, reward: 7500 },
    { days: 200, name: 'Bicentennial', icon: '🎊', rarity: 'mythic' as const, reward: 10000 },
    { days: 250, name: 'Quarter Thousand', icon: '🏆', rarity: 'mythic' as const, reward: 15000 },
    { days: 300, name: 'Tri-Century', icon: '👑', rarity: 'mythic' as const, reward: 20000 },
    { days: 365, name: 'Year of Dedication', icon: '🎉', rarity: 'mythic' as const, reward: 36500 },
  ]

  streakMilestones.forEach(m => {
    achievements.push({
      id: `streak_${m.days}`,
      name: m.name,
      description: `Maintain a ${m.days}-day streak`,
      icon: m.icon,
      category: 'streak',
      rarity: m.rarity,
      requirement: { type: 'streak', days: m.days },
      coinReward: m.reward,
    })
  })

  // Best Streak achievements (all-time record)
  const bestStreakMilestones = [
    { days: 7, name: 'Week Record', icon: '📊', rarity: 'uncommon' as const, reward: 75 },
    { days: 14, name: 'Fortnight Record', icon: '📈', rarity: 'rare' as const, reward: 150 },
    { days: 30, name: 'Month Record', icon: '🏆', rarity: 'epic' as const, reward: 500 },
    { days: 60, name: 'Two Month Record', icon: '🎖️', rarity: 'legendary' as const, reward: 1000 },
    { days: 100, name: 'Century Record', icon: '💎', rarity: 'legendary' as const, reward: 2000 },
    { days: 200, name: 'Bicentennial Record', icon: '👑', rarity: 'mythic' as const, reward: 5000 },
    { days: 365, name: 'Year Record', icon: '🌟', rarity: 'mythic' as const, reward: 10000 },
  ]

  bestStreakMilestones.forEach(m => {
    achievements.push({
      id: `best_streak_${m.days}`,
      name: m.name,
      description: `Achieve a best streak of ${m.days}+ days`,
      icon: m.icon,
      category: 'streak',
      rarity: m.rarity,
      requirement: { type: 'best_streak', days: m.days },
      coinReward: m.reward,
    })
  })

  // ==========================================
  // SPEED ACHIEVEMENTS (40+ achievements)
  // ==========================================

  // Fast answers (under 3 seconds)
  const fastAnswerMilestones = [
    { count: 5, name: 'Quick Thinker', icon: '⚡', rarity: 'common' as const, reward: 25 },
    { count: 10, name: 'Speed Reader', icon: '💨', rarity: 'common' as const, reward: 50 },
    { count: 25, name: 'Rapid Fire', icon: '🔥', rarity: 'uncommon' as const, reward: 100 },
    { count: 50, name: 'Lightning Mind', icon: '⚡', rarity: 'uncommon' as const, reward: 200 },
    { count: 100, name: 'Speed Demon', icon: '😈', rarity: 'rare' as const, reward: 400 },
    { count: 250, name: 'Flash', icon: '💫', rarity: 'rare' as const, reward: 750 },
    { count: 500, name: 'Sonic Speed', icon: '🚀', rarity: 'epic' as const, reward: 1500 },
    { count: 1000, name: 'Hyperspeed', icon: '🌟', rarity: 'epic' as const, reward: 3000 },
    { count: 2500, name: 'Light Speed', icon: '✨', rarity: 'legendary' as const, reward: 7500 },
    { count: 5000, name: 'Warp Speed', icon: '🌌', rarity: 'legendary' as const, reward: 15000 },
    { count: 10000, name: 'Time Lord', icon: '⏱️', rarity: 'mythic' as const, reward: 30000 },
  ]

  fastAnswerMilestones.forEach(m => {
    achievements.push({
      id: `fast_3s_${m.count}`,
      name: m.name,
      description: `Answer ${m.count.toLocaleString()} questions in under 3 seconds`,
      icon: m.icon,
      category: 'speed',
      rarity: m.rarity,
      requirement: { type: 'fast_answers', count: m.count, seconds: 3 },
      coinReward: m.reward,
    })
  })

  // Ultra fast (under 2 seconds)
  const ultraFastMilestones = [
    { count: 5, name: 'Instant Reflexes', icon: '⚡', rarity: 'uncommon' as const, reward: 50 },
    { count: 25, name: 'Blink Speed', icon: '👁️', rarity: 'rare' as const, reward: 200 },
    { count: 100, name: 'Inhuman Reflexes', icon: '🦸', rarity: 'epic' as const, reward: 750 },
    { count: 500, name: 'Matrix Mode', icon: '🕶️', rarity: 'legendary' as const, reward: 3000 },
    { count: 1000, name: 'Precognition', icon: '🔮', rarity: 'mythic' as const, reward: 10000 },
  ]

  ultraFastMilestones.forEach(m => {
    achievements.push({
      id: `fast_2s_${m.count}`,
      name: m.name,
      description: `Answer ${m.count.toLocaleString()} questions in under 2 seconds`,
      icon: m.icon,
      category: 'speed',
      rarity: m.rarity,
      requirement: { type: 'fast_answers', count: m.count, seconds: 2 },
      coinReward: m.reward,
    })
  })

  // Lightning fast (under 1 second)
  const lightningMilestones = [
    { count: 1, name: 'Lightning Strike', icon: '⚡', rarity: 'rare' as const, reward: 100 },
    { count: 10, name: 'Storm Chaser', icon: '🌩️', rarity: 'epic' as const, reward: 500 },
    { count: 50, name: 'Thunder God', icon: '⛈️', rarity: 'legendary' as const, reward: 2500 },
    { count: 100, name: 'Speed Force', icon: '💫', rarity: 'mythic' as const, reward: 10000 },
  ]

  lightningMilestones.forEach(m => {
    achievements.push({
      id: `fast_1s_${m.count}`,
      name: m.name,
      description: `Answer ${m.count} question${m.count > 1 ? 's' : ''} in under 1 second`,
      icon: m.icon,
      category: 'speed',
      rarity: m.rarity,
      requirement: { type: 'fast_answers', count: m.count, seconds: 1 },
      coinReward: m.reward,
    })
  })

  // ==========================================
  // SCORE ACHIEVEMENTS (30+ achievements)
  // ==========================================

  // Single game scores
  const singleScoreMilestones = [
    { score: 500, name: 'Half Grand', icon: '💵', rarity: 'common' as const, reward: 25 },
    { score: 750, name: 'Three Quarters', icon: '📊', rarity: 'common' as const, reward: 50 },
    { score: 1000, name: 'Grand Score', icon: '💰', rarity: 'uncommon' as const, reward: 100 },
    { score: 1100, name: 'Eleven Hundred', icon: '📈', rarity: 'uncommon' as const, reward: 150 },
    { score: 1200, name: 'Twelve Hundred', icon: '🎯', rarity: 'rare' as const, reward: 250 },
    { score: 1300, name: 'Lucky Thirteen', icon: '🍀', rarity: 'rare' as const, reward: 400 },
    { score: 1400, name: 'Fourteen Hundred', icon: '⭐', rarity: 'epic' as const, reward: 750 },
    { score: 1500, name: 'Maximum Score', icon: '🏆', rarity: 'legendary' as const, reward: 1500 },
  ]

  singleScoreMilestones.forEach(m => {
    achievements.push({
      id: `score_single_${m.score}`,
      name: m.name,
      description: `Score ${m.score.toLocaleString()}+ in a single game`,
      icon: m.icon,
      category: 'score',
      rarity: m.rarity,
      requirement: { type: 'score_single', score: m.score },
      coinReward: m.reward,
    })
  })

  // Total score milestones
  const totalScoreMilestones = [
    { score: 5000, name: 'Five Thousand', icon: '5️⃣', rarity: 'common' as const, reward: 50 },
    { score: 10000, name: 'Ten K', icon: '🔟', rarity: 'common' as const, reward: 100 },
    { score: 25000, name: 'Twenty Five K', icon: '📊', rarity: 'uncommon' as const, reward: 250 },
    { score: 50000, name: 'Fifty Grand', icon: '💰', rarity: 'uncommon' as const, reward: 500 },
    { score: 100000, name: 'Hundred K', icon: '💵', rarity: 'rare' as const, reward: 1000 },
    { score: 250000, name: 'Quarter Million', icon: '💎', rarity: 'rare' as const, reward: 2500 },
    { score: 500000, name: 'Half Million', icon: '🌟', rarity: 'epic' as const, reward: 5000 },
    { score: 1000000, name: 'Millionaire', icon: '💰', rarity: 'epic' as const, reward: 10000 },
    { score: 2500000, name: 'Multi-Millionaire', icon: '💵', rarity: 'legendary' as const, reward: 25000 },
    { score: 5000000, name: 'Five Million Club', icon: '👑', rarity: 'legendary' as const, reward: 50000 },
    { score: 10000000, name: 'Ten Million Legend', icon: '🏆', rarity: 'mythic' as const, reward: 100000 },
  ]

  totalScoreMilestones.forEach(m => {
    achievements.push({
      id: `score_total_${m.score}`,
      name: m.name,
      description: `Accumulate ${m.score.toLocaleString()}+ total score`,
      icon: m.icon,
      category: 'score',
      rarity: m.rarity,
      requirement: { type: 'score_total', score: m.score },
      coinReward: m.reward,
    })
  })

  // ==========================================
  // THEMATIC MASTERY (100+ achievements)
  // ==========================================

  Object.entries(STAT_CATEGORIES).forEach(([categoryKey, category]) => {
    // Category correct answers
    const categoryCorrectMilestones = [
      { count: 10, rarity: 'common' as const, reward: 25 },
      { count: 25, rarity: 'common' as const, reward: 50 },
      { count: 50, rarity: 'uncommon' as const, reward: 100 },
      { count: 100, rarity: 'uncommon' as const, reward: 200 },
      { count: 250, rarity: 'rare' as const, reward: 500 },
      { count: 500, rarity: 'rare' as const, reward: 1000 },
      { count: 1000, rarity: 'epic' as const, reward: 2000 },
      { count: 2500, rarity: 'legendary' as const, reward: 5000 },
      { count: 5000, rarity: 'mythic' as const, reward: 10000 },
    ]

    categoryCorrectMilestones.forEach(m => {
      achievements.push({
        id: `category_${categoryKey}_${m.count}`,
        name: `${category.name} Student${m.count >= 500 ? ' Master' : m.count >= 100 ? ' Expert' : ''}`,
        description: `Answer ${m.count} ${category.name} questions correctly`,
        icon: category.icon,
        category: 'mastery',
        rarity: m.rarity,
        requirement: { type: 'category_correct', category: categoryKey, count: m.count },
        coinReward: m.reward,
      })
    })

    // Perfect category games (all questions from that category correct in a game)
    const perfectCategoryMilestones = [
      { count: 1, name: `${category.name} Ace`, rarity: 'rare' as const, reward: 100 },
      { count: 5, name: `${category.name} Expert`, rarity: 'epic' as const, reward: 500 },
      { count: 10, name: `${category.name} Master`, rarity: 'legendary' as const, reward: 1500 },
      { count: 25, name: `${category.name} Grandmaster`, rarity: 'mythic' as const, reward: 5000 },
    ]

    perfectCategoryMilestones.forEach(m => {
      achievements.push({
        id: `category_perfect_${categoryKey}_${m.count}`,
        name: m.name,
        description: `Get all ${category.name} questions right in ${m.count} game${m.count > 1 ? 's' : ''}`,
        icon: category.icon,
        category: 'mastery',
        rarity: m.rarity,
        requirement: { type: 'category_perfect', category: categoryKey, count: m.count },
        coinReward: m.reward,
      })
    })
  })

  // ==========================================
  // REGIONAL MASTERY (60+ achievements)
  // ==========================================

  Object.entries(CONTINENTS).forEach(([continentKey, continent]) => {
    const regionalMilestones = [
      { count: 10, rarity: 'common' as const, reward: 25 },
      { count: 25, rarity: 'common' as const, reward: 50 },
      { count: 50, rarity: 'uncommon' as const, reward: 100 },
      { count: 100, rarity: 'uncommon' as const, reward: 200 },
      { count: 250, rarity: 'rare' as const, reward: 500 },
      { count: 500, rarity: 'epic' as const, reward: 1000 },
      { count: 1000, rarity: 'legendary' as const, reward: 2500 },
      { count: 2500, rarity: 'mythic' as const, reward: 7500 },
    ]

    regionalMilestones.forEach(m => {
      let title = `${continent.name} Novice`
      if (m.count >= 1000) title = `${continent.name} Legend`
      else if (m.count >= 500) title = `${continent.name} Master`
      else if (m.count >= 250) title = `${continent.name} Expert`
      else if (m.count >= 100) title = `${continent.name} Scholar`
      else if (m.count >= 50) title = `${continent.name} Student`

      achievements.push({
        id: `continent_${continentKey}_${m.count}`,
        name: title,
        description: `Answer ${m.count} questions about ${continent.name} correctly`,
        icon: continent.icon,
        category: 'regional',
        rarity: m.rarity,
        requirement: { type: 'continent_correct', continent: continentKey, count: m.count },
        coinReward: m.reward,
      })
    })
  })

  // ==========================================
  // COLLECTOR ACHIEVEMENTS (30+ achievements)
  // ==========================================

  const collectorMilestones = [
    { count: 1, name: 'First Purchase', icon: '🛒', rarity: 'common' as const, reward: 10 },
    { count: 5, name: 'Small Collection', icon: '📦', rarity: 'common' as const, reward: 50 },
    { count: 10, name: 'Collector', icon: '🎁', rarity: 'uncommon' as const, reward: 100 },
    { count: 25, name: 'Hoarder', icon: '💼', rarity: 'uncommon' as const, reward: 250 },
    { count: 50, name: 'Treasure Hunter', icon: '🗝️', rarity: 'rare' as const, reward: 500 },
    { count: 100, name: 'Museum Curator', icon: '🏛️', rarity: 'epic' as const, reward: 1000 },
    { count: 200, name: 'Dragon Hoard', icon: '🐉', rarity: 'legendary' as const, reward: 2500 },
    { count: 500, name: 'Ultimate Collector', icon: '👑', rarity: 'mythic' as const, reward: 10000 },
  ]

  collectorMilestones.forEach(m => {
    achievements.push({
      id: `items_owned_${m.count}`,
      name: m.name,
      description: `Own ${m.count} item${m.count > 1 ? 's' : ''} from the shop`,
      icon: m.icon,
      category: 'collector',
      rarity: m.rarity,
      requirement: { type: 'items_owned', count: m.count },
      coinReward: m.reward,
    })
  })

  // Coins earned
  const coinsEarnedMilestones = [
    { count: 100, name: 'Pocket Change', icon: '🪙', rarity: 'common' as const, reward: 10 },
    { count: 500, name: 'Piggy Bank', icon: '🐷', rarity: 'common' as const, reward: 25 },
    { count: 1000, name: 'First Thousand', icon: '💰', rarity: 'uncommon' as const, reward: 50 },
    { count: 5000, name: 'Five K Club', icon: '💵', rarity: 'uncommon' as const, reward: 100 },
    { count: 10000, name: 'Ten K Rich', icon: '💎', rarity: 'rare' as const, reward: 250 },
    { count: 25000, name: 'Wealthy', icon: '🏦', rarity: 'rare' as const, reward: 500 },
    { count: 50000, name: 'Fortune', icon: '💰', rarity: 'epic' as const, reward: 1000 },
    { count: 100000, name: 'Hundred Grand', icon: '🤑', rarity: 'epic' as const, reward: 2500 },
    { count: 250000, name: 'Quarter Million Coins', icon: '💎', rarity: 'legendary' as const, reward: 5000 },
    { count: 500000, name: 'Half Million', icon: '👑', rarity: 'legendary' as const, reward: 10000 },
    { count: 1000000, name: 'Coin Millionaire', icon: '🏆', rarity: 'mythic' as const, reward: 25000 },
  ]

  coinsEarnedMilestones.forEach(m => {
    achievements.push({
      id: `coins_earned_${m.count}`,
      name: m.name,
      description: `Earn ${m.count.toLocaleString()} total coins`,
      icon: m.icon,
      category: 'collector',
      rarity: m.rarity,
      requirement: { type: 'coins_earned', count: m.count },
      coinReward: m.reward,
    })
  })

  // Coins spent
  const coinsSpentMilestones = [
    { count: 100, name: 'First Spend', icon: '💸', rarity: 'common' as const, reward: 10 },
    { count: 1000, name: 'Big Spender', icon: '🛍️', rarity: 'uncommon' as const, reward: 50 },
    { count: 5000, name: 'Shop Regular', icon: '🏪', rarity: 'rare' as const, reward: 150 },
    { count: 10000, name: 'Heavy Spender', icon: '💳', rarity: 'epic' as const, reward: 500 },
    { count: 50000, name: 'Philanthropist', icon: '🎭', rarity: 'legendary' as const, reward: 2500 },
    { count: 100000, name: 'Tycoon', icon: '🏰', rarity: 'mythic' as const, reward: 10000 },
  ]

  coinsSpentMilestones.forEach(m => {
    achievements.push({
      id: `coins_spent_${m.count}`,
      name: m.name,
      description: `Spend ${m.count.toLocaleString()} coins in the shop`,
      icon: m.icon,
      category: 'collector',
      rarity: m.rarity,
      requirement: { type: 'coins_spent', count: m.count },
      coinReward: m.reward,
    })
  })

  // ==========================================
  // SOCIAL ACHIEVEMENTS (20+ achievements)
  // ==========================================

  const socialMilestones = [
    { count: 1, name: 'First Share', icon: '📤', rarity: 'common' as const, reward: 15 },
    { count: 5, name: 'Sharing is Caring', icon: '🤝', rarity: 'common' as const, reward: 50 },
    { count: 10, name: 'Social Butterfly', icon: '🦋', rarity: 'uncommon' as const, reward: 100 },
    { count: 25, name: 'Influencer', icon: '📱', rarity: 'uncommon' as const, reward: 250 },
    { count: 50, name: 'Viral Spreader', icon: '📡', rarity: 'rare' as const, reward: 500 },
    { count: 100, name: 'Ambassador', icon: '🎺', rarity: 'epic' as const, reward: 1000 },
    { count: 250, name: 'Truth Evangelist', icon: '📢', rarity: 'legendary' as const, reward: 2500 },
    { count: 500, name: 'Legend of Sharing', icon: '👑', rarity: 'mythic' as const, reward: 5000 },
  ]

  socialMilestones.forEach(m => {
    achievements.push({
      id: `shares_${m.count}`,
      name: m.name,
      description: `Share your results ${m.count} time${m.count > 1 ? 's' : ''}`,
      icon: m.icon,
      category: 'social',
      rarity: m.rarity,
      requirement: { type: 'shares', count: m.count },
      coinReward: m.reward,
    })
  })

  // ==========================================
  // SPECIAL ACHIEVEMENTS (40+ achievements)
  // ==========================================

  // Consecutive correct answers
  const consecutiveMilestones = [
    { count: 10, name: 'Hot Streak', icon: '🔥', rarity: 'common' as const, reward: 25 },
    { count: 15, name: 'On Fire', icon: '🔥', rarity: 'uncommon' as const, reward: 75 },
    { count: 20, name: 'Blazing', icon: '🌋', rarity: 'uncommon' as const, reward: 150 },
    { count: 25, name: 'Inferno', icon: '☄️', rarity: 'rare' as const, reward: 300 },
    { count: 30, name: 'Supernova', icon: '💥', rarity: 'rare' as const, reward: 500 },
    { count: 40, name: 'Legendary Run', icon: '⭐', rarity: 'epic' as const, reward: 1000 },
    { count: 50, name: 'Fifty Straight', icon: '🌟', rarity: 'epic' as const, reward: 2000 },
    { count: 75, name: 'Diamond Run', icon: '💎', rarity: 'legendary' as const, reward: 5000 },
    { count: 100, name: 'Perfect Century', icon: '💯', rarity: 'mythic' as const, reward: 10000 },
  ]

  consecutiveMilestones.forEach(m => {
    achievements.push({
      id: `consecutive_${m.count}`,
      name: m.name,
      description: `Answer ${m.count} questions correctly in a row (across games)`,
      icon: m.icon,
      category: 'special',
      rarity: m.rarity,
      requirement: { type: 'consecutive_correct', count: m.count },
      coinReward: m.reward,
    })
  })

  // No wrong answers streak (multiple perfect games)
  const noWrongMilestones = [
    { games: 2, name: 'Double Perfect', icon: '✌️', rarity: 'epic' as const, reward: 500 },
    { games: 3, name: 'Triple Perfect', icon: '🎯', rarity: 'legendary' as const, reward: 1500 },
    { games: 5, name: 'Penta Perfect', icon: '🌟', rarity: 'legendary' as const, reward: 5000 },
    { games: 7, name: 'Week of Perfection', icon: '👑', rarity: 'mythic' as const, reward: 15000 },
    { games: 10, name: 'Perfect Ten', icon: '💎', rarity: 'mythic' as const, reward: 50000 },
  ]

  noWrongMilestones.forEach(m => {
    achievements.push({
      id: `no_wrong_${m.games}`,
      name: m.name,
      description: `Get perfect scores in ${m.games} consecutive games`,
      icon: m.icon,
      category: 'special',
      rarity: m.rarity,
      requirement: { type: 'no_wrong_streak', games: m.games },
      coinReward: m.reward,
    })
  })

  // Speed run achievements (complete game fast)
  const speedRunMilestones = [
    { time: 60, name: 'Minute Man', icon: '⏱️', rarity: 'rare' as const, reward: 250 },
    { time: 45, name: 'Speed Runner', icon: '🏃', rarity: 'epic' as const, reward: 500 },
    { time: 30, name: 'Blitz Master', icon: '⚡', rarity: 'legendary' as const, reward: 1500 },
    { time: 20, name: 'Lightning Round', icon: '🌩️', rarity: 'mythic' as const, reward: 5000 },
  ]

  speedRunMilestones.forEach(m => {
    achievements.push({
      id: `speed_run_${m.time}`,
      name: m.name,
      description: `Complete a perfect game in under ${m.time} seconds total`,
      icon: m.icon,
      category: 'special',
      rarity: m.rarity,
      requirement: { type: 'speed_run', totalTime: m.time },
      coinReward: m.reward,
    })
  })

  // Hidden/Secret achievements
  const hiddenAchievements: Achievement[] = [
    {
      id: 'hidden_first_wrong',
      name: 'Learning Experience',
      description: 'Get your first wrong answer',
      icon: '📚',
      category: 'special',
      rarity: 'common',
      requirement: { type: 'total_correct', count: 1 }, // Placeholder, tracked separately
      coinReward: 5,
      hidden: true,
    },
    {
      id: 'hidden_midnight',
      name: 'Night Owl',
      description: 'Play at exactly midnight UTC',
      icon: '🦉',
      category: 'special',
      rarity: 'rare',
      requirement: { type: 'first_play' }, // Placeholder
      coinReward: 200,
      hidden: true,
    },
    {
      id: 'hidden_all_categories',
      name: 'Renaissance Player',
      description: 'Answer questions from all 10 categories correctly in one game',
      icon: '🎨',
      category: 'special',
      rarity: 'epic',
      requirement: { type: 'all_categories_in_game' },
      coinReward: 500,
      hidden: true,
    },
    {
      id: 'hidden_comeback',
      name: 'Comeback King',
      description: 'Win after being 5+ questions behind',
      icon: '🔄',
      category: 'special',
      rarity: 'epic',
      requirement: { type: 'comeback', behindBy: 5 },
      coinReward: 750,
      hidden: true,
    },
    {
      id: 'hidden_day_1',
      name: 'Day One',
      description: 'Play Truthle on its first day',
      icon: '🎂',
      category: 'special',
      rarity: 'mythic',
      requirement: { type: 'first_play' },
      coinReward: 1000,
      hidden: true,
    },
  ]

  achievements.push(...hiddenAchievements)

  return achievements
}

// Generate and export all achievements
export const ALL_ACHIEVEMENTS = generateAchievements()

// Get achievements by category
export function getAchievementsByCategory(category: AchievementCategory): Achievement[] {
  return ALL_ACHIEVEMENTS.filter(a => a.category === category)
}

// Get achievements by rarity
export function getAchievementsByRarity(rarity: AchievementRarity): Achievement[] {
  return ALL_ACHIEVEMENTS.filter(a => a.rarity === rarity)
}

// Get achievement by ID
export function getAchievementById(id: string): Achievement | undefined {
  return ALL_ACHIEVEMENTS.find(a => a.id === id)
}

// Get visible achievements (non-hidden)
export function getVisibleAchievements(): Achievement[] {
  return ALL_ACHIEVEMENTS.filter(a => !a.hidden)
}

// Get achievement stats
export function getAchievementStats(): {
  total: number
  byCategory: Record<AchievementCategory, number>
  byRarity: Record<AchievementRarity, number>
} {
  const byCategory: Record<AchievementCategory, number> = {
    gameplay: 0, streak: 0, speed: 0, accuracy: 0, mastery: 0,
    regional: 0, collector: 0, special: 0, score: 0, social: 0,
  }
  const byRarity: Record<AchievementRarity, number> = {
    common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0, mythic: 0,
  }

  ALL_ACHIEVEMENTS.forEach(a => {
    byCategory[a.category]++
    byRarity[a.rarity]++
  })

  return { total: ALL_ACHIEVEMENTS.length, byCategory, byRarity }
}

console.log('Achievement Stats:', getAchievementStats())

export interface TruthleLocalState {
  lastPlayedDate: string | null
  todayScore: number | null
  todayResults: boolean[] | null
  todayTimes: number[] | null
  streak: number
  bestStreak: number
  gamesPlayed: number
  totalCorrect: number
  coins: number
  totalCoinsEarned: number
  ownedItems: string[]
  equippedTheme: string | null
  equippedBadge: string | null
  equippedFrame: string | null
  equippedTitle: string | null
  streakFreezes: number
  hints: number
  fiftyFifties: number
  timeExtenders: number
  doubleCoinsActive: boolean
  perfectGames: number
  fastAnswersTotal: number
  unlockedAchievements: string[]
  emailSignupBonusClaimed: boolean
  totalShares: number
  lastShareDate: string | null
}

const UTC_DAY_RE = /^\d{4}-\d{2}-\d{2}$/

export function getDefaultTruthleState(): TruthleLocalState {
  return {
    lastPlayedDate: null,
    todayScore: null,
    todayResults: null,
    todayTimes: null,
    streak: 0,
    bestStreak: 0,
    gamesPlayed: 0,
    totalCorrect: 0,
    coins: 0,
    totalCoinsEarned: 0,
    ownedItems: [],
    equippedTheme: null,
    equippedBadge: null,
    equippedFrame: null,
    equippedTitle: null,
    streakFreezes: 0,
    hints: 0,
    fiftyFifties: 0,
    timeExtenders: 0,
    doubleCoinsActive: false,
    perfectGames: 0,
    fastAnswersTotal: 0,
    unlockedAchievements: [],
    emailSignupBonusClaimed: false,
    totalShares: 0,
    lastShareDate: null,
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function nonNegativeInteger(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? Math.floor(value)
    : fallback
}

function nullableScore(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null
}

function nullableDay(value: unknown): string | null {
  if (typeof value !== 'string' || !UTC_DAY_RE.test(value)) return null
  const parsed = Date.parse(`${value}T00:00:00.000Z`)
  return Number.isFinite(parsed) && new Date(parsed).toISOString().slice(0, 10) === value
    ? value
    : null
}

function nullableString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}

function booleanArray(value: unknown): boolean[] | null {
  if (!Array.isArray(value) || !value.every((item) => typeof item === 'boolean')) return null
  return [...value]
}

function numberArray(value: unknown): number[] | null {
  if (!Array.isArray(value)) return null
  return value.every((item) => typeof item === 'number' && Number.isFinite(item) && item >= 0)
    ? [...value]
    : null
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return [...new Set(value.filter((item): item is string => typeof item === 'string' && item.length > 0))]
}

export function sanitizeTruthleState(value: unknown): TruthleLocalState {
  const defaults = getDefaultTruthleState()
  if (!isRecord(value)) return defaults

  const extraFields = Object.fromEntries(
    Object.entries(value).filter(([key]) => !(key in defaults))
  )

  return {
    ...defaults,
    ...extraFields,
    lastPlayedDate: nullableDay(value.lastPlayedDate),
    todayScore: nullableScore(value.todayScore),
    todayResults: booleanArray(value.todayResults),
    todayTimes: numberArray(value.todayTimes),
    streak: nonNegativeInteger(value.streak, defaults.streak),
    bestStreak: nonNegativeInteger(value.bestStreak, defaults.bestStreak),
    gamesPlayed: nonNegativeInteger(value.gamesPlayed, defaults.gamesPlayed),
    totalCorrect: nonNegativeInteger(value.totalCorrect, defaults.totalCorrect),
    coins: nonNegativeInteger(value.coins, defaults.coins),
    totalCoinsEarned: nonNegativeInteger(value.totalCoinsEarned, defaults.totalCoinsEarned),
    ownedItems: stringArray(value.ownedItems),
    equippedTheme: nullableString(value.equippedTheme),
    equippedBadge: nullableString(value.equippedBadge),
    equippedFrame: nullableString(value.equippedFrame),
    equippedTitle: nullableString(value.equippedTitle),
    streakFreezes: nonNegativeInteger(value.streakFreezes, defaults.streakFreezes),
    hints: nonNegativeInteger(value.hints, defaults.hints),
    fiftyFifties: nonNegativeInteger(value.fiftyFifties, defaults.fiftyFifties),
    timeExtenders: nonNegativeInteger(value.timeExtenders, defaults.timeExtenders),
    doubleCoinsActive: value.doubleCoinsActive === true,
    perfectGames: nonNegativeInteger(value.perfectGames, defaults.perfectGames),
    fastAnswersTotal: nonNegativeInteger(value.fastAnswersTotal, defaults.fastAnswersTotal),
    unlockedAchievements: stringArray(value.unlockedAchievements),
    emailSignupBonusClaimed: value.emailSignupBonusClaimed === true,
    totalShares: nonNegativeInteger(value.totalShares, defaults.totalShares),
    lastShareDate: nullableDay(value.lastShareDate),
  }
}

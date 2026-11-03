/**
 * Curated, ordinary Amazon search recommendations used by the rewards lane.
 * They are not coupons, verified discounts or score-gated rewards.
 */
export interface VerifiedAmazonProduct {
  asin: string
  title: string
  cta: string
}

export type UnlockPick = {
  label: string
  /** Stable identity used by photo matching and analytics content IDs. */
  query: string
  /** Natural French destination used only on Amazon.fr. */
  searchQuery?: string
  amazonProduct?: VerifiedAmazonProduct
}
export type UnlockTheme = { key: 'press' | 'travel' | 'world'; picks: UnlockPick[] }
export type UnlockGame = 'truthle' | 'true-false'

export const PRESS_PICKS: UnlockPick[] = [
  {
    label: 'Privacy screen protectors',
    query: 'privacy screen protector laptop',
    searchQuery: 'protecteur écran confidentialité ordinateur portable',
  },
  { label: 'Webcam covers & privacy kits', query: 'webcam cover privacy', searchQuery: 'cache webcam confidentialité' },
  {
    label: 'Best books on press freedom & journalism',
    query: 'press freedom journalism book',
    searchQuery: 'livre liberté de la presse journalisme',
  },
  { label: 'Nineteen Eighty-Four (Orwell)', query: 'nineteen eighty-four orwell', searchQuery: '1984 george orwell livre' },
]
export const TRAVEL_PICKS: UnlockPick[] = [
  { label: 'RFID-blocking passport holders', query: 'rfid passport holder', searchQuery: 'étui passeport anti rfid' },
  { label: 'Universal travel adapters', query: 'universal travel adapter', searchQuery: 'adaptateur voyage universel' },
  { label: 'Carry-on cabin bags', query: 'cabin bag carry on', searchQuery: 'bagage cabine' },
  { label: 'Lonely Planet & travel guides', query: 'lonely planet guide', searchQuery: 'guide lonely planet' },
]

export const WORLD_GAME_PRODUCT: VerifiedAmazonProduct = {
  asin: 'B0D983R6B6',
  title: 'The World Game: geography board game, French edition',
  cta: 'View product on Amazon France',
}

export const GENERAL_PICKS: UnlockPick[] = [
  { label: 'World atlases', query: 'world atlas', searchQuery: 'atlas mondial' },
  { label: 'Scratch-off world maps', query: 'scratch off world map', searchQuery: 'carte du monde à gratter' },
  { label: 'Illuminated & smart globes', query: 'world globe illuminated', searchQuery: 'globe terrestre lumineux' },
  {
    label: 'Geography trivia board games',
    query: 'geography trivia game',
    searchQuery: 'jeu de société géographie',
    amazonProduct: WORLD_GAME_PRODUCT,
  },
]
const ROTATION: UnlockTheme[] = [
  { key: 'world', picks: GENERAL_PICKS },
  { key: 'travel', picks: TRAVEL_PICKS },
  { key: 'press', picks: PRESS_PICKS },
]

const DAY_MS = 24 * 60 * 60 * 1000

/** Selects a deterministic set of ordinary picks for a UTC day. */
export function getDailyUnlockTheme(date: string): UnlockTheme {
  const n = date.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return ROTATION[n % ROTATION.length]
}

/** Milliseconds until the next UTC midnight, used by the mounted shelf refresh. */
export function getMillisecondsUntilNextUtcDay(now: Date = new Date()): number {
  const current = now.getTime()
  if (!Number.isFinite(current)) return DAY_MS

  const nextUtcDay = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
  )
  return Math.max(1, nextUtcDay - current)
}

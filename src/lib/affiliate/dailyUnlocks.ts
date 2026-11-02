/**
 * Curated, ordinary Amazon search recommendations used by the rewards lane.
 * They are not coupons, verified discounts or score-gated rewards.
 */
export type UnlockPick = { label: string; query: string }
export type UnlockTheme = { key: 'press' | 'travel' | 'world'; picks: UnlockPick[] }
export type UnlockGame = 'truthle' | 'true-false'

export const PRESS_PICKS: UnlockPick[] = [
  { label: 'Privacy screen protectors', query: 'privacy screen protector laptop' },
  { label: 'Webcam covers & privacy kits', query: 'webcam cover privacy' },
  { label: 'Best books on press freedom & journalism', query: 'press freedom journalism book' },
  { label: 'Nineteen Eighty-Four (Orwell)', query: 'nineteen eighty-four orwell' },
]
export const TRAVEL_PICKS: UnlockPick[] = [
  { label: 'RFID-blocking passport holders', query: 'rfid passport holder' },
  { label: 'Universal travel adapters', query: 'universal travel adapter' },
  { label: 'Carry-on cabin bags', query: 'cabin bag carry on' },
  { label: 'Lonely Planet & travel guides', query: 'lonely planet guide' },
]
export const GENERAL_PICKS: UnlockPick[] = [
  { label: 'World atlases', query: 'world atlas' },
  { label: 'Scratch-off world maps', query: 'scratch off world map' },
  { label: 'Illuminated & smart globes', query: 'world globe illuminated' },
  { label: 'Geography trivia board games', query: 'geography trivia game' },
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

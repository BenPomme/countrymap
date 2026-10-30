/**
 * Daily "perfect score" unlocks — shared curated Amazon picks (Associates tag via
 * amazonSearchUrl, worldtruth-21 / amazon.co.uk). Compliance: these are affiliate
 * search links to curated product categories, NOT coupons or exclusive discounts.
 * Queries are deliberately clean (atlas / travel / books / privacy) and never derived
 * from adult/sensitive map variables.
 *
 * Eligibility (v1, localStorage): a 5/5 in a given game on a given UTC day unlocks
 * that game's picks for the day. Truthle and True/False tracked separately. An Extra
 * Attempt that hits 5/5 also unlocks. Firestore sync can come later.
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

/** Exclusive store code we control (Lien & Cie Shopify). Not an Amazon coupon. */
export const STORE_CODE: string = (process.env.NEXT_PUBLIC_TRUTHLE_STORE_CODE || 'TRUTHLE10').trim().toUpperCase()
export const STORE_URL: string = (process.env.NEXT_PUBLIC_LIEN_CIE_STORE_URL || 'https://lienetcie.com').trim()
export const STORE_DISCLOSURE = 'Exclusive World Truth code — valid on Lien & Cie'
export const storeCodeTeaser = (code: string = STORE_CODE) => `${code.slice(0, 2)}••••`

export const AMAZON_DISCLOSURE =
  'As an Amazon Associate we earn from qualifying purchases. Prices and deals are set by Amazon and may change. No prizes or cash — just for fun.'

/** Today's picks rotate deterministically by UTC date (YYYY-MM-DD). */
export function getDailyUnlockTheme(date: string): UnlockTheme {
  const n = date.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return ROTATION[n % ROTATION.length]
}

const key = (game: UnlockGame, date: string) => `wt_unlock_v1_${game}_${date}`

export function isDailyUnlocked(game: UnlockGame, date: string): boolean {
  if (typeof window === 'undefined') return false
  try { return localStorage.getItem(key(game, date)) === '1' } catch { return false }
}

export function markDailyUnlocked(game: UnlockGame, date: string): void {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(key(game, date), '1') } catch { /* ignore */ }
}

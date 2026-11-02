export type GameKey = 'truthle' | 'true-false'

export interface ShareResultData {
  game: GameKey
  day: string
  score: number
  correct: number
  total: number
  streak: number
}

export interface GiftDetails {
  code: string
  expiresAt: string
}

export const GAME_TITLES: Record<GameKey, string> = {
  truthle: 'Truthle',
  'true-false': 'True or False: World',
}

export const CHECKOUT_POLL_DELAYS_MS = [0, 1500, 4000, 9000, 18000] as const

function scoreLine(data: ShareResultData): string {
  if (data.game === 'truthle') {
    return `Score: ${data.score.toLocaleString('en-GB')} points (${data.correct}/${data.total} correct)`
  }
  return `Score: ${data.correct}/${data.total}`
}

function streakLine(streak: number): string {
  if (streak <= 1) return ''
  return `Streak: ${streak} days`
}

export function buildShareCopy(
  data: ShareResultData,
  challengeUrl: string,
  gift?: GiftDetails | null,
): string {
  const lines = [
    `The World Truth - ${GAME_TITLES[data.game]}`,
    `Day: ${data.day}`,
    scoreLine(data),
    streakLine(data.streak),
    gift ? `Friend Extra Attempt code: ${gift.code}` : '',
    gift ? `Code expires: ${formatGiftExpiry(gift.expiresAt)}` : '',
    '',
    `Play the same challenge: ${challengeUrl}`,
  ]

  return lines.filter((line, index, all) => line !== '' || all[index - 1] !== '').join('\n')
}

export function formatGiftExpiry(expiresAt: string): string {
  const parsed = new Date(expiresAt)
  if (Number.isNaN(parsed.getTime())) return expiresAt
  return `${parsed.toISOString().replace('.000Z', 'Z')} (UTC)`
}

export function getMillisecondsUntilNextUtcDay(now = new Date()): number {
  const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
  return Math.max(0, next - now.getTime())
}

export function formatUtcCountdown(milliseconds: number): string {
  const safe = Math.max(0, Math.floor(milliseconds / 1000))
  const hours = Math.floor(safe / 3600)
  const minutes = Math.floor((safe % 3600) / 60)
  const seconds = safe % 60
  return [hours, minutes, seconds].map((part) => String(part).padStart(2, '0')).join(':')
}

export type CheckoutReturn =
  | { kind: 'none' }
  | { kind: 'cancel' }
  | { kind: 'verify'; sessionId: string }
  | { kind: 'unverifiable' }

export function parseCheckoutReturn(search: string): CheckoutReturn {
  const params = new URLSearchParams(search)
  const checkout = params.get('checkout')
  if (checkout !== 'success' && checkout !== 'cancel') return { kind: 'none' }
  if (checkout === 'cancel') return { kind: 'cancel' }

  const sessionId = params.get('session_id') || params.get('sessionId')
  if (!sessionId) return { kind: 'unverifiable' }
  return { kind: 'verify', sessionId }
}

export function removeCheckoutQuery(search: string): string {
  const params = new URLSearchParams(search)
  for (const key of ['checkout', 'paid', 'session_id', 'sessionId']) params.delete(key)
  return params.toString()
}

export function nextCheckoutPollDelay(attempt: number): number | null {
  if (!Number.isInteger(attempt) || attempt < 0) return CHECKOUT_POLL_DELAYS_MS[0]
  return CHECKOUT_POLL_DELAYS_MS[attempt] ?? null
}

export function shareFailureKind(error: unknown): 'cancel' | 'error' {
  return error instanceof Error && error.name === 'AbortError' ? 'cancel' : 'error'
}

export function isGiftUsable(expiresAt: string, now = Date.now()): boolean {
  const timestamp = new Date(expiresAt).getTime()
  return Number.isFinite(timestamp) && timestamp > now
}

export function shareCardFileName(game: GameKey, day: string): string {
  const safeDay = /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : 'current-day'
  return `world-truth-${game}-${safeDay}.png`
}

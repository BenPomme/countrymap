export const CHALLENGE_GAMES = ['truthle', 'true-false'] as const
export type ChallengeGame = (typeof CHALLENGE_GAMES)[number]

export interface ChallengeContext {
  game: ChallengeGame
  day: string
  code?: string
}

const CANONICAL_ORIGIN = 'https://theworldtruth.com'
const STORAGE_PREFIX = 'wt_challenge_v1_'
const CODE_PATTERN = /^[A-Z0-9][A-Z0-9_-]{1,63}$/

export function isChallengeGame(value: unknown): value is ChallengeGame {
  return value === 'truthle' || value === 'true-false'
}

export function isValidChallengeDay(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

export function normalizeGiftCode(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const normalized = value.trim().toUpperCase()
  return normalized.length > 0 && CODE_PATTERN.test(normalized) ? normalized : null
}

export function buildChallengeUrl({ game, day, code }: ChallengeContext): string {
  if (!isChallengeGame(game) || !isValidChallengeDay(day)) return `${CANONICAL_ORIGIN}/challenge/`
  const params = new URLSearchParams({ game, day })
  const normalizedCode = normalizeGiftCode(code)
  if (normalizedCode) params.set('code', normalizedCode)
  return `${CANONICAL_ORIGIN}/challenge/?${params.toString()}`
}

function storageKey(game: ChallengeGame): string {
  return `${STORAGE_PREFIX}${game}`
}

function getSessionStorage(): Storage | null {
  if (typeof window === 'undefined') return null
  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

function removeStoredChallenge(game: ChallengeGame): void {
  const storage = getSessionStorage()
  if (!storage) return
  try {
    storage.removeItem(storageKey(game))
  } catch {
    // Storage can be unavailable in restricted or private browser contexts.
  }
}

export function rememberChallenge({ game, day, code }: ChallengeContext): boolean {
  if (!isChallengeGame(game) || !isValidChallengeDay(day)) return false

  const normalizedCode = code === undefined ? undefined : normalizeGiftCode(code)
  if (code !== undefined && !normalizedCode) return false

  const storage = getSessionStorage()
  if (!storage) return false

  const context: ChallengeContext = normalizedCode ? { game, day, code: normalizedCode } : { game, day }
  try {
    storage.setItem(storageKey(game), JSON.stringify(context))
    return true
  } catch {
    removeStoredChallenge(game)
    return false
  }
}

export function getRememberedChallenge(game: ChallengeGame): ChallengeContext | null {
  if (!isChallengeGame(game)) return null
  const storage = getSessionStorage()
  if (!storage) return null

  try {
    const raw = storage.getItem(storageKey(game))
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') {
      removeStoredChallenge(game)
      return null
    }

    const candidate = parsed as { game?: unknown; day?: unknown; code?: unknown }
    if (candidate.game !== game || !isValidChallengeDay(candidate.day)) {
      removeStoredChallenge(game)
      return null
    }

    if (candidate.code === undefined) return { game, day: candidate.day }
    const code = normalizeGiftCode(candidate.code)
    if (!code) {
      removeStoredChallenge(game)
      return null
    }
    return { game, day: candidate.day, code }
  } catch {
    removeStoredChallenge(game)
    return null
  }
}

export function clearRememberedChallenge(game: ChallengeGame): void {
  if (!isChallengeGame(game)) return
  removeStoredChallenge(game)
}

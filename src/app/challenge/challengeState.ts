import {
  isChallengeGame,
  isValidChallengeDay,
  normalizeGiftCode,
  type ChallengeGame,
} from '@/lib/truthle/gifts'

export type ChallengeDayStatus = 'invalid' | 'past' | 'current' | 'future'

export interface ChallengeState {
  status: ChallengeDayStatus
  today: string
  game?: ChallengeGame
  day?: string
  code?: string
  codeRejected: boolean
  invalidReason?: 'game' | 'day'
}

export function getUtcDay(date = new Date()): string {
  return date.toISOString().slice(0, 10)
}

export function parseChallengeSearch(search: string, today = getUtcDay()): ChallengeState {
  const normalizedSearch = search.startsWith('?') ? search.slice(1) : search
  const params = new URLSearchParams(normalizedSearch)
  const rawGame = params.get('game')
  const rawDay = params.get('day')
  const rawCode = params.get('code')

  if (!isChallengeGame(rawGame)) {
    return { status: 'invalid', today, codeRejected: rawCode !== null, invalidReason: 'game' }
  }
  if (!isValidChallengeDay(rawDay)) {
    return { status: 'invalid', today, game: rawGame, codeRejected: rawCode !== null, invalidReason: 'day' }
  }

  const code = rawCode === null ? undefined : normalizeGiftCode(rawCode) ?? undefined
  const codeRejected = rawCode !== null && code === undefined
  const status: ChallengeDayStatus = rawDay < today ? 'past' : rawDay > today ? 'future' : 'current'

  return { status, today, game: rawGame, day: rawDay, code, codeRejected }
}

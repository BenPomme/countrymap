export interface DailyStreakStats {
  lastPlayedDate?: string | null
  lastDate?: string | null
  currentStreak?: number | null
  streak?: number | null
}

const DAY_MS = 24 * 60 * 60 * 1000
const UTC_DAY_RE = /^\d{4}-\d{2}-\d{2}$/

export function getUtcDay(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10)
}

function utcDayValue(day: string): number | null {
  if (!UTC_DAY_RE.test(day)) return null
  const value = Date.parse(`${day}T00:00:00.000Z`)
  if (!Number.isFinite(value)) return null
  if (new Date(value).toISOString().slice(0, 10) !== day) return null
  return value
}

function lastCompletionDay(stats: DailyStreakStats): string | null {
  return stats.lastPlayedDate ?? stats.lastDate ?? null
}

function storedStreak(stats: DailyStreakStats): number {
  const value = stats.currentStreak ?? stats.streak ?? 0
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0
}

function daysBetween(earlier: string, later: string): number | null {
  const earlierValue = utcDayValue(earlier)
  const laterValue = utcDayValue(later)
  if (earlierValue === null || laterValue === null) return null
  return Math.floor((laterValue - earlierValue) / DAY_MS)
}

export function getCompletionStreak(stats: DailyStreakStats, day: string): number {
  if (utcDayValue(day) === null) return 1

  const lastDay = lastCompletionDay(stats)
  const current = storedStreak(stats)
  if (!lastDay) return 1

  const gap = daysBetween(lastDay, day)
  if (gap === 0) return Math.max(1, current)
  if (gap === 1) return Math.max(1, current) + 1
  return 1
}

export function getDisplayStreak(
  stats: DailyStreakStats,
  today: string = getUtcDay()
): number {
  const lastDay = lastCompletionDay(stats)
  if (!lastDay || utcDayValue(today) === null) return 0

  const gap = daysBetween(lastDay, today)
  if (gap === 0 || gap === 1) return storedStreak(stats)
  return 0
}

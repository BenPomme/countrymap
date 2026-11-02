import {
  formatRankRange,
  rankFiniteValues,
  rankOrderLabel,
  type ValueOrder,
} from '@/lib/seo/ranking'

export interface RankPosition {
  competitionRank: number
  rankMin: number
  rankMax: number
  total: number
  order: ValueOrder
  rangeLabel: string
  rankLabel: string
  directionLabel: string
}

export function isFiniteRankValue(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

export function findRankPosition<T>(
  items: readonly T[],
  getValue: (item: T) => number,
  matches: (item: T) => boolean,
  order: ValueOrder,
): RankPosition | null {
  const finiteItems = items.filter((item) => isFiniteRankValue(getValue(item)))
  const ranked = rankFiniteValues(finiteItems, getValue, order)
  const match = ranked.find((entry) => matches(entry.item))
  if (!match) return null

  const rangeLabel = formatRankRange(match)
  return {
    competitionRank: match.competitionRank,
    rankMin: match.rankMin,
    rankMax: match.rankMax,
    total: match.total,
    order,
    rangeLabel,
    rankLabel: `Rank ${rangeLabel} of ${match.total}`,
    directionLabel: rankOrderLabel(order),
  }
}

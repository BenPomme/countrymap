export type ValueOrder = 'highest-first' | 'lowest-first'

export type RankedValue<T> = {
  item: T
  value: number
  competitionRank: number
  rankMin: number
  rankMax: number
  tied: boolean
  total: number
  order: ValueOrder
}

type IndexedValue<T> = {
  item: T
  value: number
  inputIndex: number
}

/**
 * Ranks finite numeric values without parsing or coercion. Equal values share
 * a competition rank and the full first-to-last position range. Input order is
 * used only to make equal-value output deterministic, never to assign ranks.
 */
export function rankFiniteValues<T>(
  items: readonly T[],
  getValue: (item: T) => number,
  order: ValueOrder,
): RankedValue<T>[] {
  const indexed: IndexedValue<T>[] = items.map((item, inputIndex) => {
    const value = getValue(item)
    if (!Number.isFinite(value)) {
      throw new RangeError(`Cannot rank non-finite numeric value at input index ${inputIndex}`)
    }
    return { item, value, inputIndex }
  })

  indexed.sort((left, right) => {
    if (left.value === right.value) return left.inputIndex - right.inputIndex
    return order === 'highest-first' ? right.value - left.value : left.value - right.value
  })

  const ranked: RankedValue<T>[] = []
  let groupStart = 0
  while (groupStart < indexed.length) {
    let groupEnd = groupStart
    while (groupEnd + 1 < indexed.length && indexed[groupEnd + 1].value === indexed[groupStart].value) {
      groupEnd += 1
    }
    const rankMin = groupStart + 1
    const rankMax = groupEnd + 1
    for (let index = groupStart; index <= groupEnd; index += 1) {
      const row = indexed[index]
      ranked.push({
        item: row.item,
        value: row.value,
        competitionRank: rankMin,
        rankMin,
        rankMax,
        tied: rankMax > rankMin,
        total: indexed.length,
        order,
      })
    }
    groupStart = groupEnd + 1
  }
  return ranked
}

export function formatRankRange(rank: Pick<RankedValue<unknown>, 'rankMin' | 'rankMax'>): string {
  return rank.rankMin === rank.rankMax
    ? `#${rank.rankMin}`
    : `#${rank.rankMin} to #${rank.rankMax}`
}

export function rankOrderLabel(order: ValueOrder): string {
  const endpoint = order === 'highest-first' ? 'highest' : 'lowest'
  return `Rank 1 is the ${endpoint} stored value. Tied values share the same rank range.`
}

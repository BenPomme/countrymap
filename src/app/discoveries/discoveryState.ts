export const DISCOVERY_STRENGTHS = ['all', 'very_strong', 'strong'] as const
export const DISCOVERY_DIRECTIONS = ['all', 'positive', 'negative'] as const
export const DISCOVERY_SORTS = ['interesting', 'strength', 'sample'] as const

export type DiscoveryStrength = (typeof DISCOVERY_STRENGTHS)[number]
export type DiscoveryDirection = (typeof DISCOVERY_DIRECTIONS)[number]
export type DiscoverySort = (typeof DISCOVERY_SORTS)[number]

export interface DiscoveryPair {
  x: string
  y: string
}

export interface DiscoveryState {
  q: string
  category: string | null
  strength: DiscoveryStrength
  direction: DiscoveryDirection
  cross: boolean
  sort: DiscoverySort
  pair: DiscoveryPair | null
}

export interface DiscoveryRecord {
  var1: string
  var2: string
  var1Name: string
  var2Name: string
  categoryNames: [string, string]
  categories: [string, string]
  strength: 'moderate' | 'strong' | 'very_strong'
  direction: 'positive' | 'negative'
  coefficient: number
  sampleSize: number
  interestingScore: number
  crossCategory: boolean
}

export interface DiscoveryOptions {
  categories: readonly string[]
  pairs: ReadonlyArray<readonly [string, string]>
}

export interface UrlParamSource {
  get(name: string): string | null
}

export const DEFAULT_DISCOVERY_STATE: DiscoveryState = {
  q: '',
  category: null,
  strength: 'all',
  direction: 'all',
  cross: false,
  sort: 'interesting',
  pair: null,
}

function read(params: UrlParamSource, name: string): string | null {
  const value = params.get(name)?.trim() ?? ''
  return value.length > 0 && value.length <= 120 ? value : null
}

function oneOf<T extends string>(value: string | null, allowed: readonly T[], fallback: T): T {
  return value !== null && (allowed as readonly string[]).includes(value) ? (value as T) : fallback
}

function canonicalPair(
  x: string | null,
  y: string | null,
  pairs: DiscoveryOptions['pairs'],
): DiscoveryPair | null {
  if (!x || !y || x === y) return null
  const match = pairs.find(([left, right]) => (left === x && right === y) || (left === y && right === x))
  return match ? { x: match[0], y: match[1] } : null
}

export function parseDiscoveryState(
  params: UrlParamSource,
  options: DiscoveryOptions,
): DiscoveryState {
  const category = read(params, 'category')
  const crossValue = read(params, 'cross')

  return {
    q: read(params, 'q') ?? '',
    category: category !== null && options.categories.includes(category) ? category : null,
    strength: oneOf(read(params, 'strength'), DISCOVERY_STRENGTHS, DEFAULT_DISCOVERY_STATE.strength),
    direction: oneOf(read(params, 'direction'), DISCOVERY_DIRECTIONS, DEFAULT_DISCOVERY_STATE.direction),
    cross: crossValue === '1' || crossValue === 'true',
    sort: oneOf(read(params, 'sort'), DISCOVERY_SORTS, DEFAULT_DISCOVERY_STATE.sort),
    pair: canonicalPair(read(params, 'x'), read(params, 'y'), options.pairs),
  }
}

export function normalizeDiscoveryState(
  candidate: Partial<DiscoveryState>,
  options: DiscoveryOptions,
): DiscoveryState {
  const pair =
    candidate.pair === null || candidate.pair === undefined
      ? null
      : canonicalPair(candidate.pair.x, candidate.pair.y, options.pairs)

  return {
    q: typeof candidate.q === 'string' ? candidate.q.trim().slice(0, 120) : '',
    category:
      typeof candidate.category === 'string' && options.categories.includes(candidate.category)
        ? candidate.category
        : null,
    strength: oneOf(candidate.strength ?? null, DISCOVERY_STRENGTHS, DEFAULT_DISCOVERY_STATE.strength),
    direction: oneOf(
      candidate.direction ?? null,
      DISCOVERY_DIRECTIONS,
      DEFAULT_DISCOVERY_STATE.direction,
    ),
    cross: candidate.cross === true,
    sort: oneOf(candidate.sort ?? null, DISCOVERY_SORTS, DEFAULT_DISCOVERY_STATE.sort),
    pair,
  }
}

export function serializeDiscoveryState(state: DiscoveryState): string {
  const params = new URLSearchParams()
  if (state.q) params.set('q', state.q)
  if (state.category) params.set('category', state.category)
  if (state.strength !== 'all') params.set('strength', state.strength)
  if (state.direction !== 'all') params.set('direction', state.direction)
  if (state.cross) params.set('cross', '1')
  if (state.sort !== 'interesting') params.set('sort', state.sort)
  if (state.pair) {
    params.set('x', state.pair.x)
    params.set('y', state.pair.y)
  }
  return params.toString()
}

export function discoveryStateHref(state: DiscoveryState): string {
  const query = serializeDiscoveryState(state)
  return query ? `/discoveries?${query}` : '/discoveries'
}

export function findDiscoveryPair<T extends DiscoveryRecord>(
  records: readonly T[],
  pair: DiscoveryPair | null,
): T | null {
  if (!pair) return null
  return (
    records.find((record) => record.var1 === pair.x && record.var2 === pair.y) ??
    records.find((record) => record.var1 === pair.y && record.var2 === pair.x) ??
    null
  )
}

export function filterAndSortDiscoveries<T extends DiscoveryRecord>(
  records: readonly T[],
  state: DiscoveryState,
): T[] {
  const query = state.q.trim().toLowerCase()
  let filtered = records.filter((record) => {
    if (query) {
      const haystack = [
        record.var1Name,
        record.var2Name,
        record.categoryNames[0],
        record.categoryNames[1],
      ]
        .join(' ')
        .toLowerCase()
      if (!haystack.includes(query)) return false
    }
    if (
      state.category &&
      record.categories[0] !== state.category &&
      record.categories[1] !== state.category
    ) {
      return false
    }
    if (state.strength === 'very_strong' && record.strength !== 'very_strong') return false
    if (
      state.strength === 'strong' &&
      record.strength !== 'very_strong' &&
      record.strength !== 'strong'
    ) {
      return false
    }
    if (state.direction !== 'all' && record.direction !== state.direction) return false
    if (state.cross && !record.crossCategory) return false
    return true
  })

  filtered = [...filtered]
  if (state.sort === 'strength') {
    filtered.sort((left, right) => Math.abs(right.coefficient) - Math.abs(left.coefficient))
  } else if (state.sort === 'sample') {
    filtered.sort((left, right) => right.sampleSize - left.sampleSize)
  } else {
    filtered.sort((left, right) => right.interestingScore - left.interestingScore)
  }
  return filtered
}

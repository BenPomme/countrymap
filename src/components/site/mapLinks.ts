import { MAJOR_RELIGIONS, REGIONS } from '@/lib/constants/variables'
import type { CountryFilters } from '@/types/country'

type NumericFilterKey =
  | 'democracyMin'
  | 'democracyMax'
  | 'povertyMin'
  | 'povertyMax'
  | 'gdpMin'
  | 'gdpMax'
  | 'genderMin'
  | 'genderMax'
  | 'happinessMin'
  | 'happinessMax'
  | 'iqMin'
  | 'iqMax'

type NumericFilterConfig = {
  queryKey: string
  min: number
  max: number
  neutral?: 'min' | 'max'
}

const NUMERIC_FILTERS: Record<NumericFilterKey, NumericFilterConfig> = {
  democracyMin: { queryKey: 'democracy_min', min: 0, max: 100, neutral: 'min' },
  democracyMax: { queryKey: 'democracy_max', min: 0, max: 100, neutral: 'max' },
  povertyMin: { queryKey: 'poverty_min', min: 0, max: 100, neutral: 'min' },
  povertyMax: { queryKey: 'poverty_max', min: 0, max: 100, neutral: 'max' },
  gdpMin: { queryKey: 'gdp_min', min: 0, max: 100000, neutral: 'min' },
  gdpMax: { queryKey: 'gdp_max', min: 0, max: 100000, neutral: 'max' },
  genderMin: { queryKey: 'gender_min', min: 0, max: 100, neutral: 'min' },
  genderMax: { queryKey: 'gender_max', min: 0, max: 100, neutral: 'max' },
  happinessMin: { queryKey: 'happiness_min', min: 0, max: 10, neutral: 'min' },
  happinessMax: { queryKey: 'happiness_max', min: 0, max: 10, neutral: 'max' },
  iqMin: { queryKey: 'iq_min', min: 0, max: 200, neutral: 'min' },
  iqMax: { queryKey: 'iq_max', min: 0, max: 200, neutral: 'max' },
}

const RELIGIONS = new Set<string>(MAJOR_RELIGIONS)
const REGION_NAMES = new Set<string>(REGIONS)
const MAP_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const CANONICAL_ORIGIN = 'https://theworldtruth.com'

function readNumber(params: URLSearchParams, config: NumericFilterConfig): number | undefined {
  const raw = params.get(config.queryKey)
  if (raw === null || raw.trim() === '') return undefined

  const value = Number(raw)
  if (!Number.isFinite(value) || value < config.min || value > config.max) {
    return undefined
  }
  return value
}

function readAllowedList(params: URLSearchParams, key: string, allowed: Set<string>): string[] | undefined {
  const values = Array.from(new Set(params.getAll(key).filter((value) => allowed.has(value))))
  return values.length > 0 ? values : undefined
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

function formatRange(
  filters: CountryFilters,
  minKey: NumericFilterKey,
  maxKey: NumericFilterKey,
  label: string,
  format: (value: number) => string = formatNumber
): string | null {
  const min = filters[minKey]
  const max = filters[maxKey]
  const minConfig = NUMERIC_FILTERS[minKey]
  const maxConfig = NUMERIC_FILTERS[maxKey]
  const hasMin = min !== undefined && min !== minConfig.min
  const hasMax = max !== undefined && max !== maxConfig.max

  if (!hasMin && !hasMax) return null
  if (hasMin && hasMax && min !== undefined && max !== undefined) {
    return `${label}: ${format(min)} to ${format(max)}`
  }
  if (hasMin && min !== undefined) return `${label}: ${format(min)} and above`
  if (hasMax && max !== undefined) return `${label}: up to ${format(max)}`
  return null
}

export function parseMapFilters(params: URLSearchParams): CountryFilters {
  const filters: CountryFilters = {}

  for (const [key, config] of Object.entries(NUMERIC_FILTERS) as [NumericFilterKey, NumericFilterConfig][]) {
    const value = readNumber(params, config)
    if (value !== undefined) filters[key] = value
  }

  const religions = readAllowedList(params, 'religion', RELIGIONS)
  if (religions) filters.majorReligion = religions

  const regions = readAllowedList(params, 'region', REGION_NAMES)
  if (regions) filters.regions = regions

  const conflict = params.get('conflict')
  if (conflict === 'true' || conflict === 'false') filters.hasConflict = conflict === 'true'

  return filters
}

export function activeFilterLabels(filters: CountryFilters): string[] {
  const labels: string[] = []

  if (filters.majorReligion?.length) {
    labels.push(`Religion: ${filters.majorReligion.join(', ')}`)
  }
  if (filters.regions?.length) {
    labels.push(`Region: ${filters.regions.join(', ')}`)
  }

  const ranges = [
    formatRange(filters, 'democracyMin', 'democracyMax', 'Democracy'),
    formatRange(filters, 'gdpMin', 'gdpMax', 'GDP per capita', (value) => `$${value.toLocaleString('en-US')}`),
    formatRange(filters, 'povertyMin', 'povertyMax', 'Poverty', (value) => `${formatNumber(value)}%`),
    formatRange(filters, 'genderMin', 'genderMax', 'Women\'s rights'),
    formatRange(filters, 'happinessMin', 'happinessMax', 'Happiness'),
    formatRange(filters, 'iqMin', 'iqMax', 'IQ'),
  ]
  for (const range of ranges) {
    if (range) labels.push(range)
  }

  if (filters.hasConflict === true) labels.push('Active conflict')
  if (filters.hasConflict === false) labels.push('No active conflict recorded')

  return labels
}

export function buildMapShareUrl(slug: string, filters: CountryFilters): string {
  const safeSlug = MAP_SLUG_PATTERN.test(slug) ? slug : 'press-freedom'
  const params = new URLSearchParams()

  for (const [key, config] of Object.entries(NUMERIC_FILTERS) as [NumericFilterKey, NumericFilterConfig][]) {
    const value = filters[key]
    if (value === undefined) continue
    if (config.neutral === 'min' && value === config.min) continue
    if (config.neutral === 'max' && value === config.max) continue
    params.set(config.queryKey, String(value))
  }

  for (const religion of filters.majorReligion ?? []) {
    if (RELIGIONS.has(religion)) params.append('religion', religion)
  }
  for (const region of filters.regions ?? []) {
    if (REGION_NAMES.has(region)) params.append('region', region)
  }

  if (filters.hasConflict === true || filters.hasConflict === false) {
    params.set('conflict', String(filters.hasConflict))
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : CANONICAL_ORIGIN
  const query = params.toString()
  return `${origin}/map/${safeSlug}/${query ? `?${query}` : ''}`
}

import type { Country } from '@/types/country'
import { REGIONS } from '@/lib/constants/variables'

export interface MapFilters {
  regions?: string[]
  populationMin?: number
  populationMax?: number
  gdpMin?: number
  gdpMax?: number
}

const REGION_ORDER = REGIONS as readonly string[]
const REGION_BY_LOWER_CASE = new Map(
  REGION_ORDER.map((region) => [region.toLowerCase(), region])
)

function readRegions(params: URLSearchParams): string[] {
  const selected = new Set<string>()

  for (const key of ['regions', 'region']) {
    for (const rawValue of params.getAll(key)) {
      for (const rawPart of rawValue.split(',')) {
        const match = REGION_BY_LOWER_CASE.get(rawPart.trim().toLowerCase())
        if (match) selected.add(match)
      }
    }
  }

  return REGION_ORDER.filter((region) => selected.has(region))
}

function readNumber(params: URLSearchParams, keys: string[]): number | undefined {
  for (const key of keys) {
    const rawValue = params.get(key)
    if (rawValue === null || rawValue.trim() === '') continue

    const value = Number(rawValue)
    if (Number.isFinite(value)) return Math.max(0, value)
  }

  return undefined
}

export function parseMapFilters(params: URLSearchParams): MapFilters {
  const filters: MapFilters = {}
  const regions = readRegions(params)
  const populationMin = readNumber(params, ['populationMin', 'popMin'])
  const populationMax = readNumber(params, ['populationMax', 'popMax'])
  const gdpMin = readNumber(params, ['gdpMin', 'incomeMin'])
  const gdpMax = readNumber(params, ['gdpMax', 'incomeMax'])

  if (regions.length > 0) filters.regions = regions
  if (populationMin !== undefined) filters.populationMin = populationMin
  if (populationMax !== undefined) filters.populationMax = populationMax
  if (gdpMin !== undefined) filters.gdpMin = gdpMin
  if (gdpMax !== undefined) filters.gdpMax = gdpMax

  return filters
}

export function hasActiveMapFilters(filters: MapFilters): boolean {
  return Boolean(
    (filters.regions && filters.regions.length > 0) ||
      filters.populationMin !== undefined ||
      filters.populationMax !== undefined ||
      filters.gdpMin !== undefined ||
      filters.gdpMax !== undefined
  )
}

function isReportedNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function fallsWithinRange(
  value: unknown,
  minimum: number | undefined,
  maximum: number | undefined
): boolean {
  if (minimum === undefined && maximum === undefined) return true
  if (!isReportedNumber(value)) return false
  if (minimum !== undefined && value < minimum) return false
  if (maximum !== undefined && value > maximum) return false
  return true
}

export function filterCountriesByMapFilters(
  countries: Country[],
  filters: MapFilters
): Country[] {
  const selectedRegions = new Set(filters.regions || [])

  return countries.filter((country) => {
    if (selectedRegions.size > 0 && !selectedRegions.has(country.region)) {
      return false
    }
    if (
      !fallsWithinRange(
        country.population,
        filters.populationMin,
        filters.populationMax
      )
    ) {
      return false
    }
    if (
      !fallsWithinRange(
        country.poverty?.gdpPerCapita,
        filters.gdpMin,
        filters.gdpMax
      )
    ) {
      return false
    }
    return true
  })
}

export function mapFiltersToSearchParams(filters: MapFilters): URLSearchParams {
  const params = new URLSearchParams()
  const selectedRegions = new Set(
    (filters.regions || [])
      .map((region) => REGION_BY_LOWER_CASE.get(region.trim().toLowerCase()))
      .filter((region): region is string => Boolean(region))
  )
  const regions = REGION_ORDER.filter((region) => selectedRegions.has(region))

  if (regions.length > 0) {
    params.set('regions', regions.join(','))
  }
  if (filters.populationMin !== undefined) {
    params.set('populationMin', String(filters.populationMin))
  }
  if (filters.populationMax !== undefined) {
    params.set('populationMax', String(filters.populationMax))
  }
  if (filters.gdpMin !== undefined) {
    params.set('gdpMin', String(filters.gdpMin))
  }
  if (filters.gdpMax !== undefined) {
    params.set('gdpMax', String(filters.gdpMax))
  }

  return params
}

export function buildMapFilterQuery(filters: MapFilters): string {
  const params = mapFiltersToSearchParams(filters)
  const query = params.toString()
  return query ? `?${query}` : ''
}

export function buildMapFilterHref(path: string, filters: MapFilters): string {
  return `${path}${buildMapFilterQuery(filters)}`
}

export function buildMapShareUrl(
  origin: string,
  path: string,
  filters: MapFilters
): string {
  const cleanOrigin = origin.replace(/\/+$/, '')
  const withLeadingSlash = path.startsWith('/') ? path : `/${path}`
  const canonicalPath = withLeadingSlash.endsWith('/')
    ? withLeadingSlash
    : `${withLeadingSlash}/`

  return `${cleanOrigin}${canonicalPath}${buildMapFilterQuery(filters)}`
}

import type { Country, CountryFilters } from '@/types/country'
import { getNestedValue } from '@/lib/utils'
import { countries } from './loadCountries'

export { countries } from './loadCountries'

export function getAllCountries(): Country[] {
  return countries
}

export function getCountryByCode(iso3: string): Country | undefined {
  return getAllCountries().find((c) => c.iso3 === iso3)
}

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

type NumericRange = {
  minKey: NumericFilterKey
  maxKey: NumericFilterKey
  neutralMin: number
  neutralMax: number
  value: (country: Country) => unknown
}

const NUMERIC_RANGES: NumericRange[] = [
  { minKey: 'democracyMin', maxKey: 'democracyMax', neutralMin: 0, neutralMax: 100, value: (c) => c.democracy.score },
  { minKey: 'povertyMin', maxKey: 'povertyMax', neutralMin: 0, neutralMax: 100, value: (c) => c.poverty.povertyRate },
  { minKey: 'gdpMin', maxKey: 'gdpMax', neutralMin: 0, neutralMax: 100000, value: (c) => c.poverty.gdpPerCapita },
  { minKey: 'genderMin', maxKey: 'genderMax', neutralMin: 0, neutralMax: 100, value: (c) => c.gender.wblIndex },
  { minKey: 'happinessMin', maxKey: 'happinessMax', neutralMin: 0, neutralMax: 10, value: (c) => c.lifestyle.happinessIndex },
  { minKey: 'iqMin', maxKey: 'iqMax', neutralMin: 0, neutralMax: 200, value: (c) => c.education.avgIQ },
]

function activeBound(value: number | undefined, neutral: number): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value !== neutral ? value : undefined
}

function matchesNumericRanges(country: Country, filters: CountryFilters): boolean {
  for (const range of NUMERIC_RANGES) {
    const min = activeBound(filters[range.minKey], range.neutralMin)
    const max = activeBound(filters[range.maxKey], range.neutralMax)
    if (min === undefined && max === undefined) continue

    const value = range.value(country)
    if (typeof value !== 'number' || !Number.isFinite(value)) return false
    if (min !== undefined && value < min) return false
    if (max !== undefined && value > max) return false
  }
  return true
}

export function filterCountries(
  countries: Country[],
  filters: CountryFilters
): Country[] {
  return countries.filter((country) => {
    // Religion filter
    if (filters.majorReligion && filters.majorReligion.length > 0) {
      if (!filters.majorReligion.includes(country.religion.major)) {
        return false
      }
    }

    // Numeric range filters
    if (!matchesNumericRanges(country, filters)) return false

    // Conflict filter
    if (filters.hasConflict !== undefined) {
      if (country.conflict.hasActiveConflict !== filters.hasConflict) {
        return false
      }
    }

    // Region filter
    if (filters.regions && filters.regions.length > 0) {
      if (!filters.regions.includes(country.region)) {
        return false
      }
    }

    return true
  })
}

export function getUniqueReligions(countries: Country[]): string[] {
  const religions = new Set<string>()
  countries.forEach((c) => {
    if (c.religion.major) {
      religions.add(c.religion.major)
    }
  })
  return Array.from(religions).sort()
}

export function getUniqueRegions(countries: Country[]): string[] {
  const regions = new Set<string>()
  countries.forEach((c) => {
    if (c.region) {
      regions.add(c.region)
    }
  })
  return Array.from(regions).sort()
}

export function getValueRange(
  countries: Country[],
  path: string
): { min: number; max: number } {
  const values = countries
    .map((c) => getNestedValue(c as unknown as Record<string, unknown>, path) as number)
    .filter((v) => v !== null && v !== undefined && !isNaN(v))

  if (values.length === 0) {
    return { min: 0, max: 100 }
  }

  return {
    min: Math.min(...values),
    max: Math.max(...values),
  }
}

export function groupCountriesByReligion(
  countries: Country[]
): Record<string, Country[]> {
  const groups: Record<string, Country[]> = {}
  countries.forEach((c) => {
    const religion = c.religion.major || 'Unknown'
    if (!groups[religion]) {
      groups[religion] = []
    }
    groups[religion].push(c)
  })
  return groups
}

export function getStatistics(countries: Country[], path: string) {
  const values = countries
    .map((c) => getNestedValue(c as unknown as Record<string, unknown>, path) as number)
    .filter((v) => v !== null && v !== undefined && !isNaN(v))

  if (values.length === 0) {
    return { mean: 0, median: 0, min: 0, max: 0, count: 0 }
  }

  const sorted = [...values].sort((a, b) => a - b)
  const sum = values.reduce((a, b) => a + b, 0)

  return {
    mean: sum / values.length,
    median: sorted[Math.floor(sorted.length / 2)],
    min: sorted[0],
    max: sorted[sorted.length - 1],
    count: values.length,
  }
}

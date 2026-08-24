import { VARIABLES } from '@/lib/constants/variables'
import '@/lib/constants/extraVariables'
import { getNestedValue } from '@/lib/utils'
import { countrySlug, variableSlug } from '@/lib/seo/slugs'
import type { Country, ColorVariable } from '@/types/country'
import correlationsData from '../../../data/correlations.json'
import { countries } from '@/lib/data/loadCountries'

export { countries }

export type VariableEntry = {
  id: ColorVariable
  slug: string
  name: string
}

export const variableEntries: VariableEntry[] = Object.entries(VARIABLES).map(
  ([id, config]) => ({
    id: id as ColorVariable,
    slug: variableSlug(config.name),
    name: config.name,
  })
)

const slugToVariable = new Map(variableEntries.map((entry) => [entry.slug, entry]))
const idToVariable = new Map(variableEntries.map((entry) => [entry.id, entry]))

export function getVariableBySlug(slug: string): VariableEntry | undefined {
  return slugToVariable.get(slug)
}

export function getVariableById(id: string): VariableEntry | undefined {
  return idToVariable.get(id as ColorVariable)
}

export function findCountryBySlug(rawSlug: string): Country | undefined {
  const slug = decodeURIComponent(rawSlug || '').replace(/\/+$/, '').toLowerCase()
  return countries.find((country) => {
    const next = countrySlug(country.name)
    const legacy = country.name.toLowerCase().replace(/\s+/g, '-')
    return (
      next === slug ||
      legacy === slug ||
      country.iso3.toLowerCase() === slug ||
      country.iso2.toLowerCase() === slug
    )
  })
}

export function allCountrySlugs(): string[] {
  const slugs = new Set<string>()
  for (const country of countries) {
    slugs.add(countrySlug(country.name))
    slugs.add(country.name.toLowerCase().replace(/\s+/g, '-'))
  }
  return Array.from(slugs)
}

export type RankedRow = {
  country: Country
  value: number
  formatted: string
}

export function rankCountries(variableId: ColorVariable): RankedRow[] {
  const config = VARIABLES[variableId]
  const rows: RankedRow[] = []
  for (const country of countries) {
    const value = getNestedValue(
      country as unknown as Record<string, unknown>,
      variableId
    )
    if (value === null || value === undefined) continue
    if (config.type === 'numeric' && typeof value === 'number' && !Number.isNaN(value)) {
      rows.push({ country, value, formatted: config.format(value) })
    } else if (config.type === 'categorical' && typeof value === 'string') {
      rows.push({ country, value: 0, formatted: config.format(value) })
    }
  }
  if (config.type === 'numeric') {
    rows.sort((a, b) => (config.higherIsBetter ? b.value - a.value : a.value - b.value))
  } else {
    rows.sort((a, b) => a.country.name.localeCompare(b.country.name))
  }
  return rows
}

export function topCountry(variableId: ColorVariable): RankedRow | undefined {
  return rankCountries(variableId)[0]
}

type CorrelationRow = {
  var1: string
  var2: string
  coefficient: number
}

export function relatedVariableSlugs(variableId: ColorVariable, limit = 5): VariableEntry[] {
  const list = ((correlationsData as { correlations?: CorrelationRow[] }).correlations || []) as CorrelationRow[]
  const scored: { id: string; r: number }[] = []
  for (const row of list) {
    if (row.var1 === variableId) scored.push({ id: row.var2, r: Math.abs(row.coefficient) })
    if (row.var2 === variableId) scored.push({ id: row.var1, r: Math.abs(row.coefficient) })
  }
  scored.sort((a, b) => b.r - a.r)
  const out: VariableEntry[] = []
  const seen = new Set<string>([variableId])
  for (const item of scored) {
    if (seen.has(item.id)) continue
    const entry = getVariableById(item.id)
    if (!entry) continue
    seen.add(item.id)
    out.push(entry)
    if (out.length >= limit) break
  }
  if (out.length < limit) {
    for (const entry of variableEntries) {
      if (seen.has(entry.id)) continue
      out.push(entry)
      if (out.length >= limit) break
    }
  }
  return out
}

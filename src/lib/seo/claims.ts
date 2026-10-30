import { VARIABLES } from '@/lib/constants/variables'
import { variableEntries, rankCountries, ranksHighFirst, type RankedRow } from '@/lib/seo/catalog'
import { countrySlug } from '@/lib/seo/slugs'
import type { ColorVariable } from '@/types/country'

const FAMOUS = ['USA', 'CHN', 'IND', 'JPN', 'DEU', 'GBR', 'FRA', 'BRA', 'RUS', 'CAN', 'AUS', 'MEX', 'ITA', 'ESP', 'KOR', 'NGA', 'ZAF', 'SWE', 'TUR', 'ARG', 'EGY', 'IDN', 'NLD', 'POL']
const WEAK = /penis|breast|porn|onlyfans|consanguinity|dating app|sex|hiv|ethnic/i
const PER_VAR = 3

export type Claim = {
  slug: string
  variableId: ColorVariable
  variableSlug: string
  variableName: string
  a: RankedRow
  b: RankedRow
  rankA: number
  rankB: number
  total: number
  text: string
  answer: boolean
}

let cache: Claim[] | null = null

export function getAllClaims(): Claim[] {
  if (cache) return cache
  const out: Claim[] = []
  variableEntries.forEach((entry, vi) => {
    const config = VARIABLES[entry.id]
    if (config.type !== 'numeric' || WEAK.test(`${config.name} ${config.description || ''}`)) return
    const ranked = rankCountries(entry.id)
    const pool = FAMOUS.map((iso) => ranked.findIndex((r) => r.country.iso3 === iso)).filter((i) => i >= 0)
    if (pool.length < 4) return
    for (let k = 0; k < PER_VAR; k++) {
      const i = pool[(vi + k * 2) % pool.length]
      const j = pool[(vi + k * 2 + 1 + k) % pool.length]
      if (i === j) continue
      const a = ranked[i], b = ranked[j]
      if (a.value === b.value) continue
      // Alternate phrasing so ~half the claims are false.
      const sayHigher = (vi + k) % 2 === 0
      const answer = sayHigher ? a.value > b.value : a.value < b.value
      const name = config.name.toLowerCase()
      out.push({
        slug: `${countrySlug(a.country.name)}-vs-${countrySlug(b.country.name)}-${entry.slug}`,
        variableId: entry.id,
        variableSlug: entry.slug,
        variableName: config.name,
        a, b, rankA: i + 1, rankB: j + 1, total: ranked.length,
        text: `${a.country.name} has a ${sayHigher ? 'higher' : 'lower'} ${name} than ${b.country.name}.`,
        answer,
      })
    }
  })
  const seen = new Set<string>()
  cache = out.filter((c) => (seen.has(c.slug) ? false : (seen.add(c.slug), true)))
  return cache
}

export function getClaim(slug: string): Claim | undefined {
  return getAllClaims().find((c) => c.slug === slug)
}

export function claimsForVariable(id: string, limit = 3): Claim[] {
  return getAllClaims().filter((c) => c.variableId === id).slice(0, limit)
}

export function claimsForCountry(iso3: string, limit = 6): Claim[] {
  return getAllClaims().filter((c) => c.a.country.iso3 === iso3 || c.b.country.iso3 === iso3).slice(0, limit)
}

export { ranksHighFirst }

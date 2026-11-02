import { countrySlug } from '@/lib/seo/slugs'
import type { RankedRow } from '@/lib/seo/catalog'
import type { VariableConfig } from '@/types/country'
import type { RankingRow } from './RankingTable'

export interface MainFact {
  label: string
  lead: string
  value: string
  valueLabel: string
  detail: string
  countryHref?: string
  empty: boolean
}

function listWithAnd(items: string[]): string {
  if (items.length < 2) return items[0] || ''
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`
}

export function buildMainFact(
  config: VariableConfig,
  ranked: RankedRow[],
  higher: boolean,
  totalCountryCount: number
): MainFact {
  if (ranked.length === 0) {
    const categorical = config.type === 'categorical'
    return {
      label: 'Data status',
      lead: categorical ? 'No reported categories' : 'No reported values',
      value: `0 of ${totalCountryCount}`,
      valueLabel: categorical ? 'Countries with a category' : 'Countries with data',
      detail: `No country in this ${totalCountryCount}-country dataset has a reported ${categorical ? 'category' : 'value'} for ${config.name}.`,
      empty: true,
    }
  }

  if (config.type === 'categorical') {
    const counts = new Map<string, number>()
    for (const row of ranked) {
      counts.set(row.formatted, (counts.get(row.formatted) || 0) + 1)
    }

    const highestCount = Math.max(...Array.from(counts.values()))
    const leadingCategories = Array.from(counts.entries())
      .filter(([, count]) => count === highestCount)
      .map(([category]) => category)
    const categoryList = listWithAnd(leadingCategories)
    const tied = leadingCategories.length > 1

    return {
      label: tied ? 'Most reported categories' : 'Most reported category',
      lead: categoryList,
      value: `${highestCount} of ${ranked.length}`,
      valueLabel: tied ? 'Countries reporting each' : 'Countries reporting it',
      detail: tied
        ? `${categoryList} are tied as the most commonly reported categories. ${ranked.length} of ${totalCountryCount} countries have a reported category.`
        : `${categoryList} is the most commonly reported category. ${ranked.length} of ${totalCountryCount} countries have a reported category.`,
      empty: false,
    }
  }

  const leaderValue = ranked[0].value
  const leaders = ranked.filter((row) => row.value === leaderValue)
  const leaderNames = leaders.map((row) => row.country.name)
  const direction = higher ? 'highest' : 'lowest'
  const tied = leaders.length > 1

  return {
    label: tied ? `Reported ${direction} values` : `Reported ${direction} value`,
    lead: tied ? `${leaders.length} countries tied` : leaders[0].country.name,
    value: leaders[0].formatted,
    valueLabel: tied ? 'Tied reported value' : 'Reported value',
    detail: tied
      ? `${listWithAnd(leaderNames)} are tied for the ${direction} reported ${config.name} value in this dataset, at ${leaders[0].formatted}, among ${ranked.length} countries with data.`
      : `${leaders[0].country.name} has the ${direction} reported ${config.name} value in this dataset, at ${leaders[0].formatted}, among ${ranked.length} countries with data.`,
    countryHref: tied
      ? undefined
      : `/country/${countrySlug(leaders[0].country.name)}/`,
    empty: false,
  }
}

export function buildRankingRows(
  config: VariableConfig,
  ranked: RankedRow[]
): RankingRow[] {
  let previousValue: number | undefined
  let currentRank = 0

  return ranked.map((row, index) => {
    if (config.type !== 'numeric') {
      return {
        iso3: row.country.iso3,
        countryName: row.country.name,
        countryHref: `/country/${countrySlug(row.country.name)}/`,
        formatted: row.formatted,
        rank: index + 1,
      }
    }

    if (previousValue === undefined || row.value !== previousValue) {
      currentRank = index + 1
      previousValue = row.value
    }

    return {
      iso3: row.country.iso3,
      countryName: row.country.name,
      countryHref: `/country/${countrySlug(row.country.name)}/`,
      formatted: row.formatted,
      rank: currentRank,
    }
  })
}

import { countrySlug } from '@/lib/seo/slugs'
import { ranksHighFirst, type RankedRow } from '@/lib/seo/catalog'
import { formatRankRange, rankFiniteValues, rankOrderLabel, type ValueOrder } from '@/lib/seo/ranking'
import type { VariableConfig } from '@/types/country'
import type { RankingRow } from './RankingTable'
import { isFiniteRankValue } from './rankingPresentation'

export interface MainFact {
  label: string
  lead: string
  value: string
  valueLabel: string
  detail: string
  rankLabel?: string
  directionLabel?: string
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
  const available = ranked.filter((row) => isFiniteRankValue(row.value))

  if (available.length === 0) {
    const categorical = config.type === 'categorical'
    return {
      label: 'Data status',
      lead: categorical ? 'No reported categories' : 'No reported values',
      value: `0 of ${totalCountryCount}`,
      valueLabel: categorical ? 'Countries with a category' : 'Countries with data',
      detail: `No country in this ${totalCountryCount}-country dataset has a reported ${categorical ? 'category' : 'value'} for ${config.name}.`,
      directionLabel: categorical
        ? undefined
        : rankOrderLabel(higher ? 'highest-first' : 'lowest-first'),
      empty: true,
    }
  }

  if (config.type === 'categorical') {
    const counts = new Map<string, number>()
    for (const row of available) {
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
      value: `${highestCount} of ${available.length}`,
      valueLabel: tied ? 'Countries reporting each' : 'Countries reporting it',
      detail: tied
        ? `${categoryList} are tied as the most commonly reported categories. ${available.length} of ${totalCountryCount} countries have a reported category.`
        : `${categoryList} is the most commonly reported category. ${available.length} of ${totalCountryCount} countries have a reported category.`,
      empty: false,
    }
  }

  const order: ValueOrder = higher ? 'highest-first' : 'lowest-first'
  const rankedValues = rankFiniteValues(available, (row) => row.value, order)
  const leaders = rankedValues.filter((entry) => entry.competitionRank === 1)
  const top = leaders[0]
  const leaderNames = leaders.map((entry) => entry.item.country.name)
  const direction = higher ? 'highest' : 'lowest'
  const tied = leaders.length > 1
  const rangeLabel = formatRankRange(top)
  const total = rankedValues.length

  return {
    label: tied ? `Reported ${direction} values` : `Reported ${direction} value`,
    lead: tied ? `${leaders.length} countries tied` : top.item.country.name,
    value: top.item.formatted,
    valueLabel: tied ? 'Tied reported value' : 'Reported value',
    detail: tied
      ? `${listWithAnd(leaderNames)} are tied for the ${direction} reported ${config.name} value in this dataset, at ${top.item.formatted}, among ${total} countries with data. They share rank ${rangeLabel} of ${total}.`
      : `${top.item.country.name} has the ${direction} reported ${config.name} value in this dataset, at ${top.item.formatted}, among ${total} countries with data. It ranks ${rangeLabel} of ${total}.`,
    rankLabel: `Rank ${rangeLabel} of ${total}`,
    directionLabel: rankOrderLabel(order),
    countryHref: tied
      ? undefined
      : `/country/${countrySlug(top.item.country.name)}/`,
    empty: false,
  }
}

export function buildRankingRows(
  config: VariableConfig,
  ranked: RankedRow[]
): RankingRow[] {
  const available = ranked.filter((row) => isFiniteRankValue(row.value))

  if (config.type !== 'numeric') {
    return available.map((row, index) => ({
      iso3: row.country.iso3,
      countryName: row.country.name,
      countryHref: `/country/${countrySlug(row.country.name)}/`,
      formatted: row.formatted,
      rank: index + 1,
      rankMin: index + 1,
      rankMax: index + 1,
      rangeLabel: formatRankRange({ rankMin: index + 1, rankMax: index + 1 }),
    }))
  }

  const order: ValueOrder = ranksHighFirst(config) ? 'highest-first' : 'lowest-first'
  return rankFiniteValues(available, (row) => row.value, order).map((entry) => ({
    iso3: entry.item.country.iso3,
    countryName: entry.item.country.name,
    countryHref: `/country/${countrySlug(entry.item.country.name)}/`,
    formatted: entry.item.formatted,
    rank: entry.competitionRank,
    rankMin: entry.rankMin,
    rankMax: entry.rankMax,
    rangeLabel: formatRankRange(entry),
  }))
}

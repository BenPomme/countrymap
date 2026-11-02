import assert from 'node:assert/strict'
import test from 'node:test'

import { countries } from '../src/lib/seo/catalog'
import type { RankedRow } from '../src/lib/seo/catalog'
import { resolveClaimDescriptors } from '../src/lib/seo/claims'
import type { ClaimDescriptorMap } from '../src/lib/seo/claims'
import { formatRankRange, rankFiniteValues, rankOrderLabel } from '../src/lib/seo/ranking'

function row(iso3: string, value: number): RankedRow {
  const country = countries.find((candidate) => candidate.iso3 === iso3)
  assert.ok(country, `missing fixture country ${iso3}`)
  return { country, value, formatted: String(value) }
}

test('rankFiniteValues gives explicit competition ranks and tie ranges', () => {
  const items = [
    { id: 'alpha', value: 20 },
    { id: 'beta', value: 20 },
    { id: 'gamma', value: 10 },
    { id: 'delta', value: 5 },
  ]
  const high = rankFiniteValues(items, (item) => item.value, 'highest-first')
  assert.deepEqual(high.map((item) => ({
    id: item.item.id,
    rank: item.competitionRank,
    min: item.rankMin,
    max: item.rankMax,
    tied: item.tied,
  })), [
    { id: 'alpha', rank: 1, min: 1, max: 2, tied: true },
    { id: 'beta', rank: 1, min: 1, max: 2, tied: true },
    { id: 'gamma', rank: 3, min: 3, max: 3, tied: false },
    { id: 'delta', rank: 4, min: 4, max: 4, tied: false },
  ])

  const low = rankFiniteValues(items, (item) => item.value, 'lowest-first')
  assert.deepEqual(low.map((item) => item.item.id), ['delta', 'gamma', 'alpha', 'beta'])
  assert.equal(low[2].competitionRank, 3)
  assert.equal(low[3].rankMax, 4)
  assert.equal(formatRankRange(high[0]), '#1 to #2')
  assert.equal(formatRankRange(high[2]), '#3')
  assert.match(rankOrderLabel('highest-first'), /Rank 1 is the highest stored value/)
  assert.match(rankOrderLabel('lowest-first'), /Rank 1 is the lowest stored value/)
})

test('rankFiniteValues rejects non-finite and non-numeric values without parsing', () => {
  const rejected = [
    NaN,
    Infinity,
    -Infinity,
    '5' as unknown as number,
    null as unknown as number,
    undefined as unknown as number,
    true as unknown as number,
  ]
  for (const value of rejected) {
    assert.throws(
      () => rankFiniteValues([{ value }], (item) => item.value, 'highest-first'),
      RangeError,
    )
  }
  assert.deepEqual(rankFiniteValues([], () => 0, 'highest-first'), [])
})

const DESCRIPTORS: ClaimDescriptorMap = {
  'poverty.gdpPerCapita': [
    {
      countryA: 'DEU',
      countryB: 'GBR',
      direction: 'higher',
      slug: 'germany-vs-united-kingdom-gdp-per-capita',
    },
    {
      countryA: 'FRA',
      countryB: 'RUS',
      direction: 'lower',
      slug: 'france-vs-russia-gdp-per-capita',
    },
  ],
}

function fixtureRows(order: 'baseline' | 'reordered', mutate: boolean): RankedRow[] {
  const values = mutate
    ? [row('RUS', 21000), row('GBR', 70000), row('DEU', 75000), row('FRA', 50000)]
    : [row('DEU', 65699), row('GBR', 61108), row('FRA', 51448), row('RUS', 19953)]
  return order === 'reordered' ? values.reverse() : values
}

test('descriptor identities keep claim URLs when rows are reordered or values mutate', () => {
  const baseline = resolveClaimDescriptors(DESCRIPTORS, () => fixtureRows('baseline', false))
  const changed = resolveClaimDescriptors(DESCRIPTORS, () => fixtureRows('reordered', true))
  const identity = (claims: typeof baseline) => claims.map((claim) => ({
    slug: claim.slug,
    countryA: claim.countryAIso3,
    countryB: claim.countryBIso3,
    direction: claim.direction,
  }))
  assert.deepEqual(identity(changed), identity(baseline))
  assert.deepEqual(identity(baseline).map((claim) => claim.slug), [
    'germany-vs-united-kingdom-gdp-per-capita',
    'france-vs-russia-gdp-per-capita',
  ])
})

test('descriptor resolution fails closed for duplicate, missing, tied, or malformed identities', () => {
  const rows = [row('DEU', 10), row('GBR', 9), row('FRA', 8), row('RUS', 7)]
  const one = DESCRIPTORS['poverty.gdpPerCapita'][0]

  assert.throws(
    () => resolveClaimDescriptors({ 'poverty.gdpPerCapita': [one, one] }, () => rows),
    /Duplicate claim descriptor slug/,
  )
  assert.throws(
    () => resolveClaimDescriptors({
      'poverty.gdpPerCapita': [{ ...one, countryA: 'USA' }],
    }, () => rows),
    /cannot resolve stored country values/,
  )
  assert.throws(
    () => resolveClaimDescriptors({ 'poverty.gdpPerCapita': [one] }, () => [
      row('DEU', 10),
      row('GBR', 10),
      row('FRA', 8),
    ]),
    /tied values/,
  )
  assert.throws(
    () => resolveClaimDescriptors({ 'poverty.gdpPerCapita': [one] }, () => [
      row('DEU', 10),
      row('DEU', 9),
      row('GBR', 8),
    ]),
    /Duplicate country identity/,
  )
  assert.throws(
    () => resolveClaimDescriptors({ 'poverty.gdpPerCapita': [one] }, () => [
      row('DEU', Infinity),
      row('GBR', 9),
    ]),
    /non-finite/,
  )
  assert.throws(
    () => resolveClaimDescriptors({
      'poverty.gdpPerCapita': [{ ...one, slug: 'invalid-slug' }],
    }, () => rows),
    /does not match variable/,
  )
  assert.throws(
    () => resolveClaimDescriptors({
      'poverty.gdpPerCapita': [{ ...one, direction: 'sideways' as 'higher' }],
    }, () => rows),
    /Invalid claim direction/,
  )
})

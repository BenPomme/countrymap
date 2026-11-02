import assert from 'node:assert/strict'
import test from 'node:test'
import type { Country, VariableConfig } from '../src/types/country'
import type { RankedRow } from '../src/lib/seo/catalog'
import { buildMainFact, buildRankingRows } from '../src/components/map/mapFacts'
import { findRankPosition } from '../src/components/map/rankingPresentation'

function makeConfig(overrides: Partial<VariableConfig> = {}): VariableConfig {
  return {
    id: 'test.metric',
    name: 'Test Metric',
    description: 'Test metric description',
    category: 'test',
    type: 'numeric',
    colorScheme: 'test',
    format: (value) => value === null ? 'N/A' : String(value),
    higherIsBetter: true,
    ...overrides,
  }
}

function row(name: string, iso3: string, value: number, formatted = String(value)): RankedRow {
  return {
    country: { name, iso3 } as Country,
    value,
    formatted,
  }
}

test('tie-heavy numeric fixtures use competition ranges in the fact and table', () => {
  const config = makeConfig()
  const rows = [
    row('France', 'FRA', 10),
    row('Italy', 'ITA', 10),
    row('Spain', 'ESP', 10),
    row('Portugal', 'PRT', 8),
    row('Ireland', 'IRL', 8),
    row('Malta', 'MLT', 4),
  ]

  const fact = buildMainFact(config, rows, true, 8)
  assert.equal(fact.lead, '3 countries tied')
  assert.equal(fact.rankLabel, 'Rank #1 to #3 of 6')
  assert.match(fact.detail, /They share rank #1 to #3 of 6/)
  assert.match(fact.directionLabel ?? '', /Rank 1 is the highest stored value/)

  const table = buildRankingRows(config, rows)
  assert.deepEqual(table.map((entry) => entry.rangeLabel), [
    '#1 to #3',
    '#1 to #3',
    '#1 to #3',
    '#4 to #5',
    '#4 to #5',
    '#6',
  ])
  assert.deepEqual(table.map((entry) => entry.rank), [1, 1, 1, 4, 4, 6])
})

test('binary true-false fixtures preserve zero values and explicit lowest-first direction', () => {
  const config = makeConfig({
    name: 'Landlocked',
    format: (value) => value === 1 ? 'true' : value === 0 ? 'false' : 'N/A',
    higherIsBetter: false,
  })
  const rows = [
    row('Chad', 'TCD', 1, 'true'),
    row('Bolivia', 'BOL', 1, 'true'),
    row('Nepal', 'NPL', 1, 'true'),
    row('France', 'FRA', 0, 'false'),
    row('Spain', 'ESP', 0, 'false'),
  ]

  const fact = buildMainFact(config, rows, false, 5)
  assert.equal(fact.value, 'false')
  assert.equal(fact.lead, '2 countries tied')
  assert.equal(fact.rankLabel, 'Rank #1 to #2 of 5')
  assert.match(fact.detail, /lowest reported Landlocked value/)
  assert.match(fact.directionLabel ?? '', /Rank 1 is the lowest stored value/)

  const table = buildRankingRows(config, rows)
  assert.deepEqual(table.map((entry) => entry.formatted), ['false', 'false', 'true', 'true', 'true'])
  assert.deepEqual(table.map((entry) => entry.rangeLabel), ['#1 to #2', '#1 to #2', '#3 to #5', '#3 to #5', '#3 to #5'])

  const nepal = findRankPosition(
    rows,
    (entry) => entry.value,
    (entry) => entry.country.iso3 === 'NPL',
    'lowest-first',
  )
  assert.deepEqual(nepal, {
    competitionRank: 3,
    rankMin: 3,
    rankMax: 5,
    total: 5,
    order: 'lowest-first',
    rangeLabel: '#3 to #5',
    rankLabel: 'Rank #3 to #5 of 5',
    directionLabel: 'Rank 1 is the lowest stored value. Tied values share the same rank range.',
  })
})

test('non-finite values are treated as missing instead of receiving ranks', () => {
  const config = makeConfig()
  const rows = [
    row('Broken High', 'BHG', Number.POSITIVE_INFINITY),
    row('Broken Missing', 'BMG', Number.NaN),
    row('Finite High', 'FHG', 3),
    row('Zero State', 'ZRO', 0),
  ]

  const table = buildRankingRows(config, rows)
  assert.deepEqual(table.map((entry) => entry.iso3), ['FHG', 'ZRO'])
  assert.deepEqual(table.map((entry) => entry.rangeLabel), ['#1', '#2'])

  const emptyFact = buildMainFact(config, rows.slice(0, 2), true, 4)
  assert.equal(emptyFact.empty, true)
  assert.equal(emptyFact.value, '0 of 4')
  assert.match(emptyFact.directionLabel ?? '', /highest stored value/)
})

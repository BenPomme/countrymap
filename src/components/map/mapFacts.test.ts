import assert from 'node:assert/strict'
import test from 'node:test'
import type { Country, VariableConfig } from '@/types/country'
import type { RankedRow } from '@/lib/seo/catalog'
import { buildMainFact, buildRankingRows } from './mapFacts'

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

function makeRow(
  name: string,
  iso3: string,
  value: number,
  formatted = String(value)
): RankedRow {
  return {
    country: { name, iso3 } as Country,
    value,
    formatted,
  }
}

test('names a single numeric leader and links to the country profile', () => {
  const fact = buildMainFact(
    makeConfig(),
    [
      makeRow('France', 'FRA', 90, '90 points'),
      makeRow('Italy', 'ITA', 80, '80 points'),
      makeRow('Spain', 'ESP', 70, '70 points'),
    ],
    true,
    5
  )

  assert.equal(fact.empty, false)
  assert.equal(fact.lead, 'France')
  assert.equal(fact.value, '90 points')
  assert.equal(fact.countryHref, '/country/france/')
  assert.match(fact.detail, /France has the highest reported Test Metric value/)
  assert.match(fact.detail, /among 3 countries with data/)
})

test('reports every numeric leader when the top value is tied', () => {
  const fact = buildMainFact(
    makeConfig(),
    [
      makeRow('France', 'FRA', 90),
      makeRow('Italy', 'ITA', 90),
      makeRow('Spain', 'ESP', 70),
    ],
    true,
    4
  )

  assert.equal(fact.lead, '2 countries tied')
  assert.equal(fact.valueLabel, 'Tied reported value')
  assert.equal(fact.countryHref, undefined)
  assert.match(fact.detail, /France and Italy are tied/)
  assert.doesNotMatch(fact.detail, /France has the lowest/)
})

test('keeps a reported zero as a non-empty result', () => {
  const fact = buildMainFact(
    makeConfig(),
    [makeRow('Zero State', 'ZRO', 0, '0')],
    false,
    2
  )

  assert.equal(fact.empty, false)
  assert.equal(fact.lead, 'Zero State')
  assert.equal(fact.value, '0')
  assert.match(fact.detail, /lowest reported Test Metric value/)
})

test('reports no data without inventing a country or value', () => {
  const fact = buildMainFact(makeConfig(), [], true, 5)

  assert.deepEqual(fact, {
    label: 'Data status',
    lead: 'No reported values',
    value: '0 of 5',
    valueLabel: 'Countries with data',
    detail: 'No country in this 5-country dataset has a reported value for Test Metric.',
    directionLabel: 'Rank 1 is the highest stored value. Tied values share the same rank range.',
    empty: true,
  })
})

test('uses category wording when no categorical data is reported', () => {
  const fact = buildMainFact(
    makeConfig({ name: 'Major Religion', type: 'categorical' }),
    [],
    true,
    5
  )

  assert.equal(fact.lead, 'No reported categories')
  assert.equal(fact.valueLabel, 'Countries with a category')
  assert.equal(
    fact.detail,
    'No country in this 5-country dataset has a reported category for Major Religion.'
  )
})

test('reports shared leading categories without choosing one', () => {
  const fact = buildMainFact(
    makeConfig({
      name: 'Major Religion',
      type: 'categorical',
      categories: ['Christianity', 'Islam', 'Buddhism'],
    }),
    [
      makeRow('Brazil', 'BRA', 0, 'Christianity'),
      makeRow('France', 'FRA', 0, 'Christianity'),
      makeRow('Indonesia', 'IDN', 0, 'Islam'),
      makeRow('Pakistan', 'PAK', 0, 'Islam'),
      makeRow('Thailand', 'THA', 0, 'Buddhism'),
    ],
    true,
    6
  )

  assert.equal(fact.label, 'Most reported categories')
  assert.equal(fact.lead, 'Christianity and Islam')
  assert.equal(fact.value, '2 of 5')
  assert.equal(fact.valueLabel, 'Countries reporting each')
  assert.match(fact.detail, /Christianity and Islam are tied/)
  assert.match(fact.detail, /5 of 6 countries have a reported category/)
})

test('uses competition ranks for numeric ties and keeps zero rows ranked', () => {
  const rows = buildRankingRows(
    makeConfig(),
    [
      makeRow('France', 'FRA', 90),
      makeRow('Italy', 'ITA', 80),
      makeRow('Spain', 'ESP', 80),
      makeRow('Zero State', 'ZRO', 0),
    ]
  )

  assert.deepEqual(rows.map((row) => row.rank), [1, 2, 2, 4])
  assert.deepEqual(rows.map((row) => row.iso3), ['FRA', 'ITA', 'ESP', 'ZRO'])
  assert.equal(rows[3].formatted, '0')
  assert.equal(rows[0].countryHref, '/country/france/')
})

test('keeps categorical table rows alphabetical with hidden ordinal values', () => {
  const rows = buildRankingRows(
    makeConfig({ type: 'categorical' }),
    [
      makeRow('France', 'FRA', 0, 'Christianity'),
      makeRow('Indonesia', 'IDN', 0, 'Islam'),
      makeRow('Thailand', 'THA', 0, 'Buddhism'),
    ]
  )

  assert.deepEqual(rows.map((row) => row.countryName), ['France', 'Indonesia', 'Thailand'])
  assert.deepEqual(rows.map((row) => row.rank), [1, 2, 3])
  assert.deepEqual(rows.map((row) => row.formatted), ['Christianity', 'Islam', 'Buddhism'])
})

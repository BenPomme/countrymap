import assert from 'node:assert/strict'
import test from 'node:test'
import type { Country } from '@/types/country'
import {
  buildMapFilterHref,
  buildMapFilterQuery,
  buildMapShareUrl,
  filterCountriesByMapFilters,
  hasActiveMapFilters,
  mapFiltersToSearchParams,
  parseMapFilters,
  type MapFilters,
} from './mapFilters'

type CountryOverride = Omit<Partial<Country>, 'poverty'> & {
  poverty?: Partial<Country['poverty']>
}

function makeCountry(iso3: string, overrides: CountryOverride = {}): Country {
  const { poverty, ...rest } = overrides
  const country = {
    iso3,
    iso2: iso3.slice(0, 2),
    name: iso3,
    region: 'Europe',
    population: 10,
    ...rest,
    poverty: { gdpPerCapita: 100, ...poverty },
  }

  return country as Country
}

test('parses canonical filters and normalizes region order', () => {
  const filters = parseMapFilters(
    new URLSearchParams(
      'regions=Europe%2CAsia%2CAfrica&populationMin=0&populationMax=1000&gdpMin=0&gdpMax=50000'
    )
  )

  assert.deepEqual(filters, {
    regions: ['Africa', 'Asia', 'Europe'],
    populationMin: 0,
    populationMax: 1000,
    gdpMin: 0,
    gdpMax: 50000,
  })
})

test('accepts legacy aliases, repeated regions and mixed case', () => {
  const filters = parseMapFilters(
    new URLSearchParams(
      'region=asia&region=Europe%2Cafrica&popMin=12&popMax=34&incomeMin=56&incomeMax=78'
    )
  )

  assert.deepEqual(filters, {
    regions: ['Africa', 'Asia', 'Europe'],
    populationMin: 12,
    populationMax: 34,
    gdpMin: 56,
    gdpMax: 78,
  })
})

test('prefers canonical numeric keys and keeps a valid zero', () => {
  const filters = parseMapFilters(
    new URLSearchParams('populationMin=0&popMin=7&gdpMax=0&incomeMax=9')
  )

  assert.equal(filters.populationMin, 0)
  assert.equal(filters.gdpMax, 0)
})

test('ignores empty, unknown and non-finite filters', () => {
  const filters = parseMapFilters(
    new URLSearchParams(
      'regions=&region=Atlantis&populationMin=&popMin=not-a-number&populationMax=Infinity&gdpMin=NaN'
    )
  )

  assert.deepEqual(filters, {})
  assert.equal(hasActiveMapFilters(filters), false)
})

test('filters regions without changing the source order', () => {
  const countries = [
    makeCountry('FRA', { region: 'Europe' }),
    makeCountry('JPN', { region: 'Asia' }),
    makeCountry('USA', { region: 'Americas' }),
  ]

  assert.deepEqual(
    filterCountriesByMapFilters(countries, { regions: ['Asia', 'Americas'] }).map(
      (country) => country.iso3
    ),
    ['JPN', 'USA']
  )
})

test('treats zero as reported while excluding missing values for active bounds', () => {
  const countries = [
    makeCountry('ZRO', {
      population: 0,
      poverty: { gdpPerCapita: 0 },
    }),
    makeCountry('MIS', {
      population: null,
      poverty: { gdpPerCapita: null },
    }),
    makeCountry('TEN', {
      population: 10,
      poverty: { gdpPerCapita: 10 },
    }),
  ]

  assert.deepEqual(
    filterCountriesByMapFilters(countries, { populationMin: 0, gdpMin: 0 }).map(
      (country) => country.iso3
    ),
    ['ZRO', 'TEN']
  )
})

test('applies inclusive population and income bounds', () => {
  const countries = [
    makeCountry('LOW', {
      population: 99,
      poverty: { gdpPerCapita: 99 },
    }),
    makeCountry('MIN', {
      population: 100,
      poverty: { gdpPerCapita: 100 },
    }),
    makeCountry('MAX', {
      population: 200,
      poverty: { gdpPerCapita: 200 },
    }),
    makeCountry('HIGH', {
      population: 201,
      poverty: { gdpPerCapita: 201 },
    }),
  ]
  const filters: MapFilters = {
    populationMin: 100,
    populationMax: 200,
    gdpMin: 100,
    gdpMax: 200,
  }

  assert.deepEqual(
    filterCountriesByMapFilters(countries, filters).map((country) => country.iso3),
    ['MIN', 'MAX']
  )
})

test('keeps countries with missing values when no numeric bound is active', () => {
  const countries = [
    makeCountry('MIS', {
      population: null,
      poverty: { gdpPerCapita: null },
    }),
  ]

  assert.equal(filterCountriesByMapFilters(countries, {}).length, 1)
})

test('emits filters in canonical order for exact link restoration', () => {
  const filters: MapFilters = {
    gdpMax: 50000,
    populationMax: 1000,
    regions: ['Europe', 'Africa', 'Europe'],
    gdpMin: 0,
    populationMin: 0,
  }

  assert.equal(
    mapFiltersToSearchParams(filters).toString(),
    'regions=Africa%2CEurope&populationMin=0&populationMax=1000&gdpMin=0&gdpMax=50000'
  )
  assert.equal(
    buildMapFilterHref('/map/democracy-score/', filters),
    '/map/democracy-score/?regions=Africa%2CEurope&populationMin=0&populationMax=1000&gdpMin=0&gdpMax=50000'
  )
})

test('round trips alias input to canonical URL output', () => {
  const parsed = parseMapFilters(
    new URLSearchParams('region=asia&popMin=0&incomeMax=0')
  )

  assert.equal(
    buildMapFilterQuery(parsed),
    '?regions=Asia&populationMin=0&gdpMax=0'
  )
  assert.deepEqual(
    parseMapFilters(new URLSearchParams(buildMapFilterQuery(parsed))),
    parsed
  )
})

test('builds empty and canonical share URLs without duplicate slashes', () => {
  assert.equal(buildMapFilterQuery({}), '')
  assert.equal(buildMapFilterHref('/map/democracy-score/', {}), '/map/democracy-score/')
  assert.equal(
    buildMapShareUrl('https://theworldtruth.com///', 'map/democracy-score', {
      regions: ['Asia'],
      populationMin: 0,
    }),
    'https://theworldtruth.com/map/democracy-score/?regions=Asia&populationMin=0'
  )
})

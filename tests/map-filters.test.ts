import assert from 'node:assert/strict'
import test from 'node:test'

import type { Country, CountryFilters } from '../src/types/country'
import { filterCountries, getAllCountries } from '../src/lib/data/index'
import { getVariableById } from '../src/lib/seo/catalog'
import {
  activeFilterLabels,
  buildMapShareUrl,
  parseMapFilters,
} from '../src/components/site/mapLinks'

type NumericKey =
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

type MetricCase = {
  name: string
  minKey: NumericKey
  maxKey: NumericKey
  neutralMin: number
  neutralMax: number
  write: (country: Country, value: number | null | undefined) => void
}

const NUMERIC_CASES: MetricCase[] = [
  { name: 'democracy', minKey: 'democracyMin', maxKey: 'democracyMax', neutralMin: 0, neutralMax: 100, write: (c, v) => { c.democracy.score = v as number } },
  { name: 'poverty', minKey: 'povertyMin', maxKey: 'povertyMax', neutralMin: 0, neutralMax: 100, write: (c, v) => { c.poverty.povertyRate = v as number | null } },
  { name: 'gdp', minKey: 'gdpMin', maxKey: 'gdpMax', neutralMin: 0, neutralMax: 100000, write: (c, v) => { c.poverty.gdpPerCapita = v as number | null } },
  { name: 'gender', minKey: 'genderMin', maxKey: 'genderMax', neutralMin: 0, neutralMax: 100, write: (c, v) => { c.gender.wblIndex = v as number | null } },
  { name: 'happiness', minKey: 'happinessMin', maxKey: 'happinessMax', neutralMin: 0, neutralMax: 10, write: (c, v) => { c.lifestyle.happinessIndex = v as number | null } },
  { name: 'iq', minKey: 'iqMin', maxKey: 'iqMax', neutralMin: 0, neutralMax: 200, write: (c, v) => { c.education.avgIQ = v as number | null } },
]

function fixture(
  iso3: string,
  options: { region?: string; religion?: string; conflict?: boolean } = {}
): Country {
  return {
    iso3,
    iso2: iso3.slice(0, 2),
    name: iso3,
    region: options.region ?? 'Europe',
    subregion: 'Test',
    population: 1,
    religion: { major: options.religion ?? 'Christianity', breakdown: {}, importance: null },
    democracy: { score: 50, freedomScore: null, vdemScore: null },
    poverty: { povertyRate: 20, gdpPerCapita: 20000, hdi: null },
    gender: { wblIndex: 50, giiScore: null },
    conflict: {
      hasActiveConflict: options.conflict ?? false,
      peaceIndex: null,
      conflictDeaths: null,
      militarySpendingGdp: null,
    },
    education: { avgIQ: 100 },
    lifestyle: { happinessIndex: 5 },
  } as unknown as Country
}

function withMetric(iso3: string, metric: MetricCase, value: number | null | undefined): Country {
  const country = fixture(iso3)
  metric.write(country, value)
  return country
}

function ids(rows: Country[]): string[] {
  return rows.map((country) => country.iso3)
}

function rangeFilters(minKey: NumericKey, min: number, maxKey?: NumericKey, max?: number): CountryFilters {
  return { [minKey]: min, ...(maxKey !== undefined ? { [maxKey]: max } : {}) } as CountryFilters
}

function boundFilters(key: NumericKey, value: number): CountryFilters {
  return { [key]: value } as CountryFilters
}

for (const metric of NUMERIC_CASES) {
  test(`${metric.name} filtering is finite, inclusive, and zero-safe`, () => {
    const records = [49, 50, 75, 76].map((value) => withMetric(`${metric.name}-${value}`, metric, value))
    const bounded = filterCountries(records, rangeFilters(metric.minKey, 50, metric.maxKey, 75))
    assert.deepEqual(ids(bounded), [`${metric.name}-50`, `${metric.name}-75`])

    const zero = withMetric(`${metric.name}-zero`, metric, 0)
    assert.deepEqual(ids(filterCountries([zero], boundFilters(metric.maxKey, 0))), [`${metric.name}-zero`])
  })

  test(`${metric.name} active bounds reject unknown values but neutral bounds do not`, () => {
    const unknownValues = [null, undefined, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]
    for (let index = 0; index < unknownValues.length; index += 1) {
      const value = unknownValues[index]
      const unknown = withMetric(`${metric.name}-unknown-${index}`, metric, value)
      assert.deepEqual(ids(filterCountries([unknown], boundFilters(metric.minKey, 1))), [])
      assert.deepEqual(ids(filterCountries([unknown], boundFilters(metric.maxKey, 90))), [])
      assert.deepEqual(ids(filterCountries([unknown], {})), [unknown.iso3])

      const neutral = rangeFilters(metric.minKey, metric.neutralMin, metric.maxKey, metric.neutralMax)
      assert.deepEqual(ids(filterCountries([unknown], neutral)), [unknown.iso3])

      const aboveNeutralMax = withMetric(`${metric.name}-above-neutral-${index}`, metric, metric.neutralMax + 1)
      assert.deepEqual(ids(filterCountries([aboveNeutralMax], neutral)), [aboveNeutralMax.iso3])
    }
  })
}

test('religion, region, and conflict filters keep their existing exact-match semantics', () => {
  const records = [
    fixture('islam-asia-conflict', { religion: 'Islam', region: 'Asia', conflict: true }),
    fixture('christian-europe-peace', { religion: 'Christianity', region: 'Europe', conflict: false }),
    fixture('none-americas-peace', { religion: 'None/Unaffiliated', region: 'Americas', conflict: false }),
  ]

  assert.deepEqual(ids(filterCountries(records, { majorReligion: ['Islam', 'None/Unaffiliated'] })), [
    'islam-asia-conflict',
    'none-americas-peace',
  ])
  assert.deepEqual(ids(filterCountries(records, { regions: ['Europe'] })), ['christian-europe-peace'])
  assert.deepEqual(ids(filterCountries(records, { hasConflict: true })), ['islam-asia-conflict'])
  assert.deepEqual(ids(filterCountries(records, { hasConflict: false })), [
    'christian-europe-peace',
    'none-americas-peace',
  ])
  assert.deepEqual(ids(filterCountries(records, { majorReligion: [], regions: [] })), ids(records))
})

test('composed category, region, conflict, happiness, and IQ filters intersect', () => {
  const matching = fixture('matching', { religion: 'Islam', region: 'Asia', conflict: true })
  matching.lifestyle.happinessIndex = 6
  matching.education.avgIQ = 100
  const lowHappiness = fixture('low-happiness', { religion: 'Islam', region: 'Asia', conflict: true })
  lowHappiness.lifestyle.happinessIndex = 4
  const wrongReligion = fixture('wrong-religion', { religion: 'Christianity', region: 'Asia', conflict: true })
  const wrongRegion = fixture('wrong-region', { religion: 'Islam', region: 'Europe', conflict: true })
  const peace = fixture('peace', { religion: 'Islam', region: 'Asia', conflict: false })
  const unknownIq = fixture('unknown-iq', { religion: 'Islam', region: 'Asia', conflict: true })
  unknownIq.education.avgIQ = null

  const filters: CountryFilters = {
    majorReligion: ['Islam'],
    regions: ['Asia'],
    hasConflict: true,
    happinessMin: 5,
    iqMin: 80,
    iqMax: 120,
  }
  assert.deepEqual(
    ids(filterCountries([matching, lowHappiness, wrongReligion, wrongRegion, peace, unknownIq], filters)),
    ['matching']
  )
})

test('parseMapFilters accepts every supported filter and rejects invalid values', () => {
  const params = new URLSearchParams()
  const numericValues: Record<NumericKey, number> = {
    democracyMin: 10,
    democracyMax: 90,
    povertyMin: 1,
    povertyMax: 20,
    gdpMin: 1000,
    gdpMax: 90000,
    genderMin: 20,
    genderMax: 95,
    happinessMin: 2,
    happinessMax: 9,
    iqMin: 60,
    iqMax: 120,
  }
  for (const [key, value] of Object.entries(numericValues)) params.set(key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`), String(value))
  params.append('religion', 'Islam')
  params.append('religion', 'Islam')
  params.append('religion', 'Pastafarian')
  params.append('religion', 'Christianity')
  params.append('region', 'Asia')
  params.append('region', 'Atlantis')
  params.set('conflict', 'false')

  assert.deepEqual(parseMapFilters(params), {
    ...numericValues,
    majorReligion: ['Islam', 'Christianity'],
    regions: ['Asia'],
    hasConflict: false,
  })

  const invalid = new URLSearchParams(
    'democracy_min=-1&democracy_max=101&poverty_min=NaN&poverty_max=Infinity&gdp_min=-1&gdp_max=100001&gender_min=&gender_max=1e999&happiness_min=10.1&happiness_max=-0.1&iq_min=201&iq_max=not-a-number&religion=Pastafarian&region=Atlantis&conflict=maybe'
  )
  assert.deepEqual(parseMapFilters(invalid), {})
})

test('map share URLs round-trip active filters and omit neutral endpoints', () => {
  const filters: CountryFilters = {
    democracyMin: 10,
    democracyMax: 90,
    povertyMin: 1,
    povertyMax: 20,
    gdpMin: 1000,
    gdpMax: 90000,
    genderMin: 20,
    genderMax: 95,
    happinessMin: 2,
    happinessMax: 9,
    iqMin: 60,
    iqMax: 120,
    majorReligion: ['Islam', 'Christianity'],
    regions: ['Asia'],
    hasConflict: false,
  }
  const url = new URL(buildMapShareUrl('happiness-index', filters))
  assert.equal(url.pathname, '/map/happiness-index/')
  const restoredFilters = parseMapFilters(url.searchParams)
  assert.deepEqual(restoredFilters, filters)
  const allCountries = getAllCountries()
  assert.deepEqual(
    ids(filterCountries(allCountries, restoredFilters)),
    ids(filterCountries(allCountries, filters))
  )

  const neutral = Object.fromEntries(
    NUMERIC_CASES.flatMap((metric) => [
      [metric.minKey, metric.neutralMin],
      [metric.maxKey, metric.neutralMax],
    ])
  ) as CountryFilters
  assert.equal(new URL(buildMapShareUrl('happiness-index', neutral)).search, '')
  assert.deepEqual(activeFilterLabels(neutral), [])
  assert.equal(new URL(buildMapShareUrl('Not Safe', {})).pathname, '/map/press-freedom/')
})

test('home selected-content share restoration uses the actual applied filters', () => {
  const allCountries = getAllCountries()
  const homeParams = new URLSearchParams(
    'var=lifestyle.happinessIndex&happiness_min=5&happiness_max=8&iq_min=80&iq_max=120&region=Europe&conflict=false'
  )
  const selectedContent = getVariableById(homeParams.get('var') ?? '')
  assert.ok(selectedContent)

  const homeFilters = parseMapFilters(homeParams)
  const homeResults = filterCountries(allCountries, homeFilters)
  assert.ok(homeResults.length > 0 && homeResults.length < allCountries.length)

  const shared = new URL(buildMapShareUrl(selectedContent.slug, homeFilters))
  assert.equal(shared.pathname, '/map/happiness-index/')
  const restoredFilters = parseMapFilters(shared.searchParams)
  assert.deepEqual(restoredFilters, homeFilters)
  assert.deepEqual(ids(filterCountries(allCountries, restoredFilters)), ids(homeResults))
})

test('empty filters preserve all records and impossible filters return an empty state', () => {
  const records = [fixture('a'), fixture('b', { region: 'Asia', religion: 'Islam', conflict: true })]
  assert.deepEqual(ids(filterCountries(records, {})), ['a', 'b'])
  assert.deepEqual(filterCountries([], { happinessMin: 5 }), [])
  assert.deepEqual(filterCountries(records, { happinessMin: 10, happinessMax: 10 }), [])
  assert.deepEqual(filterCountries(records, { majorReligion: ['Unknown'] }), [])
})

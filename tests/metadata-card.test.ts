import assert from 'node:assert/strict'
import test from 'node:test'

import { generateMetadata, generateStaticParams } from '../src/app/map/[slug]/layout'
import { buildMainFact } from '../src/components/map/mapFacts'
import { VARIABLES, MAJOR_RELIGIONS } from '../src/lib/constants/variables'
import '../src/lib/constants/extraVariables'
import {
  countries,
  rankCountries,
  ranksHighFirst,
  variableEntries,
  type RankedRow,
} from '../src/lib/seo/catalog'
import { mapLongform } from '../src/lib/seo/mapLongform'
import { getMetricProvenance } from '../src/lib/seo/provenance'
import type { Country, VariableConfig } from '../src/types/country'
import {
  buildCategoryColorMap,
  buildGameOgSvg,
  buildMapCardCopy,
  MAGAZINE_COLORS,
  mapOgAssetPath,
  NUMERIC_BLUE_GRADIENT,
  OG_CARD_HEIGHT,
  OG_CARD_WIDTH,
  TRUE_FALSE_OG_COPY,
  TRUTHLE_OG_COPY,
  wrapText,
  type MapCardCopy,
} from '../scripts/og-card-helpers'

function makeConfig(overrides: Partial<VariableConfig> = {}): VariableConfig {
  return {
    id: 'test.metric',
    name: 'Test Metric',
    description: 'Test metric description',
    category: 'test',
    type: 'numeric',
    colorScheme: 'test',
    format: (value) => value == null ? 'N/A' : String(value),
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

function cardFor(slug: string): MapCardCopy {
  const entry = variableEntries.find((candidate) => candidate.slug === slug)
  assert.ok(entry, `missing catalogue entry for ${slug}`)
  return buildMapCardCopy({
    config: VARIABLES[entry.id],
    ranked: rankCountries(entry.id),
    totalCountryCount: countries.length,
    provenance: getMetricProvenance(entry.id),
    longform: mapLongform(entry.slug),
  })
}

function openGraph(metadata: Awaited<ReturnType<typeof generateMetadata>>) {
  return metadata.openGraph as unknown as {
    title?: string
    description?: string
    url?: string
    images?: { url: string; width: number; height: number }[]
  } | undefined
}

function imageFor(metadata: Awaited<ReturnType<typeof generateMetadata>>) {
  const image = openGraph(metadata)?.images?.[0]
  assert.ok(image)
  return image
}

test('military spending card follows leadWithHigh and matches its metadata', async () => {
  const config = VARIABLES['conflict.militarySpendingGdp']
  const card = cardFor('military-spending-gdp')
  const metadata = await generateMetadata({ params: { slug: 'military-spending-gdp' } })

  assert.equal(ranksHighFirst(config), true)
  assert.equal(card.higher, true)
  assert.equal(card.fact.lead, 'Ukraine')
  assert.equal(card.fact.value, '39.6%')
  assert.match(card.question, /highest/)
  assert.doesNotMatch(card.question, /lowest/)
  assert.match(card.description, /Ukraine has the highest reported Military Spending/)
  assert.equal(card.sourceCaption, 'Source: Unknown')
  assert.equal(card.vintageCaption, 'Vintage: Unknown')
  assert.equal(metadata.title, card.title)
  assert.equal(metadata.description, card.description)
  assert.equal(openGraph(metadata)?.title, card.ogTitle)
  assert.equal(openGraph(metadata)?.description, card.description)
})

test('categorical religion card reports the leading category without an extreme', async () => {
  const card = cardFor('major-religion')
  const metadata = await generateMetadata({ params: { slug: 'major-religion' } })

  assert.equal(card.fact.lead, 'Christianity')
  assert.equal(card.fact.value, '94 of 164')
  assert.equal(card.question, 'Which category is most commonly reported for major religion?')
  assert.doesNotMatch(card.question, /highest|lowest/)
  assert.match(card.description, /Christianity is the most commonly reported category/)
  assert.equal(metadata.description, card.description)
  assert.equal(openGraph(metadata)?.title, card.ogTitle)
})

test('no-data card uses the shared empty fact and explicit unknown provenance', () => {
  const config = makeConfig({ name: 'Unreported Metric' })
  const card = buildMapCardCopy({
    config,
    ranked: [],
    totalCountryCount: 164,
    provenance: {
      limitations: [],
      featuredEligible: false,
      quizEligible: false,
    },
  })
  const fact = buildMainFact(config, [], ranksHighFirst(config), 164)

  assert.deepEqual(card.fact, fact)
  assert.equal(card.fact.empty, true)
  assert.equal(card.fact.lead, 'No reported values')
  assert.equal(card.question, 'Which countries report unreported metric?')
  assert.doesNotMatch(card.description, /highest|lowest/)
  assert.equal(card.sourceCaption, 'Source: Unknown')
  assert.equal(card.vintageCaption, 'Vintage: Unknown')
})

test('numeric ties include every leader instead of the first catalogue row', () => {
  const card = buildMapCardCopy({
    config: makeConfig({ name: 'Tied Metric' }),
    ranked: [
      makeRow('France', 'FRA', 10),
      makeRow('Italy', 'ITA', 10),
      makeRow('Spain', 'ESP', 10),
      makeRow('Portugal', 'PRT', 8),
    ],
    totalCountryCount: 6,
    provenance: { limitations: [], featuredEligible: false, quizEligible: false },
  })

  assert.equal(card.fact.lead, '3 countries tied')
  assert.equal(card.fact.value, '10')
  assert.match(card.fact.detail, /France, Italy and Spain are tied/)
  assert.match(card.fact.detail, /They share rank #1 to #3 of 4/)
  assert.equal(card.fact.countryHref, undefined)
})

test('categorical ties include every leading category', () => {
  const card = buildMapCardCopy({
    config: makeConfig({
      name: 'Major Religion',
      type: 'categorical',
      categories: ['Christianity', 'Islam', 'Buddhism'],
    }),
    ranked: [
      makeRow('Brazil', 'BRA', 0, 'Christianity'),
      makeRow('France', 'FRA', 0, 'Christianity'),
      makeRow('Indonesia', 'IDN', 0, 'Islam'),
      makeRow('Pakistan', 'PAK', 0, 'Islam'),
      makeRow('Thailand', 'THA', 0, 'Buddhism'),
    ],
    totalCountryCount: 6,
    provenance: { limitations: [], featuredEligible: false, quizEligible: false },
  })

  assert.equal(card.fact.lead, 'Christianity and Islam')
  assert.equal(card.fact.value, '2 of 5')
  assert.match(card.fact.detail, /Christianity and Islam are tied as the most commonly reported categories/)
  assert.doesNotMatch(card.question, /highest|lowest/)
})

test('unverified provenance keeps the real source label and never invents a year', async () => {
  const card = cardFor('gdp-per-capita')
  const metadata = await generateMetadata({ params: { slug: 'gdp-per-capita' } })

  assert.match(card.sourceCaption, /^Source: IMF World Economic Outlook/)
  assert.match(card.sourceCaption, /edition not independently verified/)
  assert.equal(card.vintageCaption, 'Vintage: Unknown')
  assert.doesNotMatch(card.vintageCaption, /2026/)
  assert.match(String(metadata.description), /Vintage: Unknown/)
})

test('all 106 map routes retain unique canonical, title, and 1200x630 OG identities', async () => {
  assert.equal(OG_CARD_WIDTH, 1200)
  assert.equal(OG_CARD_HEIGHT, 630)
  assert.equal(variableEntries.length, 106)
  assert.equal(generateStaticParams().length, 106)

  const routes = await Promise.all(
    variableEntries.map(async (entry) => ({
      entry,
      metadata: await generateMetadata({ params: { slug: entry.slug } }),
    }))
  )
  const canonicals = routes.map(({ entry, metadata }) => {
    assert.equal(
      metadata.alternates?.canonical,
      `https://theworldtruth.com/map/${entry.slug}/`
    )
    assert.equal(openGraph(metadata)?.url, `https://theworldtruth.com/map/${entry.slug}/`)
    assert.equal(imageFor(metadata).url, `https://theworldtruth.com${mapOgAssetPath(entry.slug)}`)
    assert.equal(imageFor(metadata).width, 1200)
    assert.equal(imageFor(metadata).height, 630)
    return String(metadata.alternates?.canonical)
  })
  const titles = routes.map(({ metadata }) => String(metadata.title))
  const imageUrls = routes.map(({ metadata }) => imageFor(metadata).url)

  assert.equal(new Set(canonicals).size, 106)
  assert.equal(new Set(titles).size, 106)
  assert.equal(new Set(imageUrls).size, 106)
})

test('categorical colours cover every configured category and Unknown', () => {
  const colors = buildCategoryColorMap([...MAJOR_RELIGIONS])
  const values = Object.values(colors)

  assert.deepEqual(Object.keys(colors).sort(), [...MAJOR_RELIGIONS, 'Unknown'].sort())
  assert.equal(new Set(values).size, MAJOR_RELIGIONS.length + 1)
  for (const value of values) assert.notEqual(value, MAGAZINE_COLORS.noData)
  assert.deepEqual([...NUMERIC_BLUE_GRADIENT], ['#e8eeff', '#91a7e8', '#294cc4'])
})

test('heading wrapping keeps every word for every map question', () => {
  for (const entry of variableEntries) {
    const card = cardFor(entry.slug)
    const normalized = card.question.replace(/\s+/g, ' ').trim()
    assert.equal(wrapText(card.question, 68).join(' '), normalized)
    assert.equal(wrapText(card.question, 88).join(' '), normalized)
  }
})

test('game cards share the magazine brand without scores, percentile, merchant, or spoiler claims', () => {
  for (const copy of [TRUTHLE_OG_COPY, TRUE_FALSE_OG_COPY]) {
    const svg = buildGameOgSvg(copy)
    const visibleText = Array.from(svg.matchAll(/>([^<>]+)</g)).map((match) => match[1]).join(' ')
    assert.match(svg, /width="1200" height="630"/)
    assert.ok(svg.includes(MAGAZINE_COLORS.paper))
    assert.ok(svg.includes(MAGAZINE_COLORS.ink))
    assert.ok(svg.includes(MAGAZINE_COLORS.blue))
    assert.ok(svg.includes(MAGAZINE_COLORS.yellow))
    assert.doesNotMatch(visibleText, /89|percentile|merchant|Lien|Cie|coupon|TRUTHLE10/i)
    assert.doesNotMatch(visibleText, /Which country|highest|lowest|top 11|5 questions/i)
  }
})

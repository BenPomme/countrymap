import assert from 'node:assert/strict'
import test from 'node:test'
import {
  DEFAULT_CHART_STATE,
  chartStateHref,
  normalizeChartState,
  parseChartState,
  serializeChartState,
} from '../src/app/charts/chartState'
import {
  DEFAULT_DISCOVERY_STATE,
  discoveryStateHref,
  filterAndSortDiscoveries,
  findDiscoveryPair,
  normalizeDiscoveryState,
  parseDiscoveryState,
  serializeDiscoveryState,
  type DiscoveryRecord,
} from '../src/app/discoveries/discoveryState'
import {
  quizMetricId,
  selectProvenanceEligibleQuestions,
} from '../src/app/quiz/quizEligibility'
import {
  absoluteSiteUrl,
  buildShareFilename,
  buildWhatsAppShareUrl,
  clipboardFailureStatus,
  FALLBACK_SHARE_CONTENT_ID,
  isNativeShareCancellation,
  metricShareContentId,
  nativeShareFailureKind,
  normalizeShareCopy,
  resolveShareContentId,
  sanitizeAnalyticsValue,
} from '../src/components/share/shareState'
import {
  buildCardSourceLines,
  wrapExactText,
  wrapTextLines,
} from '../src/components/share/shareCard'
import { resolveShareProvenance } from '../src/components/share/provenance'
import { sourceNote } from '../src/lib/seo/sourceNotes'
import {
  normalizeAdFillState,
  shouldRenderAdBanner,
} from '../src/components/ads/AdBanner'

const numericVariables = new Set([
  DEFAULT_CHART_STATE.x,
  DEFAULT_CHART_STATE.y,
  DEFAULT_CHART_STATE.metric,
  'economy.gdpGrowth',
  'freedom.pressFreedom',
])

test('chart state restores valid direct links and rejects unknown identifiers', () => {
  const valid = parseChartState(
    new URLSearchParams(
      'chart=ranking&x=economy.gdpGrowth&y=freedom.pressFreedom&color=region&metric=economy.gdpGrowth',
    ),
    numericVariables,
  )
  assert.deepEqual(valid, {
    chart: 'ranking',
    x: 'economy.gdpGrowth',
    y: 'freedom.pressFreedom',
    color: 'region',
    metric: 'economy.gdpGrowth',
  })
  assert.equal(chartStateHref(valid), `/charts?${serializeChartState(valid)}`)

  const malformed = parseChartState(
    new URLSearchParams(
      `chart=unknown&x=not.a.metric&y=${'x'.repeat(121)}&color=green&metric=../../private`,
    ),
    numericVariables,
  )
  assert.deepEqual(malformed, DEFAULT_CHART_STATE)
  assert.deepEqual(normalizeChartState({ chart: 'scatter', metric: 'missing' }, numericVariables), {
    ...DEFAULT_CHART_STATE,
    chart: 'scatter',
  })
})

test('chart serialization round-trips the metric and both axes', () => {
  const state = {
    chart: 'correlation' as const,
    x: 'freedom.pressFreedom',
    y: 'economy.gdpGrowth',
    color: 'religion' as const,
    metric: 'economy.gdpGrowth',
  }
  const roundTrip = parseChartState(new URLSearchParams(serializeChartState(state)), numericVariables)
  assert.deepEqual(roundTrip, state)
})

const records: DiscoveryRecord[] = [
  {
    var1: 'a',
    var2: 'b',
    var1Name: 'Alpha life',
    var2Name: 'Beta wealth',
    categoryNames: ['Economy', 'Health'],
    categories: ['economy', 'health'],
    strength: 'very_strong',
    direction: 'positive',
    coefficient: 0.91,
    sampleSize: 100,
    interestingScore: 2,
    crossCategory: true,
  },
  {
    var1: 'b',
    var2: 'a',
    var1Name: 'Beta wealth',
    var2Name: 'Alpha life',
    categoryNames: ['Health', 'Economy'],
    categories: ['health', 'economy'],
    strength: 'moderate',
    direction: 'negative',
    coefficient: -0.44,
    sampleSize: 200,
    interestingScore: 1,
    crossCategory: true,
  },
  {
    var1: 'c',
    var2: 'd',
    var1Name: 'Gamma work',
    var2Name: 'Delta trust',
    categoryNames: ['Economy', 'Governance'],
    categories: ['economy', 'governance'],
    strength: 'strong',
    direction: 'positive',
    coefficient: 0.74,
    sampleSize: 50,
    interestingScore: 3,
    crossCategory: true,
  },
  {
    var1: 'd',
    var2: 'c',
    var1Name: 'Delta trust',
    var2Name: 'Gamma work',
    categoryNames: ['Governance', 'Economy'],
    categories: ['governance', 'economy'],
    strength: 'very_strong',
    direction: 'positive',
    coefficient: 0.82,
    sampleSize: 20,
    interestingScore: 4,
    crossCategory: true,
  },
]

const options = {
  categories: ['economy', 'governance', 'health'],
  pairs: [
    ['a', 'b'] as const,
    ['c', 'd'] as const,
  ],
}

test('discovery state validates filters and canonicalizes a reversed pair', () => {
  const parsed = parseDiscoveryState(
    new URLSearchParams(
      'q=life&category=economy&strength=strong&direction=positive&cross=1&sort=sample&x=b&y=a',
    ),
    options,
  )
  assert.deepEqual(parsed, {
    q: 'life',
    category: 'economy',
    strength: 'strong',
    direction: 'positive',
    cross: true,
    sort: 'sample',
    pair: { x: 'a', y: 'b' },
  })
  assert.equal(
    discoveryStateHref(parsed),
    '/discoveries?q=life&category=economy&strength=strong&direction=positive&cross=1&sort=sample&x=a&y=b',
  )

  const malformed = parseDiscoveryState(
    new URLSearchParams('category=private&strength=impossible&direction=sideways&sort=random&x=a&y=missing'),
    options,
  )
  assert.deepEqual(malformed, DEFAULT_DISCOVERY_STATE)
  assert.equal(
    normalizeDiscoveryState({ pair: { x: 'missing', y: 'also-missing' } }, options).pair,
    null,
  )
})

test('discovery links round-trip and unknown pairs do not resolve', () => {
  const state = {
    ...DEFAULT_DISCOVERY_STATE,
    q: 'wealth',
    category: 'health',
    cross: true,
    pair: { x: 'c', y: 'd' },
  }
  assert.deepEqual(
    parseDiscoveryState(new URLSearchParams(serializeDiscoveryState(state)), options),
    state,
  )
  assert.equal(findDiscoveryPair(records, { x: 'a', y: 'missing' }), null)
  assert.equal(findDiscoveryPair(records, { x: 'b', y: 'a' })?.var1, 'b')
})

test('discovery filters combine and supported sorts are deterministic', () => {
  const bySample = filterAndSortDiscoveries(records, {
    ...DEFAULT_DISCOVERY_STATE,
    sort: 'sample',
  })
  assert.deepEqual(
    bySample.map((record) => record.sampleSize),
    [200, 100, 50, 20],
  )

  const strongPositive = filterAndSortDiscoveries(records, {
    ...DEFAULT_DISCOVERY_STATE,
    strength: 'strong',
    direction: 'positive',
    category: 'economy',
    sort: 'strength',
  })
  assert.deepEqual(
    strongPositive.map((record) => record.coefficient),
    [0.91, 0.82, 0.74],
  )

  const searched = filterAndSortDiscoveries(records, {
    ...DEFAULT_DISCOVERY_STATE,
    q: 'delta',
    sort: 'strength',
  })
  assert.deepEqual(
    searched.map((record) => record.sampleSize),
    [20, 50],
  )
})

test('quiz extraction and eligibility fail closed on inadequate provenance', () => {
  assert.equal(quizMetricId('highest-health.lifeExpectancy-123'), 'health.lifeExpectancy')
  assert.equal(quizMetricId('lowest-economy.gdpGrowth-456'), 'economy.gdpGrowth')
  assert.equal(quizMetricId('compare-education.avgIQ-789'), 'education.avgIQ')
  assert.equal(quizMetricId('truefalse-freedom.pressFreedom-101'), 'freedom.pressFreedom')
  assert.equal(quizMetricId('guess-poverty.hdi-202'), 'poverty.hdi')
  assert.equal(quizMetricId('unrecognized-question-303'), null)

  const questions = [
    { id: 'highest-good.metric-1' },
    { id: 'lowest-missing.metric-2' },
    { id: 'compare-good.metric-3' },
    { id: 'guess-broken.metric-4' },
    { id: 'highest-good.metric-1' },
  ]
  const selected = selectProvenanceEligibleQuestions(
    questions,
    (metricId) => {
      if (metricId === 'broken.metric') throw new Error('unknown provenance')
      if (metricId === 'good.metric') return { quizEligible: true }
      return { quizEligible: false }
    },
    5,
  )
  assert.deepEqual(
    selected.map((question) => question.id),
    ['highest-good.metric-1', 'compare-good.metric-3'],
  )
})

test('share helpers use canonical copy, truthful cancellation, and exact destinations', () => {
  assert.equal(normalizeShareCopy('  A fact \u2014 with  space  '), 'A fact - with space')
  assert.equal(
    sanitizeAnalyticsValue('chart?email=private&token=secret', 'fallback'),
    'chart_email_private_token_secret',
  )
  assert.equal(resolveShareContentId(), 'shared_visual')
  assert.equal(resolveShareContentId('discovery_pair'), 'discovery_pair')
  assert.equal(resolveShareContentId('chart?token=secret'), FALLBACK_SHARE_CONTENT_ID)
  assert.equal(resolveShareContentId('Alpha life and Beta wealth'), FALLBACK_SHARE_CONTENT_ID)
  assert.equal(
    metricShareContentId('chart_correlation', ['health.penisSize', 'democracy.score']),
    'chart_correlation_health.penisSize_democracy.score',
  )
  assert.equal(
    metricShareContentId('discovery_correlation', ['Alpha life', 'Beta wealth']),
    FALLBACK_SHARE_CONTENT_ID,
  )

  const whatsapp = buildWhatsAppShareUrl('A measured fact', 'https://theworldtruth.com/charts?x=a&y=b')
  assert.match(whatsapp, /^https:\/\/wa\.me\/\?text=/)
  assert.equal(decodeURIComponent(whatsapp.split('=')[1]).includes('https://theworldtruth.com/charts?x=a&y=b'), true)

  assert.equal(isNativeShareCancellation({ name: 'AbortError' }), true)
  assert.equal(isNativeShareCancellation({ name: 'NotAllowedError' }), false)
  assert.equal(isNativeShareCancellation(new Error('cancel')), false)
  assert.equal(nativeShareFailureKind({ name: 'AbortError' }), 'cancelled')
  assert.equal(nativeShareFailureKind({ name: 'NotAllowedError' }), 'denied')
  assert.equal(nativeShareFailureKind({ name: 'NotSupportedError' }), 'unavailable')
  assert.equal(nativeShareFailureKind(new Error('blocked')), 'failed')
  assert.equal(clipboardFailureStatus({ name: 'NotAllowedError' }), 'denied')
  assert.equal(clipboardFailureStatus({ name: 'NotSupportedError' }), 'unavailable')
  assert.equal(clipboardFailureStatus(new Error('write failed')), 'failed')

  assert.equal(buildShareFilename('A / B: C'), 'a-b-c-theworldtruth.png')
  assert.equal(
    absoluteSiteUrl('/charts?x=a&y=b'),
    'https://theworldtruth.com/charts?x=a&y=b',
  )
  assert.equal(absoluteSiteUrl('charts?x=a'), 'https://theworldtruth.com/charts?x=a')
  assert.equal(absoluteSiteUrl('//private.example/path'), 'https://theworldtruth.com/')
  assert.equal(absoluteSiteUrl('javascript:alert(1)'), 'https://theworldtruth.com/')
})

test('share-card line wrapping truncates on word boundaries at the final line', () => {
  const measure = (value: string) => value.length * 10
  assert.deepEqual(wrapTextLines('alpha beta gamma delta', 100, 2, measure), [
    'alpha beta',
    'gamma...',
  ])
  assert.deepEqual(wrapTextLines('abcdefghij', 50, 1, measure), ['ab...'])
})

test('exact share-card wrapping preserves every URL character or fails closed', () => {
  const measure = (value: string) => value.length * 10
  const url = 'https://theworldtruth.com/charts?chart=ranking&x=gdp&y=trust&color=region'
  assert.deepEqual(wrapExactText(url, 400, 4, measure)?.join(''), url)
  assert.equal(wrapExactText(url, 100, 1, measure), null)
  assert.deepEqual(wrapExactText('short', 100, 1, measure), ['short'])
})

test('share cards keep the full source and vintage or fail closed', () => {
  const measure = (value: string) => value.length * 10
  const source = 'Reporters Without Borders (RSF) World Press Freedom Index 2026'
  const vintage = 'RSF 2026 index (global scores, two decimals)'
  assert.equal(buildCardSourceLines(source, vintage, measure, 1072).join(''), `Source: ${source} | Vintage: ${vintage}`)
  assert.throws(() => buildCardSourceLines(source, vintage, measure, 100))
})

test('share provenance says Unknown when a measure has no verified vintage', () => {
  const note = sourceNote('freedom.pressFreedom')
  assert.ok(note)
  const known = resolveShareProvenance(['freedom.pressFreedom'])
  assert.equal(known.sourceName, note.source)
  assert.equal(known.sourceVintage, note.vintage)

  const mixed = resolveShareProvenance(['freedom.pressFreedom', 'not.a.measured.metric'])
  assert.match(mixed.sourceVintage, /Unknown for one or more measures/)
  assert.doesNotMatch(mixed.sourceVintage, /latest available release per source/i)
  assert.equal(resolveShareProvenance([]).sourceVintage, 'Unknown')
  assert.equal(resolveShareProvenance(['not.a.measured.metric']).sourceVintage, 'Unknown')
})

test('ad banner helper collapses disabled and unfilled placements', () => {
  assert.equal(normalizeAdFillState(' FILLED '), 'filled')
  assert.equal(normalizeAdFillState('UNFILLED'), 'unfilled')
  assert.equal(normalizeAdFillState('error'), 'waiting')

  const base = { embedded: false, disabled: false, slotId: '123', fillState: 'waiting' as const }
  assert.equal(shouldRenderAdBanner(base), true)
  assert.equal(shouldRenderAdBanner({ ...base, fillState: 'filled' }), true)
  assert.equal(shouldRenderAdBanner({ ...base, fillState: 'unfilled' }), false)
  assert.equal(shouldRenderAdBanner({ ...base, embedded: true }), false)
  assert.equal(shouldRenderAdBanner({ ...base, disabled: true }), false)
  assert.equal(shouldRenderAdBanner({ ...base, slotId: '' }), false)
})

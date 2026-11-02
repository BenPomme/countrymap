import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import test from 'node:test'

import {
  claimSourceDetails,
  getAllClaims,
  getClaimDescriptors,
} from '../src/lib/seo/claims'
import { rankCountries, type RankedRow } from '../src/lib/seo/catalog'
import { getMetricProvenance } from '../src/lib/seo/provenance'
import { rankFiniteValues, type RankedValue } from '../src/lib/seo/ranking'

const CLAIMS = getAllClaims()
const SORTED_SLUG_HASH = '5c7fcf9d9db96bb611c3fad2e1c4eee1f4b8487f53c60fa6f0dac5d97cb648b3'
const SORTED_ANSWER_HASH = 'd4a77cd202c391401177326f4f557052269072bf2cc3d6b21183aa46cb3bf00e'
const STALE_SLUGS = [
  'italy-vs-spain-mcdonald-s-per-capita',
  'south-korea-vs-sweden-mcdonald-s-per-capita',
  'sweden-vs-egypt-mcdonald-s-per-capita',
]
const REPLACEMENT_SLUGS = [
  'south-africa-vs-turkey-mcdonald-s-per-capita',
  'spain-vs-south-korea-mcdonald-s-per-capita',
  'turkey-vs-indonesia-mcdonald-s-per-capita',
]

function sortedHash(values: readonly string[]): string {
  return createHash('sha256').update([...values].sort().join('\n')).digest('hex')
}

test('preserves exactly 270 audited claim slugs and answers', () => {
  assert.equal(CLAIMS.length, 270)
  assert.equal(new Set(CLAIMS.map((claim) => claim.slug)).size, 270)
  assert.equal(CLAIMS.filter((claim) => claim.answer).length, 153)
  assert.equal(CLAIMS.filter((claim) => !claim.answer).length, 117)
  assert.equal(sortedHash(CLAIMS.map((claim) => claim.slug)), SORTED_SLUG_HASH)
  assert.equal(sortedHash(CLAIMS.map((claim) => `${claim.slug}\t${claim.answer}`)), SORTED_ANSWER_HASH)

  const urls = new Set(CLAIMS.map((claim) => `/true-false/claims/${claim.slug}/`))
  assert.equal(urls.size, 270)
  for (const stale of STALE_SLUGS) assert.equal(urls.has(`/true-false/claims/${stale}/`), false)
  for (const replacement of REPLACEMENT_SLUGS) assert.equal(urls.has(`/true-false/claims/${replacement}/`), true)
  assert.equal(CLAIMS.filter((claim) => claim.variableId === 'education.avgIQ').length, 3)
})

test('descriptor identities are stable and match every current claim', () => {
  const descriptorMap = getClaimDescriptors()
  assert.equal(Object.keys(descriptorMap).length, 92)
  const claimsBySlug = new Map(CLAIMS.map((claim) => [claim.slug, claim]))
  let descriptorCount = 0

  for (const [variableId, descriptors] of Object.entries(descriptorMap)) {
    for (const descriptor of descriptors) {
      descriptorCount += 1
      assert.deepEqual(Object.keys(descriptor).sort(), ['countryA', 'countryB', 'direction', 'slug'])
      assert.match(descriptor.countryA, /^[A-Z]{3}$/)
      assert.match(descriptor.countryB, /^[A-Z]{3}$/)
      assert.ok(descriptor.direction === 'higher' || descriptor.direction === 'lower')
      const claim = claimsBySlug.get(descriptor.slug)
      assert.ok(claim, descriptor.slug)
      assert.equal(claim.variableId, variableId)
      assert.equal(claim.countryAIso3, descriptor.countryA)
      assert.equal(claim.countryBIso3, descriptor.countryB)
      assert.equal(claim.direction, descriptor.direction)
    }
  }
  assert.equal(descriptorCount, 270)
})

test('every answer is the current finite raw-value comparison for its direction', () => {
  for (const claim of CLAIMS) {
    assert.equal(typeof claim.a.value, 'number', claim.slug)
    assert.equal(typeof claim.b.value, 'number', claim.slug)
    assert.ok(Number.isFinite(claim.a.value), claim.slug)
    assert.ok(Number.isFinite(claim.b.value), claim.slug)
    assert.notEqual(claim.a.value, claim.b.value, claim.slug)
    assert.ok(claim.a.formatted && claim.b.formatted, claim.slug)
    const expected = claim.direction === 'higher'
      ? claim.a.value > claim.b.value
      : claim.a.value < claim.b.value
    assert.equal(claim.answer, expected, claim.slug)
  }
})

test('every displayed rank is a highest-first competition rank with explicit ties', () => {
  const ranksByVariable = new Map<string, Map<string, RankedValue<RankedRow>>>()
  let tiePages = 0

  for (const claim of CLAIMS) {
    let ranks = ranksByVariable.get(claim.variableId)
    if (!ranks) {
      const ranked = rankFiniteValues(rankCountries(claim.variableId), (row) => row.value, 'highest-first')
      ranks = new Map(ranked.map((row) => [row.item.country.iso3, row]))
      ranksByVariable.set(claim.variableId, ranks)
    }
    const a = ranks.get(claim.countryAIso3)
    const b = ranks.get(claim.countryBIso3)
    assert.ok(a, claim.slug)
    assert.ok(b, claim.slug)
    assert.equal(claim.rankOrder, 'highest-first')
    assert.equal(claim.total, ranks.size)
    assert.deepEqual(claim.rankA, {
      competitionRank: a.competitionRank,
      rankMin: a.rankMin,
      rankMax: a.rankMax,
      tied: a.tied,
    })
    assert.deepEqual(claim.rankB, {
      competitionRank: b.competitionRank,
      rankMin: b.rankMin,
      rankMax: b.rankMax,
      tied: b.tied,
    })
    for (const rank of [claim.rankA, claim.rankB]) {
      assert.equal(rank.competitionRank, rank.rankMin)
      assert.equal(rank.tied, rank.rankMax > rank.rankMin)
      assert.ok(rank.rankMin >= 1 && rank.rankMax <= claim.total)
    }
    if (claim.rankA.tied || claim.rankB.tied) tiePages += 1
  }
  assert.equal(tiePages, 199)
})

test('claim provenance labels unknown source and vintage honestly and keeps limitations public', () => {
  let unknownSourceClaims = 0

  for (const claim of CLAIMS) {
    const details = claimSourceDetails(claim)
    const provenance = getMetricProvenance(claim.variableId)
    const expectedCoverage = provenance.coverage ?? claim.coveragePct
    assert.equal(details.sourceName, provenance.sourceName?.trim() || 'Unknown', claim.slug)
    assert.equal(details.sourceUrl, provenance.sourceUrl, claim.slug)
    assert.equal(details.vintage, provenance.year?.trim() || 'Unknown', claim.slug)
    assert.equal(details.coveragePct, expectedCoverage, claim.slug)
    const actualCoveragePct = (claim.total / claim.datasetTotal) * 100
    assert.ok(Math.abs(details.coveragePct - actualCoveragePct) < 0.0501, claim.slug)
    assert.equal(details.coverageLabel, `${claim.total} of ${claim.datasetTotal} country records (${expectedCoverage.toFixed(1)}%)`)
    assert.match(details.comparisonBasis, /stored dataset values/)
    assert.match(details.comparisonBasis, /source link alone is not verification/)
    assert.ok(details.limitations.length > 0, claim.slug)
    for (const limitation of details.limitations) {
      assert.doesNotMatch(limitation, /eligible|featured|quiz|promotion|browseable/i, claim.slug)
    }
    if (details.sourceName === 'Unknown') unknownSourceClaims += 1
  }
  assert.equal(unknownSourceClaims, 252)

  const unknown = claimSourceDetails(CLAIMS.find((claim) => claim.variableId === 'democracy.score')!)
  assert.equal(unknown.sourceName, 'Unknown')
  assert.equal(unknown.sourceUrl, undefined)
  assert.equal(unknown.vintage, 'Unknown')
  assert.equal(unknown.coveragePct, 100)
  assert.equal(unknown.editorialReviewRequired, true)
  assert.ok(unknown.limitations.some((limitation) => /No complete primary-source reconciliation/.test(limitation)))

  const pressFreedom = claimSourceDetails(CLAIMS.find((claim) => claim.variableId === 'freedom.pressFreedom')!)
  assert.match(pressFreedom.sourceUrl ?? '', /^https:\/\/rsf\.org\//)
  assert.equal(pressFreedom.vintage, '2026')
  assert.equal(pressFreedom.editorialReviewRequired, true)

  const limitedCoverage = claimSourceDetails(CLAIMS.find((claim) => claim.variableId === 'economy.billionairesPerCapita')!)
  assert.equal(limitedCoverage.coveragePct, 42.7)
  assert.equal(limitedCoverage.editorialReviewRequired, true)
})

test('claim copy preserves configured names, acronyms, brands, and binary-status wording', () => {
  const requiredNames = [
    'GDP per Capita',
    'GDP per Capita (PPP)',
    'CO2 per Capita',
    "McDonald's per Capita",
    'Starbucks per Capita',
    'EV Adoption',
    'VAT/Sales Tax Rate',
    'FDI Inflows (% GDP)',
    'LGBT+ Acceptance',
    'Average IQ',
    'PISA Math Score',
    'Big Mac Price (USD)',
  ]
  for (const name of requiredNames) {
    assert.ok(CLAIMS.some((claim) => claim.variableName === name), name)
  }

  const lowercaseFragments = ['gdp', 'ppp', 'co2', 'lgbt+', 'pisa', 'average iq', 'vat', 'fdi', 'usd', "mcdonald's", 'starbucks', 'ev adoption']
  for (const claim of CLAIMS) {
    assert.doesNotMatch(claim.text, /[—–]/, claim.slug)
    assert.ok(claim.text.includes(claim.variableName), claim.slug)
    assert.match(claim.text, /^.+ has a (?:higher|lower) (?:legal-status )?value for the .+ metric than .+\.$/)
    for (const fragment of lowercaseFragments) {
      assert.equal(claim.text.includes(fragment), false, `${claim.slug}: ${fragment}`)
    }
  }

  const massNounVariables = new Set([
    'economy.startupUnicorns',
    'economy.touristArrivals',
    'economy.renewableEnergy',
    'demographics.urbanPopulation',
    'lifestyle.internetPenetration',
    'lifestyle.videoGamePlayers',
    'transport.bicycleUsage',
    'religion.importance',
  ])
  const massNounClaims = CLAIMS.filter((claim) => massNounVariables.has(claim.variableId))
  assert.equal(massNounClaims.length, 24)
  for (const claim of massNounClaims) {
    assert.doesNotMatch(claim.text, /\bhas a (?:higher|lower) (?:startup unicorns|tourist arrivals|renewable energy|urban population|internet users|video game players|bicycle usage|religion very important)\b/i)
  }

  const binaryClaims = CLAIMS.filter((claim) =>
    claim.variableId === 'freedom.gamblingLegal' || claim.variableId === 'sex.prostitutionLegal')
  assert.equal(binaryClaims.length, 3)
  for (const claim of binaryClaims) {
    assert.match(claim.text, /legal-status value/)
    assert.doesNotMatch(claim.text, /has a (?:higher|lower) (?:gambling|prostitution) legal/i)
  }
})

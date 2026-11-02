import assert from 'node:assert/strict'
import test from 'node:test'

import type { Country } from '../src/types/country'
import { countries } from '../src/lib/data/loadCountries'
import {
  generateDailyQuestions,
  type TruthleQuestion,
} from '../src/lib/truthle/generator'
import {
  generateTrueFalseClaims,
  generateTrueFalseQuestions,
  type ProvenancedTrueFalseClaim,
} from '../src/lib/truthle/trueFalse'

const VERIFIED_VARIABLES = new Set([
  'freedom.pressFreedom',
  'lifestyle.happinessIndex',
])

const DATES = [
  '2026-11-02',
  '2026-11-03',
  '2026-12-31',
  '2027-01-01',
  '2028-02-29',
  '2030-06-15',
]

function assertCompleteProvenance(question: TruthleQuestion | ProvenancedTrueFalseClaim): void {
  assert.ok(question.provenance.length > 0)
  assert.ok(question.limitations.length > 0)
  for (const provenance of question.provenance) {
    assert.equal(provenance.quizEligible, true)
    assert.match(provenance.sourceUrl ?? '', /^https:\/\//)
    assert.ok(provenance.sourceName)
    assert.ok(provenance.year)
    assert.equal(typeof provenance.coverage, 'number')
    assert.ok((provenance.coverage ?? 0) > 0)
    assert.ok(provenance.limitations.length > 0)
  }
}

function assertVerifiedDailyQuestions(questions: TruthleQuestion[]): void {
  assert.equal(questions.length, 5)
  assert.equal(new Set(questions.map((question) => question.id)).size, 5)

  const correlationTypes = new Set(['direction', 'yes_no', 'strongest_pair'])
  const regularTypes = new Set(
    questions
      .filter((question) => !correlationTypes.has(question.type))
      .map((question) => question.type)
  )
  assert.deepEqual(Array.from(regularTypes).sort(), ['compare', 'highest', 'lowest'])

  for (const question of questions) {
    assertCompleteProvenance(question)
    if (correlationTypes.has(question.type)) {
      assert.equal(question.provenance.length, 2)
      assert.match(question.id, /freedom\.pressFreedom/)
      assert.match(question.id, /lifestyle\.happinessIndex/)
      continue
    }

    assert.ok(question.variablePath)
    assert.equal(VERIFIED_VARIABLES.has(question.variablePath), true)
    assert.ok(question.correctAnswer >= 0)
    assert.ok(question.correctAnswer < question.options.length)

    if (question.type === 'compare') {
      assert.equal(question.options.length, 2)
      assert.notEqual(question.options[0], question.options[1])
    } else {
      assert.equal(question.options.length, 4)
      assert.equal(new Set(question.options).size, 4)
    }
  }
}

function assertVerifiedTrueFalseClaims(claims: ProvenancedTrueFalseClaim[]): void {
  assert.equal(claims.length, 5)
  assert.equal(new Set(claims.map((claim) => claim.id)).size, 5)
  assert.ok(claims.filter((claim) => claim.answer).length >= 2)
  assert.ok(claims.filter((claim) => claim.answer).length <= 3)

  for (const claim of claims) {
    assert.equal(VERIFIED_VARIABLES.has(claim.mapSlugVar), true)
    assertCompleteProvenance(claim)
  }
}

function syntheticCountries(): Country[] {
  return Array.from({ length: 5 }, (_, index) => ({
    iso3: `T${String(index).padStart(2, '0')}`,
    name: `Test ${index}`,
    freedom: { pressFreedom: 20 + index * 10 },
    lifestyle: { happinessIndex: 3 + index },
  })) as unknown as Country[]
}

test('daily Truthle generates five verified deterministic questions across UTC dates', () => {
  for (const date of DATES) {
    const first = generateDailyQuestions(countries, date)
    const second = generateDailyQuestions(countries, date)

    assertVerifiedDailyQuestions(first)
    assert.deepEqual(second, first)
  }
})

test('Truthle reuses only the two verified metrics without duplicate identities', () => {
  for (const date of DATES) {
    const questions = generateDailyQuestions(countries, date)
    const regularVariableIds = questions
      .filter((question) => VERIFIED_VARIABLES.has(question.variablePath ?? ''))
      .map((question) => question.variablePath)

    assert.ok(new Set(regularVariableIds).size < regularVariableIds.length)
  }
})

test('True or False generates five verified deterministic claims across UTC dates', () => {
  for (const date of DATES) {
    const first = generateTrueFalseClaims(countries, date)
    const second = generateTrueFalseClaims(countries, date)
    const alias = generateTrueFalseQuestions(countries, date)

    assertVerifiedTrueFalseClaims(first)
    assert.deepEqual(second, first)
    assert.deepEqual(alias, first)
  }
})

test('insufficient country data fails closed instead of using unverified fallbacks', () => {
  const countriesWithTooFewValues = syntheticCountries()
  assert.deepEqual(generateDailyQuestions(countriesWithTooFewValues, '2026-11-02'), [])
  assert.deepEqual(generateTrueFalseClaims(countriesWithTooFewValues, '2026-11-02'), [])
})

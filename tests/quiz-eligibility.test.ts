import test from 'node:test'
import assert from 'node:assert/strict'
import { selectProvenanceEligibleQuestions } from '../src/app/quiz/quizEligibility'

const eligibleLookup = () => ({ quizEligible: true })

test('deduplicates the same normalized prompt and correct-answer meaning across IDs and option order', () => {
  const questions = [
    {
      id: 'highest-freedom.pressFreedom-100',
      question: 'Which country has the HIGHEST press freedom?',
      options: ['Norway', 'Finland', 'Sweden', 'Denmark'],
      correctAnswer: 0,
    },
    {
      id: 'highest-freedom.pressFreedom-200',
      question: '  which country has the highest   press freedom? ',
      options: ['Denmark', 'Sweden', 'Norway', 'Finland'],
      correctAnswer: 2,
    },
  ]

  const selected = selectProvenanceEligibleQuestions(questions, eligibleLookup, 20)

  assert.equal(selected.length, 1)
  assert.equal(selected[0].id, questions[0].id)
})

test('retains questions with a distinct prompt or distinct correct-answer meaning', () => {
  const questions = [
    {
      id: 'highest-lifestyle.happinessIndex-101',
      question: 'Which country has the HIGHEST happiness index?',
      options: ['Finland', 'Norway'],
      correctAnswer: 0,
    },
    {
      id: 'highest-lifestyle.happinessIndex-102',
      question: 'Which country has the HIGHEST happiness index?',
      options: ['Norway', 'Finland'],
      correctAnswer: 0,
    },
    {
      id: 'lowest-conflict.peaceIndex-103',
      question: 'Which country has the LOWEST peace index?',
      options: ['Iceland', 'Finland'],
      correctAnswer: 1,
    },
  ]

  const selected = selectProvenanceEligibleQuestions(questions, eligibleLookup, 20)

  assert.deepEqual(
    selected.map((question) => question.id),
    questions.map((question) => question.id),
  )
})

test('fails closed when provenance is unknown or unavailable', () => {
  const questions = [
    {
      id: 'highest-freedom.pressFreedom-300',
      question: 'Which country has the HIGHEST press freedom?',
      options: ['Norway', 'Finland'],
      correctAnswer: 0,
    },
  ]

  assert.equal(selectProvenanceEligibleQuestions(questions, () => null, 20).length, 0)
  assert.equal(
    selectProvenanceEligibleQuestions(
      questions,
      () => {
        throw new Error('provenance unavailable')
      },
      20,
    ).length,
    0,
  )
})

test('keeps duplicate ID and actual selected-count safeguards, including id-only inputs', () => {
  const questions = [
    { id: 'highest-alpha.score-1' },
    { id: 'highest-alpha.score-1' },
    { id: 'highest-alpha.score-2' },
    { id: 'highest-alpha.score-3' },
  ]
  const lookedUp: string[] = []

  const selected = selectProvenanceEligibleQuestions(
    questions,
    (metricId) => {
      lookedUp.push(metricId)
      return { quizEligible: true }
    },
    2,
  )

  assert.deepEqual(selected, [questions[0], questions[2]])
  assert.deepEqual(lookedUp, ['alpha.score', 'alpha.score'])
})

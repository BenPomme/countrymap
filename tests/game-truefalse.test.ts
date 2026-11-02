import test, { afterEach, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { countries } from '../src/lib/data/loadCountries'
import { loadTF, recordTF } from '../src/lib/truthle/trueFalse'
import {
  classifyRecipientChallenge,
  restoreSavedResult,
  retryView,
  selectQuestions,
} from '../src/components/truthle/TrueFalseGame'

const STORAGE_KEY = 'tf_world_v1'
const originalLocalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')

function installLocalStorage(): Map<string, string> {
  const values = new Map<string, string>()
  const storage: Storage = {
    get length() { return values.size },
    clear() { values.clear() },
    getItem(key) { return values.get(key) ?? null },
    key(index) { return Array.from(values.keys())[index] ?? null },
    removeItem(key) { values.delete(key) },
    setItem(key, value) { values.set(key, value) },
  }
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage })
  return values
}

beforeEach(() => {
  installLocalStorage()
})

afterEach(() => {
  if (originalLocalStorage) Object.defineProperty(globalThis, 'localStorage', originalLocalStorage)
  else delete (globalThis as { localStorage?: Storage }).localStorage
})

test('normal catalogue produces exactly five unique playable claims for a UTC day', () => {
  const days = ['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06']
  for (const day of days) {
    const selection = selectQuestions(countries, day)
    assert.equal(selection.error, null)
    assert.equal(selection.questions.length, 5)
    assert.equal(new Set(selection.questions.map((question) => question.id)).size, 5)
    assert.ok(selection.questions.every((question) => question.provenance.quizEligible))

    const repeated = selectQuestions(countries, day)
    assert.deepEqual(
      repeated.questions.map((question) => question.id),
      selection.questions.map((question) => question.id),
    )
  }
})

test('the result view mounts the share panel explicitly and never mints from the game view', () => {
  const source = readFileSync(new URL('../src/components/truthle/TrueFalseGame.tsx', import.meta.url), 'utf8')
  assert.match(source, /<ResultSharePanel/)
  assert.doesNotMatch(source, /(?:mintSharePromo|createTruthleSharePromo)\s*\(/)
})

test('saved results restore the exact stored breakdown on reload', () => {
  const stats = {
    lastDate: '2026-11-02',
    lastResults: [true, false, true, true, false],
    streak: 3,
    maxStreak: 5,
    played: 8,
    wins: 2,
  }
  assert.deepEqual(restoreSavedResult(stats, '2026-11-02', 5), {
    kind: 'restored',
    results: [true, false, true, true, false],
  })
  assert.deepEqual(restoreSavedResult(stats, '2026-11-03', 5), { kind: 'not-today' })
})

test('legacy saved results without a breakdown stay honest and are not guessed', () => {
  const legacy = { lastDate: '2026-11-02', streak: 4, maxStreak: 4, played: 6, wins: 1 }
  assert.deepEqual(restoreSavedResult(legacy, '2026-11-02', 5), {
    kind: 'unusable',
    reason: 'missing-breakdown',
  })
  assert.deepEqual(
    restoreSavedResult({ ...legacy, lastResults: [true, false, true, true] }, '2026-11-02', 5),
    { kind: 'unusable', reason: 'count-mismatch' },
  )
  assert.deepEqual(
    restoreSavedResult({ ...legacy, lastResults: [true, false, true, true, 'yes'] as unknown as boolean[] }, '2026-11-02', 5),
    { kind: 'unusable', reason: 'invalid-breakdown' },
  )
})

test('a consumed retry cannot be consumed again and missing credit counts are not invented', () => {
  const consumed = retryView({
    date: '2026-11-02',
    granted: true,
    consumed: true,
    canConsume: true,
    paidCredits: 2,
    source: 'backend',
  })
  assert.equal(consumed.state, 'ready')
  assert.equal(consumed.canConsume, false)
  assert.equal(consumed.credits, 2)

  const availableWithoutPaidCredit = retryView({
    date: '2026-11-02',
    granted: true,
    consumed: false,
    canConsume: true,
    source: 'backend',
  })
  assert.equal(availableWithoutPaidCredit.canConsume, true)
  assert.equal(availableWithoutPaidCredit.credits, 0)

  const unavailable = retryView({
    date: '2026-11-02',
    granted: false,
    consumed: false,
    canConsume: true,
    paidCredits: 4,
    source: 'none',
  })
  assert.equal(unavailable.state, 'unknown')
  assert.equal(unavailable.canConsume, false)
})

test('recipient challenges and the recipient own gift remain separate', () => {
  assert.deepEqual(classifyRecipientChallenge('2026-11-02', null, null), { referred: false })
  assert.deepEqual(
    classifyRecipientChallenge('2026-11-02', { day: '2026-11-01', code: 'FRIEND-1' }, null),
    { referred: false },
  )
  assert.deepEqual(
    classifyRecipientChallenge('2026-11-02', { day: '2026-11-02' }, null),
    { referred: true },
  )
  assert.deepEqual(
    classifyRecipientChallenge('2026-11-02', { day: '2026-11-02', code: 'friend-1' }, ' FRIEND-1 '),
    { referred: false },
  )
  assert.deepEqual(
    classifyRecipientChallenge('2026-11-02', { day: '2026-11-02', code: 'friend-1' }, 'OWN-CODE'),
    { referred: true, shareCode: 'FRIEND-1' },
  )
})

test('primary scoring persists once per UTC day and survives reload', () => {
  const first = recordTF('2026-11-02', [true, false, true, true, true], false)
  assert.equal(first.played, 1)
  assert.equal(first.wins, 0)
  assert.equal(first.streak, 1)
  assert.deepEqual(loadTF(), first)

  const duplicate = recordTF('2026-11-02', [false, false, false, false, false], false)
  assert.equal(duplicate.played, 1)
  assert.equal(duplicate.wins, 0)
  assert.deepEqual(duplicate.lastResults, [true, false, true, true, true])
})

test('a perfect 5/5 first run records exactly one win', () => {
  const perfect = recordTF('2026-11-02', [true, true, true, true, true], false)
  assert.equal(perfect.played, 1)
  assert.equal(perfect.wins, 1)
  assert.equal(perfect.streak, 1)
  assert.deepEqual(loadTF(), perfect)
})

test('an extra attempt does not replace the first result or duplicate scoring', () => {
  const first = recordTF('2026-11-02', [true, true, true, true, true], false)
  const extra = recordTF('2026-11-02', [false, false, false, false, false], true)
  assert.deepEqual(extra, first)
  assert.deepEqual(loadTF(), first)
})

test('a missed UTC day resets the next primary score and streak honestly', () => {
  const previous = recordTF('2026-10-30', [true, true, true, true, true], false)
  assert.equal(previous.streak, 1)
  const next = recordTF('2026-11-02', [true, false, true, true, false], false)
  assert.equal(next.streak, 1)
  assert.equal(next.maxStreak, 1)
  assert.equal(next.played, 2)
  assert.equal(next.wins, 1)
  assert.deepEqual(next.lastResults, [true, false, true, true, false])
})

test('stored zero values remain readable without fabricating a result', () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ streak: 0, maxStreak: 0, played: 0, wins: 0 }))
  assert.deepEqual(loadTF(), { streak: 0, maxStreak: 0, played: 0, wins: 0 })
})

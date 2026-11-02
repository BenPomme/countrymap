import test from 'node:test'
import assert from 'node:assert/strict'
import { buildChallengeUrl } from '../src/lib/truthle/gifts'
import {
  buildShareCopy,
  checkoutAttemptOutcome,
  clipboardFailureStatus,
  formatGiftExpiry,
  isGiftUsableForDay,
  nextCheckoutPollDelay,
  parseCheckoutReturn,
  removeCheckoutQuery,
  shareFailureKind,
  type ShareResultData,
} from '../src/components/truthle/resultShare'
import { drawShareCard } from '../src/components/truthle/shareCardImage'

const RESULT: ShareResultData = {
  game: 'truthle',
  day: '2026-11-02',
  score: 1234,
  correct: 7,
  total: 10,
  streak: 4,
}

const FIXED_NOW = Date.UTC(2026, 10, 2, 12, 0, 0)

function recordCanvasText(): { context: CanvasRenderingContext2D; lines: string[] } {
  const lines: string[] = []
  const context = {
    fillStyle: '',
    font: '',
    strokeStyle: '',
    lineWidth: 0,
    fillRect() {},
    beginPath() {},
    moveTo() {},
    lineTo() {},
    stroke() {},
    fillText(text: string) {
      lines.push(String(text))
    },
  } as unknown as CanvasRenderingContext2D
  return { context, lines }
}

test('gift expiry is exact, UTC and usable only on its intended day', () => {
  assert.equal(formatGiftExpiry('2026-11-03T00:00:00.000Z'), '2026-11-03T00:00:00Z (UTC)')
  assert.equal(formatGiftExpiry('not-a-date'), 'Expiry unavailable')
  assert.equal(isGiftUsableForDay('2026-11-03T00:00:00.000Z', '2026-11-02', FIXED_NOW), true)
  assert.equal(isGiftUsableForDay('2026-11-03T00:00:00.000Z', '2026-11-01', FIXED_NOW), false)
  assert.equal(isGiftUsableForDay('2026-11-02T11:59:59.000Z', '2026-11-02', FIXED_NOW), false)
})

test('share copy uses the exact challenge URL and an actual UTC expiry', () => {
  const url = buildChallengeUrl({ game: RESULT.game, day: RESULT.day, code: 'WT-FRIEND1' })
  const copy = buildShareCopy(RESULT, url, { code: 'WT-FRIEND1', expiresAt: '2026-11-03T00:00:00.000Z' })

  assert.match(copy, /Play the same challenge: https:\/\/theworldtruth\.com\/challenge\/\?game=truthle&day=2026-11-02&code=WT-FRIEND1/)
  assert.match(copy, /Friend Extra Attempt code: WT-FRIEND1/)
  assert.match(copy, /Code expires: 2026-11-03T00:00:00Z \(UTC\)/)
  assert.doesNotMatch(copy, /percentile|leaderboard|correct answer/i)
})

test('clipboard and share failures distinguish cancellation, denial and unavailable APIs', () => {
  const named = (name: string) => Object.assign(new Error(name), { name })
  assert.equal(clipboardFailureStatus(named('NotAllowedError')), 'denied')
  assert.equal(clipboardFailureStatus(named('SecurityError')), 'denied')
  assert.equal(clipboardFailureStatus(named('NotFoundError')), 'unavailable')
  assert.equal(clipboardFailureStatus(new Error('write failed')), 'failed')
  assert.equal(shareFailureKind(named('AbortError')), 'cancel')
  assert.equal(shareFailureKind(new Error('blocked')), 'error')
})

test('checkout outcomes are derived only from verified status fields', () => {
  assert.deepEqual(checkoutAttemptOutcome({ status: 'fulfilled', credits: 2 }), { kind: 'fulfilled', credits: 2 })
  assert.deepEqual(checkoutAttemptOutcome({ status: 'pending', credits: 0 }), { kind: 'pending' })
  assert.deepEqual(checkoutAttemptOutcome({ status: 'expired', credits: 0 }), { kind: 'expired' })
  assert.deepEqual(checkoutAttemptOutcome({ status: 'failed', credits: 0 }), { kind: 'failed' })
  assert.deepEqual(checkoutAttemptOutcome({ status: 'fulfilled', credits: 0 }), { kind: 'failed' })
  assert.deepEqual(checkoutAttemptOutcome({ status: 'pending', credits: Number.NaN }), { kind: 'failed' })
  assert.deepEqual(checkoutAttemptOutcome(null), { kind: 'failed' })
})

test('checkout polling is bounded and checkout URLs only request verification', () => {
  assert.equal(nextCheckoutPollDelay(0), 0)
  assert.equal(nextCheckoutPollDelay(1), 1500)
  assert.equal(nextCheckoutPollDelay(4), 18000)
  assert.equal(nextCheckoutPollDelay(5), null)
  assert.deepEqual(parseCheckoutReturn('?checkout=success&session_id=cs_test_123'), { kind: 'verify', sessionId: 'cs_test_123' })
  assert.deepEqual(parseCheckoutReturn('?checkout=success'), { kind: 'unverifiable' })
  assert.deepEqual(parseCheckoutReturn('?paid=1'), { kind: 'none' })
  assert.equal(removeCheckoutQuery('?checkout=success&session_id=cs_test_123&game=truthle'), 'game=truthle')
})

test('share card draws the result and canonical destination without unsupported claims', () => {
  const url = buildChallengeUrl({ game: RESULT.game, day: RESULT.day })
  const { context, lines } = recordCanvasText()
  drawShareCard(context, RESULT, url)
  const rendered = lines.join('\n').toLowerCase()

  assert.ok(lines.includes('Truthle'))
  assert.ok(lines.includes('Day 2026-11-02'))
  assert.ok(lines.includes('1,234 points'))
  assert.ok(lines.includes('7/10 correct'))
  assert.ok(lines.includes('Streak: 4 days'))
  assert.ok(lines.includes('theworldtruth.com/challenge/?game=truthle&day=2026-11-02'))
  assert.doesNotMatch(rendered, /percentile|leaderboard|correct answer|code=/)
})

import test from 'node:test'
import assert from 'node:assert/strict'
import {
  getCompletionStreak,
  getDisplayStreak,
  getUtcDay,
} from '../src/lib/truthle/dailyLifecycle'

test('UTC day changes at midnight UTC, not local midnight', () => {
  assert.equal(getUtcDay(new Date('2026-11-01T23:30:00-05:00')), '2026-11-02')
  assert.equal(getUtcDay(new Date('2026-11-02T00:30:00+01:00')), '2026-11-01')
})

test('first completion starts the round streak at one', () => {
  const empty = { lastPlayedDate: null, currentStreak: 0 }
  assert.equal(getDisplayStreak(empty, '2026-11-02'), 0)
  assert.equal(getCompletionStreak(empty, '2026-11-02'), 1)
})

test('a paid retry on the same UTC day does not add a second streak day', () => {
  const playedToday = { lastPlayedDate: '2026-11-02', currentStreak: 4 }
  assert.equal(getDisplayStreak(playedToday, '2026-11-02'), 4)
  assert.equal(getCompletionStreak(playedToday, '2026-11-02'), 4)
})

test('the next UTC day increments the completion streak once', () => {
  const playedYesterday = { lastPlayedDate: '2026-11-01', currentStreak: 4 }
  assert.equal(getDisplayStreak(playedYesterday, '2026-11-02'), 4)
  assert.equal(getCompletionStreak(playedYesterday, '2026-11-02'), 5)
})

test('a missed UTC day resets the displayed and completion streak', () => {
  const stale = { lastPlayedDate: '2026-10-30', currentStreak: 9 }
  assert.equal(getDisplayStreak(stale, '2026-11-02'), 0)
  assert.equal(getCompletionStreak(stale, '2026-11-02'), 1)
})

test('legacy lastDate and streak fields remain supported', () => {
  const legacy = { lastDate: '2026-11-01', streak: 2 }
  assert.equal(getDisplayStreak(legacy, '2026-11-02'), 2)
  assert.equal(getCompletionStreak(legacy, '2026-11-02'), 3)
})

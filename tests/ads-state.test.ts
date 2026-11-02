import test from 'node:test'
import assert from 'node:assert/strict'
import { buildConsentSnapshot } from '../src/lib/analytics/consent'
import {
  AD_WAIT_TIMEOUT_MS,
  isAdEligible,
  isAdStatusForSlot,
  normalizeAdFillState,
  normalizeAdStatusFillState,
  reduceAdFillState,
  shouldShowAdBanner,
} from '../src/lib/ads/state'

const allowedConsent = buildConsentSnapshot({
  stored: { analytics: true, advertising: true },
  globalPrivacyControl: false,
  environmentAllowed: true,
})

test('ads require explicit opt-in, an allowed environment and no GPC', () => {
  assert.equal(
    isAdEligible({ consent: allowedConsent, embedded: false, slotId: '3829065727' }),
    true
  )

  assert.equal(
    isAdEligible({
      consent: buildConsentSnapshot({
        stored: null,
        globalPrivacyControl: false,
        environmentAllowed: true,
      }),
      embedded: false,
      slotId: '3829065727',
    }),
    false
  )

  assert.equal(
    isAdEligible({
      consent: buildConsentSnapshot({
        stored: { analytics: true, advertising: false },
        globalPrivacyControl: false,
        environmentAllowed: true,
      }),
      embedded: false,
      slotId: '3829065727',
    }),
    false
  )

  assert.equal(
    isAdEligible({
      consent: buildConsentSnapshot({
        stored: { analytics: true, advertising: true },
        globalPrivacyControl: true,
        environmentAllowed: true,
      }),
      embedded: false,
      slotId: '3829065727',
    }),
    false
  )

  assert.equal(
    isAdEligible({
      consent: buildConsentSnapshot({
        stored: { analytics: true, advertising: true },
        globalPrivacyControl: false,
        environmentAllowed: false,
      }),
      embedded: false,
      slotId: '3829065727',
    }),
    false
  )

  assert.equal(isAdEligible({ consent: null, embedded: false, slotId: '3829065727' }), false)
})

test('embedded, disabled and missing-slot placements never render an ad shell', () => {
  assert.equal(isAdEligible({ consent: allowedConsent, embedded: true, slotId: '3829065727' }), false)
  assert.equal(
    isAdEligible({ consent: allowedConsent, embedded: false, disabled: true, slotId: '3829065727' }),
    false
  )
  assert.equal(isAdEligible({ consent: allowedConsent, embedded: false, slotId: '' }), false)
  assert.equal(isAdEligible({ consent: allowedConsent, embedded: false, slotId: '   ' }), false)
  assert.equal(isAdEligible({ consent: allowedConsent, embedded: false }), false)
})

test('waiting ads collapse on unfilled, error and bounded timeout states', () => {
  assert.equal(normalizeAdFillState(null), 'waiting')
  assert.equal(normalizeAdFillState('filled'), 'filled')
  assert.equal(normalizeAdFillState('UNFILLED'), 'unfilled')
  assert.equal(normalizeAdFillState('error'), 'waiting')
  assert.equal(normalizeAdStatusFillState('error'), 'unfilled')
  assert.equal(normalizeAdStatusFillState('failed'), 'unfilled')

  assert.equal(reduceAdFillState('waiting', { type: 'status', status: 'filled' }), 'filled')
  assert.equal(reduceAdFillState('waiting', { type: 'status', status: 'unfilled' }), 'unfilled')
  assert.equal(reduceAdFillState('waiting', { type: 'status', status: 'error' }), 'unfilled')
  assert.equal(reduceAdFillState('waiting', { type: 'timeout' }), 'unfilled')
  assert.equal(reduceAdFillState('filled', { type: 'timeout' }), 'filled')
  assert.equal(
    reduceAdFillState(reduceAdFillState('waiting', { type: 'timeout' }), {
      type: 'status',
      status: 'filled',
    }),
    'filled'
  )
  assert.equal(AD_WAIT_TIMEOUT_MS > 0 && AD_WAIT_TIMEOUT_MS <= 5000, true)
})

test('banner rendering follows eligibility and fill state, with slot-scoped status', () => {
  assert.equal(shouldShowAdBanner({ eligible: true, fillState: 'waiting' }), true)
  assert.equal(shouldShowAdBanner({ eligible: true, fillState: 'filled' }), true)
  assert.equal(shouldShowAdBanner({ eligible: true, fillState: 'unfilled' }), false)
  assert.equal(shouldShowAdBanner({ eligible: false, fillState: 'filled' }), false)
  assert.equal(isAdStatusForSlot({ status: 'error' }, '3829065727'), true)
  assert.equal(isAdStatusForSlot({ status: 'error', slotId: '3829065727' }, '3829065727'), true)
  assert.equal(isAdStatusForSlot({ status: 'error', slotId: '1374933403' }, '3829065727'), false)
})

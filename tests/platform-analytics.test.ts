import test from 'node:test'
import assert from 'node:assert/strict'
import {
  CONSENT_STORAGE_KEY,
  buildConsentSnapshot,
  hasGlobalPrivacyControl,
  isAnalyticsHostAllowed,
  isAnalyticsLocationAllowed,
  parseStoredConsent,
} from '../src/lib/analytics/consent'
import {
  filterEventParams,
  sanitizeAnalyticsReferrer,
  sanitizeAnalyticsUrl,
  trackEvent,
  trackPageView,
} from '../src/lib/analytics/events'

type GtagCall = unknown[]

function storedChoice(analytics: boolean, advertising: boolean): string {
  return JSON.stringify({ version: 1, analytics, advertising })
}

function withBrowser(
  options: {
    stored?: string | null
    globalPrivacyControl?: boolean
    href?: string
    referrer?: string
    includeGtag?: boolean
  },
  run: (calls: GtagCall[]) => void
): void {
  const globals = globalThis as unknown as { window?: unknown }
  const previousWindow = globals.window
  const calls: GtagCall[] = []
  const location = new URL(options.href ?? 'https://theworldtruth.com/country/france/')

  globals.window = {
    localStorage: {
      getItem: (key: string) => (key === CONSENT_STORAGE_KEY ? (options.stored ?? null) : null),
    },
    navigator: { globalPrivacyControl: options.globalPrivacyControl === true },
    location,
    document: { referrer: options.referrer ?? '' },
    ...(options.includeGtag === false
      ? {}
      : { gtag: (...args: unknown[]) => calls.push(args) }),
  }

  try {
    run(calls)
  } finally {
    globals.window = previousWindow
  }
}

test('stored consent requires version 1 and boolean categories', () => {
  assert.deepEqual(parseStoredConsent(null), null)
  assert.deepEqual(parseStoredConsent('{'), null)
  assert.deepEqual(parseStoredConsent(JSON.stringify({ analytics: true, advertising: true })), null)
  assert.deepEqual(
    parseStoredConsent(JSON.stringify({ version: 2, analytics: true, advertising: true })),
    null
  )
  assert.deepEqual(
    parseStoredConsent(JSON.stringify({ version: 1, analytics: true, advertising: 'yes' })),
    null
  )
  assert.deepEqual(
    parseStoredConsent(JSON.stringify({ version: 1, analytics: true, advertising: false })),
    { analytics: true, advertising: false }
  )
})

test('consent snapshots deny unknown, malformed, off-site and GPC states', () => {
  assert.deepEqual(
    buildConsentSnapshot({
      stored: null,
      globalPrivacyControl: false,
      environmentAllowed: true,
    }),
    {
      choice: 'unknown',
      analytics: false,
      advertising: false,
      globalPrivacyControl: false,
      environmentAllowed: true,
    }
  )

  assert.deepEqual(
    buildConsentSnapshot({
      stored: { analytics: true, advertising: true },
      globalPrivacyControl: false,
      environmentAllowed: false,
    }),
    {
      choice: 'set',
      analytics: false,
      advertising: false,
      globalPrivacyControl: false,
      environmentAllowed: false,
    }
  )

  assert.deepEqual(
    buildConsentSnapshot({
      stored: { analytics: true, advertising: true },
      globalPrivacyControl: true,
      environmentAllowed: true,
    }),
    {
      choice: 'set',
      analytics: false,
      advertising: false,
      globalPrivacyControl: true,
      environmentAllowed: true,
    }
  )
})

test('analytics hosts are exact HTTPS production hosts only', () => {
  assert.equal(isAnalyticsHostAllowed('theworldtruth.com'), true)
  assert.equal(isAnalyticsHostAllowed(' WWW.TheWorldTruth.com '), true)
  assert.equal(isAnalyticsHostAllowed('theworldtruth.com.evil.example'), false)
  assert.equal(isAnalyticsHostAllowed('preview.theworldtruth.com'), false)
  assert.equal(isAnalyticsHostAllowed('localhost'), false)
  assert.equal(isAnalyticsHostAllowed(null), false)

  assert.equal(
    isAnalyticsLocationAllowed({ protocol: 'https:', hostname: 'theworldtruth.com' }),
    true
  )
  assert.equal(
    isAnalyticsLocationAllowed({ protocol: 'http:', hostname: 'theworldtruth.com' }),
    false
  )
  assert.equal(
    isAnalyticsLocationAllowed({ protocol: 'https:', hostname: 'localhost' }),
    false
  )
  assert.equal(hasGlobalPrivacyControl({ globalPrivacyControl: true }), true)
  assert.equal(hasGlobalPrivacyControl({ globalPrivacyControl: false }), false)
  assert.equal(hasGlobalPrivacyControl(null), false)
})

test('unknown and denied consent transmit no events or page views', () => {
  withBrowser({}, (calls) => {
    trackEvent('game_start', { game: 'truthle' })
    assert.equal(trackPageView(), false)
    assert.deepEqual(calls, [])
  })

  withBrowser({ stored: storedChoice(false, true) }, (calls) => {
    trackEvent('game_start', { game: 'truthle' })
    assert.equal(trackPageView(), false)
    assert.deepEqual(calls, [])
  })

  withBrowser(
    {
      stored: storedChoice(true, true),
      href: 'https://preview.example.test/country/france/',
    },
    (calls) => {
      trackEvent('game_start', { game: 'truthle' })
      assert.equal(trackPageView(), false)
      assert.deepEqual(calls, [])
    }
  )
})

test('event and parameter allowlists reject sensitive or unknown values', () => {
  withBrowser({ stored: storedChoice(true, false) }, (calls) => {
    trackEvent('share_handoff', {
      content_id: 'day-2026-11-02',
      method: 'whatsapp',
      placement: 'results',
      status: 'requested',
      code: 'RAW-CODE',
      email: 'person@example.com',
      uid: 'user-123',
      url: 'https://theworldtruth.com/?code=RAW-CODE',
      referrer: 'https://example.com/?uid=123',
      query: '?code=RAW-CODE',
    })
    trackEvent('unknown_event', { game: 'truthle' })
    trackEvent('affiliate_click', {
      partner: 'unapproved-partner',
      placement: 'results',
      method: 'link',
    })
    trackEvent('game_complete', {
      game: 'truthle',
      score: 5.5,
      correct: true,
    })

    assert.deepEqual(calls, [
      [
        'event',
        'share_handoff',
        {
          content_id: 'day-2026-11-02',
          method: 'whatsapp',
          placement: 'results',
          status: 'requested',
        },
      ],
      ['event', 'affiliate_click', { placement: 'results', method: 'link' }],
      ['event', 'game_complete', { game: 'truthle', correct: true }],
    ])
  })
})

test('event filtering accepts safe transaction ids and rejects arbitrary identifiers', () => {
  assert.deepEqual(
    filterEventParams('purchase', {
      transaction_id: 'cs_test_abc12345',
      value: 0.99,
      currency: 'EUR',
      status: 'success',
    }),
    {
      transaction_id: 'cs_test_abc12345',
      value: 0.99,
      currency: 'EUR',
      status: 'success',
    }
  )
  assert.deepEqual(
    filterEventParams('purchase', {
      transaction_id: 'uid_abcdefgh',
      email: 'person@example.com',
      uid: 'user-123',
    }),
    {}
  )
  assert.equal(filterEventParams('not_allowed', { game: 'truthle' }), null)
})

test('page locations keep public paths while referrers keep only safe origins', () => {
  withBrowser(
    {
      stored: storedChoice(true, false),
      href: 'https://theworldtruth.com/country/france/?code=RAW-CODE&uid=123#private',
      referrer: 'https://www.google.com/search?q=person%40example.com&uid=123#result',
    },
    (calls) => {
      assert.equal(trackPageView(), true)
      assert.deepEqual(calls, [
        [
          'event',
          'page_view',
          {
            page_location: 'https://theworldtruth.com/country/france/',
            page_referrer: 'https://www.google.com',
          },
        ],
      ])
    }
  )

  assert.equal(sanitizeAnalyticsUrl('not a url'), undefined)
  assert.equal(sanitizeAnalyticsUrl('javascript:alert(1)'), undefined)
  assert.equal(sanitizeAnalyticsUrl('https://user:pass@theworldtruth.com/private'), undefined)
  assert.equal(
    sanitizeAnalyticsUrl('https://theworldtruth.com/path/?email=a%40b.test#fragment'),
    'https://theworldtruth.com/path/'
  )

  assert.equal(
    sanitizeAnalyticsReferrer('https://www.google.com/search?q=person%40example.com&uid=123#result'),
    'https://www.google.com'
  )
  assert.equal(
    sanitizeAnalyticsReferrer(
      'https://checkout.stripe.com/c/pay/cs_live_SECRET?session_id=cs_live_SECRET#private'
    ),
    'https://checkout.stripe.com'
  )
  assert.equal(
    sanitizeAnalyticsReferrer('https://checkout.stripe.com.evil.example/private-path/?uid=123'),
    'https://checkout.stripe.com.evil.example'
  )
  assert.equal(
    sanitizeAnalyticsReferrer('https://user:pass@checkout.stripe.com/c/pay/cs_live_SECRET'),
    undefined
  )
})

test('tracking fails closed when the Google tag is absent', () => {
  withBrowser({ stored: storedChoice(true, true), includeGtag: false }, (calls) => {
    trackEvent('game_start', { game: 'truthle' })
    assert.equal(trackPageView(), false)
    assert.deepEqual(calls, [])
  })
})

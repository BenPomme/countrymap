import test from 'node:test'
import assert from 'node:assert/strict'
import { CONSENT_OPEN_EVENT, CONSENT_STORAGE_KEY, openConsentPreferences } from '../src/lib/analytics/consent'
import {
  configureGoogleTags,
  filterEventParams,
  isIgnoredBillingReferrer,
  queueAnalyticsPageContext,
  sanitizeAnalyticsReferrer,
  trackEvent,
  trackPageView,
} from '../src/lib/analytics/events'

type GtagCall = unknown[]

type BrowserOptions = {
  stored?: string | null
  globalPrivacyControl?: boolean
  href?: string
  referrer?: string
  includeGtag?: boolean
}

function storedChoice(analytics: boolean, advertising: boolean): string {
  return JSON.stringify({ version: 1, analytics, advertising })
}

function assertPrivateTokensAbsent(calls: GtagCall[]): void {
  const transmitted = JSON.stringify(calls)
  for (const token of [
    'RAW-GIFT',
    'RAW-PRIVATE-PATH',
    'cs_live_SECRET',
    'session_id',
    '/c/pay/',
    '/private-path/',
    'person%40example.com',
    'user-123',
  ]) {
    assert.equal(transmitted.includes(token), false, `unexpected transmitted token: ${token}`)
  }
}

function withBrowser(
  options: BrowserOptions,
  run: (calls: GtagCall[], browser: { location: URL; document: { referrer: string } }) => void
): void {
  const globals = globalThis as unknown as { window?: unknown }
  const previousWindow = globals.window
  const calls: GtagCall[] = []
  const location = new URL(options.href ?? 'https://theworldtruth.com/truthle/')
  const document = { referrer: options.referrer ?? '' }

  globals.window = {
    localStorage: {
      getItem: (key: string) => (key === CONSENT_STORAGE_KEY ? (options.stored ?? null) : null),
    },
    navigator: { globalPrivacyControl: options.globalPrivacyControl === true },
    location,
    document,
    ...(options.includeGtag === false
      ? {}
      : { gtag: (...args: unknown[]) => calls.push(args) }),
  }

  try {
    run(calls, { location, document })
  } finally {
    globals.window = previousWindow
  }
}

test('tag config queues sanitized page context before GA and Ads config', () => {
  withBrowser(
    {
      stored: storedChoice(true, true),
      href: 'https://theworldtruth.com/truthle/?gift=RAW-GIFT&session_id=cs_live_SECRET#claim',
      referrer: 'https://checkout.stripe.com/c/pay/cs_live_SECRET?session_id=cs_live_SECRET',
    },
    (calls) => {
      assert.equal(
        configureGoogleTags(
          (...args: unknown[]) => calls.push(args),
          {
            analyticsMeasurementId: 'G-TEST123',
            adsConversionId: 'AW-TEST123',
          }
        ),
        true
      )

      assert.deepEqual(calls, [
        [
          'set',
          {
            page_location: 'https://theworldtruth.com/truthle/',
            page_referrer: 'https://checkout.stripe.com',
          },
        ],
        [
          'config',
          'G-TEST123',
          {
            send_page_view: false,
            page_location: 'https://theworldtruth.com/truthle/',
            page_referrer: 'https://checkout.stripe.com',
            ignore_referrer: true,
          },
        ],
        ['config', 'AW-TEST123', { send_page_view: false }],
      ])

      assertPrivateTokensAbsent(calls)
    }
  )
})

test('navigation refreshes sanitized page context before a measured page view', () => {
  withBrowser({ stored: storedChoice(true, false) }, (calls, browser) => {
    const gtag = (...args: unknown[]) => calls.push(args)

    assert.ok(queueAnalyticsPageContext(gtag))
    assert.equal(trackPageView(), true)

    browser.location.href =
      'https://theworldtruth.com/country/france/?gift=RAW-GIFT&session_id=cs_live_SECRET#private'
    browser.document.referrer = 'https://www.google.com/search?q=person%40example.com&uid=123#result'

    assert.ok(queueAnalyticsPageContext(gtag))
    assert.equal(trackPageView(), true)

    assert.deepEqual(calls, [
      ['set', { page_location: 'https://theworldtruth.com/truthle/' }],
      ['event', 'page_view', { page_location: 'https://theworldtruth.com/truthle/' }],
      [
        'set',
        {
          page_location: 'https://theworldtruth.com/country/france/',
          page_referrer: 'https://www.google.com',
        },
      ],
      [
        'event',
        'page_view',
        {
          page_location: 'https://theworldtruth.com/country/france/',
          page_referrer: 'https://www.google.com',
        },
      ],
    ])
  })
})

test('custom events replace raw gift and session URLs with clean context', () => {
  withBrowser(
    {
      stored: storedChoice(true, false),
      href: 'https://theworldtruth.com/challenge/?gift=RAW-GIFT&session_id=cs_live_SECRET#private',
      referrer: 'https://www.google.com/search?q=person%40example.com&uid=123',
    },
    (calls) => {
      trackEvent('reward_copy', {
        game: 'truthle',
        content_id: 'freedom.pressFreedom',
        method: 'copy',
        code: 'RAW-GIFT',
        email: 'person@example.com',
        uid: 'user-123',
      })

      assert.deepEqual(calls, [
        [
          'set',
          {
            page_location: 'https://theworldtruth.com/challenge/',
            page_referrer: 'https://www.google.com',
          },
        ],
        [
          'event',
          'reward_copy',
          {
            game: 'truthle',
            content_id: 'freedom.pressFreedom',
            method: 'copy',
            page_location: 'https://theworldtruth.com/challenge/',
            page_referrer: 'https://www.google.com',
          },
        ],
      ])

      assertPrivateTokensAbsent(calls)
    }
  )
})

test('external billing referrers send only origin in custom event payloads', () => {
  withBrowser(
    {
      stored: storedChoice(true, false),
      href: 'https://theworldtruth.com/challenge/?gift=RAW-GIFT&session_id=cs_live_SECRET#private',
      referrer:
        'https://checkout.stripe.com/c/pay/cs_live_SECRET?session_id=cs_live_SECRET#private-path',
    },
    (calls) => {
      trackEvent('reward_copy', {
        game: 'truthle',
        content_id: 'freedom.pressFreedom',
        method: 'copy',
        code: 'RAW-GIFT',
        email: 'person@example.com',
        uid: 'user-123',
      })

      assert.deepEqual(calls, [
        [
          'set',
          {
            page_location: 'https://theworldtruth.com/challenge/',
            page_referrer: 'https://checkout.stripe.com',
          },
        ],
        [
          'event',
          'reward_copy',
          {
            game: 'truthle',
            content_id: 'freedom.pressFreedom',
            method: 'copy',
            page_location: 'https://theworldtruth.com/challenge/',
            page_referrer: 'https://checkout.stripe.com',
          },
        ],
      ])

      assertPrivateTokensAbsent(calls)
    }
  )
})

test('only exact HTTPS Stripe billing origins are ignored for acquisition', () => {
  assert.equal(isIgnoredBillingReferrer('https://checkout.stripe.com/c/pay/cs_test_123'), true)
  assert.equal(isIgnoredBillingReferrer('https://billing.stripe.com/p/session/test_123'), true)
  assert.equal(isIgnoredBillingReferrer('https://checkout.stripe.com/?session_id=123'), true)
  assert.equal(isIgnoredBillingReferrer('http://checkout.stripe.com/c/pay/cs_test_123'), false)
  assert.equal(isIgnoredBillingReferrer('https://checkout.stripe.com.evil.example/pay'), false)
  assert.equal(isIgnoredBillingReferrer('https://billing.stripe.com.evil.example/pay'), false)
  assert.equal(isIgnoredBillingReferrer('https://checkout.stripe.com@evil.example/pay'), false)
  assert.equal(isIgnoredBillingReferrer('https://evil.example@billing.stripe.com/pay'), false)
  assert.equal(isIgnoredBillingReferrer('https://checkout.stripe.com:444/pay'), false)
  assert.equal(isIgnoredBillingReferrer('not a url'), false)

  withBrowser(
    {
      stored: storedChoice(true, false),
      referrer: 'https://checkout.stripe.com.evil.example/pay?session_id=RAW',
    },
    (calls) => {
      configureGoogleTags((...args: unknown[]) => calls.push(args), {
        analyticsMeasurementId: 'G-TEST123',
      })

      assert.equal(JSON.stringify(calls).includes('ignore_referrer'), false)
      assert.equal(
        (calls[1]?.[2] as Record<string, unknown>).page_referrer,
        'https://checkout.stripe.com.evil.example'
      )
    }
  )
})

test('credential-bearing referrers are ignored in config and event payloads', () => {
  const referrer =
    'https://worker:secret@checkout.stripe.com/c/pay/cs_live_SECRET?session_id=RAW-PRIVATE-PATH'

  assert.equal(sanitizeAnalyticsReferrer(referrer), undefined)

  withBrowser({ stored: storedChoice(true, false), referrer }, (calls) => {
    configureGoogleTags((...args: unknown[]) => calls.push(args), {
      analyticsMeasurementId: 'G-TEST123',
    })
    trackEvent('game_start', { game: 'truthle' })

    assert.equal(JSON.stringify(calls).includes('page_referrer'), false)
    assert.equal(JSON.stringify(calls).includes('ignore_referrer'), false)
    assertPrivateTokensAbsent(calls)
  })
})

test('denied, GPC and preview contexts queue no measurement', () => {
  const contexts: BrowserOptions[] = [
    { stored: null },
    { stored: storedChoice(false, true) },
    { stored: storedChoice(true, true), globalPrivacyControl: true },
    {
      stored: storedChoice(true, true),
      href: 'https://preview.example.test/truthle/?gift=RAW-GIFT',
    },
  ]

  for (const context of contexts) {
    withBrowser(context, (calls) => {
      trackEvent('game_start', { game: 'truthle' })
      assert.equal(trackPageView(), false)
      assert.deepEqual(calls, [])
    })
  }
})

test('numeric correct counts and uppercase metric content IDs pass the allowlist', () => {
  for (const correct of [0, 1, 2, 3, 4, 5]) {
    assert.deepEqual(
      filterEventParams('game_complete', {
        game: 'true-false',
        content_id: 'freedom.pressFreedom',
        correct,
        score: 80,
      }),
      {
        game: 'true-false',
        content_id: 'freedom.pressFreedom',
        correct,
        score: 80,
      }
    )
  }

  assert.deepEqual(filterEventParams('game_complete', { correct: true }), { correct: true })
  for (const correct of [-1, 6, 2.5, Number.NaN]) {
    assert.deepEqual(filterEventParams('game_complete', { correct }), {})
  }

  for (const contentId of ['freedom.pressFreedom', 'economy.gdpGrowth', 'HDI']) {
    assert.deepEqual(filterEventParams('game_start', { content_id: contentId }), {
      content_id: contentId,
    })
  }
  for (const contentId of ['arbitrary text', 'person@example.com', 'https://example.com/']) {
    assert.deepEqual(filterEventParams('game_start', { content_id: contentId }), {})
  }
})

type ShareFilterCase = {
  name: string
  params: Record<string, string | number | boolean | undefined>
}

test('ResultSharePanel share and reward payloads retain their bounded fields', () => {
  const base = { game: 'truthle', puzzle_day: '2026-11-02' }
  const cases: ShareFilterCase[] = [
    ...['clipboard', 'clipboard_gift', 'native', 'native_gift', 'whatsapp', 'whatsapp_gift', 'native_image']
      .map((method) => ({ name: 'share_intent', params: { ...base, method } })),
    { name: 'share_handoff', params: { ...base, method: 'native', status: 'handed_off' } },
    { name: 'share_handoff', params: { ...base, method: 'native_gift', status: 'handed_off' } },
    { name: 'share_handoff', params: { ...base, method: 'native_image', status: 'handed_off' } },
    { name: 'share_handoff', params: { ...base, method: 'whatsapp', status: 'opened' } },
    { name: 'share_handoff', params: { ...base, method: 'whatsapp_gift', status: 'opened' } },
    { name: 'share_copy', params: { ...base, method: 'clipboard', status: 'success' } },
    { name: 'share_copy', params: { ...base, method: 'clipboard_gift', status: 'success' } },
    { name: 'share_cancel', params: { ...base, method: 'native', status: 'cancel' } },
    { name: 'share_cancel', params: { ...base, method: 'native_gift', status: 'cancel' } },
    { name: 'share_cancel', params: { ...base, method: 'native_image', status: 'cancel' } },
    { name: 'share_error', params: { ...base, method: 'whatsapp', status: 'blocked' } },
    { name: 'share_error', params: { ...base, method: 'whatsapp_gift', status: 'blocked' } },
    { name: 'share_error', params: { ...base, method: 'image', status: 'generation' } },
    { name: 'share_error', params: { ...base, method: 'native_image', status: 'unavailable' } },
    { name: 'share_error', params: { ...base, method: 'image_download', status: 'download' } },
    { name: 'reward_mint', params: { ...base, status: 'success' } },
    { name: 'reward_mint', params: { ...base, status: 'failed' } },
  ]

  for (const { name, params } of cases) {
    assert.deepEqual(filterEventParams(name, params), params, `${name} should retain its caller payload`)
  }
})

test('VisualShare share payloads retain their bounded fields', () => {
  const base = {
    content_id: 'chart_correlation_gdpGrowth_lifeExpectancy',
    placement: 'share_dialog',
  }
  const cases: ShareFilterCase[] = [
    { name: 'share_intent', params: { ...base, method: 'dialog' } },
    { name: 'share_copy', params: { ...base, method: 'url_fallback', status: 'success' } },
    { name: 'share_copy', params: { ...base, method: 'image_clipboard', status: 'success' } },
    { name: 'share_handoff', params: { ...base, method: 'download', status: 'requested' } },
    { name: 'share_handoff', params: { ...base, method: 'whatsapp', status: 'requested' } },
    { name: 'share_handoff', params: { ...base, method: 'native_file', status: 'success' } },
    { name: 'share_handoff', params: { ...base, method: 'native_link', status: 'success' } },
    { name: 'share_cancel', params: { ...base, method: 'native', status: 'cancelled' } },
    { name: 'share_error', params: { ...base, method: 'image_generation', status: 'capture_failed' } },
    { name: 'share_error', params: { ...base, method: 'clipboard', status: 'denied' } },
    { name: 'share_error', params: { ...base, method: 'clipboard', status: 'unavailable' } },
    { name: 'share_error', params: { ...base, method: 'clipboard', status: 'failed' } },
    { name: 'share_error', params: { ...base, method: 'whatsapp', status: 'handoff_failed' } },
    { name: 'share_error', params: { ...base, method: 'download', status: 'download_failed' } },
    { name: 'share_error', params: { ...base, method: 'native', status: 'denied' } },
    { name: 'share_error', params: { ...base, method: 'native', status: 'unavailable' } },
    { name: 'share_error', params: { ...base, method: 'native', status: 'failed' } },
  ]

  for (const { name, params } of cases) {
    assert.deepEqual(filterEventParams(name, params), params, `${name} should retain its caller payload`)
  }
})

test('share event enums reject private values and values from another share event', () => {
  assert.deepEqual(
    filterEventParams('share_error', {
      game: 'truthle',
      puzzle_day: '2026-02-30',
      content_id: 'person@example.com',
      placement: 'https://private.example/path?gift=RAW-GIFT',
      method: 'RAW-GIFT',
      status: 'blocked',
      code: 'RAW-GIFT',
      email: 'person@example.com',
      uid: 'user-123',
      session_id: 'cs_live_SECRET',
      url: 'https://private.example/path?gift=RAW-GIFT',
    }),
    { game: 'truthle', status: 'blocked' }
  )

  assert.deepEqual(
    filterEventParams('share_error', { game: 'truthle', method: 'native', status: 'RAW-GIFT' }),
    { game: 'truthle', method: 'native' }
  )

  const crossEventValues: Array<ShareFilterCase & { expected: Record<string, string> }> = [
    {
      name: 'share_handoff',
      params: { method: 'clipboard_gift', status: 'requested' },
      expected: { status: 'requested' },
    },
    {
      name: 'share_handoff',
      params: { method: 'native', status: 'blocked' },
      expected: { method: 'native' },
    },
    {
      name: 'share_copy',
      params: { method: 'native', status: 'success' },
      expected: { status: 'success' },
    },
    {
      name: 'share_copy',
      params: { method: 'clipboard', status: 'handed_off' },
      expected: { method: 'clipboard' },
    },
    {
      name: 'share_cancel',
      params: { method: 'whatsapp', status: 'cancel' },
      expected: { status: 'cancel' },
    },
    {
      name: 'share_cancel',
      params: { method: 'native', status: 'opened' },
      expected: { method: 'native' },
    },
    {
      name: 'share_error',
      params: { method: 'url_fallback', status: 'failed' },
      expected: { status: 'failed' },
    },
    {
      name: 'share_error',
      params: { method: 'native', status: 'success' },
      expected: { method: 'native' },
    },
  ]
  for (const { name, params, expected } of crossEventValues) {
    assert.deepEqual(
      filterEventParams(name, params),
      expected,
      `${name} should drop only the value from another share event`
    )
  }

  assert.deepEqual(filterEventParams('reward_copy', { game: 'truthle', method: 'clipboard_gift' }), {
    game: 'truthle',
  })
})

test('Truthle primary and extra placements pass game event filtering', () => {
  for (const placement of ['primary', 'extra']) {
    assert.deepEqual(
      filterEventParams('game_start', { game: 'truthle', puzzle_day: '2026-11-02', placement }),
      { game: 'truthle', puzzle_day: '2026-11-02', placement }
    )
    assert.deepEqual(
      filterEventParams('game_complete', {
        game: 'truthle',
        puzzle_day: '2026-11-02',
        placement,
        score: 4200,
        correct: 4,
      }),
      { game: 'truthle', puzzle_day: '2026-11-02', placement, score: 4200, correct: 4 }
    )
  }

  assert.deepEqual(
    filterEventParams('game_complete', {
      game: 'truthle',
      puzzle_day: '2026-02-30',
      placement: 'https://private.example/',
      score: 4200,
      correct: 4,
    }),
    { game: 'truthle', score: 4200, correct: 4 }
  )
})

test('opening privacy choices dispatches the consent dialog contract event', () => {
  const globals = globalThis as unknown as { window?: unknown }
  const previousWindow = globals.window
  const browser = new EventTarget()
  const receivedEvents: string[] = []
  const recordOpen = (event: Event) => receivedEvents.push(event.type)

  globals.window = browser
  browser.addEventListener(CONSENT_OPEN_EVENT, recordOpen)

  try {
    openConsentPreferences()
    openConsentPreferences()
    browser.dispatchEvent(new Event('unrelated-event'))

    assert.deepEqual(receivedEvents, [CONSENT_OPEN_EVENT, CONSENT_OPEN_EVENT])
  } finally {
    browser.removeEventListener(CONSENT_OPEN_EVENT, recordOpen)
    globals.window = previousWindow
  }
})

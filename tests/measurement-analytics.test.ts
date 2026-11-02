import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { CONSENT_STORAGE_KEY } from '../src/lib/analytics/consent'
import {
  configureGoogleTags,
  filterEventParams,
  isIgnoredBillingReferrer,
  queueAnalyticsPageContext,
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
            page_referrer: 'https://checkout.stripe.com/c/pay/cs_live_SECRET',
          },
        ],
        [
          'config',
          'G-TEST123',
          {
            send_page_view: false,
            page_location: 'https://theworldtruth.com/truthle/',
            page_referrer: 'https://checkout.stripe.com/c/pay/cs_live_SECRET',
            ignore_referrer: true,
          },
        ],
        ['config', 'AW-TEST123', { send_page_view: false }],
      ])

      const transmitted = JSON.stringify(calls)
      assert.equal(transmitted.includes('RAW-GIFT'), false)
      assert.equal(transmitted.includes('session_id'), false)
      assert.equal(transmitted.includes('#claim'), false)
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
          page_referrer: 'https://www.google.com/search',
        },
      ],
      [
        'event',
        'page_view',
        {
          page_location: 'https://theworldtruth.com/country/france/',
          page_referrer: 'https://www.google.com/search',
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
            page_referrer: 'https://www.google.com/search',
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
            page_referrer: 'https://www.google.com/search',
          },
        ],
      ])

      const transmitted = JSON.stringify(calls)
      assert.equal(transmitted.includes('RAW-GIFT'), false)
      assert.equal(transmitted.includes('session_id'), false)
      assert.equal(transmitted.includes('person%40example.com'), false)
      assert.equal(transmitted.includes('user-123'), false)
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
        'https://checkout.stripe.com.evil.example/pay'
      )
    }
  )
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

test('footer exposes the existing consent preference opener directly', () => {
  const footer = readFileSync(
    new URL('../src/components/site/SiteFooter.tsx', import.meta.url),
    'utf8'
  )
  const analytics = readFileSync(
    new URL('../src/components/Analytics.tsx', import.meta.url),
    'utf8'
  )

  assert.match(footer, /import \{ openConsentPreferences \}/)
  assert.match(footer, /onClick=\{openConsentPreferences\}/)
  assert.match(footer, />\s*Privacy choices\s*</)
  assert.match(analytics, /queueAnalyticsPageContext\(gtag\)/)
  assert.match(analytics, /\[pageViewsAllowed, pathname, ready, tagId\]/)
  assert.match(analytics, /args\[2\]\.outbound === true/)
})

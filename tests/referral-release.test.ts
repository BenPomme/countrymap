import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { CONSENT_STORAGE_KEY } from '../src/lib/analytics/consent'
import {
  clearQueuedAnalyticsEvents,
  markAnalyticsConfigured,
  trackEvent,
} from '../src/lib/analytics/events'

type GtagCall = unknown[]
type Gtag = (...args: unknown[]) => void

type BrowserOptions = {
  stored?: string | null
  globalPrivacyControl?: boolean
  href?: string
  referrer?: string
  gtagReady?: boolean
}

type TestBrowser = {
  calls: GtagCall[]
  location: URL
  document: { referrer: string }
  localStorage: {
    getItem: (key: string) => string | null
    setItem: (key: string, value: string) => void
  }
  navigator: { globalPrivacyControl: boolean }
  setStored: (value: string | null) => void
  installGtag: () => void
  gtag?: Gtag
}

const CHALLENGE_URL =
  'https://theworldtruth.com/challenge/?game=truthle&day=2026-11-02&code=QA_RELEASE_ONLY'
const ONCE_KEY = 'referral_open:current:truthle:2026-11-02'
const CLEAN_CHALLENGE_LOCATION = 'https://theworldtruth.com/challenge/'

function storedChoice(analytics: boolean, advertising = false): string {
  return JSON.stringify({ version: 1, analytics, advertising })
}

function referralParams(): Record<string, string> {
  return { game: 'truthle', puzzle_day: '2026-11-02', status: 'current' }
}

function assertNoPrivateTokens(calls: GtagCall[]): void {
  const transmitted = JSON.stringify(calls)
  for (const token of [
    'QA_RELEASE_ONLY',
    'RAW-GIFT',
    'person%40example.com',
    'person@example.com',
    'user-123',
    'cs_live_SECRET',
    'session_id',
    '?game=',
    '&code=',
  ]) {
    assert.equal(transmitted.includes(token), false, `unexpected transmitted token: ${token}`)
  }
}

function withBrowser(options: BrowserOptions, run: (browser: TestBrowser) => void): void {
  const globals = globalThis as unknown as { window?: unknown }
  const previousWindow = globals.window
  const calls: GtagCall[] = []
  const location = new URL(options.href ?? CHALLENGE_URL)
  const document = { referrer: options.referrer ?? '' }
  let stored = options.stored ?? null

  const browser: TestBrowser = {
    calls,
    location,
    document,
    localStorage: {
      getItem: (key: string) => (key === CONSENT_STORAGE_KEY ? stored : null),
      setItem: (key: string, value: string) => {
        if (key === CONSENT_STORAGE_KEY) stored = value
      },
    },
    navigator: { globalPrivacyControl: options.globalPrivacyControl === true },
    setStored: (value: string | null) => {
      stored = value
    },
    installGtag: () => {
      browser.gtag = (...args: unknown[]) => calls.push(args)
    },
  }

  if (options.gtagReady) browser.installGtag()
  globals.window = browser

  try {
    run(browser)
  } finally {
    globals.window = previousWindow
  }
}

test('pre-existing allowed consent queues a cold referral open until tag configuration', () => {
  withBrowser({ stored: storedChoice(true), gtagReady: false }, (browser) => {
    assert.equal(trackEvent('referral_open', referralParams(), { onceKey: ONCE_KEY }), true)
    assert.equal(trackEvent('referral_open', referralParams(), { onceKey: ONCE_KEY }), false)
    assert.deepEqual(browser.calls, [])

    browser.installGtag()
    markAnalyticsConfigured()
    markAnalyticsConfigured()
    assert.equal(trackEvent('referral_open', referralParams(), { onceKey: ONCE_KEY }), false)

    assert.deepEqual(browser.calls, [
      [
        'event',
        'referral_open',
        {
          game: 'truthle',
          puzzle_day: '2026-11-02',
          status: 'current',
          page_location: CLEAN_CHALLENGE_LOCATION,
        },
      ],
    ])
    assertNoPrivateTokens(browser.calls)
  })
})

test('late consent emits the referral open once after the tag is configured', () => {
  withBrowser({ stored: null, gtagReady: true }, (browser) => {
    markAnalyticsConfigured()
    assert.equal(trackEvent('referral_open', referralParams(), { onceKey: ONCE_KEY }), false)
    assert.deepEqual(browser.calls, [])

    browser.setStored(storedChoice(true))
    assert.equal(trackEvent('referral_open', referralParams(), { onceKey: ONCE_KEY }), true)
    assert.equal(trackEvent('referral_open', referralParams(), { onceKey: ONCE_KEY }), false)

    assert.deepEqual(browser.calls, [
      ['set', { page_location: CLEAN_CHALLENGE_LOCATION }],
      [
        'event',
        'referral_open',
        {
          game: 'truthle',
          puzzle_day: '2026-11-02',
          status: 'current',
          page_location: CLEAN_CHALLENGE_LOCATION,
        },
      ],
    ])
  })
})

test('late consent queues safely when the tag becomes ready after consent', () => {
  withBrowser({ stored: null, gtagReady: false }, (browser) => {
    assert.equal(trackEvent('referral_open', referralParams(), { onceKey: ONCE_KEY }), false)
    browser.setStored(storedChoice(true))
    assert.equal(trackEvent('referral_open', referralParams(), { onceKey: ONCE_KEY }), true)
    assert.deepEqual(browser.calls, [])

    browser.installGtag()
    markAnalyticsConfigured()
    assert.equal(browser.calls.length, 1)
    assert.equal(browser.calls[0]?.[1], 'referral_open')
  })
})

test('preconsent actions are not queued or replayed after consent', () => {
  withBrowser({ stored: null, gtagReady: false }, (browser) => {
    assert.equal(trackEvent('game_start', { game: 'truthle' }, { onceKey: 'game_start' }), false)
    browser.setStored(storedChoice(true))
    browser.installGtag()
    markAnalyticsConfigured()
    assert.deepEqual(browser.calls, [])
  })
})

test('unknown, denied, GPC and nonproduction consent never queue referral events', () => {
  const contexts: Array<{ label: string; options: BrowserOptions }> = [
    { label: 'unknown', options: { stored: null, gtagReady: false } },
    { label: 'denied', options: { stored: storedChoice(false, true), gtagReady: false } },
    {
      label: 'GPC',
      options: { stored: storedChoice(true, true), globalPrivacyControl: true, gtagReady: false },
    },
    {
      label: 'nonproduction',
      options: {
        stored: storedChoice(true),
        href: 'https://preview.example.test/challenge/?game=truthle&day=2026-11-02',
        gtagReady: false,
      },
    },
  ]

  for (const { label, options } of contexts) {
    withBrowser(options, (browser) => {
      assert.equal(
        trackEvent('referral_open', referralParams(), { onceKey: ONCE_KEY }),
        false,
        label
      )
      browser.installGtag()
      markAnalyticsConfigured()
      assert.deepEqual(browser.calls, [], label)
    })
  }
})

test('withdrawal clears an unsent referral event and re-grant does not replay it', () => {
  withBrowser({ stored: storedChoice(true), gtagReady: false }, (browser) => {
    assert.equal(trackEvent('referral_open', referralParams(), { onceKey: ONCE_KEY }), true)

    browser.setStored(storedChoice(false))
    clearQueuedAnalyticsEvents()
    browser.installGtag()
    markAnalyticsConfigured()
    assert.deepEqual(browser.calls, [])

    browser.setStored(storedChoice(true))
    assert.equal(trackEvent('referral_open', referralParams(), { onceKey: ONCE_KEY }), false)
    assert.deepEqual(browser.calls, [])
  })
})

test('withdrawal after delivery does not replay the referral open on re-grant', () => {
  withBrowser({ stored: storedChoice(true), gtagReady: true }, (browser) => {
    markAnalyticsConfigured()
    assert.equal(trackEvent('referral_open', referralParams(), { onceKey: ONCE_KEY }), true)
    assert.equal(browser.calls.filter((call) => call[0] === 'event').length, 1)

    browser.setStored(storedChoice(false))
    clearQueuedAnalyticsEvents()
    browser.setStored(storedChoice(true))
    assert.equal(trackEvent('referral_open', referralParams(), { onceKey: ONCE_KEY }), false)
    assert.equal(browser.calls.filter((call) => call[0] === 'event').length, 1)
  })
})

test('queued referral payloads strip gift codes, identity fields and raw query text', () => {
  withBrowser(
    {
      stored: storedChoice(true),
      gtagReady: false,
      href:
        'https://theworldtruth.com/challenge/?game=truthle&day=2026-11-02&code=QA_RELEASE_ONLY&email=person%40example.com&uid=user-123&session_id=cs_live_SECRET#friend',
      referrer:
        'https://www.google.com/search?q=person%40example.com&uid=user-123&code=RAW-GIFT#result',
    },
    (browser) => {
      trackEvent(
        'referral_open',
        {
          ...referralParams(),
          code: 'QA_RELEASE_ONLY',
          email: 'person@example.com',
          uid: 'user-123',
          session_id: 'cs_live_SECRET',
          checkout_id: 'cs_live_SECRET',
          url: 'https://theworldtruth.com/challenge/?code=QA_RELEASE_ONLY',
          query: '?game=truthle&code=QA_RELEASE_ONLY',
        },
        { onceKey: ONCE_KEY }
      )

      browser.installGtag()
      markAnalyticsConfigured()

      assert.deepEqual(browser.calls, [
        [
          'event',
          'referral_open',
          {
            game: 'truthle',
            puzzle_day: '2026-11-02',
            status: 'current',
            page_location: CLEAN_CHALLENGE_LOCATION,
            page_referrer: 'https://www.google.com',
          },
        ],
      ])
      assertNoPrivateTokens(browser.calls)
    }
  )
})

test('challenge page tracks one consent-aware referral open without private payloads', () => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
  const source = readFileSync(path.join(root, 'src/app/challenge/page.tsx'), 'utf8')

  assert.match(source, /useConsent/)
  assert.match(source, /consent\?\.analytics === true/)
  assert.match(source, /if \(!analyticsAllowed \|\| !state\) return/)
  assert.doesNotMatch(source, /setInterval|setTimeout/)

  const referralTrack = source.match(/trackEvent\('referral_open',\s*\{([\s\S]*?)\}\)/)
  assert.ok(referralTrack)
  assert.match(referralTrack[1], /status: state\.status/)
  assert.match(referralTrack[1], /onceKey:/)
  assert.doesNotMatch(referralTrack[1], /\bcode\b/i)
})

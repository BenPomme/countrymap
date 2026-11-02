import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  buildChallengeUrl,
  clearRememberedChallenge,
  getRememberedChallenge,
  isValidChallengeDay,
  normalizeGiftCode,
  rememberChallenge,
} from '../src/lib/truthle/gifts'
import { parseChallengeSearch } from '../src/app/challenge/challengeState'
import {
  COMMISSION_DISCLOSURE,
  FRIEND_GIFT_TERMS,
  getAffiliateContentId,
  getAmazonStorefrontLabel,
  getAvailableOrdinaryPicks,
  getOrdinaryPicks,
  type OrdinaryPick,
} from '../src/lib/affiliate/rewards'
import { getMillisecondsUntilNextUtcDay } from '../src/lib/affiliate/dailyUnlocks'
import { filterEventParams } from '../src/lib/analytics/events'
import {
  AMAZON_ASSOCIATE_TAG,
  AMAZON_DOMAIN,
  amazonDealsUrl,
  amazonSearchUrl,
} from '../src/lib/constants/affiliates'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const ownedSourcePaths = [
  'src/components/affiliate',
  'src/lib/affiliate',
  'src/lib/truthle/gifts.ts',
  'src/lib/truthle/monetizeCopy.ts',
  'src/components/truthle/RewardsTeaser.tsx',
  'src/components/truthle/EmailPreferences.tsx',
  'src/app/rewards',
  'src/app/challenge',
]

class MemoryStorage implements Storage {
  private data = new Map<string, string>()

  get length(): number {
    return this.data.size
  }

  clear(): void {
    this.data.clear()
  }

  getItem(key: string): string | null {
    return this.data.get(key) ?? null
  }

  key(index: number): string | null {
    return Array.from(this.data.keys())[index] ?? null
  }

  removeItem(key: string): void {
    this.data.delete(key)
  }

  setItem(key: string, value: string): void {
    this.data.set(key, String(value))
  }
}

class FailingSetStorage implements Storage {
  private readonly backing: MemoryStorage

  constructor(backing: MemoryStorage) {
    this.backing = backing
  }

  get length(): number {
    return this.backing.length
  }

  clear(): void {
    this.backing.clear()
  }

  getItem(key: string): string | null {
    return this.backing.getItem(key)
  }

  key(index: number): string | null {
    return this.backing.key(index)
  }

  removeItem(key: string): void {
    this.backing.removeItem(key)
  }

  setItem(): void {
    throw new Error('Storage quota exceeded')
  }
}

function installWindow(value: unknown): void {
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    writable: true,
    value,
  })
}

function removeWindow(): void {
  delete (globalThis as unknown as { window?: unknown }).window
}

function readSource(relativePath: string): string {
  return readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function collectSourceFiles(relativePath: string): string[] {
  const absolutePath = path.join(ROOT, relativePath)
  const stat = statSync(absolutePath)
  if (stat.isFile()) return [absolutePath]

  return readdirSync(absolutePath).flatMap((entry) =>
    collectSourceFiles(path.relative(ROOT, path.join(absolutePath, entry))),
  )
}

test('builds canonical challenge URLs with optional normalized codes', () => {
  assert.equal(
    buildChallengeUrl({ game: 'truthle', day: '2026-11-02' }),
    'https://theworldtruth.com/challenge/?game=truthle&day=2026-11-02',
  )
  assert.equal(
    buildChallengeUrl({ game: 'true-false', day: '2026-11-02', code: ' wt-abc123 ' }),
    'https://theworldtruth.com/challenge/?game=true-false&day=2026-11-02&code=WT-ABC123',
  )
  assert.equal(
    buildChallengeUrl({ game: 'truthle', day: '2026-11-02', code: 'bad code' }),
    'https://theworldtruth.com/challenge/?game=truthle&day=2026-11-02',
  )
  assert.equal(
    buildChallengeUrl({ game: 'other' as 'truthle', day: '2026-11-02' }),
    'https://theworldtruth.com/challenge/',
  )
  assert.equal(
    buildChallengeUrl({ game: 'truthle', day: '2023-02-29' }),
    'https://theworldtruth.com/challenge/',
  )
})

test('validates real UTC days and safe gift code formats', () => {
  assert.equal(isValidChallengeDay('2024-02-29'), true)
  assert.equal(isValidChallengeDay('2026-02-29'), false)
  assert.equal(isValidChallengeDay('2026-02-30'), false)
  assert.equal(isValidChallengeDay('02-11-2026'), false)
  assert.equal(isValidChallengeDay('2026-11-02T00:00:00Z'), false)
  assert.equal(isValidChallengeDay(null), false)

  assert.equal(normalizeGiftCode(' wt-abc123 '), 'WT-ABC123')
  assert.equal(normalizeGiftCode('AB_12'), 'AB_12')
  assert.equal(normalizeGiftCode('A'), null)
  assert.equal(normalizeGiftCode('bad code'), null)
  assert.equal(normalizeGiftCode('<script>'), null)
  assert.equal(normalizeGiftCode(123), null)
})

test('remembers and clears separate challenge contexts in session storage', () => {
  const storage = new MemoryStorage()
  installWindow({ sessionStorage: storage })

  try {
    assert.equal(rememberChallenge({ game: 'truthle', day: '2026-11-02' }), true)
    assert.deepEqual(getRememberedChallenge('truthle'), { game: 'truthle', day: '2026-11-02' })

    assert.equal(rememberChallenge({ game: 'truthle', day: '2026-11-02', code: 'wt-abc123' }), true)
    assert.deepEqual(getRememberedChallenge('truthle'), {
      game: 'truthle',
      day: '2026-11-02',
      code: 'WT-ABC123',
    })

    assert.equal(rememberChallenge({ game: 'true-false', day: '2026-11-02', code: 'WT-XYZ789' }), true)
    assert.deepEqual(getRememberedChallenge('true-false'), {
      game: 'true-false',
      day: '2026-11-02',
      code: 'WT-XYZ789',
    })

    clearRememberedChallenge('truthle')
    assert.equal(getRememberedChallenge('truthle'), null)
    assert.deepEqual(getRememberedChallenge('true-false'), {
      game: 'true-false',
      day: '2026-11-02',
      code: 'WT-XYZ789',
    })
  } finally {
    removeWindow()
  }
})

test('rejects and removes corrupted or mismatched stored contexts', () => {
  const storage = new MemoryStorage()
  installWindow({ sessionStorage: storage })

  try {
    storage.setItem('wt_challenge_v1_truthle', '{not json')
    assert.equal(getRememberedChallenge('truthle'), null)
    assert.equal(storage.getItem('wt_challenge_v1_truthle'), null)

    storage.setItem('wt_challenge_v1_truthle', JSON.stringify({ game: 'true-false', day: '2026-11-02' }))
    assert.equal(getRememberedChallenge('truthle'), null)
    assert.equal(storage.getItem('wt_challenge_v1_truthle'), null)

    storage.setItem('wt_challenge_v1_truthle', JSON.stringify({ game: 'truthle', day: '2023-02-29' }))
    assert.equal(getRememberedChallenge('truthle'), null)
    assert.equal(storage.getItem('wt_challenge_v1_truthle'), null)

    storage.setItem('wt_challenge_v1_truthle', JSON.stringify({ game: 'truthle', day: '2026-11-02', code: 'bad code' }))
    assert.equal(getRememberedChallenge('truthle'), null)
    assert.equal(storage.getItem('wt_challenge_v1_truthle'), null)
  } finally {
    removeWindow()
  }
})

test('gift helpers fail safely without usable session storage', () => {
  removeWindow()
  assert.equal(rememberChallenge({ game: 'truthle', day: '2026-11-02' }), false)
  assert.equal(getRememberedChallenge('truthle'), null)
  assert.doesNotThrow(() => clearRememberedChallenge('truthle'))

  installWindow({
    get sessionStorage(): Storage {
      throw new Error('Storage blocked')
    },
  })

  try {
    assert.equal(rememberChallenge({ game: 'truthle', day: '2026-11-02', code: 'WT-ABC123' }), false)
    assert.equal(getRememberedChallenge('truthle'), null)
    assert.doesNotThrow(() => clearRememberedChallenge('truthle'))
  } finally {
    removeWindow()
  }
})

test('a failed save removes any stale challenge context', () => {
  const backing = new MemoryStorage()
  backing.setItem('wt_challenge_v1_truthle', JSON.stringify({ game: 'truthle', day: '2026-11-01', code: 'WT-OLD123' }))
  installWindow({ sessionStorage: new FailingSetStorage(backing) })

  try {
    assert.equal(rememberChallenge({ game: 'truthle', day: '2026-11-02', code: 'WT-NEW123' }), false)
    assert.equal(getRememberedChallenge('truthle'), null)
    assert.equal(backing.getItem('wt_challenge_v1_truthle'), null)
  } finally {
    removeWindow()
  }
})

test('parses invalid, past, current and future challenge states', () => {
  const today = '2026-11-02'

  assert.equal(parseChallengeSearch('?game=truthle&day=2026-11-01', today).status, 'past')
  assert.equal(parseChallengeSearch('?game=truthle&day=2026-11-02', today).status, 'current')
  assert.equal(parseChallengeSearch('?game=truthle&day=2026-11-03', today).status, 'future')

  const invalidGame = parseChallengeSearch('?game=worldle&day=2026-11-02', today)
  assert.equal(invalidGame.status, 'invalid')
  assert.equal(invalidGame.invalidReason, 'game')

  const invalidDay = parseChallengeSearch('?game=truthle&day=2026-02-30', today)
  assert.equal(invalidDay.status, 'invalid')
  assert.equal(invalidDay.invalidReason, 'day')

  const currentWithCode = parseChallengeSearch('?game=true-false&day=2026-11-02&code=wt-abc123', today)
  assert.deepEqual(currentWithCode, {
    status: 'current',
    today,
    game: 'true-false',
    day: '2026-11-02',
    code: 'WT-ABC123',
    codeRejected: false,
  })

  const currentWithBadCode = parseChallengeSearch('?game=truthle&day=2026-11-02&code=bad%20code', today)
  assert.equal(currentWithBadCode.status, 'current')
  assert.equal(currentWithBadCode.code, undefined)
  assert.equal(currentWithBadCode.codeRejected, true)
})

test('ordinary Amazon picks are identical at zero and full score', () => {
  const atZero = getOrdinaryPicks('2026-11-02', 0)
  const atFull = getOrdinaryPicks('2026-11-02', 5)

  assert.ok(atZero.length > 0)
  assert.deepEqual(atZero, atFull)
  assert.ok(atZero.every((pick) => Boolean(pick.href)))
  assert.equal(getAmazonStorefrontLabel('amazon.co.uk'), 'Amazon UK')
  assert.match(COMMISSION_DISCLOSURE, /commission/i)
  assert.equal(FRIEND_GIFT_TERMS.some((term) => /23:59:59 UTC/.test(term)), true)
  assert.equal(FRIEND_GIFT_TERMS.some((term) => /can be used once/.test(term)), true)
  assert.equal(FRIEND_GIFT_TERMS.some((term) => /one friend code per UTC day/.test(term)), true)
  assert.equal(FRIEND_GIFT_TERMS.some((term) => /self-use/i.test(term)), false)
})

test('Amazon search and deals links preserve the configured marketplace and tag', () => {
  const search = new URL(amazonSearchUrl('world atlas') ?? '')
  assert.equal(search.protocol, 'https:')
  assert.equal(search.hostname, `www.${AMAZON_DOMAIN}`)
  assert.equal(search.pathname, '/s')
  assert.equal(search.searchParams.get('k'), 'world atlas')
  assert.equal(search.searchParams.get('tag'), AMAZON_ASSOCIATE_TAG)

  const deals = new URL(amazonDealsUrl('amazon.com', 'curious-minds-20') ?? '')
  assert.equal(deals.protocol, 'https:')
  assert.equal(deals.hostname, 'www.amazon.com')
  assert.equal(deals.pathname, '/gp/goldbox')
  assert.equal(deals.searchParams.get('tag'), 'curious-minds-20')

  const configuredDeals = new URL(amazonDealsUrl() ?? '')
  assert.equal(configuredDeals.hostname, `www.${AMAZON_DOMAIN}`)
  assert.equal(configuredDeals.pathname, '/gp/goldbox')
  assert.equal(configuredDeals.searchParams.get('tag'), AMAZON_ASSOCIATE_TAG)
  assert.equal(amazonDealsUrl('amazon.com', ''), null)
  assert.equal(amazonDealsUrl('', 'curious-minds-20'), null)
})

test('affiliate cards filter missing links before applying the display limit', () => {
  const picks: OrdinaryPick[] = [
    { label: 'Missing', query: 'missing', href: null },
    { label: 'World atlases', query: 'world atlas', href: 'https://www.amazon.co.uk/s?k=world+atlas&tag=worldtruth-21' },
    { label: 'Empty', query: 'empty', href: '' },
    { label: 'Travel guides', query: 'travel guide', href: 'https://www.amazon.co.uk/s?k=travel+guide&tag=worldtruth-21' },
  ]

  assert.deepEqual(
    getAvailableOrdinaryPicks(picks, 2).map((pick) => pick.label),
    ['World atlases', 'Travel guides'],
  )
  assert.deepEqual(getAvailableOrdinaryPicks(picks, 0), [])
  assert.deepEqual(getAvailableOrdinaryPicks(picks, Number.NaN), [])
  assert.deepEqual(getAvailableOrdinaryPicks(picks.filter((pick) => !pick.href), 4), [])
})

test('affiliate content IDs are stable and safe for the analytics allowlist', () => {
  assert.equal(getAffiliateContentId('World atlas'), 'amazon_world-atlas')
  assert.equal(getAffiliateContentId('World atlas'), getAffiliateContentId('World atlas'))
  assert.equal(getAffiliateContentId('RFID-blocking passport holders'), 'amazon_rfid-blocking-passport-holders')
  assert.equal(getAffiliateContentId('<script>alert(1)</script>'), 'amazon_script-alert-1-script')
  assert.equal(getAffiliateContentId('   '), undefined)
  assert.equal(getAffiliateContentId('東京'), undefined)
  assert.match(getAffiliateContentId('World atlas') ?? '', /^[A-Za-z0-9]+(?:[._-][A-Za-z0-9]+)*$/)
})

test('Amazon deals use the stable allowlisted analytics content ID', () => {
  assert.deepEqual(
    filterEventParams('affiliate_click', {
      partner: 'amazon',
      placement: 'home-hero',
      content_id: 'amazon_daily_deals',
    }),
    {
      partner: 'amazon',
      placement: 'home-hero',
      content_id: 'amazon_daily_deals',
    },
  )
})

test('UTC shelf refresh waits for the next UTC midnight', () => {
  assert.equal(getMillisecondsUntilNextUtcDay(new Date('2026-11-02T00:00:00.000Z')), 24 * 60 * 60 * 1000)
  assert.equal(getMillisecondsUntilNextUtcDay(new Date('2026-11-02T23:59:59.500Z')), 500)
  assert.equal(getMillisecondsUntilNextUtcDay(new Date('invalid')), 24 * 60 * 60 * 1000)
})

test('owned source contains no discontinued merchant or bonus offer', () => {
  const allSource = collectSourceFiles('src').map((file) => readFileSync(file, 'utf8')).join('\n')
  const prohibited = /\bLIEN\b|\bLIENETCIE\b|\bLIEN\s*&\s*CIE\b|\bTRUTHLE10\b|10\s*%\s*off|partner\s+bonus|5\s*\/\s*5\s+bonus|five\s+of\s+five/gi
  assert.deepEqual(allSource.match(prohibited), null)

  assert.equal(ownedSourcePaths.length > 0, true)
})

test('new rewards and challenge copy has no em or en dashes', () => {
  const files = ownedSourcePaths.flatMap(collectSourceFiles)
  const offenders = files.filter((file) => /\u2013|\u2014/.test(readFileSync(file, 'utf8')))
  assert.deepEqual(offenders, [])
})

test('challenge page keeps link opening free of mint, consume and archive promises', () => {
  const challengeSource = readSource('src/app/challenge/page.tsx')
  const rewardsSource = readSource('src/app/rewards/page.tsx')

  assert.match(challengeSource, /parseChallengeSearch\(window\.location\.search\)/)
  assert.match(challengeSource, /rememberChallenge\(/)
  assert.doesNotMatch(challengeSource, /mintSharePromo|mintTruthleSharePromo|createRetryCheckout|consumeCloudRetry|grantPaidRetries|httpsCallable|fetch\(/)
  assert.doesNotMatch(challengeSource, /archiv|replay any past|past puzzle.*playable/i)

  const referralTrack = challengeSource.match(/trackEvent\('referral_open',\s*\{([\s\S]*?)\}\)/)
  assert.ok(referralTrack)
  assert.doesNotMatch(referralTrack[1], /\bcode\b/i)

  assert.match(rewardsSource, /href: '\/truthle\/'/)
  assert.match(rewardsSource, /href: '\/true-false\/'/)
  assert.match(rewardsSource, /href: '\/truthle\/shop\/'/)
  assert.match(rewardsSource, /FRIEND_GIFT_TERMS/)
  assert.match(rewardsSource, /DailyAmazonPicks/)
  assert.match(rewardsSource, /placement="rewards-hub"/)
  assert.doesNotMatch(rewardsSource, /<AffiliateShelf/)
  assert.doesNotMatch(rewardsSource, /unavailable|coming soon|future partner|booking|vpn|LIENETCIE|TRUTHLE10/i)
})

test('affiliate shelves keep sponsored links and consent-aware event paths', () => {
  const shelfSource = readSource('src/components/affiliate/AffiliateShelf.tsx')
  const contextualSource = readSource('src/components/affiliate/ContextualOffers.tsx')

  assert.match(shelfSource, /rel="sponsored nofollow noopener noreferrer"/)
  assert.match(shelfSource, /target="_blank"/)
  assert.match(shelfSource, /trackEvent\('affiliate_click'/)
  assert.match(shelfSource, /amazon_daily_deals/)
  assert.match(shelfSource, /amazonDealsUrl\(\)/)
  assert.match(contextualSource, /<AmazonDealsAction placement="map-context"/)
  assert.match(contextualSource, /rel="sponsored nofollow noopener noreferrer"/)
  assert.doesNotMatch(shelfSource, /fetch\(|sendBeacon|gtag\(/)
  assert.doesNotMatch(contextualSource, /fetch\(|sendBeacon|gtag\(/)
})

test('email preferences remain disabled and are not mounted', () => {
  const emailPreferences = readSource('src/components/truthle/EmailPreferences.tsx')
  assert.match(emailPreferences, /Email reminders are disabled/)
  assert.doesNotMatch(emailPreferences, /fetch\(|httpsCallable|sendMail\(|trackEvent\(|<button|<input/i)

  const allSource = collectSourceFiles('src')
    .filter((file) => !file.endsWith('EmailPreferences.tsx'))
    .map((file) => readFileSync(file, 'utf8'))
    .join('\n')
  assert.doesNotMatch(allSource, /import\s+EmailPreferences|<EmailPreferences/)
})

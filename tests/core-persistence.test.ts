import test, { before, mock } from 'node:test'
import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'
import {
  getCompletionStreak,
  getDisplayStreak,
  getUtcDay,
} from '../src/lib/truthle/dailyLifecycle'
import {
  getDefaultTruthleState,
  sanitizeTruthleState,
} from '../src/lib/truthle/localState'
import { completeDailyAttempt } from '../src/lib/truthle/attemptLifecycle'
import {
  CommerceRequestError,
  createCommerceService,
  type CommerceStorage,
  type CommerceTransport,
  type WalletClaimResponse,
} from '../src/lib/truthle/commerce'

class MemoryStorage implements CommerceStorage {
  private readonly data = new Map<string, string>()

  getItem(key: string): string | null {
    return this.data.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.data.set(key, String(value))
  }

  removeItem(key: string): void {
    this.data.delete(key)
  }

  clear(): void {
    this.data.clear()
  }
}

const firebaseStub = {
  currentUid: 'account-a',
  callable: async (name: string): Promise<unknown> => {
    throw new Error(`Unexpected callable: ${name}`)
  },
  setDocCalls: [] as Array<{ path: string; data: unknown }>,

  async ensureAuth(): Promise<{ uid: string }> {
    return { uid: this.currentUid }
  },

  async setDoc(path: string, data: unknown): Promise<void> {
    this.setDocCalls.push({ path, data })
  },

  async getDoc(): Promise<{ exists: () => boolean; data: () => null }> {
    return { exists: () => false, data: () => null }
  },
}

const stubSources = new Map([
  [
    'core-persistence:firebase-config',
    `export const db = {};
     export const functionsClient = {};
     export function ensureAnonymousAuth() {
       return globalThis.__corePersistenceFirebase.ensureAuth();
     }`,
  ],
  [
    'core-persistence:firebase-firestore',
    `export function doc(_db, ...parts) { return { path: parts.join('/') }; }
     export function getDoc(ref) { return globalThis.__corePersistenceFirebase.getDoc(ref.path); }
     export function setDoc(ref, data) { return globalThis.__corePersistenceFirebase.setDoc(ref.path, data); }
     export function serverTimestamp() { return { seconds: 1, nanoseconds: 0 }; }`,
  ],
  [
    'core-persistence:firebase-functions',
    `export function httpsCallable(_client, name) {
       return async (request) => ({
         data: await globalThis.__corePersistenceFirebase.callable(name, request),
       });
     }`,
  ],
])

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@/lib/firebase/config') {
      return { url: 'core-persistence:firebase-config', shortCircuit: true }
    }
    if (specifier === 'firebase/firestore') {
      return { url: 'core-persistence:firebase-firestore', shortCircuit: true }
    }
    if (specifier === 'firebase/functions') {
      return { url: 'core-persistence:firebase-functions', shortCircuit: true }
    }
    return nextResolve(specifier, context)
  },
  load(url, context, nextLoad) {
    const source = stubSources.get(url)
    if (source) return { format: 'module', source, shortCircuit: true }
    return nextLoad(url, context)
  },
})

const browserStorage = new MemoryStorage()
Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: { dispatchEvent() {} },
})
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: browserStorage,
})
Object.defineProperty(globalThis, '__corePersistenceFirebase', {
  configurable: true,
  value: firebaseStub,
})

let storage: typeof import('../src/lib/truthle/storage')

before(async () => {
  storage = await import('../src/lib/truthle/storage')
})

function resetBrowserState(): void {
  browserStorage.clear()
  firebaseStub.currentUid = 'account-a'
  firebaseStub.setDocCalls = []
  firebaseStub.callable = async (name: string): Promise<unknown> => {
    throw new Error(`Unexpected callable: ${name}`)
  }
}

function createTransport(overrides: Partial<CommerceTransport>): CommerceTransport {
  const unexpected = async (): Promise<never> => {
    throw new Error('Unexpected commerce transport call')
  }
  return {
    authenticate: async () => {},
    createRetryCheckout: unexpected,
    getCheckoutStatus: unexpected,
    consumeRetry: unexpected,
    claimWallet: unexpected,
    redeemReward: unexpected,
    ...overrides,
  }
}

test('UTC rollover and missed days reset the completion streak', () => {
  assert.equal(getUtcDay(new Date('2026-11-01T23:59:59.999Z')), '2026-11-01')
  assert.equal(getUtcDay(new Date('2026-11-02T00:00:00.000Z')), '2026-11-02')
  assert.equal(getUtcDay(new Date('2026-11-02T00:30:00+01:00')), '2026-11-01')

  const playedYesterday = { lastPlayedDate: '2026-11-01', currentStreak: 3 }
  assert.equal(getDisplayStreak(playedYesterday, '2026-11-02'), 3)
  assert.equal(getCompletionStreak(playedYesterday, '2026-11-02'), 4)

  const missedDay = { lastPlayedDate: '2026-10-31', currentStreak: 9 }
  assert.equal(getDisplayStreak(missedDay, '2026-11-02'), 0)
  assert.equal(getCompletionStreak(missedDay, '2026-11-02'), 1)
})

test('first completion awards coins once and persisted replay adds none', () => {
  const before = {
    ...getDefaultTruthleState(),
    lastPlayedDate: '2026-11-01',
    todayScore: 3,
    todayResults: [true, true, false, true, false],
    todayTimes: [2, 3, 4, 5, 6],
    streak: 4,
    bestStreak: 4,
    gamesPlayed: 7,
    totalCorrect: 22,
    coins: 41,
    totalCoinsEarned: 90,
  }

  const first = completeDailyAttempt(
    before,
    5,
    [true, true, true, true, false],
    [1, 2, 3, 4, 5],
    '2026-11-02',
  )

  assert.equal(first.isFirstCompletion, true)
  assert.ok(first.coinsAwarded > 0)
  assert.equal(first.state.coins, before.coins + first.coinsAwarded)
  assert.equal(first.state.totalCoinsEarned, before.totalCoinsEarned + first.coinsAwarded)
  assert.equal(first.state.gamesPlayed, before.gamesPlayed + 1)
  assert.equal(first.state.totalCorrect, before.totalCorrect + 4)

  const persisted = sanitizeTruthleState(JSON.parse(JSON.stringify(first.state)))
  const replay = completeDailyAttempt(
    persisted,
    0,
    [false, false, false, false, false],
    [9, 9, 9, 9, 9],
    '2026-11-02',
  )

  assert.equal(replay.isFirstCompletion, false)
  assert.equal(replay.coinsAwarded, 0)
  assert.equal(replay.state.coins, first.state.coins)
  assert.equal(replay.state.totalCoinsEarned, first.state.totalCoinsEarned)
  assert.equal(replay.state.gamesPlayed, first.state.gamesPlayed)
  assert.equal(replay.state.totalCorrect, first.state.totalCorrect)
  assert.equal(replay.state.todayScore, first.state.todayScore)
})

test('local state sanitization preserves valid progress and credits', () => {
  const state = sanitizeTruthleState({
    ...getDefaultTruthleState(),
    lastPlayedDate: '2026-11-02',
    todayScore: 4,
    todayResults: [true, true, false, true, true],
    todayTimes: [1, 2, 3, 4, 5],
    streak: 6,
    gamesPlayed: 12,
    totalCorrect: 48,
    coins: 37.9,
    totalCoinsEarned: 120,
    hints: 2,
    streakFreezes: 1,
    ownedItems: ['theme_ocean', 'theme_ocean'],
  })

  assert.equal(state.lastPlayedDate, '2026-11-02')
  assert.deepEqual(state.todayResults, [true, true, false, true, true])
  assert.equal(state.streak, 6)
  assert.equal(state.gamesPlayed, 12)
  assert.equal(state.totalCorrect, 48)
  assert.equal(state.coins, 37)
  assert.equal(state.totalCoinsEarned, 120)
  assert.equal(state.hints, 2)
  assert.equal(state.streakFreezes, 1)
  assert.deepEqual(state.ownedItems, ['theme_ocean'])
})

test('storage marks one first completion and replay performs no cloud write', async () => {
  resetBrowserState()
  mock.timers.enable({ apis: ['Date'], now: Date.parse('2026-11-02T12:00:00.000Z') })

  try {
    storage.saveLocalState({
      ...getDefaultTruthleState(),
      lastPlayedDate: '2026-11-01',
      todayScore: 3,
      todayResults: [true, false, true, true, false],
      todayTimes: [1, 2, 3, 4, 5],
      streak: 3,
      bestStreak: 3,
      gamesPlayed: 5,
      totalCorrect: 18,
      coins: 44,
      totalCoinsEarned: 95,
    })

    const first = await storage.saveAttempt(
      4,
      [true, true, false, true, false],
      [1, 2, 3, 4, 5],
    )
    const afterFirst = storage.getLocalState()

    assert.equal(first.isFirstCompletion, true)
    assert.equal(first.streak, 4)
    assert.equal(afterFirst.gamesPlayed, 6)
    assert.equal(afterFirst.totalCorrect, 21)
    assert.equal(afterFirst.coins, 44)
    assert.equal(firebaseStub.setDocCalls.length, 1)

    const replay = await storage.saveAttempt(
      0,
      [false, false, false, false, false],
      [9, 9, 9, 9, 9],
    )

    assert.equal(replay.isFirstCompletion, false)
    assert.equal(replay.streak, 4)
    assert.equal(firebaseStub.setDocCalls.length, 1)
    assert.deepEqual(storage.getLocalState(), afterFirst)
  } finally {
    mock.timers.reset()
  }
})

test('retry request id survives a lost response and service reload', async () => {
  const store = new MemoryStorage()
  const seenRequestIds: string[] = []
  let attempts = 0
  const transport = createTransport({
    async consumeRetry(request) {
      seenRequestIds.push(request.requestId)
      attempts += 1
      if (attempts === 1) {
        throw new CommerceRequestError('Lost response', false)
      }
      return {
        success: true,
        source: 'paid',
        remainingRetries: 2,
        receiptId: 'retry-receipt-1',
      }
    },
  })

  const firstService = createCommerceService({ storage: store, transport })
  await assert.rejects(firstService.consumeRetry(), /Lost response/)
  assert.equal(store.getItem('truthle_retry_request_v1'), seenRequestIds[0])

  const reloadedService = createCommerceService({ storage: store, transport })
  const result = await reloadedService.consumeRetry()

  assert.equal(seenRequestIds[1], seenRequestIds[0])
  assert.equal(result.reusedRequestId, true)
  assert.equal(result.receiptId, 'retry-receipt-1')
  assert.equal(store.getItem('truthle_retry_request_v1'), null)
})

test('wallet claim receipt applies once across reload and account switch', async () => {
  const store = new MemoryStorage()
  const applied: WalletClaimResponse[] = []
  let account = 'account-a'
  let claimId = 'claim-shared'
  let coins = 20

  const transport = createTransport({
    async authenticate() {
      assert.ok(account)
    },
    async claimWallet() {
      return { claimId, coins }
    },
  })
  const applyWalletClaim = (claim: WalletClaimResponse) => applied.push(claim)

  const accountAService = createCommerceService({ storage: store, transport, applyWalletClaim })
  const first = await accountAService.claimWallet('request-a')
  assert.equal(first.applied, true)

  account = 'account-b'
  const accountBService = createCommerceService({ storage: store, transport, applyWalletClaim })
  const duplicate = await accountBService.claimWallet('request-b')
  assert.equal(duplicate.applied, false)

  claimId = 'claim-account-b'
  coins = 7
  const fresh = await accountBService.claimWallet('request-b')
  assert.equal(fresh.applied, true)

  assert.deepEqual(applied, [
    { claimId: 'claim-shared', coins: 20 },
    { claimId: 'claim-account-b', coins: 7 },
  ])
})

test('storage wallet claims do not double add a receipt after account switch', async () => {
  resetBrowserState()
  storage.saveLocalState({
    ...getDefaultTruthleState(),
    coins: 5,
    totalCoinsEarned: 5,
  })

  let claimId = 'cloud-claim-a'
  let coins = 20
  firebaseStub.callable = async (name: string) => {
    assert.equal(name, 'claimTruthleWallet')
    return { claimId, coins }
  }

  const first = await storage.claimTruthleWallet({ requestId: 'request-a' })
  assert.equal(first.applied, true)
  assert.equal(storage.getCoins(), 25)

  firebaseStub.currentUid = 'account-b'
  const duplicate = await storage.claimTruthleWallet({ requestId: 'request-b' })
  assert.equal(duplicate.applied, false)
  assert.equal(storage.getCoins(), 25)

  claimId = 'cloud-claim-b'
  coins = 7
  const fresh = await storage.claimTruthleWallet({ requestId: 'request-b' })
  assert.equal(fresh.applied, true)
  assert.equal(storage.getCoins(), 32)
})

test('failed cloud sync preserves the durable wallet request id', async () => {
  resetBrowserState()
  firebaseStub.callable = async () => {
    throw new Error('Network unavailable')
  }
  const consoleError = mock.method(console, 'error', () => {})

  try {
    await storage.syncCloudCoins()
  } finally {
    consoleError.mock.restore()
  }

  assert.match(
    browserStorage.getItem('truthle_wallet_claim_request_v1') ?? '',
    /[A-Za-z0-9-]+/,
  )
})

test('cloud sync surfaces a transient claim failure instead of reporting zero', async () => {
  resetBrowserState()
  firebaseStub.callable = async () => {
    throw new Error('Network unavailable')
  }
  const consoleError = mock.method(console, 'error', () => {})

  try {
    await assert.rejects(storage.syncCloudCoins(), /Commerce request failed/)
  } finally {
    consoleError.mock.restore()
  }
})

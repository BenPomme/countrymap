import test, { before } from 'node:test'
import assert from 'node:assert/strict'
import type {
  CommerceStorage,
  CommerceTransport,
} from '../src/lib/truthle/commerce'

type ModuleHookContext = Record<string, unknown>

type ResolveResult = {
  url: string
  shortCircuit?: boolean
}

type LoadResult = {
  format?: string | null
  source?: string | ArrayBuffer | Uint8Array | null
  shortCircuit?: boolean
}

type ModuleHooks = {
  resolve?: (
    specifier: string,
    context: ModuleHookContext,
    nextResolve: (specifier: string, context?: ModuleHookContext) => ResolveResult,
  ) => ResolveResult
  load?: (
    url: string,
    context: ModuleHookContext,
    nextLoad: (url: string, context?: ModuleHookContext) => LoadResult,
  ) => LoadResult
}

type NodeModuleApi = {
  registerHooks(hooks: ModuleHooks): void
}

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

  entries(): Array<[string, string]> {
    return Array.from(this.data.entries())
  }
}

const firebaseStub = {
  authCalls: 0,
  callableCalls: [] as Array<{ name: string; request: unknown }>,
  setDocCalls: [] as Array<{ path: string; data: unknown }>,

  async ensureAuth(): Promise<{ uid: string }> {
    this.authCalls += 1
    return { uid: 'account-a' }
  },

  async callable(name: string, request: unknown): Promise<unknown> {
    this.callableCalls.push({ name, request })
    throw new Error(`Unexpected callable: ${name}`)
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
    'commerce-gate:firebase-config',
    `export const db = {};
     export const functionsClient = {};
     export function ensureAnonymousAuth() {
       return globalThis.__commerceGateFirebase.ensureAuth();
     }`,
  ],
  [
    'commerce-gate:firebase-firestore',
    `export function doc(_db, ...parts) { return { path: parts.join('/') }; }
     export function getDoc(ref) { return globalThis.__commerceGateFirebase.getDoc(ref.path); }
     export function setDoc(ref, data) { return globalThis.__commerceGateFirebase.setDoc(ref.path, data); }
     export function serverTimestamp() { return { seconds: 1, nanoseconds: 0 }; }`,
  ],
  [
    'commerce-gate:firebase-functions',
    `export function httpsCallable(_client, name) {
       return async (request) => ({
         data: await globalThis.__commerceGateFirebase.callable(name, request),
       });
     }`,
  ],
])

function hasRegisterHooks(value: unknown): value is NodeModuleApi {
  return (
    typeof value === 'object'
    && value !== null
    && 'registerHooks' in value
    && typeof value.registerHooks === 'function'
  )
}

async function installFirebaseModuleHooks(): Promise<void> {
  const runtimeModule: unknown = await import('node:module')
  if (!hasRegisterHooks(runtimeModule)) {
    throw new Error('This test requires Node.js 22.15 or newer with module.registerHooks')
  }

  runtimeModule.registerHooks({
    resolve(specifier, context, nextResolve) {
      if (specifier === '@/lib/firebase/config') {
        return { url: 'commerce-gate:firebase-config', shortCircuit: true }
      }
      if (specifier === 'firebase/firestore') {
        return { url: 'commerce-gate:firebase-firestore', shortCircuit: true }
      }
      if (specifier === 'firebase/functions') {
        return { url: 'commerce-gate:firebase-functions', shortCircuit: true }
      }
      return nextResolve(specifier, context)
    },
    load(url, context, nextLoad) {
      const source = stubSources.get(url)
      if (source) return { format: 'module', source, shortCircuit: true }
      return nextLoad(url, context)
    },
  })
}

const browserStorage = new MemoryStorage()
Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: { dispatchEvent() {} },
})
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: browserStorage,
})
Object.defineProperty(globalThis, '__commerceGateFirebase', {
  configurable: true,
  value: firebaseStub,
})

let release: typeof import('../src/lib/truthle/commerceRelease')
let commerce: typeof import('../src/lib/truthle/commerce')
let storage: typeof import('../src/lib/truthle/storage')
let dailyLifecycle: typeof import('../src/lib/truthle/dailyLifecycle')

before(async () => {
  delete process.env.NEXT_PUBLIC_TWT_SERVER_COMMERCE_READY
  await installFirebaseModuleHooks()
  release = await import('../src/lib/truthle/commerceRelease')
  commerce = await import('../src/lib/truthle/commerce')
  dailyLifecycle = await import('../src/lib/truthle/dailyLifecycle')
  storage = await import('../src/lib/truthle/storage')
})

function resetState(): void {
  browserStorage.clear()
  firebaseStub.authCalls = 0
  firebaseStub.callableCalls = []
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

test('only the exact build value true enables server commerce', () => {
  assert.equal(release.isServerCommerceReady(undefined), false)
  assert.equal(release.isServerCommerceReady(''), false)
  assert.equal(release.isServerCommerceReady('false'), false)
  assert.equal(release.isServerCommerceReady('TRUE'), false)
  assert.equal(release.isServerCommerceReady('1'), false)
  assert.equal(release.isServerCommerceReady(' true '), false)
  assert.equal(release.isServerCommerceReady('true'), true)
  assert.equal(release.SERVER_COMMERCE_READY, false)
})

test('disabled commerce rejects every side-effecting service call before authentication, storage, or network', async () => {
  const calls: string[] = []
  const store = new MemoryStorage()
  const applied: unknown[] = []
  const transport = createTransport({
    async authenticate() {
      calls.push('authenticate')
    },
    async createRetryCheckout() {
      calls.push('checkout')
      return { url: 'https://example.invalid/checkout', id: 'checkout-1' }
    },
    async getCheckoutStatus() {
      calls.push('status')
      return { status: 'pending', credits: 2 }
    },
    async consumeRetry() {
      calls.push('consume')
      return { success: true, source: 'paid', remainingRetries: 0, receiptId: 'receipt-1' }
    },
    async claimWallet() {
      calls.push('wallet')
      return { claimId: 'claim-1', coins: 10 }
    },
    async redeemReward() {
      calls.push('redeem')
      return { redemptionId: 'redemption-1', newBalance: 0 }
    },
  })
  const service = commerce.createCommerceService({
    storage: store,
    transport,
    applyWalletClaim: (claim) => applied.push(claim),
  })

  await assert.rejects(() => service.createRetryCheckout(1, 'truthle', 'legacy-code'), /temporarily unavailable/)
  await assert.rejects(() => service.consumeRetry(), /temporarily unavailable/)
  await assert.rejects(() => service.claimWallet('stable-claim-id'), /temporarily unavailable/)
  await assert.rejects(() => service.redeemReward('theme_ocean'), /temporarily unavailable/)

  assert.deepEqual(calls, [])
  assert.deepEqual(store.entries(), [])
  assert.deepEqual(applied, [])

  assert.deepEqual(await service.getCheckoutStatus('session-1'), { status: 'pending', credits: 2 })
  assert.deepEqual(calls, ['authenticate', 'status'])
})

test('enabled commerce retains checkout, retry, wallet, and redemption contracts', async () => {
  const store = new MemoryStorage()
  const applied: unknown[] = []
  let authCalls = 0
  const transport = createTransport({
    async authenticate() {
      authCalls += 1
    },
    async createRetryCheckout(request) {
      assert.deepEqual(request, { quantity: 2, returnTo: 'true-false', shareCode: 'friend-code' })
      return { url: 'https://example.invalid/checkout', id: 'checkout-1' }
    },
    async getCheckoutStatus() {
      return { status: 'fulfilled', credits: 1 }
    },
    async consumeRetry(request) {
      assert.match(request.requestId, /[A-Za-z0-9-]+/)
      return { success: true, source: 'paid', remainingRetries: 1, receiptId: 'receipt-1' }
    },
    async claimWallet(request) {
      assert.match(request.requestId, /[A-Za-z0-9-]+/)
      return { claimId: 'claim-1', coins: 12 }
    },
    async redeemReward(request) {
      assert.equal(request.rewardId, 'theme_ocean')
      assert.match(request.requestId, /[A-Za-z0-9-]+/)
      return { redemptionId: 'redemption-1', newBalance: 3 }
    },
  })
  const service = commerce.createCommerceService({
    storage: store,
    transport,
    commerceReady: true,
    applyWalletClaim: (claim) => applied.push(claim),
  })

  assert.deepEqual(await service.createRetryCheckout(2, 'true-false', 'friend-code'), {
    url: 'https://example.invalid/checkout',
    id: 'checkout-1',
  })
  assert.deepEqual(await service.getCheckoutStatus('session-1'), { status: 'fulfilled', credits: 1 })
  assert.deepEqual(await service.consumeRetry(), {
    success: true,
    source: 'paid',
    remainingRetries: 1,
    receiptId: 'receipt-1',
    reusedRequestId: false,
  })
  assert.deepEqual(await service.claimWallet('claim-request'), {
    claimId: 'claim-1',
    coins: 12,
    applied: true,
  })
  assert.deepEqual(await service.redeemReward('theme_ocean'), {
    redemptionId: 'redemption-1',
    newBalance: 3,
  })
  assert.deepEqual(applied, [{ claimId: 'claim-1', coins: 12 }])
  assert.equal(authCalls, 5)
})

test('disabled local commerce preserves coins, rewards, and stored state', () => {
  resetState()
  storage.saveLocalState({
    ...storage.getLocalState(),
    coins: 37,
    totalCoinsEarned: 40,
    ownedItems: ['theme_ocean'],
  })
  const before = storage.getLocalState()
  const rawBefore = browserStorage.getItem('truthle_state')

  assert.equal(storage.spendCoins(5), false)
  assert.deepEqual(storage.purchaseReward('badge_pioneer', 10), {
    success: false,
    error: release.REWARD_PURCHASE_UNAVAILABLE_MESSAGE,
  })

  assert.deepEqual(storage.getLocalState(), before)
  assert.equal(browserStorage.getItem('truthle_state'), rawBefore)
  assert.equal(storage.getCoins(), 37)
  assert.deepEqual(storage.getLocalState().ownedItems, ['theme_ocean'])
})

test('ordinary free daily save and progress remain available while commerce is disabled', async () => {
  resetState()
  storage.saveLocalState({
    ...storage.getLocalState(),
    coins: 41,
    totalCoinsEarned: 41,
  })

  const saved = await storage.saveAttempt(4, [true, true, false, true, true], [1, 2, 3, 4, 5])

  assert.equal(saved.success, true)
  assert.equal(saved.isFirstCompletion, true)
  assert.equal(firebaseStub.setDocCalls.length, 1)
  assert.equal(firebaseStub.callableCalls.length, 0)
  assert.equal(storage.getCoins(), 41)
  assert.equal(storage.getLocalState().gamesPlayed, 1)
})

test('disabled retry, promo, wallet, and redemption paths make no authenticated network calls or local writes', async () => {
  resetState()
  storage.saveLocalState({
    ...storage.getLocalState(),
    coins: 37,
    totalCoinsEarned: 40,
  })
  const before = storage.getLocalState()
  const day = dailyLifecycle.getUtcDay()
  browserStorage.setItem(
    `wt_share_promo_v1_${day}`,
    JSON.stringify({ code: 'LEGACY-FRIEND', expiresAt: `${day}T23:59:59.999Z` }),
  )

  assert.equal(await storage.createTruthleSharePromo(), null)
  assert.equal(storage.getStoredSharePromo()?.code, 'LEGACY-FRIEND')

  const checkout = await storage.createRetryCheckout(1, 'truthle', {
    shareCode: storage.getStoredSharePromo()?.code,
  })
  assert.deepEqual(checkout, {
    url: null,
    error: release.EXTRA_ATTEMPT_UNAVAILABLE_MESSAGE,
  })

  assert.deepEqual(await storage.saveRetryAttempt(4, [true, true, false, true, true], [1, 2, 3, 4, 5], 3), {
    success: false,
  })
  assert.deepEqual(await storage.consumeCloudRetry(), { success: false, remainingRetries: 0 })
  await assert.rejects(storage.syncCloudCoins(), /temporarily unavailable/)
  await assert.rejects(storage.claimTruthleWallet({ requestId: 'claim-request' }), /temporarily unavailable/)
  await assert.rejects(storage.redeemCloudReward({ rewardId: 'theme_ocean' }), /temporarily unavailable/)

  assert.equal(firebaseStub.authCalls, 0)
  assert.deepEqual(firebaseStub.callableCalls, [])
  assert.deepEqual(firebaseStub.setDocCalls, [])
  assert.equal(browserStorage.getItem('wt_device_key'), null)
  assert.equal(browserStorage.getItem('truthle_retry_request_v1'), null)
  assert.equal(browserStorage.getItem('truthle_wallet_claim_request_v1'), null)
  assert.equal(browserStorage.getItem('truthle_redeem_request_v1:theme_ocean'), null)
  assert.deepEqual(storage.getLocalState(), before)
})

test('read-only retry and checkout status queries remain available while commerce is disabled', async () => {
  resetState()
  firebaseStub.callable = async (name: string, request: unknown): Promise<unknown> => {
    firebaseStub.callableCalls.push({ name, request })
    if (name === 'getTruthleRetryStatus') {
      return {
        date: '2026-11-02',
        granted: true,
        consumed: false,
        canConsume: true,
        paidCredits: 2,
        source: 'backend',
      }
    }
    if (name === 'getTruthleCheckoutStatus') {
      return { status: 'pending', credits: 2 }
    }
    throw new Error(`Unexpected callable: ${name}`)
  }

  const retry = await storage.getCloudRetryStatus()
  const checkout = await storage.getTruthleCheckoutStatus({ sessionId: 'session-read-only' })

  assert.deepEqual(retry, {
    date: '2026-11-02',
    granted: true,
    consumed: false,
    canConsume: true,
    paidCredits: 2,
    source: 'backend',
  })
  assert.deepEqual(checkout, { status: 'pending', credits: 2 })
  assert.equal(firebaseStub.authCalls, 2)
  assert.deepEqual(firebaseStub.callableCalls.map((call) => call.name), [
    'getTruthleRetryStatus',
    'getTruthleCheckoutStatus',
  ])
})

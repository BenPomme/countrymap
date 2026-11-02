export type CheckoutStatus = 'pending' | 'fulfilled' | 'expired' | 'failed'

export interface RetryCheckoutRequest {
  quantity: number
  returnTo: 'truthle' | 'true-false'
  shareCode?: string
}

export interface RetryCheckoutResponse {
  url: string
  id: string
}

export interface CheckoutStatusResponse {
  status: CheckoutStatus
  credits: number
}

export interface RetryConsumptionResponse {
  success: boolean
  source: 'free' | 'paid'
  remainingRetries: number
  receiptId: string
}

export interface WalletClaimResponse {
  claimId: string
  coins: number
}

export interface RedemptionResponse {
  redemptionId: string
  newBalance: number
}

export interface CommerceTransport {
  authenticate(): Promise<void>
  createRetryCheckout(request: RetryCheckoutRequest): Promise<RetryCheckoutResponse>
  getCheckoutStatus(request: { sessionId: string }): Promise<CheckoutStatusResponse>
  consumeRetry(request: { requestId: string }): Promise<RetryConsumptionResponse>
  claimWallet(request: { requestId: string }): Promise<WalletClaimResponse>
  redeemReward(request: { rewardId: string; requestId: string }): Promise<RedemptionResponse>
}

export interface CommerceStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export class CommerceRequestError extends Error {
  readonly definitive: boolean

  constructor(message: string, definitive: boolean) {
    super(message)
    this.name = 'CommerceRequestError'
    this.definitive = definitive
  }
}

const RETRY_REQUEST_KEY = 'truthle_retry_request_v1'
const WALLET_REQUEST_KEY = 'truthle_wallet_claim_request_v1'
const WALLET_RECEIPTS_KEY = 'truthle_wallet_claim_receipts_v1'
const MAX_WALLET_RECEIPTS = 100

function requestId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

function readJsonArray(storage: CommerceStorage, key: string): string[] {
  try {
    const parsed = JSON.parse(storage.getItem(key) || '[]')
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string' && item.length > 0)
      : []
  } catch {
    return []
  }
}

function assertNonNegativeInteger(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new CommerceRequestError(`Invalid ${field}`, true)
  }
  return Math.floor(value)
}

function assertNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new CommerceRequestError(`Invalid ${field}`, true)
  }
  return value
}

function isDefinitive(error: unknown): boolean {
  return error instanceof CommerceRequestError && error.definitive
}

export interface CommerceServiceOptions {
  storage: CommerceStorage
  transport: CommerceTransport
  applyWalletClaim?: (claim: WalletClaimResponse) => void
}

export function createCommerceService({ storage, transport, applyWalletClaim }: CommerceServiceOptions) {
  function pendingRequestId(key: string): string | null {
    const existing = storage.getItem(key)
    return existing && existing.trim().length > 0 ? existing : null
  }

  function getOrCreateRequestId(key: string): string {
    const existing = pendingRequestId(key)
    if (existing) return existing
    const created = requestId()
    storage.setItem(key, created)
    return created
  }

  return {
    async createRetryCheckout(
      quantity = 1,
      returnTo: 'truthle' | 'true-false' = 'truthle',
      shareCode?: string
    ): Promise<RetryCheckoutResponse> {
      const safeQuantity = Math.floor(quantity)
      if (!Number.isFinite(safeQuantity) || safeQuantity < 1) {
        throw new CommerceRequestError('Invalid checkout quantity', true)
      }
      await transport.authenticate()
      const result = await transport.createRetryCheckout({
        quantity: safeQuantity,
        returnTo,
        ...(shareCode ? { shareCode } : {}),
      })
      return {
        url: assertNonEmptyString(result?.url, 'checkout url'),
        id: assertNonEmptyString(result?.id, 'checkout id'),
      }
    },

    async getCheckoutStatus(sessionId: string): Promise<CheckoutStatusResponse> {
      const safeSessionId = assertNonEmptyString(sessionId, 'session id')
      await transport.authenticate()
      const result = await transport.getCheckoutStatus({ sessionId: safeSessionId })
      const statuses: CheckoutStatus[] = ['pending', 'fulfilled', 'expired', 'failed']
      if (!result || !statuses.includes(result.status)) {
        throw new CommerceRequestError('Invalid checkout status', true)
      }
      return {
        status: result.status,
        credits: assertNonNegativeInteger(result.credits, 'checkout credits'),
      }
    },

    async consumeRetry(): Promise<RetryConsumptionResponse & { reusedRequestId: boolean }> {
      const reusedRequestId = pendingRequestId(RETRY_REQUEST_KEY) !== null
      const stableRequestId = getOrCreateRequestId(RETRY_REQUEST_KEY)
      try {
        await transport.authenticate()
        const result = await transport.consumeRetry({ requestId: stableRequestId })
        const receiptId = assertNonEmptyString(result?.receiptId, 'retry receipt id')
        const remainingRetries = assertNonNegativeInteger(result?.remainingRetries, 'remaining retries')
        if (result.source !== 'free' && result.source !== 'paid') {
          throw new CommerceRequestError('Invalid retry source', true)
        }
        storage.removeItem(RETRY_REQUEST_KEY)
        return { ...result, receiptId, remainingRetries, reusedRequestId }
      } catch (error) {
        if (isDefinitive(error)) {
          storage.removeItem(RETRY_REQUEST_KEY)
        }
        throw error
      }
    },

    async claimWallet(stableRequestId?: string): Promise<WalletClaimResponse & { applied: boolean }> {
      const claimRequestId = stableRequestId?.trim()
        ? stableRequestId.trim()
        : getOrCreateRequestId(WALLET_REQUEST_KEY)
      if (!stableRequestId?.trim()) storage.setItem(WALLET_REQUEST_KEY, claimRequestId)

      try {
        await transport.authenticate()
        const result = await transport.claimWallet({ requestId: claimRequestId })
        const claimId = assertNonEmptyString(result?.claimId, 'wallet claim id')
        const coins = assertNonNegativeInteger(result?.coins, 'wallet coins')
        const receipts = readJsonArray(storage, WALLET_RECEIPTS_KEY)
        const applied = !receipts.includes(claimId)
        if (applied) {
          applyWalletClaim?.({ claimId, coins })
          storage.setItem(
            WALLET_RECEIPTS_KEY,
            JSON.stringify([...receipts, claimId].slice(-MAX_WALLET_RECEIPTS))
          )
        }
        storage.removeItem(WALLET_REQUEST_KEY)
        return { claimId, coins, applied }
      } catch (error) {
        if (isDefinitive(error)) {
          storage.removeItem(WALLET_REQUEST_KEY)
        }
        throw error
      }
    },

    async redeemReward(rewardId: string): Promise<RedemptionResponse> {
      const safeRewardId = assertNonEmptyString(rewardId, 'reward id')
      const stableRequestId = getOrCreateRequestId(`truthle_redeem_request_v1:${safeRewardId}`)
      try {
        await transport.authenticate()
        const result = await transport.redeemReward({ rewardId: safeRewardId, requestId: stableRequestId })
        const redemptionId = assertNonEmptyString(result?.redemptionId, 'redemption id')
        const newBalance = assertNonNegativeInteger(result?.newBalance, 'new balance')
        storage.removeItem(`truthle_redeem_request_v1:${safeRewardId}`)
        return { redemptionId, newBalance }
      } catch (error) {
        if (isDefinitive(error)) {
          storage.removeItem(`truthle_redeem_request_v1:${safeRewardId}`)
        }
        throw error
      }
    },
  }
}

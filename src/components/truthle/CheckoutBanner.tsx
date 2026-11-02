'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { trackEvent } from '@/lib/analytics/events'
import { getTruthleCheckoutStatus } from '@/lib/truthle/storage'
import {
  nextCheckoutPollDelay,
  parseCheckoutReturn,
  removeCheckoutQuery,
  type CheckoutReturn,
  type GameKey,
} from './resultShare'

export const RETRY_ENTITLEMENT_EVENT = 'truthle:retry-entitlement'

type BannerState =
  | { kind: 'hidden' }
  | { kind: 'verifying' }
  | { kind: 'pending'; canRetry: boolean }
  | { kind: 'success'; credits: number }
  | { kind: 'cancel' }
  | { kind: 'expired' }
  | { kind: 'failed' }
  | { kind: 'unverifiable' }

interface CheckoutBannerProps {
  game: GameKey
  onVerified?: (credits: number) => void
}

const VERIFY_MESSAGE = 'Verifying your Extra Attempt with the payment server. Nothing is added until it is confirmed.'
const PENDING_MESSAGE = 'The payment is still pending, so no Extra Attempt has been added yet.'
const UNVERIFIABLE_MESSAGE = 'We could not verify this checkout. No Extra Attempt has been added from this return page.'

function replaceCheckoutQuery(): void {
  if (typeof window === 'undefined') return
  const search = removeCheckoutQuery(window.location.search)
  const next = window.location.pathname + (search ? `?${search}` : '') + window.location.hash
  window.history.replaceState(null, '', next)
}

function toneClass(state: BannerState): string {
  if (state.kind === 'success') return 'border-[#246e55] bg-[#eef8f3] text-[#174c3a]'
  if (state.kind === 'failed' || state.kind === 'unverifiable') return 'border-[#dc654e] bg-[#fff0ec] text-[#7f2f20]'
  if (state.kind === 'pending' || state.kind === 'verifying') return 'border-[#294cc4] bg-[#eef2ff] text-[#192947]'
  return 'border-[#d8d2c2] bg-[#fffdf5] text-[#192947]'
}

function titleFor(state: BannerState): string {
  if (state.kind === 'success') return 'Extra Attempt verified'
  if (state.kind === 'cancel') return 'Checkout cancelled'
  if (state.kind === 'expired') return 'Checkout expired'
  if (state.kind === 'failed') return 'Checkout failed'
  if (state.kind === 'unverifiable') return 'Checkout could not be verified'
  if (state.kind === 'pending') return state.canRetry ? 'Verification paused' : 'Payment pending'
  return 'Checking your checkout'
}

function bodyFor(state: BannerState): string {
  if (state.kind === 'success') {
    return `${state.credits} Extra Attempt ${state.credits === 1 ? 'credit is' : 'credits are'} ready to use. The credit is tied to this account.`
  }
  if (state.kind === 'cancel') return 'Checkout was cancelled. No Extra Attempt was added from this checkout.'
  if (state.kind === 'expired') return 'This checkout session expired before completion. No Extra Attempt was added.'
  if (state.kind === 'failed') return 'The payment server reported that this checkout failed. No Extra Attempt was added.'
  if (state.kind === 'pending') {
    return `${PENDING_MESSAGE} Closing this message is safe. The server remains the source of truth.`
  }
  if (state.kind === 'unverifiable') return UNVERIFIABLE_MESSAGE
  return VERIFY_MESSAGE
}

export default function CheckoutBanner({ game, onVerified }: CheckoutBannerProps) {
  const [returnState, setReturnState] = useState<CheckoutReturn>({ kind: 'none' })
  const [banner, setBanner] = useState<BannerState>({ kind: 'hidden' })
  const [retryVersion, setRetryVersion] = useState(0)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const parsed = parseCheckoutReturn(window.location.search)
    if (parsed.kind === 'none') return

    setReturnState(parsed)
    replaceCheckoutQuery()

    if (parsed.kind === 'cancel') {
      setBanner({ kind: 'cancel' })
      trackEvent('checkout_return', { game, status: 'cancelled' })
      return
    }
    if (parsed.kind === 'unverifiable') {
      setBanner({ kind: 'unverifiable' })
      trackEvent('checkout_return', { game, status: 'unverifiable' })
      return
    }

    setBanner({ kind: 'verifying' })
  }, [game])

  useEffect(() => {
    if (returnState.kind !== 'verify') return
    let cancelled = false
    let timeout: ReturnType<typeof setTimeout> | null = null

    const wait = (delay: number) => new Promise<void>((resolve) => {
      timeout = setTimeout(resolve, delay)
    })

    async function verify() {
      if (returnState.kind !== 'verify') return
      let attempt = 0
      let sawError = false

      while (!cancelled) {
        const delay = nextCheckoutPollDelay(attempt)
        if (delay === null) break
        if (delay > 0) await wait(delay)
        if (cancelled) return

        try {
          const result = await getTruthleCheckoutStatus({ sessionId: returnState.sessionId })
          if (cancelled) return

          if (result.status === 'fulfilled' && result.credits > 0) {
            setBanner({ kind: 'success', credits: result.credits })
            trackEvent('checkout_return', { game, status: 'fulfilled', value: result.credits })
            onVerified?.(result.credits)
            window.dispatchEvent(new CustomEvent(RETRY_ENTITLEMENT_EVENT, { detail: { game, credits: result.credits } }))
            return
          }
          if (result.status === 'expired') {
            setBanner({ kind: 'expired' })
            trackEvent('checkout_return', { game, status: 'expired' })
            return
          }
          if (result.status === 'failed' || result.status === 'fulfilled') {
            setBanner({ kind: 'failed' })
            trackEvent('checkout_return', { game, status: 'failed' })
            return
          }
        } catch {
          sawError = true
        }

        attempt += 1
      }

      if (cancelled) return
      setBanner({ kind: 'pending', canRetry: true })
      trackEvent('checkout_return', { game, status: sawError ? 'unverifiable' : 'pending' })
    }

    void verify()
    return () => {
      cancelled = true
      if (timeout) clearTimeout(timeout)
    }
  }, [game, onVerified, retryVersion, returnState])

  if (banner.kind === 'hidden' || typeof document === 'undefined' || !mountedRef.current) return null

  return createPortal(
    <div className="fixed inset-x-0 top-4 z-[1000] mx-auto w-[calc(100%-2rem)] max-w-lg px-0" role="status" aria-live="polite">
      <div className={`rounded-2xl border-2 p-4 shadow-xl ${toneClass(banner)}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-black">{titleFor(banner)}</p>
            <p className="mt-1 text-sm leading-relaxed">{bodyFor(banner)}</p>
          </div>
          <button
            type="button"
            aria-label="Dismiss checkout message"
            onClick={() => setBanner({ kind: 'hidden' })}
            className="shrink-0 rounded-lg px-2 py-1 text-lg font-bold opacity-70 hover:opacity-100"
          >
            x
          </button>
        </div>
        {banner.kind === 'pending' && banner.canRetry && (
          <button
            type="button"
            onClick={() => {
              setBanner({ kind: 'verifying' })
              setRetryVersion((version) => version + 1)
            }}
            className="twt-button-secondary mt-3 min-h-10 w-full"
          >
            Check status again
          </button>
        )}
        {banner.kind === 'unverifiable' && (
          <button
            type="button"
            onClick={() => {
              setBanner({ kind: 'verifying' })
              setRetryVersion((version) => version + 1)
            }}
            disabled={returnState.kind !== 'verify'}
            className="twt-button-secondary mt-3 min-h-10 w-full disabled:opacity-50"
          >
            {returnState.kind === 'verify' ? 'Check status again' : 'Close and check your account later'}
          </button>
        )}
      </div>
    </div>,
    document.body,
  )
}

import type { ConsentSnapshot } from '@/lib/analytics/consent'

export const AD_WAIT_TIMEOUT_MS = 3000
export const AD_STATUS_EVENT = 'twt:ad-status'

export type AdFillState = 'waiting' | 'filled' | 'unfilled'
export type AdStatus = 'filled' | 'unfilled' | 'error'

export type AdStatusDetail = {
  status: AdStatus
  slotId?: string
}

export function isAdEligible(options: {
  consent: ConsentSnapshot | null
  embedded: boolean
  disabled?: boolean
  slotId?: string | null
}): boolean {
  return (
    Boolean(options.slotId?.trim()) &&
    !options.disabled &&
    !options.embedded &&
    options.consent?.advertising === true &&
    options.consent.environmentAllowed
  )
}

export function normalizeAdFillState(value: string | null | undefined): AdFillState {
  const normalized = value?.trim().toLowerCase()
  if (normalized === 'filled') return 'filled'
  if (normalized === 'unfilled') return 'unfilled'
  return 'waiting'
}

export function normalizeAdStatusFillState(value: string | null | undefined): AdFillState {
  const normalized = value?.trim().toLowerCase()
  if (normalized === 'error' || normalized === 'failed') return 'unfilled'
  return normalizeAdFillState(value)
}

export function reduceAdFillState(
  current: AdFillState,
  update: { type: 'timeout' } | { type: 'status'; status: string | null | undefined }
): AdFillState {
  if (update.type === 'timeout') return current === 'waiting' ? 'unfilled' : current

  const next = normalizeAdStatusFillState(update.status)
  return next === 'waiting' ? current : next
}

export function shouldRenderAdBanner(options: {
  embedded: boolean
  disabled: boolean
  slotId?: string
  fillState: AdFillState
}): boolean {
  return !options.embedded && !options.disabled && Boolean(options.slotId) && options.fillState !== 'unfilled'
}

export function shouldShowAdBanner(options: {
  eligible: boolean
  fillState: AdFillState
}): boolean {
  return options.eligible && options.fillState !== 'unfilled'
}

export function isAdStatusForSlot(detail: AdStatusDetail, slotId: string): boolean {
  return !detail.slotId || detail.slotId === slotId
}

export function emitAdStatus(detail: AdStatusDetail): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent<AdStatusDetail>(AD_STATUS_EVENT, { detail }))
}

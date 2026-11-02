import { getConsentSnapshot } from './consent'

type EventValue = string | number | boolean
type EventParams = Record<string, string | number | boolean | undefined>
type Gtag = (...args: unknown[]) => void

export type AnalyticsPageContext = {
  page_location: string
  page_referrer?: string
  ignore_referrer?: true
}

const EVENT_PARAMETERS: Record<string, ReadonlySet<string>> = {
  game_start: new Set(['game', 'puzzle_day', 'content_id', 'placement']),
  game_complete: new Set(['game', 'puzzle_day', 'content_id', 'placement', 'score', 'correct']),
  share_intent: new Set(['game', 'content_id', 'method', 'placement']),
  share_handoff: new Set(['game', 'content_id', 'method']),
  share_copy: new Set(['game', 'content_id', 'method']),
  share_cancel: new Set(['game', 'content_id', 'method']),
  share_error: new Set(['game', 'content_id', 'method', 'status']),
  referral_open: new Set(['game', 'puzzle_day', 'content_id', 'placement']),
  referral_game_complete: new Set(['game', 'puzzle_day', 'content_id', 'score', 'correct']),
  affiliate_click: new Set(['partner', 'placement', 'content_id', 'method']),
  reward_mint: new Set(['game', 'content_id', 'method', 'status']),
  reward_copy: new Set(['game', 'content_id', 'method']),
  checkout_start: new Set(['game', 'content_id', 'placement', 'value', 'currency']),
  checkout_return: new Set(['game', 'status', 'value', 'currency']),
  purchase: new Set(['game', 'value', 'currency', 'transaction_id', 'status']),
  reminder_toggle: new Set(['status', 'method']),
}

const GAMES = new Set(['truthle', 'true-false', 'quiz'])
const PARTNERS = new Set(['amazon', 'booking', 'vpn', 'offertoro', 'affiliate'])
const STATUSES = new Set([
  'success',
  'cancelled',
  'failed',
  'pending',
  'fulfilled',
  'expired',
  'started',
  'completed',
  'copied',
  'shared',
  'error',
  'enabled',
  'disabled',
])
const METHODS = new Set([
  'whatsapp',
  'copy',
  'native',
  'download',
  'link',
  'email',
  'web-share',
  'sms',
  'other',
])

const SAFE_ID_PATTERN = /^[A-Za-z0-9]+(?:[._-][A-Za-z0-9]+)*$/
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const TRANSACTION_PATTERN = /^(?:cs|pi|ch|evt|txn)_[A-Za-z0-9_]{8,120}$/
const IGNORED_REFERRER_ORIGINS = new Set([
  'https://checkout.stripe.com',
  'https://billing.stripe.com',
])

function isValidDay(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false
  const parsed = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

function sanitizeParameter(name: string, value: EventValue): EventValue | undefined {
  if (typeof value === 'boolean') return name === 'correct' ? value : undefined

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return undefined
    if (name === 'correct') return Number.isInteger(value) && value >= 0 && value <= 5 ? value : undefined
    if (name === 'score') return Number.isInteger(value) && value >= 0 && value <= 100000 ? value : undefined
    if (name === 'value') return value >= 0 && value <= 1000000000 ? value : undefined
    return undefined
  }

  const text = value.trim()
  if (!text || text.length > 160) return undefined

  switch (name) {
    case 'game':
      return GAMES.has(text) ? text : undefined
    case 'puzzle_day':
      return isValidDay(text) ? text : undefined
    case 'content_id':
      return text.length <= 100 && SAFE_ID_PATTERN.test(text) ? text : undefined
    case 'placement':
      return SAFE_ID_PATTERN.test(text) && text.length <= 60 ? text : undefined
    case 'method':
      return METHODS.has(text) ? text : undefined
    case 'partner':
      return PARTNERS.has(text) ? text : undefined
    case 'status':
      return STATUSES.has(text) ? text : undefined
    case 'currency':
      return /^[A-Z]{3}$/.test(text) ? text : undefined
    case 'transaction_id':
      return TRANSACTION_PATTERN.test(text) ? text : undefined
    default:
      return undefined
  }
}

export function filterEventParams(
  name: string,
  params: EventParams = {}
): Record<string, EventValue> | null {
  const allowed = EVENT_PARAMETERS[name]
  if (!allowed) return null

  const safe: Record<string, EventValue> = {}
  for (const [key, value] of Object.entries(params)) {
    if (!allowed.has(key) || value === undefined) continue
    const sanitized = sanitizeParameter(key, value)
    if (sanitized !== undefined) safe[key] = sanitized
  }

  return safe
}

export function sanitizeAnalyticsUrl(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined

  try {
    const url = new URL(raw)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return undefined
    if (url.username || url.password) return undefined
    return `${url.origin}${url.pathname}`
  } catch {
    return undefined
  }
}

export function isIgnoredBillingReferrer(raw: string | null | undefined): boolean {
  if (!raw) return false

  try {
    const url = new URL(raw)
    if (url.username || url.password) return false
    return IGNORED_REFERRER_ORIGINS.has(url.origin)
  } catch {
    return false
  }
}

export function getAnalyticsPageContext(): AnalyticsPageContext | null {
  if (typeof window === 'undefined') return null

  const pageLocation = sanitizeAnalyticsUrl(window.location.href)
  if (!pageLocation) return null

  const rawReferrer = window.document.referrer
  const pageReferrer = sanitizeAnalyticsUrl(rawReferrer)

  return {
    page_location: pageLocation,
    ...(pageReferrer ? { page_referrer: pageReferrer } : {}),
    ...(isIgnoredBillingReferrer(rawReferrer) ? { ignore_referrer: true } : {}),
  }
}

function eventPageParameters(context: AnalyticsPageContext): Record<string, string> {
  return {
    page_location: context.page_location,
    ...(context.page_referrer ? { page_referrer: context.page_referrer } : {}),
  }
}

function rawPageNeedsSanitizing(context: AnalyticsPageContext): boolean {
  if (typeof window === 'undefined') return false

  return (
    window.location.href !== context.page_location ||
    (!!window.document.referrer && window.document.referrer !== context.page_referrer)
  )
}

export function queueAnalyticsPageContext(gtag: Gtag): AnalyticsPageContext | null {
  const context = getAnalyticsPageContext()
  if (!context) return null

  gtag('set', eventPageParameters(context))
  return context
}

export function buildAnalyticsConfigOptions(
  context: AnalyticsPageContext
): Record<string, string | boolean> {
  return {
    send_page_view: false,
    ...eventPageParameters(context),
    ...(context.ignore_referrer ? { ignore_referrer: true } : {}),
  }
}

export function configureGoogleTags(
  gtag: Gtag,
  ids: { analyticsMeasurementId?: string; adsConversionId?: string }
): boolean {
  const context = queueAnalyticsPageContext(gtag)
  if (!context) return false

  if (ids.analyticsMeasurementId) {
    gtag('config', ids.analyticsMeasurementId, buildAnalyticsConfigOptions(context))
  }
  if (ids.adsConversionId) {
    gtag('config', ids.adsConversionId, { send_page_view: false })
  }

  return true
}

function getGtag(): Gtag | undefined {
  if (typeof window === 'undefined') return undefined
  const candidate = (window as Window & { gtag?: Gtag }).gtag
  return typeof candidate === 'function' ? candidate : undefined
}

export function trackEvent(name: string, params: EventParams = {}): void {
  const consent = getConsentSnapshot()
  if (!consent.analytics) return

  const safeParams = filterEventParams(name, params)
  if (!safeParams) return

  const gtag = getGtag()
  if (!gtag) return

  const context = getAnalyticsPageContext()
  if (!context) return

  if (!rawPageNeedsSanitizing(context)) {
    gtag('event', name, safeParams)
    return
  }

  const contextParams = eventPageParameters(context)
  gtag('set', contextParams)
  gtag('event', name, { ...safeParams, ...contextParams })
}

export function trackPageView(): boolean {
  const consent = getConsentSnapshot()
  if (!consent.analytics || typeof window === 'undefined') return false

  const gtag = getGtag()
  if (!gtag) return false

  const context = getAnalyticsPageContext()
  if (!context) return false

  gtag('event', 'page_view', eventPageParameters(context))
  return true
}


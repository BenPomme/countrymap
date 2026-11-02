const DASH_PATTERN = /[\u2013\u2014]/g
const SAFE_ANALYTICS_VALUE = /[^a-zA-Z0-9._:-]+/g
const SHARE_CONTENT_ID = /^[a-z][a-z0-9]*(?:[._:-][a-z0-9]+)*$/i
const METRIC_ID = /^[a-z][a-z0-9]*(?:\.[a-z0-9]+)+$/i
const CANONICAL_SITE_ORIGIN = 'https://theworldtruth.com'
const MAX_ANALYTICS_VALUE_LENGTH = 80

export const FALLBACK_SHARE_CONTENT_ID = 'shared_visual'

export function normalizeShareCopy(value: string): string {
  return value.replace(DASH_PATTERN, '-').replace(/\s+/g, ' ').trim()
}

export function sanitizeAnalyticsValue(value: string | undefined, fallback: string): string {
  if (!value) return fallback
  const cleaned = value.replace(SAFE_ANALYTICS_VALUE, '_').slice(0, MAX_ANALYTICS_VALUE_LENGTH)
  return cleaned || fallback
}

export function resolveShareContentId(contentId?: string): string {
  const candidate = contentId?.trim() ?? ''
  if (
    candidate.length === 0 ||
    candidate.length > MAX_ANALYTICS_VALUE_LENGTH ||
    !SHARE_CONTENT_ID.test(candidate)
  ) {
    return FALLBACK_SHARE_CONTENT_ID
  }
  return candidate
}

export function metricShareContentId(
  scope: 'chart_correlation' | 'chart_ranking' | 'chart_scatter' | 'discovery_correlation',
  metricIds: readonly string[],
): string {
  const uniqueIds = Array.from(new Set(metricIds))
  if (uniqueIds.length === 0 || uniqueIds.some((metricId) => !METRIC_ID.test(metricId))) {
    return FALLBACK_SHARE_CONTENT_ID
  }
  return resolveShareContentId(`${scope}_${uniqueIds.join('_')}`)
}

export function isNativeShareCancellation(error: unknown): boolean {
  return nativeShareFailureKind(error) === 'cancelled'
}

export type NativeShareFailureKind = 'cancelled' | 'denied' | 'unavailable' | 'failed'

export function nativeShareFailureKind(error: unknown): NativeShareFailureKind {
  if (!error || typeof error !== 'object') return 'failed'
  const name = 'name' in error ? String((error as { name?: unknown }).name ?? '') : ''
  if (name === 'AbortError') return 'cancelled'
  if (name === 'NotAllowedError' || name === 'SecurityError') return 'denied'
  if (name === 'NotFoundError' || name === 'NotSupportedError') return 'unavailable'
  return 'failed'
}

export type ClipboardFailureStatus = 'denied' | 'unavailable' | 'failed'

export function clipboardFailureStatus(error: unknown): ClipboardFailureStatus {
  if (!error || typeof error !== 'object') return 'failed'
  const name = 'name' in error ? String((error as { name?: unknown }).name ?? '') : ''
  if (name === 'NotAllowedError' || name === 'SecurityError') return 'denied'
  if (name === 'NotFoundError' || name === 'NotSupportedError') return 'unavailable'
  return 'failed'
}

export function absoluteSiteUrl(path: string): string {
  const value = typeof path === 'string' ? path.trim() : ''
  const hasUnsafeShape =
    !value ||
    value.startsWith('//') ||
    value.includes('\\') ||
    /[\u0000-\u0020]/.test(value) ||
    /^[a-z][a-z0-9+.-]*:/i.test(value)

  if (hasUnsafeShape) return `${CANONICAL_SITE_ORIGIN}/`
  return `${CANONICAL_SITE_ORIGIN}${value.startsWith('/') ? value : `/${value}`}`
}

export function buildWhatsAppShareUrl(description: string, url: string): string {
  return `https://wa.me/?text=${encodeURIComponent(`${normalizeShareCopy(description)}\n\n${url}`)}`
}

export function buildShareFilename(title: string): string {
  const slug = normalizeShareCopy(title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
  return `${slug || 'theworldtruth-fact'}-theworldtruth.png`
}

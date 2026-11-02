const DASH_PATTERN = /[\u2013\u2014]/g
const SAFE_ANALYTICS_VALUE = /[^a-zA-Z0-9._:-]+/g
const CANONICAL_SITE_ORIGIN = 'https://theworldtruth.com'

export function normalizeShareCopy(value: string): string {
  return value.replace(DASH_PATTERN, '-').replace(/\s+/g, ' ').trim()
}

export function sanitizeAnalyticsValue(value: string | undefined, fallback: string): string {
  if (!value) return fallback
  const cleaned = value.replace(SAFE_ANALYTICS_VALUE, '_').slice(0, 80)
  return cleaned || fallback
}

export function resolveShareContentId(contentId?: string): string {
  return sanitizeAnalyticsValue(contentId, 'shared_visual')
}

export function isNativeShareCancellation(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const name = 'name' in error ? String((error as { name?: unknown }).name ?? '') : ''
  return name === 'AbortError'
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

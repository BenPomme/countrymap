/**
 * Affiliate configuration — values are env-driven (NEXT_PUBLIC_* are
 * inlined at build time). Amazon defaults to the public Associates tag.
 */
export const AMAZON_ASSOCIATE_TAG = process.env.NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG || 'worldtruth-21'
// Amazon storefront domain matching the Associates account (e.g. amazon.fr, amazon.com)
export const AMAZON_DOMAIN = process.env.NEXT_PUBLIC_AMAZON_DOMAIN || 'amazon.fr'
export const BOOKING_AID = process.env.NEXT_PUBLIC_BOOKING_AID || ''
export const VPN_AFFILIATE_URL = process.env.NEXT_PUBLIC_VPN_AFFILIATE_URL || ''

export function amazonSearchUrl(
  query: string,
  domain: string = AMAZON_DOMAIN,
  associateTag: string = AMAZON_ASSOCIATE_TAG,
): string | null {
  if (!domain || !associateTag) return null
  return `https://www.${domain}/s?k=${encodeURIComponent(query)}&tag=${encodeURIComponent(associateTag)}`
}

export function amazonProductUrl(
  asin: string,
  domain: string = AMAZON_DOMAIN,
  associateTag: string = AMAZON_ASSOCIATE_TAG,
): string | null {
  const normalizedAsin = asin.trim().toUpperCase()
  if (!domain || !associateTag || !/^[A-Z0-9]{10}$/.test(normalizedAsin)) return null
  return `https://www.${domain}/dp/${normalizedAsin}?tag=${encodeURIComponent(associateTag)}`
}

export function amazonDealsUrl(
  domain: string = AMAZON_DOMAIN,
  associateTag: string = AMAZON_ASSOCIATE_TAG,
): string | null {
  if (!domain || !associateTag) return null
  return `https://www.${domain}/gp/goldbox?tag=${encodeURIComponent(associateTag)}`
}

export function bookingSearchUrl(query?: string): string | null {
  if (!BOOKING_AID) return null
  const ss = query ? `&ss=${encodeURIComponent(query)}` : ''
  return `https://www.booking.com/searchresults.html?aid=${encodeURIComponent(BOOKING_AID)}${ss}`
}

export function vpnUrl(): string | null {
  return VPN_AFFILIATE_URL || null
}

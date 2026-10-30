/**
 * Affiliate configuration — all values are env-driven (NEXT_PUBLIC_* are
 * inlined at build time). If a value is empty, the related offer is hidden.
 */
export const AMAZON_ASSOCIATE_TAG = process.env.NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG || ''
// Amazon storefront domain matching the Associates account (e.g. amazon.fr, amazon.com)
export const AMAZON_DOMAIN = process.env.NEXT_PUBLIC_AMAZON_DOMAIN || 'amazon.fr'
export const BOOKING_AID = process.env.NEXT_PUBLIC_BOOKING_AID || ''
export const VPN_AFFILIATE_URL = process.env.NEXT_PUBLIC_VPN_AFFILIATE_URL || ''

export function amazonSearchUrl(query: string): string | null {
  if (!AMAZON_ASSOCIATE_TAG) return null
  return `https://www.${AMAZON_DOMAIN}/s?k=${encodeURIComponent(query)}&tag=${encodeURIComponent(AMAZON_ASSOCIATE_TAG)}`
}

export function bookingSearchUrl(query?: string): string | null {
  if (!BOOKING_AID) return null
  const ss = query ? `&ss=${encodeURIComponent(query)}` : ''
  return `https://www.booking.com/searchresults.html?aid=${encodeURIComponent(BOOKING_AID)}${ss}`
}

export function vpnUrl(): string | null {
  return VPN_AFFILIATE_URL || null
}

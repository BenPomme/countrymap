import { AMAZON_DOMAIN, amazonSearchUrl } from '@/lib/constants/affiliates'
import {
  GENERAL_PICKS,
  getDailyUnlockTheme,
  type UnlockPick,
} from '@/lib/affiliate/dailyUnlocks'

export const COMMISSION_DISCLOSURE =
  'We may earn a commission if you buy through a sponsored link. This does not change the price you pay.'

export const BOOKING_DISCLOSURE =
  'We may earn a commission if you book through this sponsored Booking.com link.'

export const VPN_DISCLOSURE =
  'We may earn a commission if you subscribe through this sponsored VPN link.'

export const FRIEND_GIFT_TERMS = [
  'Each account can create one friend code per UTC day.',
  'Each friend code can be used once.',
  'A friend code expires at 23:59:59 UTC on the UTC day it was created.',
  'The account that created a code cannot redeem it.',
  'Opening a challenge link does not reserve or use a code. The code is checked only when an Extra Attempt is requested.',
] as const

export function getAmazonStorefrontLabel(domain: string = AMAZON_DOMAIN): string {
  if (domain === 'amazon.co.uk') return 'Amazon UK'
  if (domain === 'amazon.com') return 'Amazon US'
  return `Amazon (${domain})`
}

export function getAmazonDisclosure(domain: string = AMAZON_DOMAIN): string {
  return `As an Amazon Associate we earn from qualifying purchases on ${getAmazonStorefrontLabel(domain)}. Search results are not verified discounts. Prices and availability are set by Amazon and can change.`
}

export interface OrdinaryPick extends UnlockPick {
  href: string | null
}

export interface AvailableOrdinaryPick extends UnlockPick {
  href: string
}

export function getAmazonPicks(picks: UnlockPick[]): OrdinaryPick[] {
  return picks.map((pick) => ({ ...pick, href: amazonSearchUrl(pick.query) }))
}

/** Removes unavailable links and keeps the requested number of usable cards. */
export function getAvailableOrdinaryPicks(
  picks: OrdinaryPick[],
  limit = 4,
): AvailableOrdinaryPick[] {
  const safeLimit = Number.isFinite(limit) ? Math.max(0, Math.floor(limit)) : 0

  return picks
    .filter((pick): pick is AvailableOrdinaryPick => typeof pick.href === 'string' && pick.href.length > 0)
    .slice(0, safeLimit)
}

/** A stable, sanitized identifier for an affiliate search query. */
export function getAffiliateContentId(query: string): string | undefined {
  const slug = query
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '')

  return slug ? `amazon_${slug}` : undefined
}

/**
 * Returns ordinary Amazon search recommendations. The score argument is
 * intentionally ignored so a perfect score cannot change what is available.
 */
export function getOrdinaryPicks(date?: string, score?: number): OrdinaryPick[] {
  void score
  const picks = date ? getDailyUnlockTheme(date).picks : GENERAL_PICKS
  return getAmazonPicks(picks)
}

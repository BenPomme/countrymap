'use client'

import { trackEvent } from '@/lib/analytics/events'
import { amazonSearchUrl, bookingSearchUrl, vpnUrl } from '@/lib/constants/affiliates'
import {
  BOOKING_DISCLOSURE,
  COMMISSION_DISCLOSURE,
  VPN_DISCLOSURE,
  getAmazonDisclosure,
  getAmazonStorefrontLabel,
} from '@/lib/affiliate/rewards'

interface Props {
  slug: string
  category?: string
  name?: string
}

const PRIVACY_RE = /press|freedom|censor|internet|surveillance|privacy|democra|corruption|vpn/i
const TRAVEL_RE = /touris|travel|visa|safety|happiness|cost of living|climate|food|beer|wine|coffee/i

type Offer = {
  href: string
  label: string
  partner: 'amazon' | 'booking' | 'vpn'
  disclosure: string
}

/** Contextual sponsored links. Optional partners render only when configured. */
export default function ContextualOffers({ slug, category = '', name = '' }: Props) {
  const ctx = `${slug} ${category} ${name}`
  const offers: Offer[] = []
  const storefront = getAmazonStorefrontLabel()

  const books = amazonSearchUrl(`world atlas ${name || 'country statistics'}`.trim())
  if (books) {
    offers.push({
      href: books,
      label: `World atlases and country data books on ${storefront}`,
      partner: 'amazon',
      disclosure: getAmazonDisclosure(),
    })
  }

  if (PRIVACY_RE.test(ctx)) {
    const vpn = vpnUrl()
    if (vpn) {
      offers.push({
        href: vpn,
        label: 'Browse privacy information and services',
        partner: 'vpn',
        disclosure: VPN_DISCLOSURE,
      })
    }
  }

  if (TRAVEL_RE.test(ctx) || offers.length < 2) {
    const travel = bookingSearchUrl()
    if (travel) {
      offers.push({
        href: travel,
        label: 'Find places to stay on Booking.com',
        partner: 'booking',
        disclosure: BOOKING_DISCLOSURE,
      })
    }
  }

  if (offers.length === 0) return null

  const disclosures = Array.from(new Set([COMMISSION_DISCLOSURE, ...offers.map((offer) => offer.disclosure)]))

  return (
    <aside className="twt-panel mt-10 rounded-2xl border border-[#e3d9bd] bg-white p-6 shadow-sm" aria-label="Sponsored links">
      <p className="twt-kicker mb-3 text-xs font-bold uppercase tracking-[0.16em] text-[#294cc4]">Sponsored links</p>
      <ul className="space-y-3">
        {offers.slice(0, 3).map((o) => (
          <li key={o.href}>
            <a
              href={o.href}
              target="_blank"
              rel="sponsored nofollow noopener noreferrer"
              className="font-semibold text-[#294cc4] underline-offset-4 hover:underline"
              onClick={() => trackEvent('affiliate_click', { partner: o.partner, placement: 'map-context' })}
            >
              {o.label}
            </a>
            <p className="mt-1 text-xs leading-5 text-[#5f6b7c]">{o.disclosure}</p>
          </li>
        ))}
      </ul>
      {disclosures.length > 0 && <p className="mt-4 text-xs leading-5 text-[#5f6b7c]">{COMMISSION_DISCLOSURE}</p>}
    </aside>
  )
}

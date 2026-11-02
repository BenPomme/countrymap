'use client'

import type { LucideIcon } from 'lucide-react'
import { BedDouble, BookOpen, ExternalLink, ShieldCheck } from 'lucide-react'
import AffiliatePhoto from '@/components/affiliate/AffiliatePhoto'
import { AmazonDealsAction } from '@/components/affiliate/AffiliateShelf'
import { trackEvent } from '@/lib/analytics/events'
import { amazonSearchUrl, bookingSearchUrl, vpnUrl } from '@/lib/constants/affiliates'
import { ATLAS_PHOTO } from '@/lib/affiliate/photos'
import {
  BOOKING_DISCLOSURE,
  COMMISSION_DISCLOSURE,
  VPN_DISCLOSURE,
  getAmazonDisclosure,
  getAmazonStorefrontLabel,
} from '@/lib/affiliate/rewards'
import { useEmbeddedAppMode } from '@/lib/useEmbeddedAppMode'

interface Props {
  slug: string
  category?: string
  name?: string
  compact?: boolean
  className?: string
}

const PRIVACY_RE = /press|freedom|censor|internet|surveillance|privacy|democra|corruption|vpn/i
const TRAVEL_RE = /touris|travel|visa|safety|happiness|cost of living|climate|food|beer|wine|coffee/i

type Offer = {
  href: string
  label: string
  action: string
  partner: 'amazon' | 'booking' | 'vpn'
  disclosure: string
}

type OfferArtwork = {
  Icon: LucideIcon
  tile: string
}

const OFFER_ARTWORK: Record<Offer['partner'], OfferArtwork> = {
  amazon: { Icon: BookOpen, tile: 'bg-twt-blue text-white' },
  booking: { Icon: BedDouble, tile: 'bg-twt-green text-white' },
  vpn: { Icon: ShieldCheck, tile: 'bg-twt-butter text-twt-ink' },
}

/** Contextual sponsored links. Optional partners render only when configured. */
export default function ContextualOffers({
  slug,
  category = '',
  name = '',
  compact = false,
  className = '',
}: Props) {
  const embeddedMode = useEmbeddedAppMode()
  const ctx = `${slug} ${category} ${name}`
  const offers: Offer[] = []
  const storefront = getAmazonStorefrontLabel()

  const books = amazonSearchUrl(`world atlas ${name || 'country statistics'}`.trim())
  if (books) {
    offers.push({
      href: books,
      label: `World atlases and country data books on ${storefront}`,
      action: `Browse on ${storefront}`,
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
        action: 'Open sponsored link',
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
        action: 'Search on Booking.com',
        partner: 'booking',
        disclosure: BOOKING_DISCLOSURE,
      })
    }
  }

  if (embeddedMode || offers.length === 0) return null

  const visibleOffers = offers.slice(0, 3)
  const hasAmazonOffer = visibleOffers.some((offer) => offer.partner === 'amazon')
  const disclosures = Array.from(new Set([COMMISSION_DISCLOSURE, ...visibleOffers.map((offer) => offer.disclosure)]))

  return (
    <aside
      className={`relative isolate overflow-hidden rounded-[1.75rem] border-2 border-twt-ink/20 bg-twt-paper p-4 text-left shadow-[6px_6px_0_rgba(25,41,71,0.1)] sm:p-6 ${className}`}
      aria-label="Related sponsored links"
    >
      <div
        aria-hidden="true"
        className="absolute -right-10 -top-12 -z-10 h-36 w-36 rounded-full border-[20px] border-twt-butter/45"
      />
      <p className="twt-kicker">Sponsored</p>
      <h2 className={`twt-display mt-1 text-balance text-twt-ink ${compact ? 'text-2xl' : 'text-3xl'}`}>
        Related reads and links
      </h2>
      <p className="mt-2 text-sm leading-6 text-twt-ink/70">
        Optional partner links for this page. They stay separate from the data and do not change any ranking.
      </p>

      <div className="mt-4">
        <AmazonDealsAction placement="map-context" className="w-full" />
      </div>

      <ul className="mt-4 space-y-2.5">
        {visibleOffers.map((offer) => {
          const { Icon, tile } = OFFER_ARTWORK[offer.partner]

          return (
            <li key={offer.href}>
              <a
                href={offer.href}
                target="_blank"
                rel="sponsored nofollow noopener noreferrer"
                className="group flex min-h-16 min-w-0 items-center gap-3 rounded-2xl border-2 border-twt-ink/10 bg-white p-3 motion-safe:transition motion-safe:duration-150 motion-safe:hover:-translate-y-0.5 hover:border-twt-ink hover:shadow-[3px_3px_0_#ffda62] motion-reduce:transform-none motion-reduce:transition-none focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-[#294cc4]"
                onClick={() => trackEvent('affiliate_click', { partner: offer.partner, placement: 'map-context' })}
                aria-label={`${offer.label}. ${offer.action} in a new tab.`}
              >
                {offer.partner === 'amazon' ? (
                  <AffiliatePhoto
                    photo={ATLAS_PHOTO}
                    className="h-[72px] w-[88px] shrink-0 rounded-xl"
                    fallbackClassName={`items-center justify-center ${tile}`}
                    fallback={<Icon className="h-5 w-5" strokeWidth={1.9} aria-hidden="true" />}
                  />
                ) : (
                  <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tile}`}>
                    <Icon className="h-5 w-5" strokeWidth={1.9} aria-hidden="true" />
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block break-words text-sm font-bold leading-5 text-twt-ink">{offer.label}</span>
                  <span className="mt-1 inline-flex items-center gap-1.5 text-xs font-extrabold text-twt-blue">
                    {offer.action}
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                </span>
              </a>
            </li>
          )
        })}
      </ul>

      {hasAmazonOffer && (
        <p className="mt-3 text-xs leading-5 text-twt-ink/55">Illustrative photos. Explore matching products on Amazon.</p>
      )}

      <div className="mt-4 border-t border-twt-ink/15 pt-3">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-twt-ink/45">Affiliate disclosure</p>
        <div className="mt-1 space-y-1 text-xs leading-5 text-twt-ink/65">
          {disclosures.map((disclosure) => <p key={disclosure}>{disclosure}</p>)}
        </div>
      </div>
    </aside>
  )
}

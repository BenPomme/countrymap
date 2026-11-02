'use client'

import type { LucideIcon } from 'lucide-react'
import {
  BookMarked,
  BookOpen,
  Compass,
  ExternalLink,
  Gamepad2,
  Globe,
  Luggage,
  Map,
  Newspaper,
  Plug,
  ShieldCheck,
  Webcam,
} from 'lucide-react'
import AffiliatePhoto from '@/components/affiliate/AffiliatePhoto'
import { trackEvent } from '@/lib/analytics/events'
import { amazonDealsUrl } from '@/lib/constants/affiliates'
import { getAffiliatePhoto, type AffiliatePhotoKey } from '@/lib/affiliate/photos'
import {
  getAffiliateContentId,
  getAmazonDisclosure,
  getAmazonStorefrontLabel,
  getAvailableOrdinaryPicks,
  getOrdinaryPicks,
  type OrdinaryPick,
} from '@/lib/affiliate/rewards'
import { useEmbeddedAppMode } from '@/lib/useEmbeddedAppMode'

type ShelfVariant = 'full' | 'compact'

interface Props {
  placement: string
  heading?: string
  intro?: string
  picks?: OrdinaryPick[]
  date?: string
  score?: number
  limit?: number
  variant?: ShelfVariant
  className?: string
}

type Artwork = {
  Icon: LucideIcon
  tile: string
}

const AMAZON_DEALS_CONTENT_ID = 'amazon_daily_deals'

const PHOTO_FALLBACK_ARTWORK: Record<AffiliatePhotoKey, Artwork> = {
  'privacy-screen': { Icon: ShieldCheck, tile: 'bg-twt-blue text-white' },
  webcam: { Icon: Webcam, tile: 'bg-twt-green text-white' },
  journalism: { Icon: Newspaper, tile: 'bg-twt-butter text-twt-ink' },
  books: { Icon: BookMarked, tile: 'bg-white text-twt-blue' },
  passport: { Icon: ShieldCheck, tile: 'bg-twt-blue text-white' },
  adapter: { Icon: Plug, tile: 'bg-twt-butter text-twt-ink' },
  luggage: { Icon: Luggage, tile: 'bg-twt-green text-white' },
  guides: { Icon: BookOpen, tile: 'bg-white text-twt-blue' },
  atlas: { Icon: Map, tile: 'bg-twt-blue text-white' },
  map: { Icon: Compass, tile: 'bg-twt-green text-white' },
  globe: { Icon: Globe, tile: 'bg-twt-butter text-twt-ink' },
  trivia: { Icon: Gamepad2, tile: 'bg-white text-twt-blue' },
}

interface AmazonDealsActionProps {
  placement: string
  className?: string
}

export function AmazonDealsAction({ placement, className = '' }: AmazonDealsActionProps) {
  const href = amazonDealsUrl()
  if (!href) return null

  const storefront = getAmazonStorefrontLabel()

  return (
    <a
      href={href}
      target="_blank"
      rel="sponsored nofollow noopener noreferrer"
      className={`inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-full border-2 border-twt-ink bg-twt-blue px-4 py-2.5 text-center text-sm font-extrabold leading-5 text-white shadow-[3px_3px_0_#ffda62] motion-safe:transition motion-safe:duration-150 motion-safe:hover:-translate-y-0.5 hover:bg-twt-ink hover:shadow-[4px_4px_0_#ffda62] motion-reduce:transform-none motion-reduce:transition-none focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-[#294cc4] ${className}`}
      onClick={() => trackEvent('affiliate_click', {
        partner: 'amazon',
        placement,
        content_id: AMAZON_DEALS_CONTENT_ID,
      })}
      aria-label={`Browse Amazon deals on ${storefront} in a new tab.`}
    >
      <span className="min-w-0 break-words">Browse Amazon deals</span>
      <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
    </a>
  )
}

export default function AffiliateShelf({
  placement,
  heading,
  intro,
  picks,
  date,
  score,
  limit = 4,
  variant = 'full',
  className = '',
}: Props) {
  const embeddedMode = useEmbeddedAppMode()
  const items = getAvailableOrdinaryPicks(picks ?? getOrdinaryPicks(date, score), limit)

  if (embeddedMode || items.length === 0) return null

  const storefront = getAmazonStorefrontLabel()
  const resolvedHeading = heading ?? 'Finds for curious minds'
  const resolvedIntro = intro ?? `Explore books, maps and useful finds on ${storefront}.`
  const compact = variant === 'compact'

  return (
    <section
      className={`relative isolate overflow-hidden rounded-[1.75rem] border-2 border-twt-ink/20 bg-twt-paper p-4 text-left shadow-[7px_7px_0_rgba(25,41,71,0.1)] sm:p-6 ${className}`}
      aria-label={resolvedHeading}
      data-affiliate-shelf={placement}
    >
      <div
        aria-hidden="true"
        className="absolute -right-12 -top-16 -z-10 h-44 w-44 rounded-full border-[24px] border-twt-butter/50"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-20 left-1/3 -z-10 h-40 w-40 rounded-full bg-twt-green/5"
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="twt-kicker">Sponsored search picks</p>
          <h2 className={`twt-display mt-1 text-balance text-twt-ink ${compact ? 'text-2xl' : 'text-3xl sm:text-4xl'}`}>
            {resolvedHeading}
          </h2>
        </div>
        <AmazonDealsAction placement={placement} className="w-full sm:w-auto" />
      </div>
      <p className={`mt-2 max-w-2xl leading-6 text-twt-ink/70 ${compact ? 'text-sm' : 'text-base'}`}>
        {resolvedIntro}
      </p>

      <ul className={`mt-5 grid min-w-0 gap-2.5 sm:gap-3 ${compact ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-2 lg:grid-cols-4'}`}>
        {items.map((pick) => {
          const photo = getAffiliatePhoto(pick)
          const { Icon, tile } = PHOTO_FALLBACK_ARTWORK[photo.key]
          const contentId = getAffiliateContentId(pick.query)

          return (
            <li key={pick.query} className="min-w-0">
              <a
                href={pick.href}
                target="_blank"
                rel="sponsored nofollow noopener noreferrer"
                className="group flex h-full min-h-44 min-w-0 flex-col overflow-hidden rounded-2xl border-2 border-twt-ink/15 bg-white motion-safe:transition motion-safe:duration-150 motion-safe:hover:-translate-y-0.5 hover:border-twt-ink hover:shadow-[4px_4px_0_#ffda62] motion-reduce:transform-none motion-reduce:transition-none focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-[#294cc4]"
                onClick={() => trackEvent('affiliate_click', {
                  partner: 'amazon',
                  placement,
                  ...(contentId ? { content_id: contentId } : {}),
                })}
                aria-label={`${pick.label}. Browse on ${storefront} in a new tab.`}
              >
                <AffiliatePhoto
                  photo={photo}
                  className="aspect-[32/21] w-full"
                  fallbackClassName={`items-center px-3 sm:px-4 ${tile}`}
                  fallback={(
                    <>
                      <span aria-hidden="true" className="absolute -right-5 -top-8 h-24 w-24 rounded-full border-[14px] border-current opacity-10" />
                      <Icon className={`${compact ? 'h-8 w-8' : 'h-9 w-9'} relative shrink-0`} strokeWidth={1.8} aria-hidden="true" />
                    </>
                  )}
                />
                <span className="flex min-w-0 flex-1 flex-col p-3 sm:p-4">
                  <span className="twt-display break-words text-lg leading-snug text-twt-ink">{pick.label}</span>
                  <span className="mt-auto inline-flex min-h-11 items-center gap-2 pt-3 text-sm font-extrabold text-twt-blue">
                    <span className="min-w-0 break-words">Browse on {storefront}</span>
                    <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
                  </span>
                </span>
              </a>
            </li>
          )
        })}
      </ul>

      <p className="mt-3 text-xs leading-5 text-twt-ink/55">Illustrative photos. Explore matching products on Amazon.</p>

      <div className="mt-5 border-t border-twt-ink/15 pt-3">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-twt-ink/45">Affiliate disclosure</p>
        <p className="mt-1 text-xs leading-5 text-twt-ink/65">{getAmazonDisclosure()}</p>
      </div>
    </section>
  )
}

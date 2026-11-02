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
  Sparkles,
  Telescope,
  Webcam,
} from 'lucide-react'
import { trackEvent } from '@/lib/analytics/events'
import { amazonDealsUrl } from '@/lib/constants/affiliates'
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

const BLUE_ARTWORK: Artwork = { Icon: Map, tile: 'bg-twt-blue text-white' }
const BUTTER_ARTWORK: Artwork = { Icon: Sparkles, tile: 'bg-twt-butter text-twt-ink' }
const GREEN_ARTWORK: Artwork = { Icon: Compass, tile: 'bg-twt-green text-white' }
const PAPER_ARTWORK: Artwork = { Icon: Telescope, tile: 'bg-white text-twt-blue' }
const AMAZON_DEALS_CONTENT_ID = 'amazon_daily_deals'

const FALLBACK_ARTWORK: Artwork[] = [
  BLUE_ARTWORK,
  GREEN_ARTWORK,
  BUTTER_ARTWORK,
  PAPER_ARTWORK,
]

function getPickArtwork(pick: OrdinaryPick, index: number): Artwork {
  const text = `${pick.label} ${pick.query}`.toLowerCase()

  if (/webcam/.test(text)) return { Icon: Webcam, tile: GREEN_ARTWORK.tile }
  if (/privacy|passport|rfid/.test(text)) return { Icon: ShieldCheck, tile: BLUE_ARTWORK.tile }
  if (/adapter|plug/.test(text)) return { Icon: Plug, tile: BUTTER_ARTWORK.tile }
  if (/cabin|carry-on|carry on|luggage|backpack/.test(text)) {
    return { Icon: Luggage, tile: GREEN_ARTWORK.tile }
  }
  if (/orwell/.test(text)) return { Icon: BookMarked, tile: PAPER_ARTWORK.tile }
  if (/press freedom|journalism|news/.test(text)) return { Icon: Newspaper, tile: BUTTER_ARTWORK.tile }
  if (/game|trivia/.test(text)) return { Icon: Gamepad2, tile: PAPER_ARTWORK.tile }
  if (/globe/.test(text)) return { Icon: Globe, tile: BUTTER_ARTWORK.tile }
  if (/scratch/.test(text)) return { Icon: Compass, tile: GREEN_ARTWORK.tile }
  if (/atlas|map/.test(text)) return { Icon: Map, tile: BLUE_ARTWORK.tile }
  if (/guide|book/.test(text)) return { Icon: BookOpen, tile: PAPER_ARTWORK.tile }
  if (/travel|trip|journey/.test(text)) return { Icon: Compass, tile: GREEN_ARTWORK.tile }

  return FALLBACK_ARTWORK[index % FALLBACK_ARTWORK.length]
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
        {items.map((pick, index) => {
          const { Icon, tile } = getPickArtwork(pick, index)
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
                <span className={`relative flex items-center overflow-hidden px-3 sm:px-4 ${compact ? 'h-20' : 'h-24'} ${tile}`}>
                  <span aria-hidden="true" className="absolute -right-5 -top-8 h-24 w-24 rounded-full border-[14px] border-current opacity-10" />
                  <Icon className={`${compact ? 'h-8 w-8' : 'h-9 w-9'} relative shrink-0`} strokeWidth={1.8} aria-hidden="true" />
                </span>
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

      <div className="mt-5 border-t border-twt-ink/15 pt-3">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-twt-ink/45">Affiliate disclosure</p>
        <p className="mt-1 text-xs leading-5 text-twt-ink/65">{getAmazonDisclosure()}</p>
      </div>
    </section>
  )
}

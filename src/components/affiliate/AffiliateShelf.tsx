'use client'

import { trackEvent } from '@/lib/analytics/events'
import {
  getAmazonDisclosure,
  getAmazonStorefrontLabel,
  getOrdinaryPicks,
  type OrdinaryPick,
} from '@/lib/affiliate/rewards'

interface Props {
  placement: string
  heading?: string
  intro?: string
  picks?: OrdinaryPick[]
  date?: string
  score?: number
  limit?: number
}

export default function AffiliateShelf({
  placement,
  heading = 'Everyday picks',
  intro,
  picks,
  date,
  score,
  limit = 4,
}: Props) {
  const items = (picks ?? getOrdinaryPicks(date, score))
    .filter((pick) => Boolean(pick.href))
    .slice(0, limit)

  if (items.length === 0) return null

  const storefront = getAmazonStorefrontLabel()

  return (
    <section className="twt-panel rounded-2xl border border-[#d7c9a6] bg-white p-4 text-left shadow-sm" aria-label={heading}>
      <p className="twt-kicker text-xs font-bold uppercase tracking-[0.16em] text-[#294cc4]">Sponsored search picks</p>
      <h2 className="mt-1 text-lg font-bold text-[#192947]">{heading}</h2>
      <p className="mt-1 text-sm leading-6 text-[#43516b]">
        {intro ?? `Ordinary ${storefront} search recommendations. They do not depend on your score.`}
      </p>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {items.map((pick) => (
          <li key={pick.query}>
            <a
              href={pick.href ?? undefined}
              target="_blank"
              rel="sponsored nofollow noopener noreferrer"
              className="block rounded-xl border border-[#e3d9bd] bg-[#fffdf6] px-3 py-2 text-sm font-semibold text-[#294cc4] underline-offset-4 hover:underline"
              onClick={() => trackEvent('affiliate_click', { partner: 'amazon', placement })}
            >
              {pick.label}
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs leading-5 text-[#5f6b7c]">{getAmazonDisclosure()}</p>
    </section>
  )
}

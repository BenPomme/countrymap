import { amazonSearchUrl, bookingSearchUrl, vpnUrl } from '@/lib/constants/affiliates'

interface Props {
  slug: string
  category?: string
  name?: string
}

const PRIVACY_RE = /press|freedom|censor|internet|surveillance|privacy|democra|corruption|vpn/i
const TRAVEL_RE = /touris|travel|visa|safety|happiness|cost of living|climate|food|beer|wine|coffee/i

/**
 * Contextual affiliate links. Renders nothing unless at least one affiliate
 * env var is configured. All links are rel="sponsored nofollow".
 */
export default function ContextualOffers({ slug, category = '', name = '' }: Props) {
  const ctx = `${slug} ${category} ${name}`
  const offers: { href: string; label: string }[] = []

  const books = amazonSearchUrl(`world atlas ${name || 'country statistics'}`.trim())
  if (books) offers.push({ href: books, label: '📚 World atlases & country stats books on Amazon' })

  if (PRIVACY_RE.test(ctx)) {
    const vpn = vpnUrl()
    if (vpn) offers.push({ href: vpn, label: '🔒 Browse privately where the internet is restricted (VPN)' })
  }

  if (TRAVEL_RE.test(ctx) || offers.length < 2) {
    const travel = bookingSearchUrl()
    if (travel) offers.push({ href: travel, label: '✈️ Find hotels in the countries on this map (Booking.com)' })
  }

  if (offers.length === 0) return null

  return (
    <aside className="mt-10 bg-white rounded-2xl shadow-sm p-6" aria-label="Sponsored links">
      <p className="text-xs uppercase tracking-wide text-gray-400 mb-3">
        Affiliate links — we may earn a commission
      </p>
      <ul className="space-y-2">
        {offers.slice(0, 3).map((o) => (
          <li key={o.href}>
            <a
              href={o.href}
              target="_blank"
              rel="sponsored nofollow noopener noreferrer"
              className="text-blue-700 hover:underline"
            >
              {o.label}
            </a>
          </li>
        ))}
      </ul>
    </aside>
  )
}

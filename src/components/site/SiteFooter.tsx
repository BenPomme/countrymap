import Link from 'next/link'
import { ArrowUpRight, Globe2 } from 'lucide-react'
import PrivacyPreferencesButton from './PrivacyPreferencesButton'

const FOOTER_LINKS = [
  { href: '/#explore', label: 'Explore maps' },
  { href: '/charts/', label: 'Charts' },
  { href: '/discoveries/', label: 'Discoveries' },
  { href: '/truthle/', label: 'Truthle' },
  { href: '/true-false/', label: 'True or False' },
  { href: '/rewards/', label: 'Rewards' },
  { href: '/privacy/', label: 'Privacy' },
]

export default function SiteFooter() {
  return (
    <footer className="twt-site-footer">
      <div className="twt-container grid gap-8 py-10 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
        <div>
          <Link href="/" className="twt-brand" aria-label="The World Truth home">
            <span className="twt-brand-mark" aria-hidden="true">
              <Globe2 className="h-5 w-5" strokeWidth={2.2} />
            </span>
            <span className="twt-display text-xl">The World Truth</span>
          </Link>
          <p className="mt-4 max-w-md text-sm leading-6 text-twt-ink/70">
            A playful data magazine about the world. Check the source note on each map before reusing a figure.
          </p>
        </div>

        <ul className="flex max-w-xl flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-twt-ink/65">
          {FOOTER_LINKS.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="twt-footer-link">
                {item.label}
              </Link>
            </li>
          ))}
          <li>
            <PrivacyPreferencesButton />
          </li>
        </ul>
      </div>

      <div className="border-t border-twt-ink/10">
        <div className="twt-container flex flex-wrap items-center justify-between gap-3 py-4 text-xs text-twt-ink/65">
          <p>The World Truth. Data stays attributed.</p>
          <Link href="/#explore" className="inline-flex items-center gap-1 font-bold text-twt-blue hover:underline">
            Start exploring
            <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </footer>
  )
}

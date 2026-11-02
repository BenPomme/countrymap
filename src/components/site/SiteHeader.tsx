import Link from 'next/link'
import { ArrowUpRight, Globe2 } from 'lucide-react'

const PRIMARY_LINKS = [
  { href: '/#explore', label: 'Explore maps' },
  { href: '/discoveries/', label: 'Discoveries' },
  { href: '/truthle/', label: 'Play today' },
]

export default function SiteHeader() {
  return (
    <header className="twt-site-header">
      <div className="twt-container flex min-h-16 flex-wrap items-center justify-between gap-3 py-3">
        <Link href="/" className="twt-brand" aria-label="The World Truth home">
          <span className="twt-brand-mark" aria-hidden="true">
            <Globe2 className="h-5 w-5" strokeWidth={2.2} />
          </span>
          <span>
            <span className="twt-display block text-[1.05rem] leading-none">The World Truth</span>
            <span className="mt-1 block text-[0.62rem] font-bold uppercase tracking-[0.18em] text-twt-ink/65">
              World data, without the fog
            </span>
          </span>
        </Link>

        <nav aria-label="Primary" className="w-full overflow-x-auto sm:w-auto">
          <ul className="flex min-w-max items-center gap-1 sm:gap-2">
            {PRIMARY_LINKS.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="twt-header-link">
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/rewards/" className="twt-button !min-h-10 !px-4 !py-2 !text-sm">
                Rewards &amp; codes
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  )
}

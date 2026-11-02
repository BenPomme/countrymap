import Link from 'next/link'
import AffiliateShelf from '@/components/affiliate/AffiliateShelf'
import {
  FRIEND_GIFT_TERMS,
  getAmazonStorefrontLabel,
} from '@/lib/affiliate/rewards'

const ACTIONS = [
  {
    eyebrow: 'Daily game',
    title: 'Play Truthle',
    body: 'Five world facts questions, with one free attempt each day.',
    href: '/truthle/',
    cta: 'Play today\'s Truthle',
  },
  {
    eyebrow: 'Daily game',
    title: 'Play True or False: World',
    body: 'Five country claims, with one free run each day.',
    href: '/true-false/',
    cta: 'Play today\'s True or False',
  },
  {
    eyebrow: 'Existing shop',
    title: 'Spend Truthle Coins',
    body: 'Use the Truthle Coins you earn in the games on virtual rewards in the existing shop.',
    href: '/truthle/shop/',
    cta: 'Open the Truthle Shop',
  },
] as const

export default function RewardsPage() {
  const storefront = getAmazonStorefrontLabel()

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-emerald-50 text-[#192947]">
      <header className="border-b border-[#e3d9bd] bg-white/90">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
          <Link href="/" className="text-sm font-semibold text-[#294cc4] hover:underline">The World Truth</Link>
          <nav className="flex items-center gap-4 text-sm" aria-label="Rewards navigation">
            <Link href="/truthle/" className="hover:underline">Truthle</Link>
            <Link href="/true-false/" className="hover:underline">True or False</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-8 px-4 py-10">
        <section className="rounded-3xl border border-[#d7c9a6] bg-white p-6 shadow-sm md:p-9">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#294cc4]">Rewards and codes</p>
          <h1 className="mt-2 max-w-3xl text-3xl font-black tracking-tight md:text-5xl">Play, earn coins and share an Extra Attempt</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[#43516b] md:text-lg">
            This hub lists the rewards available now. The coin shop is separate from the sponsored search picks below, and there are no hidden score requirements for those picks.
          </p>
        </section>

        <section aria-labelledby="available-now-heading">
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#294cc4]">Available now</p>
            <h2 id="available-now-heading" className="mt-1 text-2xl font-bold">Choose a real action</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {ACTIONS.map((action) => (
              <article key={action.href} className="flex flex-col rounded-2xl border border-[#e3d9bd] bg-white p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6b5a31]">{action.eyebrow}</p>
                <h3 className="mt-2 text-xl font-bold">{action.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-6 text-[#43516b]">{action.body}</p>
                <Link href={action.href} className="mt-5 inline-flex rounded-xl bg-[#192947] px-4 py-3 text-sm font-bold text-white hover:bg-[#294cc4]">
                  {action.cta}
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6" aria-labelledby="friend-gift-heading">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-800">Friend gift</p>
            <h2 id="friend-gift-heading" className="mt-1 text-2xl font-bold">One-use Extra Attempt codes</h2>
            <p className="mt-2 text-sm leading-6 text-[#43516b]">
              Share your finished result in either daily game to create a friend Extra Attempt code. The terms below match the server rules.
            </p>
            <ul className="mt-4 space-y-2 text-sm leading-6 text-[#243652]">
              {FRIEND_GIFT_TERMS.map((term) => (
                <li key={term} className="flex gap-2">
                  <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-700" />
                  <span>{term}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 rounded-xl border border-emerald-200 bg-white p-3 text-xs leading-5 text-[#43516b]">
              A code can still be rejected at checkout if it expired or was already used. Opening a challenge link does not reserve or use it.
            </p>
          </article>

          <article className="rounded-2xl border border-[#d7c9a6] bg-white p-6" aria-labelledby="challenge-link-heading">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#294cc4]">Challenge links</p>
            <h2 id="challenge-link-heading" className="mt-1 text-2xl font-bold">What the link carries</h2>
            <p className="mt-2 text-sm leading-6 text-[#43516b]">
              A challenge link identifies a game, a UTC puzzle day and an optional friend code. Opening it checks the link and remembers the context for the current browser tab.
            </p>
            <p className="mt-3 text-sm leading-6 text-[#43516b]">
              The code is applied only at checkout when an Extra Attempt is requested. Use the link a friend sent you, enter the code if the page asks for it, then continue to the game.
            </p>
          </article>
        </section>

        <AffiliateShelf
          placement="rewards-hub"
          heading={`Everyday ${storefront} search picks`}
          intro={`Ordinary ${storefront} search recommendations. They are available at any score and are not verified discounts.`}
        />

        <section className="rounded-2xl border border-[#e3d9bd] bg-white p-6" aria-labelledby="coin-note-heading">
          <h2 id="coin-note-heading" className="text-xl font-bold">Coins and the existing shop</h2>
          <p className="mt-2 text-sm leading-6 text-[#43516b]">
            Truthle Coins, saved progress and owned virtual items stay with the existing games and shop. This page does not replace that balance or inventory. Use the coin shop action above to see what your current balance can buy.
          </p>
        </section>
      </main>

      <footer className="mx-auto max-w-5xl px-4 pb-10 text-center text-xs leading-5 text-[#5f6b7c]">
        Sponsored search links are labelled. As an Amazon Associate we earn from qualifying purchases. Search results are not verified discounts, and prices or availability can change.
      </footer>
    </div>
  )
}

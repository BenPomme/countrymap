import Link from 'next/link'
import DailyAmazonPicks from '@/components/affiliate/DailyAmazonPicks'
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
    eyebrow: 'Coin shop',
    title: 'Spend Truthle Coins',
    body: 'Use the coins you earn in the daily games on virtual rewards.',
    href: '/truthle/shop/',
    cta: 'Visit the Truthle Shop',
  },
] as const

export default function RewardsPage() {
  const storefront = getAmazonStorefrontLabel()

  return (
    <main id="main-content" className="twt-container max-w-5xl space-y-8 py-10 sm:py-14">
        <section className="relative overflow-hidden rounded-[2rem] border-2 border-twt-ink bg-twt-paper p-6 shadow-[8px_8px_0_#ffda62] md:p-10">
          <p className="twt-kicker">Rewards and codes</p>
          <h1 className="twt-display mt-3 max-w-3xl text-balance text-4xl leading-[0.98] text-twt-ink md:text-6xl">Play, earn coins and send an extra try.</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-twt-ink/75 md:text-lg">
            Start with today&apos;s game, spend coins in the shop, or share a one-use Extra Attempt code with a friend. The sponsored picks below are available whatever your score.
          </p>
        </section>

        <DailyAmazonPicks
          placement="rewards-hub"
          heading={`Everyday ${storefront} search picks`}
          intro={`Ordinary ${storefront} search recommendations. They are available whatever your score and are not verified discounts.`}
        />

        <section aria-labelledby="available-now-heading">
          <div className="mb-4">
            <p className="twt-kicker">Start here</p>
            <h2 id="available-now-heading" className="twt-display mt-1 text-3xl">Ways to play and spend coins</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {ACTIONS.map((action) => (
              <article key={action.href} className="twt-panel flex flex-col bg-white p-5">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-twt-ink/55">{action.eyebrow}</p>
                <h3 className="mt-2 text-xl font-bold">{action.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-6 text-twt-ink/70">{action.body}</p>
                <Link href={action.href} className="mt-5 inline-flex rounded-xl bg-twt-blue px-4 py-3 text-sm font-bold text-white hover:bg-twt-ink">
                  {action.cta}
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-2xl border-2 border-twt-green/25 bg-twt-green/5 p-6" aria-labelledby="friend-gift-heading">
            <p className="twt-kicker !text-twt-green">Friend gift</p>
            <h2 id="friend-gift-heading" className="twt-display mt-1 text-2xl">Share an Extra Attempt</h2>
            <p className="mt-3 text-sm leading-6 text-twt-ink/70">
              Finish either daily game to create one friend code for the UTC day. These rules apply.
            </p>
            <ul className="mt-4 space-y-2 text-sm leading-6 text-twt-ink/80">
              {FRIEND_GIFT_TERMS.map((term) => (
                <li key={term} className="flex gap-2">
                  <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-twt-green" />
                  <span>{term}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="twt-panel bg-white p-6" aria-labelledby="challenge-link-heading">
            <p className="twt-kicker">Challenge links</p>
            <h2 id="challenge-link-heading" className="twt-display mt-1 text-2xl">Open a friend&apos;s challenge</h2>
            <p className="mt-3 text-sm leading-6 text-twt-ink/70">
              A link carries the game, the UTC puzzle day and an optional friend code.
            </p>
            <p className="mt-3 text-sm leading-6 text-twt-ink/70">
              Opening the link never uses the code. Enter the code if the page asks for it, then continue to the game.
            </p>
          </article>
        </section>

        <section className="twt-panel bg-white p-6" aria-labelledby="coin-note-heading">
          <h2 id="coin-note-heading" className="twt-display text-2xl">Truthle Coins</h2>
          <p className="mt-2 text-sm leading-6 text-twt-ink/70">
            Your coin balance and purchased virtual items stay in the Truthle Shop.
          </p>
        </section>
    </main>
  )
}

import Link from 'next/link'
import type { Metadata } from 'next'

const title = 'Truthle vs Worldle and other daily geography games'
const description = 'Compare a five-question sourced statistics quiz with shape, place and route guessing games. See how Truthle and True or False: World approach daily play.'

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: 'https://theworldtruth.com/truthle-vs-worldle/' },
  openGraph: {
    title,
    description,
    url: 'https://theworldtruth.com/truthle-vs-worldle/',
    siteName: 'The World Truth',
    images: [{ url: 'https://theworldtruth.com/og/truthle.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: ['https://theworldtruth.com/og/truthle.png'],
  },
}

const comparisonRows = [
  {
    game: 'Truthle',
    task: 'Answer five multiple-choice questions built from country and world statistics.',
    difference: 'The focus stays on interpreting a recorded figure and choosing the country or comparison that fits.',
  },
  {
    game: 'True or False: World',
    task: 'Decide whether five country-stat claims are true or false.',
    difference: 'The focus moves from choosing among answers to judging a complete statement. Each available round uses exactly five sourced claims or shows the round as unavailable.',
  },
  {
    game: 'Shape and place games, such as Worldle and Globle',
    task: 'Identify or locate a country from its outline or position on a map.',
    difference: 'The focus is geographic recognition, not reading and comparing a country statistic.',
  },
  {
    game: 'Route and clue games, such as Travle and GeoDle',
    task: 'Work through country geography using routes, connections or place clues.',
    difference: 'The focus is place knowledge and movement. Check each game for its current rules.',
  },
  {
    game: 'General true or false games, such as PopBluff',
    task: 'Judge statements presented in a true or false format.',
    difference: 'The focus is general statement judgement. Its source base and daily content can differ from True or False: World.',
  },
]

export default function Page() {
  return (
    <div className="twt-shell min-h-screen bg-[#fff9e8] text-[#192947]">
      <main className="twt-container py-8 sm:py-12 lg:py-16">
        <div className="twt-panel overflow-hidden">
          <div className="grid lg:grid-cols-[minmax(0,1.3fr)_minmax(17rem,0.7fr)]">
            <div className="p-6 sm:p-8 lg:p-12">
              <p className="twt-kicker">Game comparison</p>
              <h1 className="twt-display mt-3 max-w-3xl text-4xl font-black leading-[0.98] sm:text-5xl lg:text-6xl">
                Truthle vs Worldle and other daily geography games
              </h1>
              <p className="twt-prose mt-5 max-w-2xl">
                Shape and place games hide a country and ask you to find it. Truthle hides a figure inside a question and asks you to choose the answer that fits. Both can be daily habits, but they test different kinds of knowledge.
              </p>
            </div>
            <aside className="border-t-2 border-[#192947] bg-[#ffda62] p-6 sm:p-8 lg:border-l-2 lg:border-t-0 lg:p-10">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#192947]/70">The short version</p>
              <p className="mt-3 twt-display text-2xl font-black leading-tight">One game asks where. The other asks which figure adds up.</p>
              <p className="mt-4 text-sm leading-6 text-[#192947]/80">
                Truthle uses exactly five sourced questions per available UTC round. True or False: World uses exactly five sourced claims. If a suitable set cannot be prepared, the game says so.
              </p>
              <div className="mt-5 flex flex-col gap-3">
                <Link href="/truthle/" className="twt-button text-center">Play today&apos;s Truthle</Link>
                <Link href="/true-false/" className="twt-button-secondary text-center">Play True or False</Link>
              </div>
            </aside>
          </div>
        </div>

        <section className="twt-panel mt-6 p-6 sm:p-8 lg:p-10" aria-labelledby="comparison-table-title">
          <p className="twt-kicker">Different daily puzzles</p>
          <h2 id="comparison-table-title" className="twt-display mt-2 text-3xl font-black">Sourced statistics quiz vs shape and place guessing</h2>
          <p className="twt-prose mt-3">
            The games below are grouped by their main challenge. Formats can change, so check each game&apos;s own site for its current rules.
          </p>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[48rem] border-collapse text-left text-sm">
              <caption className="sr-only">Comparison of Truthle and True or False: World with geography guessing and true or false games</caption>
              <thead>
                <tr className="border-b-2 border-[#192947] text-xs font-black uppercase tracking-[0.12em] text-[#59647a]">
                  <th scope="col" className="py-3 pr-5">Game or family</th>
                  <th scope="col" className="py-3 pr-5">Main challenge</th>
                  <th scope="col" className="py-3">Where the focus sits</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row) => (
                  <tr key={row.game} className="border-b border-[#d8d2c2] align-top">
                    <th scope="row" className="py-4 pr-5 font-black text-[#192947]">{row.game}</th>
                    <td className="py-4 pr-5 leading-6 text-[#43516b]">{row.task}</td>
                    <td className="py-4 leading-6 text-[#43516b]">{row.difference}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs leading-5 text-[#59647a]">
            Game names belong to their creators. The World Truth is not affiliated with the other games mentioned here.
          </p>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <section className="twt-panel p-6 sm:p-8" aria-labelledby="truthle-format-title">
            <p className="twt-kicker">Truthle</p>
            <h2 id="truthle-format-title" className="twt-display mt-2 text-3xl font-black">A question first, then the evidence</h2>
            <p className="twt-prose mt-3">
              Truthle players answer five multiple-choice questions. After each answer, they can see the recorded figure and the source, year, coverage and known limitations that are available. The first run each UTC day is free.
            </p>
            <h3 className="twt-display mt-5 text-xl font-black">Good for testing</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-[#43516b]">
              <li>Whether you can compare two recorded figures.</li>
              <li>Whether you can connect a statistic to the right country.</li>
              <li>Whether a surprising claim survives a look at the data.</li>
            </ul>
          </section>

          <section className="twt-panel p-6 sm:p-8" aria-labelledby="geography-format-title">
            <p className="twt-kicker">Geography guessing</p>
            <h2 id="geography-format-title" className="twt-display mt-2 text-3xl font-black">A map, a shape or a trail of clues</h2>
            <p className="twt-prose mt-3">
              Shape, place and route games test where countries are and how they connect. That is a different challenge from interpreting a statistic, even when both games use the same daily habit.
            </p>
            <h3 className="twt-display mt-5 text-xl font-black">Good for testing</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-[#43516b]">
              <li>Recognition of country outlines and locations.</li>
              <li>Knowledge of borders, regions and routes.</li>
              <li>How quickly you can narrow down a place.</li>
            </ul>
          </section>
        </div>

        <section className="twt-panel mt-6 bg-[#eef3ff] p-6 sm:p-8 lg:p-10" aria-labelledby="choose-game-title">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="twt-kicker">Try both</p>
              <h2 id="choose-game-title" className="twt-display mt-2 text-3xl font-black">Choose your daily challenge</h2>
              <p className="twt-prose mt-3">Play a five-question statistics quiz, call five sourced claims, or switch between them.</p>
            </div>
            <div className="flex flex-col gap-3 sm:min-w-56">
              <Link href="/truthle/" className="twt-button text-center">Play Truthle</Link>
              <Link href="/true-false/" className="twt-button-secondary text-center">Play True or False</Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

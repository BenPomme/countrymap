import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Truthle vs Worldle, Globle, Travle & other daily geography games',
  description: 'How Truthle and True or False: World compare with Worldle, Globle, Travle and GeoDle: what you guess, how many tries, and which to play.',
  alternates: { canonical: 'https://theworldtruth.com/truthle-vs-worldle/' },
}

const rows = [
  { game: 'Truthle', guess: 'Answers to 5 world-statistics questions', format: '5 questions, 1 free attempt per day', link: '/truthle/' },
  { game: 'True or False: World', guess: 'Whether 5 country-stat claims are true', format: '5 claims, 1 free run per day', link: '/true-false/' },
  { game: 'Worldle', guess: 'A country from its silhouette', format: 'Several guesses, with distance and direction hints', link: '' },
  { game: 'Globle', guess: 'A mystery country on a 3D globe', format: 'Unlimited guesses, with closer/farther color hints', link: '' },
  { game: 'Travle', guess: 'A route of countries between two countries', format: 'Limited extra guesses', link: '' },
  { game: 'GeoDle and similar', guess: 'A country from geography clues', format: 'Varies by game', link: '' },
]

export default function Page() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-8 text-gray-800">
      <Link href="/" className="text-sm text-gray-600">← The World Truth</Link>
      <h1 className="text-3xl font-extrabold mt-3 text-gray-900">Truthle vs Worldle and other daily geography games</h1>
      <p className="mt-3">Most daily geography games ask you to find a country from its shape or location. Truthle and True or False: World test something else: what you know about countries, such as their economies, health and everyday life. The two kinds of game go well together.</p>
      <div className="overflow-x-auto mt-6">
        <table className="w-full text-sm">
          <thead><tr className="border-b text-left text-gray-500"><th className="py-2 pr-3">Game</th><th className="py-2 pr-3">What you guess</th><th className="py-2">Format</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.game} className="border-b border-gray-100">
                <td className="py-2 pr-3 font-medium">{r.link ? <Link href={r.link} className="text-emerald-700 underline">{r.game}</Link> : r.game}</td>
                <td className="py-2 pr-3">{r.guess}</td>
                <td className="py-2">{r.format}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-gray-500">Game names belong to their creators. Formats are summarized and may change. The World Truth is not affiliated with these games.</p>
      <div className="mt-8 grid sm:grid-cols-2 gap-3">
        <Link href="/truthle/" className="block text-center py-4 rounded-2xl bg-emerald-600 text-white font-bold">Play today&apos;s Truthle →</Link>
        <Link href="/true-false/" className="block text-center py-4 rounded-2xl bg-sky-600 text-white font-bold">Play True or False: World →</Link>
      </div>
    </main>
  )
}

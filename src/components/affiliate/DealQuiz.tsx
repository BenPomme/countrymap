'use client'

import { useState } from 'react'
import { amazonSearchUrl } from '@/lib/constants/affiliates'

interface Props {
  slug: string
  category?: string
  name?: string
}

type Q = { q: string; options: string[]; answer: number; fact: string }
type Pick = { label: string; query: string }
type Theme = { key: string; title: string; questions: Q[]; picks: Pick[] }

const PRESS: Theme = {
  key: 'press',
  title: 'Press freedom quiz',
  questions: [
    { q: 'Which country has topped the RSF World Press Freedom Index every year since 2017?', options: ['Sweden', 'Norway', 'Finland', 'Netherlands'], answer: 1, fact: 'Norway has ranked #1 in the RSF index since 2017.' },
    { q: 'Which organisation publishes the World Press Freedom Index?', options: ['UNESCO', 'Freedom House', 'Reporters Without Borders', 'Amnesty International'], answer: 2, fact: 'Reporters Without Borders (RSF) publishes it annually.' },
    { q: 'Which tool is commonly used to reach blocked websites in censored countries?', options: ['A VPN', 'A firewall', 'A DNS cache', 'A proxy ad blocker'], answer: 0, fact: 'VPNs tunnel traffic past national blocks (check local laws).' },
    { q: 'George Orwell’s classic novel about state surveillance is…', options: ['Brave New World', 'Fahrenheit 451', 'Nineteen Eighty-Four', 'The Trial'], answer: 2, fact: 'Nineteen Eighty-Four (1949) coined “Big Brother”.' },
  ],
  picks: [
    { label: 'Privacy screen protectors', query: 'privacy screen protector laptop' },
    { label: 'Webcam covers & privacy kits', query: 'webcam cover privacy' },
    { label: 'Best books on press freedom & journalism', query: 'press freedom journalism book' },
    { label: 'Nineteen Eighty-Four (Orwell)', query: 'nineteen eighty-four orwell' },
  ],
}

const TRAVEL: Theme = {
  key: 'travel',
  title: 'Passport & travel quiz',
  questions: [
    { q: 'Which passport has ranked among the most powerful in the world (Henley Index) in recent years?', options: ['Singapore', 'Brazil', 'Canada', 'Mexico'], answer: 0, fact: 'Singapore has led or co-led the Henley Passport Index recently.' },
    { q: 'What does RFID-blocking travel gear protect?', options: ['Your luggage weight', 'Contactless chips in cards & e-passports', 'Phone battery', 'Sunburn'], answer: 1, fact: 'RFID sleeves shield contactless chips from skimming.' },
    { q: 'How many countries are in the Schengen Area (2025)?', options: ['22', '27', '29', '35'], answer: 2, fact: 'Bulgaria and Romania fully joined in 2025, making 29.' },
    { q: 'UK plugs are Type G. Which plug type is used in most of continental Europe?', options: ['Type A', 'Type C/F', 'Type I', 'Type G'], answer: 1, fact: 'Continental Europe mostly uses Type C/F (Schuko) — pack an adapter.' },
  ],
  picks: [
    { label: 'RFID-blocking passport holders', query: 'rfid passport holder' },
    { label: 'Universal travel adapters', query: 'universal travel adapter' },
    { label: 'Carry-on cabin bags', query: 'cabin bag carry on' },
    { label: 'Lonely Planet & travel guides', query: 'lonely planet guide' },
  ],
}

const GENERAL: Theme = {
  key: 'world',
  title: 'World facts quiz',
  questions: [
    { q: 'What is the largest country by land area?', options: ['Canada', 'China', 'Russia', 'USA'], answer: 2, fact: 'Russia covers about 17 million km².' },
    { q: 'Which is the most populous country (UN, 2023+)?', options: ['China', 'India', 'USA', 'Indonesia'], answer: 1, fact: 'India overtook China in 2023.' },
    { q: 'How many UN member states are there?', options: ['180', '193', '201', '210'], answer: 1, fact: 'There are 193 UN member states.' },
  ],
  picks: [
    { label: 'World atlases', query: 'world atlas' },
    { label: 'Scratch-off world maps', query: 'scratch off world map' },
    { label: 'Illuminated & smart globes', query: 'world globe illuminated' },
    { label: 'Geography trivia board games', query: 'geography trivia game' },
  ],
}

const PRESS_RE = /press|freedom|censor|internet|surveillance|privacy|democra|corruption/i
const TRAVEL_RE = /passport|visa|touris|travel|safety|happiness|cost of living|climate/i

function pickTheme(ctx: string): Theme {
  if (PRESS_RE.test(ctx)) return PRESS
  if (TRAVEL_RE.test(ctx)) return TRAVEL
  return GENERAL
}

/** Short quiz that unlocks curated Amazon picks (affiliate). No prizes, no cash. */
export default function DealQuiz({ slug, category = '', name = '' }: Props) {
  const theme = pickTheme(`${slug} ${category} ${name}`)
  const [i, setI] = useState(0)
  const [score, setScore] = useState(0)
  const [chosen, setChosen] = useState<number | null>(null)
  const done = i >= theme.questions.length

  if (!amazonSearchUrl('x')) return null

  const q = theme.questions[i]
  const next = () => { setChosen(null); setI(i + 1) }

  return (
    <section id="deal-quiz" className="scroll-mt-4 bg-gradient-to-br from-amber-50 to-white border border-amber-200 rounded-2xl p-4 md:p-5" aria-label="Quiz">
      <h2 className="text-lg font-semibold text-gray-900">🎯 {theme.title} — unlock today&apos;s picks</h2>
      {!done ? (
        <div className="mt-3">
          <p className="text-xs text-gray-500">Question {i + 1} of {theme.questions.length} · answer all to unlock curated deals</p>
          <p className="mt-2 font-medium text-gray-800">{q.q}</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {q.options.map((o, k) => {
              const state = chosen === null ? '' : k === q.answer ? 'bg-green-100 border-green-400' : k === chosen ? 'bg-red-100 border-red-400' : 'opacity-60'
              return (
                <button key={o} disabled={chosen !== null}
                  onClick={() => { setChosen(k); if (k === q.answer) setScore(score + 1) }}
                  className={`text-left px-3 py-2 rounded-lg border bg-white hover:border-amber-400 ${state}`}>{o}</button>
              )
            })}
          </div>
          {chosen !== null && (
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-sm text-gray-600">{q.fact}</p>
              <button onClick={next} className="shrink-0 px-4 py-2 rounded-lg bg-amber-500 text-white font-medium hover:bg-amber-600">
                {i + 1 === theme.questions.length ? 'Unlock picks 🔓' : 'Next'}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-3">
          <p className="text-gray-800">You scored <strong>{score}/{theme.questions.length}</strong>. 🔓 Unlocked: our recommended picks & current Amazon deals.</p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {theme.picks.map((p) => (
              <li key={p.query}>
                <a href={amazonSearchUrl(p.query) || '#'} target="_blank" rel="sponsored nofollow noopener noreferrer"
                  className="block px-3 py-2 rounded-lg bg-white border hover:border-amber-400 text-blue-700">🛒 {p.label} →</a>
              </li>
            ))}
          </ul>
          <button onClick={() => { setI(0); setScore(0); setChosen(null) }} className="mt-3 text-sm text-gray-500 underline">Play again</button>
        </div>
      )}
      <p className="mt-3 text-[11px] text-gray-400">As an Amazon Associate we earn from qualifying purchases. Prices and deals are set by Amazon and may change. No prizes or cash — just for fun.</p>
    </section>
  )
}

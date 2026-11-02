import type { GameKey } from './resultShare'
import { GAME_TITLES } from './resultShare'

interface ResultScorecardProps {
  game: GameKey
  day: string
  score: number
  correct: number
  total: number
  streak: number
  scoreLabel?: string
  secondaryNote?: string
}

export default function ResultScorecard({
  game,
  day,
  score,
  correct,
  total,
  streak,
  scoreLabel = 'Score',
  secondaryNote,
}: ResultScorecardProps) {
  return (
    <section className="twt-panel w-full max-w-2xl mx-auto p-6 sm:p-8 text-left" aria-label="Your result">
      <p className="twt-kicker">The World Truth daily game</p>
      <h2 className="twt-display mt-2 text-3xl sm:text-4xl font-black text-[#192947]">{GAME_TITLES[game]}</h2>
      <p className="mt-1 text-sm font-semibold text-[#59647a]">Day {day}</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-[#fff] p-4 border border-[#e7dfc8]">
          <p className="text-xs font-bold uppercase tracking-wide text-[#59647a]">{scoreLabel}</p>
          <p className="mt-1 text-3xl font-black text-[#192947]">
            {game === 'truthle' ? score.toLocaleString('en-GB') : `${correct}/${total}`}
          </p>
          {game === 'truthle' && <p className="mt-1 text-sm text-[#59647a]">{correct}/{total} correct</p>}
        </div>
        <div className="rounded-2xl bg-[#fff] p-4 border border-[#e7dfc8]">
          <p className="text-xs font-bold uppercase tracking-wide text-[#59647a]">Correct</p>
          <p className="mt-1 text-3xl font-black text-[#246e55]">{correct}/{total}</p>
        </div>
        <div className="rounded-2xl bg-[#fff] p-4 border border-[#e7dfc8]">
          <p className="text-xs font-bold uppercase tracking-wide text-[#59647a]">Round streak</p>
          <p className="mt-1 text-3xl font-black text-[#dc654e]">{streak}</p>
          <p className="mt-1 text-sm text-[#59647a]">{streak === 1 ? 'day' : 'days'}</p>
        </div>
      </div>

      {secondaryNote && <p className="mt-4 text-sm text-[#59647a]">{secondaryNote}</p>}
    </section>
  )
}

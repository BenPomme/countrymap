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
  const scoreValue = game === 'truthle' ? score.toLocaleString('en-GB') : `${correct}/${total}`
  const scoreDetail = game === 'truthle' ? 'points' : 'correct'
  const ResultHeading = game === 'true-false' ? 'h1' : 'h2'

  return (
    <section className="twt-panel mx-auto w-full max-w-2xl px-4 py-4 text-left sm:px-6 sm:py-5" aria-label="Your result">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <div>
          <p className="twt-kicker">Daily result</p>
          <ResultHeading className="twt-display mt-1 text-xl font-black text-[#192947] sm:text-2xl">{GAME_TITLES[game]}</ResultHeading>
        </div>
        <p className="text-xs font-semibold text-[#59647a] sm:text-sm">Day {day}</p>
      </div>

      <div className={`mt-3 grid gap-2 ${game === 'truthle' ? 'grid-cols-3' : 'grid-cols-2'}`}>
        <div className="rounded-xl border border-[#e7dfc8] bg-[#fff] px-2 py-3 text-center sm:px-3">
          <p className="text-[0.65rem] font-bold uppercase tracking-wide text-[#59647a] sm:text-xs">{scoreLabel}</p>
          <p className="mt-1 text-2xl font-black tabular-nums text-[#192947] sm:text-3xl">{scoreValue}</p>
          <p className="mt-0.5 text-xs text-[#59647a]">{scoreDetail}</p>
        </div>
        {game === 'truthle' && (
          <div className="rounded-xl border border-[#e7dfc8] bg-[#fff] px-2 py-3 text-center sm:px-3">
            <p className="text-[0.65rem] font-bold uppercase tracking-wide text-[#59647a] sm:text-xs">Correct</p>
            <p className="mt-1 text-2xl font-black tabular-nums text-[#246e55] sm:text-3xl">{correct}/{total}</p>
            <p className="mt-0.5 text-xs text-[#59647a]">answers</p>
          </div>
        )}
        <div className="rounded-xl border border-[#e7dfc8] bg-[#fff] px-2 py-3 text-center sm:px-3">
          <p className="text-[0.65rem] font-bold uppercase tracking-wide text-[#59647a] sm:text-xs">Streak</p>
          <p className="mt-1 text-2xl font-black tabular-nums text-[#dc654e] sm:text-3xl">{streak}</p>
          <p className="mt-0.5 text-xs text-[#59647a]">{streak === 1 ? 'day' : 'days'}</p>
        </div>
      </div>

      {secondaryNote && <p className="mt-3 text-xs leading-5 text-[#59647a] sm:text-sm">{secondaryNote}</p>}
    </section>
  )
}

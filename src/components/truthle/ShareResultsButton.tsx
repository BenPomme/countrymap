import ResultSharePanel from './ResultSharePanel'
import type { GameKey } from './resultShare'

interface ShareResultsButtonProps {
  game?: GameKey
  day: string
  score: number
  correct: number
  total: number
  streak: number
  onFirstShare?: () => void
}

export default function ShareResultsButton({
  game = 'truthle',
  day,
  score,
  correct,
  total,
  streak,
  onFirstShare,
}: ShareResultsButtonProps) {
  return <ResultSharePanel game={game} day={day} score={score} correct={correct} total={total} streak={streak} onFirstShare={onFirstShare} />
}

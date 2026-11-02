'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  BarChart3,
  Check,
  Clock,
  Compass,
  RotateCcw,
  Sparkles,
  Trophy,
  X,
  Zap,
} from 'lucide-react'
import { generateQuizQuestions, calculateScore, type QuizQuestion } from '@/lib/quiz/questionGenerator'
import { countries } from '@/lib/data/loadCountries'
import { getMetricProvenance } from '@/lib/seo/provenance'
import { postBridgeMessage } from '@/lib/bridge/webBridge'
import { VisualShare } from '@/components/share'
import { absoluteSiteUrl } from '@/components/share/shareState'
import { trackEvent } from '@/lib/analytics/events'
import { useEmbeddedAppMode } from '@/lib/useEmbeddedAppMode'
import { quizMetricId, selectProvenanceEligibleQuestions } from './quizEligibility'

type GameState = 'start' | 'playing' | 'answered' | 'finished'

const QUESTION_LIMIT = 20
const QUESTION_POOL_LIMIT = 180
const SECONDS_PER_QUESTION = 15

function track(name: string, params: Record<string, string | number | boolean>): void {
  try {
    trackEvent(name, params)
  } catch {
    // Measurement must never interrupt the quiz.
  }
}

export default function QuizPage() {
  const [gameState, setGameState] = useState<GameState>('start')
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [streak, setStreak] = useState(0)
  const [maxStreak, setMaxStreak] = useState(0)
  const [streakBonus, setStreakBonus] = useState(0)
  const [timeLeft, setTimeLeft] = useState(SECONDS_PER_QUESTION)
  const [showTimer, setShowTimer] = useState(true)
  const [answers, setAnswers] = useState<boolean[]>([])
  const [startNotice, setStartNotice] = useState('')
  const [roundNote, setRoundNote] = useState('')
  const resultsRef = useRef<HTMLDivElement>(null)
  const answerLockedRef = useRef(false)
  const completionSentRef = useRef(false)
  const embeddedMode = useEmbeddedAppMode()

  const startGame = useCallback(() => {
    completionSentRef.current = false
    answerLockedRef.current = false

    const pool = generateQuizQuestions(countries, QUESTION_POOL_LIMIT)
    const eligible = selectProvenanceEligibleQuestions(pool, getMetricProvenance, QUESTION_LIMIT)

    if (eligible.length === 0) {
      setQuestions([])
      setGameState('start')
      setStartNotice(
        'No sourced questions are available right now. Explore charts or discoveries for now.',
      )
      return
    }

    setStartNotice('')
    setRoundNote(
      eligible.length < QUESTION_LIMIT
        ? `This round has ${eligible.length} sourced ${eligible.length === 1 ? 'question' : 'questions'}.`
        : '',
    )
    setQuestions(eligible)
    setCurrentQuestionIndex(0)
    setSelectedAnswer(null)
    setCorrectAnswers(0)
    setStreak(0)
    setMaxStreak(0)
    setStreakBonus(0)
    setTimeLeft(SECONDS_PER_QUESTION)
    setAnswers([])
    setGameState('playing')
    track('game_start', { game: 'quiz', status: 'started' })
  }, [])

  const currentQuestion = questions[currentQuestionIndex]

  const handleAnswer = useCallback(
    (answerIndex: number) => {
      if (gameState !== 'playing' || answerLockedRef.current || !currentQuestion) return
      answerLockedRef.current = true

      const isCorrect = answerIndex === currentQuestion.correctAnswer
      setSelectedAnswer(answerIndex)
      setAnswers((previous) => [...previous, isCorrect])

      if (isCorrect) {
        setCorrectAnswers((previous) => previous + 1)
        const nextStreak = streak + 1
        setStreak(nextStreak)
        if (nextStreak > maxStreak) setMaxStreak(nextStreak)
        if (nextStreak >= 3) setStreakBonus((previous) => previous + 2)
      } else {
        setStreak(0)
      }

      setGameState('answered')
    },
    [currentQuestion, gameState, maxStreak, streak],
  )

  useEffect(() => {
    if (gameState !== 'playing' || !showTimer) return

    const timer = window.setInterval(() => {
      setTimeLeft((previous) => Math.max(0, previous - 1))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [currentQuestionIndex, gameState, showTimer])

  useEffect(() => {
    if (gameState === 'playing' && showTimer && timeLeft === 0) handleAnswer(-1)
  }, [gameState, handleAnswer, showTimer, timeLeft])

  const nextQuestion = () => {
    answerLockedRef.current = false
    if (currentQuestionIndex + 1 >= questions.length) {
      setGameState('finished')
      return
    }

    setCurrentQuestionIndex((previous) => previous + 1)
    setSelectedAnswer(null)
    setTimeLeft(SECONDS_PER_QUESTION)
    setGameState('playing')
  }

  useEffect(() => {
    if (gameState !== 'finished' || questions.length === 0 || completionSentRef.current) return
    completionSentRef.current = true

    const { score } = calculateScore(correctAnswers, questions.length, streakBonus)
    postBridgeMessage({
      type: 'session_completed',
      payload: {
        route: '/quiz',
        sessionType: 'quiz',
        reason: 'completed',
        score,
        timestamp: new Date().toISOString(),
      },
    })
    track('game_complete', {
      game: 'quiz',
      score,
      correct: correctAnswers,
      status: 'completed',
    })
  }, [correctAnswers, gameState, questions.length, streakBonus])

  const quizMetricIds = useMemo(
    () =>
      Array.from(
        new Set(
          questions
            .map((question) => quizMetricId(question.id))
            .filter((metricId): metricId is string => Boolean(metricId)),
        ),
      ),
    [questions],
  )

  const shareProvenance = useMemo(() => {
    const records = quizMetricIds.flatMap((metricId) => {
      try {
        const record = getMetricProvenance(metricId)
        return record ? [record] : []
      } catch {
        return []
      }
    })
    const sourceNames = Array.from(
      new Set(
        records
          .map((record) => record.sourceName?.trim())
          .filter((value): value is string => Boolean(value)),
      ),
    )
    const years = Array.from(
      new Set(
        records
          .map((record) => record.year?.trim())
          .filter((value): value is string => Boolean(value)),
      ),
    )
    const sourceUrls = Array.from(
      new Set(records.map((record) => record.sourceUrl).filter(Boolean) as string[]),
    )
    const hasUnknownProvenance =
      records.length !== quizMetricIds.length ||
      records.some((record) => !record.sourceName?.trim() || !record.year?.trim())
    const unknownSuffix = hasUnknownProvenance ? '; Unknown for one or more measures' : ''

    return {
      sourceName: `${sourceNames.join('; ') || 'The World Truth country dataset'}${unknownSuffix}`,
      sourceVintage: years.length > 0 ? `${years.join('; ')}${unknownSuffix}` : 'Unknown',
      sourceUrl: !hasUnknownProvenance && sourceUrls.length === 1 ? sourceUrls[0] : undefined,
    }
  }, [quizMetricIds])

  const currentProvenance = useMemo(() => {
    if (!currentQuestion) return null
    const metricId = quizMetricId(currentQuestion.id)
    if (!metricId) return null

    try {
      return getMetricProvenance(metricId)
    } catch {
      return null
    }
  }, [currentQuestion])

  if (gameState === 'start') {
    return (
      <div className="twt-shell min-h-screen bg-[#fff9e8] text-[#192947]">
        <main className={`twt-container mx-auto max-w-5xl px-4 ${embeddedMode ? 'py-5' : 'py-10 md:py-16'}`}>
          <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_330px] lg:items-stretch">
            <div className="twt-panel rounded-[32px] border border-[#192947]/12 bg-white p-6 shadow-sm md:p-10">
              <p className="twt-kicker flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-[#294cc4]">
                <Trophy className="h-4 w-4" aria-hidden="true" />
                The Truth Quiz
              </p>
              <h1 className="twt-display mt-4 max-w-2xl text-4xl font-black leading-[0.98] tracking-tight md:text-6xl">
                How well do you know the world?
              </h1>
              <p className="twt-prose mt-5 max-w-xl text-base leading-7 text-[#192947]/72 md:text-lg">
                Answer up to 20 questions from sourced country data. Every answer shows its source, year, coverage and known limits.
              </p>

              {startNotice && (
                <div
                  role="alert"
                  className="mt-6 rounded-2xl border border-[#dc654e]/25 bg-[#dc654e]/8 p-4 text-sm font-semibold leading-6 text-[#7f3022]"
                >
                  {startNotice}
                </div>
              )}

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-[#fff9e8] p-4">
                  <Clock className="h-5 w-5 text-[#294cc4]" aria-hidden="true" />
                  <p className="mt-3 font-black">{SECONDS_PER_QUESTION} seconds</p>
                  <p className="mt-1 text-sm text-[#192947]/60">for each question</p>
                </div>
                <div className="rounded-2xl bg-[#fff9e8] p-4">
                  <Zap className="h-5 w-5 text-[#dc654e]" aria-hidden="true" />
                  <p className="mt-3 font-black">Streak bonus</p>
                  <p className="mt-1 text-sm text-[#192947]/60">after three correct</p>
                </div>
                <div className="rounded-2xl bg-[#fff9e8] p-4">
                  <Compass className="h-5 w-5 text-[#246e55]" aria-hidden="true" />
                  <p className="mt-3 font-black">Sourced data</p>
                  <p className="mt-1 text-sm text-[#192947]/60">source notes after each answer</p>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={startGame}
                  className="twt-button inline-flex items-center justify-center gap-2 rounded-full bg-[#294cc4] px-7 py-3.5 font-black text-white transition-colors hover:bg-[#1f3ca0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294cc4] motion-reduce:transition-none"
                >
                  <Sparkles className="h-5 w-5" aria-hidden="true" />
                  Start quiz
                </button>
                <label className="flex items-center gap-2 text-sm font-semibold text-[#192947]/70">
                  <input
                    type="checkbox"
                    checked={showTimer}
                    onChange={(event) => setShowTimer(event.target.checked)}
                    className="h-4 w-4 rounded border-[#192947]/30 accent-[#294cc4]"
                  />
                  Enable the timer
                </label>
              </div>
            </div>

            <aside className="flex flex-col justify-between rounded-[32px] bg-[#192947] p-6 text-white md:p-8">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#ffda62]">Before you start</p>
                <h2 className="mt-4 text-2xl font-black leading-tight">Questions from sourced country data</h2>
                <p className="mt-3 text-sm leading-6 text-white/70">
                  A short round shows its question count before the first question. Every answer shows its source, year, coverage and known limits.
                </p>
              </div>
              <div className="mt-8 space-y-3 text-sm font-bold">
                <Link href="/charts" className="flex items-center justify-between rounded-xl bg-white/10 px-4 py-3 hover:bg-white/15">
                  Compare charts
                  <BarChart3 className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link href="/discoveries" className="flex items-center justify-between rounded-xl bg-white/10 px-4 py-3 hover:bg-white/15">
                  Browse discoveries
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </aside>
          </section>
        </main>
      </div>
    )
  }

  if (gameState === 'finished') {
    const { score, grade, message } = calculateScore(correctAnswers, questions.length, streakBonus)

    return (
      <div className="twt-shell min-h-screen bg-[#fff9e8] text-[#192947]">
        <main className={`twt-container mx-auto max-w-4xl px-4 ${embeddedMode ? 'py-5' : 'py-10 md:py-16'}`}>
          <div ref={resultsRef} className="twt-panel overflow-hidden rounded-[32px] border border-[#192947]/12 bg-white shadow-sm">
            <div className="bg-[#192947] px-6 py-7 text-white md:px-9">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#ffda62]">Quiz complete</p>
              <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-black tracking-tight md:text-5xl">Grade {grade}</h1>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-white/72 md:text-base">{message}</p>
                </div>
                <div className="rounded-2xl bg-[#ffda62] px-5 py-3 text-center text-[#192947]">
                  <p className="text-4xl font-black">{score}%</p>
                  <p className="text-xs font-black uppercase tracking-[0.12em]">Final score</p>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-9">
              {roundNote && (
                <p className="mb-5 rounded-xl bg-[#fff9e8] px-4 py-3 text-sm font-semibold text-[#192947]/70">
                  {roundNote}
                </p>
              )}

              <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {[
                  { label: 'Correct', value: `${correctAnswers}/${questions.length}` },
                  { label: 'Max streak', value: String(maxStreak) },
                  { label: 'Streak bonus', value: `+${streakBonus}` },
                  { label: 'Questions', value: String(questions.length) },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl bg-[#fff9e8] p-4">
                    <dt className="text-xs font-black uppercase tracking-[0.1em] text-[#192947]/50">{item.label}</dt>
                    <dd className="mt-1 text-2xl font-black">{item.value}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-6" aria-label="Answer summary">
                <div className="flex flex-wrap gap-2">
                  {answers.map((isCorrect, index) => (
                    <span
                      key={index}
                      className={`inline-flex h-8 min-w-8 items-center justify-center rounded-full text-xs font-black ${
                        isCorrect ? 'bg-[#246e55]/12 text-[#246e55]' : 'bg-[#dc654e]/12 text-[#a63f2d]'
                      }`}
                      aria-label={`Question ${index + 1}: ${isCorrect ? 'correct' : 'incorrect'}`}
                    >
                      {isCorrect ? <Check className="h-4 w-4" aria-hidden="true" /> : <X className="h-4 w-4" aria-hidden="true" />}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <VisualShare
                  targetRef={resultsRef}
                  title={`Quiz result: grade ${grade}`}
                  description={`I scored ${score}% on The Truth Quiz with ${correctAnswers} of ${questions.length} correct and a max streak of ${maxStreak}. Can you beat it?`}
                  url={absoluteSiteUrl('/quiz')}
                  stat={`${score}%`}
                  detail={`${correctAnswers} of ${questions.length} correct`}
                  sourceName={shareProvenance.sourceName}
                  sourceVintage={shareProvenance.sourceVintage}
                  sourceUrl={shareProvenance.sourceUrl}
                  contentId="quiz_results"
                  placement="quiz_results"
                  className="w-full px-6 py-3 text-base sm:w-auto"
                />
                <button
                  type="button"
                  onClick={startGame}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-[#192947]/20 bg-white px-5 py-3 font-bold hover:bg-[#ffda62]/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294cc4]"
                >
                  <RotateCcw className="h-5 w-5" aria-hidden="true" />
                  Play again
                </button>
                <Link
                  href="/discoveries"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-[#192947]/20 bg-white px-5 py-3 font-bold hover:bg-[#ffda62]/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294cc4]"
                >
                  Explore discoveries
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="twt-shell min-h-screen bg-[#fff9e8] text-[#192947]">
      <main className={`twt-container mx-auto max-w-3xl px-4 ${embeddedMode ? 'py-5' : 'py-10 md:py-16'}`}>
        <header className="mb-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-black">
              Question {currentQuestionIndex + 1} of {questions.length}
            </p>
            <div className="flex items-center gap-3 text-sm font-bold">
              {streak >= 3 && (
                <span className="inline-flex items-center gap-1 text-[#dc654e] motion-safe:animate-pulse">
                  <Zap className="h-4 w-4" aria-hidden="true" />
                  {streak} streak
                </span>
              )}
              {showTimer && gameState === 'playing' && (
                <span
                  role="timer"
                  aria-label={`${timeLeft} seconds left`}
                  className={`inline-flex items-center gap-1 ${timeLeft <= 5 ? 'text-[#a63f2d]' : 'text-[#294cc4]'}`}
                >
                  <Clock className="h-4 w-4" aria-hidden="true" />
                  {timeLeft}s
                </span>
              )}
              <span className="inline-flex items-center gap-1 text-[#246e55]">
                <Trophy className="h-4 w-4" aria-hidden="true" />
                {correctAnswers} correct
              </span>
            </div>
          </div>
          <div
            className="mt-3 h-2 overflow-hidden rounded-full bg-[#192947]/10"
            role="progressbar"
            aria-label="Quiz progress"
            aria-valuemin={1}
            aria-valuemax={questions.length}
            aria-valuenow={currentQuestionIndex + 1}
          >
            <div
              className="h-full rounded-full bg-[#294cc4] transition-[width] duration-300 motion-reduce:transition-none"
              style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
          {roundNote && <p className="mt-3 text-xs font-semibold text-[#192947]/55">{roundNote}</p>}
        </header>

        <section className="twt-panel rounded-[28px] border border-[#192947]/12 bg-white p-5 shadow-sm md:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#fff9e8] px-3 py-1 text-xs font-black uppercase tracking-[0.1em] text-[#192947]/65">
              {currentQuestion?.category}
            </span>
            <span className="rounded-full bg-[#294cc4]/8 px-3 py-1 text-xs font-bold text-[#294cc4]">
              {currentQuestion?.difficulty}
            </span>
            {currentQuestion && (
              <span className="ml-auto text-xs font-semibold text-[#192947]/45">Sourced data</span>
            )}
          </div>

          <h1 className="mt-5 text-2xl font-black leading-tight tracking-tight md:text-4xl">
            {currentQuestion?.question}
          </h1>

          <div className="mt-6 space-y-3" role="group" aria-label="Answer choices">
            {currentQuestion?.options.map((option, index) => {
              const isSelected = selectedAnswer === index
              const isCorrect = index === currentQuestion.correctAnswer
              const showResult = gameState === 'answered'

              let stateClass = 'border-[#192947]/15 bg-white text-[#192947] hover:border-[#294cc4]/50 hover:bg-[#294cc4]/5'
              if (showResult && isCorrect) {
                stateClass = 'border-[#246e55] bg-[#246e55]/8 text-[#1d5743]'
              } else if (showResult && isSelected) {
                stateClass = 'border-[#dc654e] bg-[#dc654e]/8 text-[#8e3324]'
              } else if (showResult) {
                stateClass = 'border-[#192947]/10 bg-[#192947]/3 text-[#192947]/45'
              }

              return (
                <button
                  key={`${currentQuestion.id}-${index}`}
                  type="button"
                  onClick={() => handleAnswer(index)}
                  disabled={gameState === 'answered'}
                  aria-pressed={isSelected}
                  className={`flex w-full items-center justify-between gap-4 rounded-2xl border-2 px-4 py-3.5 text-left font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294cc4] disabled:cursor-default motion-reduce:transition-none ${stateClass}`}
                >
                  <span>{option}</span>
                  {showResult && isCorrect && <Check className="h-5 w-5 shrink-0" aria-hidden="true" />}
                  {showResult && isSelected && !isCorrect && <X className="h-5 w-5 shrink-0" aria-hidden="true" />}
                </button>
              )
            })}
          </div>

          {gameState === 'answered' && (
            <div className="mt-5 rounded-2xl border border-[#294cc4]/15 bg-[#294cc4]/5 p-4" role="status">
              <p className="font-semibold leading-6">{currentQuestion?.explanation}</p>
              {currentQuestion?.funFact && (
                <p className="mt-2 text-sm leading-6 text-[#192947]/65">{currentQuestion.funFact}</p>
              )}
              {currentProvenance && (
                <div className="mt-4 border-t border-[#294cc4]/15 pt-3 text-xs leading-5 text-[#192947]/65">
                  <p>
                    <span className="font-black text-[#192947]">Source:</span>{' '}
                    {currentProvenance.sourceUrl ? (
                      <a
                        href={currentProvenance.sourceUrl}
                        target="_blank"
                        rel="nofollow noopener"
                        className="underline decoration-[#294cc4]/40 underline-offset-2 hover:text-[#294cc4]"
                      >
                        {currentProvenance.sourceName ?? 'Unknown'}
                      </a>
                    ) : (
                      currentProvenance.sourceName ?? 'Unknown'
                    )}
                  </p>
                  <p className="mt-1">
                    <span className="font-black text-[#192947]">Year:</span>{' '}
                    {currentProvenance.year ?? 'Unknown'}
                  </p>
                  <p className="mt-1">
                    <span className="font-black text-[#192947]">Coverage:</span>{' '}
                    {currentProvenance.coverage !== undefined ? `${currentProvenance.coverage}%` : 'Unknown'}
                  </p>
                  {currentProvenance.limitations.length > 0 && (
                    <div className="mt-2">
                      <p className="font-black text-[#192947]">Known limits:</p>
                      <ul className="mt-1 list-disc space-y-1 pl-5">
                        {currentProvenance.limitations.map((limitation) => (
                          <li key={limitation}>{limitation}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {gameState === 'answered' && (
            <button
              type="button"
              onClick={nextQuestion}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#294cc4] px-6 py-3.5 font-black text-white hover:bg-[#1f3ca0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294cc4] motion-reduce:transition-none"
            >
              {currentQuestionIndex + 1 >= questions.length ? 'See results' : 'Next question'}
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </button>
          )}
        </section>
      </main>
    </div>
  )
}

'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Country } from '@/types/country'
import { generateDailyQuestions, getTodayDateString, getTruthleDay, TruthleQuestion } from '@/lib/truthle/generator'
import { calculateScore, estimatePercentile, getGrade, generateShareText, TruthleScore } from '@/lib/truthle/scoring'
import { hasPlayedToday, saveAttempt, getLocalState, getStats } from '@/lib/truthle/storage'
import { AdSidebar } from '@/components/ads'
import { AD_SLOTS } from '@/lib/constants/ads'
import Image from 'next/image'

type GameState = 'loading' | 'ready' | 'playing' | 'answered' | 'finished' | 'already_played'

interface TruthleGameProps {
  countries: Country[]
}

export default function TruthleGame({ countries }: TruthleGameProps) {
  const [gameState, setGameState] = useState<GameState>('loading')
  const [questions, setQuestions] = useState<TruthleQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [results, setResults] = useState<boolean[]>([])
  const [times, setTimes] = useState<number[]>([])
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [questionStartTime, setQuestionStartTime] = useState<number>(0)
  const [score, setScore] = useState<TruthleScore | null>(null)
  const [previousAttempt, setPreviousAttempt] = useState<{ score: number; results: boolean[]; streak: number } | null>(null)
  const [streak, setStreak] = useState(0)
  const [copied, setCopied] = useState(false)

  const truthleDay = getTruthleDay()

  // Initialize game
  useEffect(() => {
    async function init() {
      // Check if already played
      const { played, attempt } = await hasPlayedToday()

      if (played && attempt) {
        setPreviousAttempt({
          score: attempt.score,
          results: attempt.results,
          streak: attempt.streak,
        })
        setStreak(attempt.streak)
        setGameState('already_played')
        return
      }

      // Generate questions
      const dailyQuestions = generateDailyQuestions(countries)
      setQuestions(dailyQuestions)

      // Get current streak for display
      const localState = getLocalState()
      setStreak(localState.streak)

      setGameState('ready')
    }

    init()
  }, [countries])

  // Start the game
  const startGame = useCallback(() => {
    setGameState('playing')
    setQuestionStartTime(Date.now())
  }, [])

  // Handle answer selection
  const handleAnswer = useCallback((answerIndex: number) => {
    if (gameState !== 'playing') return

    const timeElapsed = (Date.now() - questionStartTime) / 1000
    const currentQuestion = questions[currentIndex]
    const isCorrect = answerIndex === currentQuestion.correctAnswer

    setSelectedAnswer(answerIndex)
    setResults(prev => [...prev, isCorrect])
    setTimes(prev => [...prev, timeElapsed])
    setGameState('answered')
  }, [gameState, questionStartTime, questions, currentIndex])

  // Move to next question
  const nextQuestion = useCallback(async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1)
      setSelectedAnswer(null)
      setGameState('playing')
      setQuestionStartTime(Date.now())
    } else {
      // Game finished
      setGameState('finished')

      // Calculate score
      const localState = getLocalState()
      const newStreak = localState.lastPlayedDate
        ? (new Date(getTodayDateString()).getTime() - new Date(localState.lastPlayedDate).getTime()) / (1000 * 60 * 60 * 24) === 1
          ? localState.streak + 1
          : 1
        : 1

      const finalScore = calculateScore(
        [...results, results[results.length - 1] !== undefined ? results[results.length - 1] : false],
        [...times, times[times.length - 1] || 0],
        newStreak
      )

      // Use actual results
      const finalResults = [...results]
      const finalTimes = [...times]
      const calculatedScore = calculateScore(finalResults, finalTimes, newStreak)

      setScore(calculatedScore)
      setStreak(newStreak)

      // Save attempt
      await saveAttempt(calculatedScore.totalScore, finalResults, finalTimes)
    }
  }, [currentIndex, questions.length, results, times])

  // Share results
  const shareResults = useCallback(async () => {
    const shareText = generateShareText(
      score?.totalScore || previousAttempt?.score || 0,
      score ? results : (previousAttempt?.results || []),
      score?.streak || previousAttempt?.streak || 0,
      truthleDay
    )

    try {
      if (navigator.share) {
        await navigator.share({
          title: `Truthle #${truthleDay}`,
          text: shareText,
        })
      } else {
        await navigator.clipboard.writeText(shareText)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch (e) {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(shareText)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch {
        console.error('Failed to share:', e)
      }
    }
  }, [score, results, previousAttempt, truthleDay])

  // Calculate time until next Truthle
  const getTimeUntilNext = () => {
    const now = new Date()
    const tomorrow = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
      0, 0, 0
    ))
    const diff = tomorrow.getTime() - now.getTime()

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  const [countdown, setCountdown] = useState(getTimeUntilNext())

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(getTimeUntilNext())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Loading state
  if (gameState === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
        <p className="mt-4 text-gray-600">Loading today&apos;s Truthle...</p>
      </div>
    )
  }

  // Ready state - show start screen
  if (gameState === 'ready') {
    const stats = getStats()

    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-center px-4">
        <Image
          src="/truthle.png"
          alt="Truthle"
          width={120}
          height={120}
          className="mb-4"
        />
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Truthle</h1>
        <p className="text-gray-600 mb-1">Daily World Facts Quiz</p>
        <p className="text-sm text-gray-500 mb-6">#{truthleDay} • 10 Questions</p>

        {stats.gamesPlayed > 0 && (
          <div className="flex gap-6 mb-6 text-center">
            <div>
              <div className="text-2xl font-bold text-emerald-600">{stats.currentStreak}</div>
              <div className="text-xs text-gray-500">Streak</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{stats.bestStreak}</div>
              <div className="text-xs text-gray-500">Best</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{stats.gamesPlayed}</div>
              <div className="text-xs text-gray-500">Played</div>
            </div>
          </div>
        )}

        <button
          onClick={startGame}
          className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 px-8 rounded-lg text-lg transition-colors shadow-lg hover:shadow-xl"
        >
          Play Today&apos;s Truthle
        </button>

        <p className="text-xs text-gray-400 mt-6">
          Same questions for everyone • One attempt per day
        </p>
      </div>
    )
  }

  // Already played state
  if (gameState === 'already_played' && previousAttempt) {
    const percentile = estimatePercentile(previousAttempt.score)
    const correctCount = previousAttempt.results.filter(r => r).length
    const grade = getGrade(correctCount, 10)

    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-center px-4">
        <Image
          src="/truthle.png"
          alt="Truthle"
          width={80}
          height={80}
          className="mb-4"
        />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">You&apos;ve already played today!</h2>
        <p className="text-sm text-gray-500 mb-4">Truthle #{truthleDay}</p>

        <div className="text-6xl mb-2">{grade.emoji}</div>
        <div className="text-4xl font-bold text-gray-900 mb-1">
          {previousAttempt.score.toLocaleString()}
        </div>
        <div className="text-emerald-600 font-medium mb-4">Top {percentile}%</div>

        <div className="flex gap-1 mb-4">
          {previousAttempt.results.map((r, i) => (
            <div
              key={i}
              className={`w-8 h-8 rounded ${r ? 'bg-emerald-500' : 'bg-red-500'}`}
            />
          ))}
        </div>

        <p className="text-gray-600 mb-2">{correctCount}/10 correct</p>
        {previousAttempt.streak > 1 && (
          <p className="text-orange-500 font-medium mb-4">🔥 {previousAttempt.streak} day streak</p>
        )}

        <button
          onClick={shareResults}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors mb-4"
        >
          {copied ? '✓ Copied!' : 'Share Results'}
        </button>

        <div className="text-gray-500 text-sm">
          <p>Next Truthle in</p>
          <p className="text-2xl font-mono font-bold text-gray-700">{countdown}</p>
        </div>

        {/* Ad placement */}
        <div className="mt-6">
          <AdSidebar slotId={AD_SLOTS.truthleResults} size="square" />
        </div>
      </div>
    )
  }

  // Playing or answered state
  if (gameState === 'playing' || gameState === 'answered') {
    const currentQuestion = questions[currentIndex]

    return (
      <div className="max-w-lg mx-auto px-4">
        {/* Progress bar */}
        <div className="flex gap-1 mb-6">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`h-2 flex-1 rounded ${
                i < currentIndex
                  ? results[i]
                    ? 'bg-emerald-500'
                    : 'bg-red-500'
                  : i === currentIndex
                  ? 'bg-blue-500'
                  : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Question header */}
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm text-gray-500">
            Question {currentIndex + 1}/{questions.length}
          </span>
          <span className="text-sm px-2 py-1 bg-gray-100 rounded">
            {currentQuestion.categoryIcon} {currentQuestion.category}
          </span>
        </div>

        {/* Question */}
        <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
          {currentQuestion.question}
        </h2>

        {/* Options */}
        <div className="space-y-3 mb-6">
          {currentQuestion.options.map((option, i) => {
            let buttonClass = 'w-full py-3 px-4 rounded-lg border-2 transition-all text-left font-medium '

            if (gameState === 'answered') {
              if (i === currentQuestion.correctAnswer) {
                buttonClass += 'bg-emerald-100 border-emerald-500 text-emerald-700'
              } else if (i === selectedAnswer) {
                buttonClass += 'bg-red-100 border-red-500 text-red-700'
              } else {
                buttonClass += 'bg-gray-50 border-gray-200 text-gray-400'
              }
            } else {
              buttonClass += 'bg-white border-gray-200 hover:border-blue-400 hover:bg-blue-50 text-gray-700'
            }

            return (
              <button
                key={i}
                onClick={() => handleAnswer(i)}
                disabled={gameState === 'answered'}
                className={buttonClass}
              >
                {option}
              </button>
            )
          })}
        </div>

        {/* Explanation (when answered) */}
        {gameState === 'answered' && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-700">{currentQuestion.explanation}</p>
          </div>
        )}

        {/* Next button */}
        {gameState === 'answered' && (
          <button
            onClick={nextQuestion}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            {currentIndex < questions.length - 1 ? 'Next Question' : 'See Results'}
          </button>
        )}
      </div>
    )
  }

  // Finished state
  if (gameState === 'finished' && score) {
    const percentile = estimatePercentile(score.totalScore)
    const grade = getGrade(score.correctCount, score.totalQuestions)

    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-center px-4">
        <Image
          src="/truthle.png"
          alt="Truthle"
          width={80}
          height={80}
          className="mb-4"
        />

        <div className="text-6xl mb-2">{grade.emoji}</div>
        <h2 className="text-xl font-semibold text-gray-700 mb-1">{grade.message}</h2>
        <p className="text-sm text-gray-500 mb-4">Truthle #{truthleDay}</p>

        <div className="text-5xl font-bold text-gray-900 mb-1">
          {score.totalScore.toLocaleString()}
        </div>
        <div className="text-emerald-600 font-medium text-lg mb-4">Top {percentile}%</div>

        {/* Results grid */}
        <div className="flex gap-1 mb-4">
          {results.map((r, i) => (
            <div
              key={i}
              className={`w-8 h-8 rounded ${r ? 'bg-emerald-500' : 'bg-red-500'}`}
            />
          ))}
        </div>

        {/* Stats */}
        <div className="flex gap-6 mb-6 text-center">
          <div>
            <div className="text-xl font-bold text-gray-800">{score.correctCount}/10</div>
            <div className="text-xs text-gray-500">Correct</div>
          </div>
          <div>
            <div className="text-xl font-bold text-gray-800">{score.averageTime.toFixed(1)}s</div>
            <div className="text-xs text-gray-500">Avg Time</div>
          </div>
          {streak > 0 && (
            <div>
              <div className="text-xl font-bold text-orange-500">🔥 {streak}</div>
              <div className="text-xs text-gray-500">Streak</div>
            </div>
          )}
        </div>

        {/* Score breakdown */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-sm text-left w-full max-w-xs">
          <div className="flex justify-between mb-1">
            <span className="text-gray-600">Base score</span>
            <span className="font-medium">{score.baseScore}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span className="text-gray-600">Speed bonus</span>
            <span className="font-medium text-blue-600">+{score.speedBonus}</span>
          </div>
          {score.streakBonus > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Streak bonus</span>
              <span className="font-medium text-orange-500">+{score.streakBonus}</span>
            </div>
          )}
        </div>

        <button
          onClick={shareResults}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-8 rounded-lg transition-colors shadow-lg mb-4"
        >
          {copied ? '✓ Copied!' : 'Share Results'}
        </button>

        <div className="text-gray-500 text-sm">
          <p>Next Truthle in</p>
          <p className="text-2xl font-mono font-bold text-gray-700">{countdown}</p>
        </div>

        {/* Ad placement */}
        <div className="mt-6">
          <AdSidebar slotId={AD_SLOTS.truthleResults} size="square" />
        </div>
      </div>
    )
  }

  return null
}

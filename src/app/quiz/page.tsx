'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { Globe, Trophy, Share2, RotateCcw, ArrowRight, Check, X, Zap, Clock, Home, BarChart2 } from 'lucide-react'
import CoinBalance from '@/components/truthle/CoinBalance'
import type { Country } from '@/types/country'
import { generateQuizQuestions, calculateScore, type QuizQuestion } from '@/lib/quiz/questionGenerator'
import countriesData from '../../../data/countries.json'
import { VisualShare } from '@/components/share'

type GameState = 'start' | 'playing' | 'answered' | 'finished'

export default function QuizPage() {
  const [gameState, setGameState] = useState<GameState>('start')
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [streak, setStreak] = useState(0)
  const [maxStreak, setMaxStreak] = useState(0)
  const [streakBonus, setStreakBonus] = useState(0)
  const [timeLeft, setTimeLeft] = useState(15)
  const [showTimer, setShowTimer] = useState(true)
  const [answers, setAnswers] = useState<boolean[]>([])
  const resultsRef = useRef<HTMLDivElement>(null)

  const countries = countriesData as Country[]

  const startGame = useCallback(() => {
    const newQuestions = generateQuizQuestions(countries, 20)
    setQuestions(newQuestions)
    setCurrentQuestionIndex(0)
    setSelectedAnswer(null)
    setCorrectAnswers(0)
    setStreak(0)
    setMaxStreak(0)
    setStreakBonus(0)
    setTimeLeft(15)
    setAnswers([])
    setGameState('playing')
  }, [countries])

  // Timer effect
  useEffect(() => {
    if (gameState !== 'playing' || !showTimer) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleAnswer(-1) // Time's up, wrong answer
          return 15
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [gameState, showTimer, currentQuestionIndex])

  const handleAnswer = (answerIndex: number) => {
    if (gameState !== 'playing') return

    const currentQuestion = questions[currentQuestionIndex]
    const isCorrect = answerIndex === currentQuestion.correctAnswer

    setSelectedAnswer(answerIndex)
    setAnswers((prev) => [...prev, isCorrect])

    if (isCorrect) {
      setCorrectAnswers((prev) => prev + 1)
      const newStreak = streak + 1
      setStreak(newStreak)
      if (newStreak > maxStreak) {
        setMaxStreak(newStreak)
      }
      // Streak bonus: +2 points for each answer in a streak of 3+
      if (newStreak >= 3) {
        setStreakBonus((prev) => prev + 2)
      }
    } else {
      setStreak(0)
    }

    setGameState('answered')
  }

  const nextQuestion = () => {
    if (currentQuestionIndex + 1 >= questions.length) {
      setGameState('finished')
    } else {
      setCurrentQuestionIndex((prev) => prev + 1)
      setSelectedAnswer(null)
      setTimeLeft(15)
      setGameState('playing')
    }
  }

  const shareResults = async () => {
    const { score, grade } = calculateScore(correctAnswers, questions.length, streakBonus)
    const text = `I scored ${score}% (Grade: ${grade}) on The Truth Quiz!\n\n${correctAnswers}/${questions.length} correct answers\nMax streak: ${maxStreak}\n\nCan you beat my score?\nhttps://theworldtruth.com/quiz`

    if (navigator.share) {
      try {
        await navigator.share({ text })
      } catch {
        // User cancelled or error
        copyToClipboard(text)
      }
    } else {
      copyToClipboard(text)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Results copied to clipboard!')
  }

  const currentQuestion = questions[currentQuestionIndex]

  // Start Screen
  if (gameState === 'start') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 flex flex-col">
        {/* Header */}
        <header className="bg-white/10 backdrop-blur-sm px-4 md:px-6 py-3 md:py-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 md:gap-3">
              <Globe className="w-6 h-6 md:w-8 md:h-8 text-white" />
              <div>
                <h1 className="text-base md:text-xl font-bold text-white">The World Truth Map</h1>
              </div>
            </Link>
            <nav className="flex items-center gap-2 md:gap-4">
              <Link
                href="/"
                className="flex items-center gap-2 px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-md transition-colors"
              >
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">Map</span>
              </Link>
              <Link
                href="/charts"
                className="flex items-center gap-2 px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-md transition-colors"
              >
                <BarChart2 className="w-4 h-4" />
                <span className="hidden sm:inline">Charts</span>
              </Link>
              <CoinBalance size="sm" />
            </nav>
          </div>
        </header>

        {/* Start Content */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center text-white max-w-md">
            <div className="text-6xl mb-6">🌍</div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">The Truth Quiz</h1>
            <p className="text-xl text-white/80 mb-8">
              Test your knowledge about countries around the world!
            </p>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-8">
              <h2 className="text-lg font-semibold mb-4">How it works:</h2>
              <ul className="text-left text-white/90 space-y-2">
                <li className="flex items-center gap-2">
                  <span className="text-yellow-300">20</span> Questions about world statistics
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-yellow-300" /> 15 seconds per question
                </li>
                <li className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-300" /> Streak bonuses for consecutive correct answers
                </li>
                <li className="flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-yellow-300" /> Share your score with friends
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <button
                onClick={startGame}
                className="w-full px-8 py-4 bg-white text-purple-600 font-bold text-xl rounded-xl hover:bg-yellow-300 hover:text-purple-700 transition-all transform hover:scale-105 shadow-lg"
              >
                Start Quiz
              </button>

              <label className="flex items-center justify-center gap-2 text-sm text-white/70">
                <input
                  type="checkbox"
                  checked={showTimer}
                  onChange={(e) => setShowTimer(e.target.checked)}
                  className="rounded"
                />
                Enable timer (15s per question)
              </label>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Finished Screen
  if (gameState === 'finished') {
    const { score, grade, message } = calculateScore(correctAnswers, questions.length, streakBonus)

    const gradeColors: Record<string, string> = {
      S: 'from-yellow-400 to-orange-500',
      A: 'from-green-400 to-emerald-500',
      B: 'from-blue-400 to-cyan-500',
      C: 'from-purple-400 to-pink-500',
      D: 'from-orange-400 to-red-500',
      F: 'from-red-500 to-red-700',
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 flex flex-col">
        {/* Header */}
        <header className="bg-white/10 backdrop-blur-sm px-4 md:px-6 py-3 md:py-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 md:gap-3">
              <Globe className="w-6 h-6 md:w-8 md:h-8 text-white" />
              <div>
                <h1 className="text-base md:text-xl font-bold text-white">The Truth Quiz</h1>
              </div>
            </Link>
          </div>
        </header>

        {/* Results Content */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div ref={resultsRef} className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
            <div className="text-5xl mb-4">
              {grade === 'S' || grade === 'A' ? '🏆' : grade === 'B' || grade === 'C' ? '🎉' : '📚'}
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-2">Quiz Complete!</h2>
            <p className="text-gray-600 mb-6">{message}</p>

            {/* Grade Badge */}
            <div
              className={`inline-block px-8 py-4 rounded-xl bg-gradient-to-r ${gradeColors[grade]} text-white font-bold text-4xl mb-6 shadow-lg`}
            >
              Grade: {grade}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-100 rounded-lg p-4">
                <div className="text-3xl font-bold text-purple-600">{score}%</div>
                <div className="text-sm text-gray-500">Final Score</div>
              </div>
              <div className="bg-gray-100 rounded-lg p-4">
                <div className="text-3xl font-bold text-green-600">
                  {correctAnswers}/{questions.length}
                </div>
                <div className="text-sm text-gray-500">Correct</div>
              </div>
              <div className="bg-gray-100 rounded-lg p-4">
                <div className="text-3xl font-bold text-orange-600">{maxStreak}</div>
                <div className="text-sm text-gray-500">Max Streak</div>
              </div>
              <div className="bg-gray-100 rounded-lg p-4">
                <div className="text-3xl font-bold text-blue-600">+{streakBonus}</div>
                <div className="text-sm text-gray-500">Streak Bonus</div>
              </div>
            </div>

            {/* Answer Summary */}
            <div className="flex justify-center gap-1 mb-6 flex-wrap">
              {answers.map((isCorrect, i) => (
                <div
                  key={i}
                  className={`w-4 h-4 rounded-full ${isCorrect ? 'bg-green-500' : 'bg-red-500'}`}
                  title={`Question ${i + 1}: ${isCorrect ? 'Correct' : 'Wrong'}`}
                />
              ))}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <VisualShare
                targetRef={resultsRef}
                title={`Quiz Results - Grade ${grade}`}
                description={`I scored ${score}% (Grade: ${grade}) on The Truth Quiz! ${correctAnswers}/${questions.length} correct answers, max streak: ${maxStreak}. Can you beat my score?`}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:opacity-90 transition-all justify-center"
              />
              <button
                onClick={startGame}
                className="w-full px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-5 h-5" />
                Play Again
              </button>
              <Link
                href="/"
                className="w-full px-6 py-3 border border-gray-300 text-gray-600 font-semibold rounded-lg hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
              >
                <Home className="w-5 h-5" />
                Back to Map
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Playing/Answered Screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 flex flex-col">
      {/* Header with progress */}
      <header className="bg-white/10 backdrop-blur-sm px-4 md:px-6 py-3">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-white">
              <span className="text-sm font-medium">
                Question {currentQuestionIndex + 1}/{questions.length}
              </span>
            </div>
            <div className="flex items-center gap-4">
              {streak >= 3 && (
                <div className="flex items-center gap-1 text-yellow-300 animate-pulse">
                  <Zap className="w-4 h-4" />
                  <span className="text-sm font-bold">{streak} streak!</span>
                </div>
              )}
              {showTimer && gameState === 'playing' && (
                <div
                  className={`flex items-center gap-1 ${timeLeft <= 5 ? 'text-red-300 animate-pulse' : 'text-white'}`}
                >
                  <Clock className="w-4 h-4" />
                  <span className="font-mono font-bold">{timeLeft}s</span>
                </div>
              )}
              <div className="flex items-center gap-1 text-green-300">
                <Trophy className="w-4 h-4" />
                <span className="font-bold">{correctAnswers}</span>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>
      </header>

      {/* Question Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 max-w-2xl w-full">
          {/* Category Badge */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">{currentQuestion?.categoryIcon}</span>
            <span className="text-sm font-medium text-gray-500">{currentQuestion?.category}</span>
            <span
              className={`ml-auto px-2 py-1 text-xs font-medium rounded ${
                currentQuestion?.difficulty === 'easy'
                  ? 'bg-green-100 text-green-700'
                  : currentQuestion?.difficulty === 'medium'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700'
              }`}
            >
              {currentQuestion?.difficulty}
            </span>
          </div>

          {/* Question */}
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-6">{currentQuestion?.question}</h2>

          {/* Options */}
          <div className="space-y-3">
            {currentQuestion?.options.map((option, index) => {
              const isSelected = selectedAnswer === index
              const isCorrect = index === currentQuestion.correctAnswer
              const showResult = gameState === 'answered'

              let buttonClass = 'w-full p-4 text-left rounded-xl border-2 transition-all font-medium '

              if (showResult) {
                if (isCorrect) {
                  buttonClass += 'border-green-500 bg-green-50 text-green-700'
                } else if (isSelected && !isCorrect) {
                  buttonClass += 'border-red-500 bg-red-50 text-red-700'
                } else {
                  buttonClass += 'border-gray-200 bg-gray-50 text-gray-400'
                }
              } else {
                buttonClass += 'border-gray-200 hover:border-purple-400 hover:bg-purple-50 text-gray-700'
              }

              return (
                <button
                  key={index}
                  onClick={() => handleAnswer(index)}
                  disabled={gameState === 'answered'}
                  className={buttonClass}
                >
                  <div className="flex items-center justify-between">
                    <span>{option}</span>
                    {showResult && isCorrect && <Check className="w-5 h-5 text-green-500" />}
                    {showResult && isSelected && !isCorrect && <X className="w-5 h-5 text-red-500" />}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Explanation (after answering) */}
          {gameState === 'answered' && (
            <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <p className="text-blue-800 font-medium">{currentQuestion?.explanation}</p>
              {currentQuestion?.funFact && (
                <p className="text-blue-600 text-sm mt-2 italic">💡 {currentQuestion.funFact}</p>
              )}
            </div>
          )}

          {/* Next Button */}
          {gameState === 'answered' && (
            <button
              onClick={nextQuestion}
              className="w-full mt-6 px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2"
            >
              {currentQuestionIndex + 1 >= questions.length ? (
                <>
                  See Results <Trophy className="w-5 h-5" />
                </>
              ) : (
                <>
                  Next Question <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

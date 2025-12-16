export interface TruthleScore {
  baseScore: number      // 100 per correct answer
  speedBonus: number     // Bonus for fast answers
  streakBonus: number    // Bonus for consecutive days
  totalScore: number
  correctCount: number
  totalQuestions: number
  averageTime: number
  streak: number
}

// Calculate speed bonus for a single question
export function calculateSpeedBonus(timeSeconds: number): number {
  if (timeSeconds < 3) return 50      // Very fast
  if (timeSeconds < 5) return 40
  if (timeSeconds < 8) return 30
  if (timeSeconds < 12) return 20
  if (timeSeconds < 15) return 10
  return 0                            // Slow
}

// Calculate total score
export function calculateScore(
  results: boolean[],
  times: number[],
  streak: number
): TruthleScore {
  const correctCount = results.filter(r => r).length
  const totalQuestions = results.length
  const baseScore = correctCount * 100

  // Speed bonus only for correct answers
  let speedBonus = 0
  for (let i = 0; i < results.length; i++) {
    if (results[i] && times[i]) {
      speedBonus += calculateSpeedBonus(times[i])
    }
  }

  // Streak multiplier: 5% per day, max 50%
  const streakMultiplier = Math.min(streak * 0.05, 0.5)
  const streakBonus = Math.round((baseScore + speedBonus) * streakMultiplier)

  const totalScore = baseScore + speedBonus + streakBonus
  const averageTime = times.length > 0
    ? times.reduce((a, b) => a + b, 0) / times.length
    : 0

  return {
    baseScore,
    speedBonus,
    streakBonus,
    totalScore,
    correctCount,
    totalQuestions,
    averageTime,
    streak,
  }
}

// Estimate percentile based on score (will be refined with real data later)
export function estimatePercentile(score: number): number {
  // These thresholds will be adjusted based on real player data
  if (score >= 1400) return 1
  if (score >= 1300) return 3
  if (score >= 1200) return 5
  if (score >= 1100) return 10
  if (score >= 1000) return 15
  if (score >= 900) return 25
  if (score >= 800) return 35
  if (score >= 700) return 50
  if (score >= 600) return 65
  if (score >= 500) return 75
  if (score >= 400) return 85
  if (score >= 300) return 92
  return 98
}

// Get grade based on correct answers
export function getGrade(correctCount: number, total: number): { grade: string; emoji: string; message: string } {
  const percentage = (correctCount / total) * 100

  if (percentage === 100) return { grade: 'S', emoji: '🏆', message: 'Perfect! World Truth Master!' }
  if (percentage >= 90) return { grade: 'A', emoji: '🌟', message: 'Excellent! You know your world!' }
  if (percentage >= 80) return { grade: 'B', emoji: '✨', message: 'Great job! Almost there!' }
  if (percentage >= 70) return { grade: 'C', emoji: '👍', message: 'Good effort! Keep learning!' }
  if (percentage >= 60) return { grade: 'D', emoji: '📚', message: 'Not bad! Room to improve!' }
  return { grade: 'F', emoji: '💪', message: 'Keep trying! You\'ll get better!' }
}

// Generate shareable result text
export function generateShareText(
  score: number,
  results: boolean[],
  streak: number,
  truthleDay: number
): string {
  const percentile = estimatePercentile(score)
  const correctCount = results.filter(r => r).length

  // Generate emoji grid (2 rows of 5)
  const emojiGrid = results
    .map(r => r ? '🟩' : '🟥')
    .join('')
  const row1 = emojiGrid.slice(0, 5)
  const row2 = emojiGrid.slice(5, 10)

  const lines = [
    `Truthle #${truthleDay} 🌍`,
    '',
    `Score: ${score.toLocaleString()} ⭐ Top ${percentile}%`,
    row1,
    row2,
    '',
    `${correctCount}/10`,
    streak > 1 ? `🔥 ${streak} day streak` : '',
    '',
    'theworldtruth.com/truthle'
  ].filter(Boolean)

  return lines.join('\n')
}

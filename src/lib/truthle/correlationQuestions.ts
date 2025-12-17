/**
 * Correlation Questions for Truthle
 * Generates questions about statistical correlations between world data variables
 */

export interface Correlation {
  var1: string
  var2: string
  var1Name: string
  var2Name: string
  coefficient: number
  strength: 'very_strong' | 'strong' | 'moderate'
  sampleSize: number
  categories: string[]
  categoryNames: string[]
  crossCategory: boolean
  interestingScore: number
  direction: 'positive' | 'negative'
}

export interface CorrelationQuestion {
  id: string
  type: 'direction' | 'yes_no' | 'strongest_pair'
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
  category: string
  categoryIcon: string
  correlationData?: {
    var1Name: string
    var2Name: string
    coefficient: number
    direction: string
  }
}

// Pre-defined pairs that are NOT correlated (for yes/no questions)
const UNCORRELATED_PAIRS = [
  { var1Name: 'Penis Size', var2Name: 'Happiness Index', explanation: 'These variables show no significant statistical relationship.' },
  { var1Name: 'Beer Consumption', var2Name: 'PISA Math Score', explanation: 'These variables show no significant statistical relationship.' },
  { var1Name: 'Coffee Consumption', var2Name: 'Obesity Rate', explanation: 'These variables show no significant statistical relationship.' },
  { var1Name: 'Wine Consumption', var2Name: 'Gun Ownership', explanation: 'These variables show no significant statistical relationship.' },
  { var1Name: 'Chocolate Consumption', var2Name: 'Divorce Rate', explanation: 'These variables show no significant statistical relationship.' },
  { var1Name: 'Average Height', var2Name: 'Corruption Index', explanation: 'These variables show no significant statistical relationship.' },
  { var1Name: 'Car Ownership', var2Name: 'Fertility Rate', explanation: 'These variables show no significant statistical relationship.' },
  { var1Name: 'Internet Penetration', var2Name: 'Breast Size', explanation: 'These variables show no significant statistical relationship.' },
  { var1Name: 'Forest Coverage', var2Name: 'Dating App Usage', explanation: 'These variables show no significant statistical relationship.' },
  { var1Name: 'Tourist Arrivals', var2Name: 'Suicide Rate', explanation: 'These variables show no significant statistical relationship.' },
]

// Interesting correlation pairs for better questions
const INTERESTING_CORRELATIONS = [
  'health.penisSize',
  'health.breastSize',
  'lifestyle.happinessIndex',
  'lifestyle.coffeeConsumption',
  'lifestyle.beerConsumption',
  'sex.sexualPartners',
  'sex.divorceRate',
  'health.obesityRate',
  'economy.billionairesPerCapita',
  'education.avgIQ',
]

function shuffleWithRng<T>(array: T[], rng: () => number): T[] {
  const newArray = [...array]
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[newArray[i], newArray[j]] = [newArray[j], newArray[i]]
  }
  return newArray
}

/**
 * Generate a Direction question
 * "Are HDI and Median Age positively, negatively, or not correlated?"
 */
export function generateDirectionQuestion(
  correlations: Correlation[],
  rng: () => number,
  usedPairs: Set<string>
): CorrelationQuestion | null {
  // Filter for strong correlations
  const strongCorrelations = correlations.filter(c =>
    (c.strength === 'very_strong' || c.strength === 'strong') &&
    !usedPairs.has(`${c.var1}-${c.var2}`) &&
    c.crossCategory
  )

  if (strongCorrelations.length === 0) return null

  // Pick a random correlation
  const shuffled = shuffleWithRng(strongCorrelations, rng)
  const corr = shuffled[0]

  usedPairs.add(`${corr.var1}-${corr.var2}`)

  const options = ['Positively correlated', 'Negatively correlated', 'Not significantly correlated']
  const correctAnswer = corr.direction === 'positive' ? 0 : 1

  const directionWord = corr.direction === 'positive' ? 'positively' : 'negatively'
  const coefficientPercent = Math.round(Math.abs(corr.coefficient) * 100)

  return {
    id: `direction-${corr.var1}-${corr.var2}`,
    type: 'direction',
    question: `Are ${corr.var1Name} and ${corr.var2Name} positively, negatively, or not correlated?`,
    options,
    correctAnswer,
    explanation: `${corr.var1Name} and ${corr.var2Name} are ${directionWord} correlated (r = ${corr.coefficient.toFixed(2)}, ${coefficientPercent}% correlation strength).`,
    category: 'Correlations',
    categoryIcon: '📊',
    correlationData: {
      var1Name: corr.var1Name,
      var2Name: corr.var2Name,
      coefficient: corr.coefficient,
      direction: corr.direction,
    },
  }
}

/**
 * Generate a Yes/No question
 * "Is penis size correlated with happiness?"
 */
export function generateYesNoQuestion(
  correlations: Correlation[],
  rng: () => number,
  usedPairs: Set<string>
): CorrelationQuestion | null {
  // Decide if we show a correlated pair (yes) or uncorrelated pair (no)
  const showCorrelated = rng() > 0.4 // 60% chance of correlated

  if (showCorrelated) {
    // Find an interesting correlated pair
    const interestingCorrelations = correlations.filter(c =>
      !usedPairs.has(`${c.var1}-${c.var2}`) &&
      (INTERESTING_CORRELATIONS.includes(c.var1) || INTERESTING_CORRELATIONS.includes(c.var2)) &&
      Math.abs(c.coefficient) >= 0.5
    )

    const pool = interestingCorrelations.length > 0 ? interestingCorrelations : correlations.filter(c =>
      !usedPairs.has(`${c.var1}-${c.var2}`) &&
      Math.abs(c.coefficient) >= 0.5
    )

    if (pool.length === 0) return null

    const shuffled = shuffleWithRng(pool, rng)
    const corr = shuffled[0]

    usedPairs.add(`${corr.var1}-${corr.var2}`)

    const directionWord = corr.direction === 'positive' ? 'positively' : 'negatively'

    return {
      id: `yesno-${corr.var1}-${corr.var2}`,
      type: 'yes_no',
      question: `Is ${corr.var1Name} correlated with ${corr.var2Name}?`,
      options: ['Yes', 'No'],
      correctAnswer: 0, // Yes
      explanation: `Yes! ${corr.var1Name} and ${corr.var2Name} are ${directionWord} correlated (r = ${corr.coefficient.toFixed(2)}).`,
      category: 'Correlations',
      categoryIcon: '📊',
      correlationData: {
        var1Name: corr.var1Name,
        var2Name: corr.var2Name,
        coefficient: corr.coefficient,
        direction: corr.direction,
      },
    }
  } else {
    // Show an uncorrelated pair
    const availablePairs = UNCORRELATED_PAIRS.filter(p =>
      !usedPairs.has(`uncorr-${p.var1Name}-${p.var2Name}`)
    )

    if (availablePairs.length === 0) return null

    const shuffled = shuffleWithRng(availablePairs, rng)
    const pair = shuffled[0]

    usedPairs.add(`uncorr-${pair.var1Name}-${pair.var2Name}`)

    return {
      id: `yesno-uncorr-${pair.var1Name}-${pair.var2Name}`,
      type: 'yes_no',
      question: `Is ${pair.var1Name} correlated with ${pair.var2Name}?`,
      options: ['Yes', 'No'],
      correctAnswer: 1, // No
      explanation: `No. ${pair.explanation}`,
      category: 'Correlations',
      categoryIcon: '📊',
    }
  }
}

/**
 * Generate a Strongest Pair question
 * "Which pair has the STRONGEST correlation?"
 */
export function generateStrongestPairQuestion(
  correlations: Correlation[],
  rng: () => number,
  usedPairs: Set<string>
): CorrelationQuestion | null {
  // Get correlations of varying strengths
  const veryStrong = correlations.filter(c =>
    c.strength === 'very_strong' &&
    !usedPairs.has(`${c.var1}-${c.var2}`) &&
    c.crossCategory
  )
  const strong = correlations.filter(c =>
    c.strength === 'strong' &&
    !usedPairs.has(`${c.var1}-${c.var2}`) &&
    c.crossCategory
  )
  const moderate = correlations.filter(c =>
    c.strength === 'moderate' &&
    !usedPairs.has(`${c.var1}-${c.var2}`) &&
    c.crossCategory
  )

  if (veryStrong.length === 0 || moderate.length < 3) return null

  // Pick one very strong correlation (the correct answer)
  const shuffledStrong = shuffleWithRng(veryStrong, rng)
  const strongestCorr = shuffledStrong[0]

  // Pick 3 weaker correlations as wrong answers
  const weakerPool = [...shuffleWithRng(strong, rng), ...shuffleWithRng(moderate, rng)]
  const wrongAnswers = weakerPool.slice(0, 3)

  if (wrongAnswers.length < 3) return null

  const allOptions = [strongestCorr, ...wrongAnswers]
  const shuffledOptions = shuffleWithRng(allOptions, rng)
  const correctIndex = shuffledOptions.findIndex(c => c.var1 === strongestCorr.var1 && c.var2 === strongestCorr.var2)

  // Mark all used
  shuffledOptions.forEach(c => usedPairs.add(`${c.var1}-${c.var2}`))

  const optionLabels = shuffledOptions.map(c => `${c.var1Name} & ${c.var2Name}`)

  return {
    id: `strongest-${strongestCorr.var1}-${strongestCorr.var2}`,
    type: 'strongest_pair',
    question: 'Which pair has the STRONGEST correlation?',
    options: optionLabels,
    correctAnswer: correctIndex,
    explanation: `${strongestCorr.var1Name} and ${strongestCorr.var2Name} have the strongest correlation (r = ${strongestCorr.coefficient.toFixed(2)}).`,
    category: 'Correlations',
    categoryIcon: '📊',
    correlationData: {
      var1Name: strongestCorr.var1Name,
      var2Name: strongestCorr.var2Name,
      coefficient: strongestCorr.coefficient,
      direction: strongestCorr.direction,
    },
  }
}

/**
 * Generate multiple correlation questions for a Truthle game
 */
export function generateCorrelationQuestions(
  correlations: Correlation[],
  rng: () => number,
  count: number = 3
): CorrelationQuestion[] {
  const questions: CorrelationQuestion[] = []
  const usedPairs = new Set<string>()

  const generators = [
    generateDirectionQuestion,
    generateYesNoQuestion,
    generateStrongestPairQuestion,
  ]

  // Shuffle generators to vary which types appear
  const shuffledGenerators = shuffleWithRng(generators, rng)

  let attempts = 0
  const maxAttempts = 20

  while (questions.length < count && attempts < maxAttempts) {
    const generatorIndex = questions.length % shuffledGenerators.length
    const generator = shuffledGenerators[generatorIndex]

    const question = generator(correlations, rng, usedPairs)
    if (question) {
      questions.push(question)
    }

    attempts++
  }

  return questions
}

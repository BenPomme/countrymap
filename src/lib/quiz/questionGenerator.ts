import type { Country } from '@/types/country'
import { VARIABLES, VARIABLE_CATEGORIES } from '@/lib/constants/variables'
import { getNestedValue } from '@/lib/utils'

export interface QuizQuestion {
  id: string
  type: 'highest' | 'lowest' | 'compare' | 'guess_value' | 'true_false' | 'which_country'
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
  funFact?: string
  difficulty: 'easy' | 'medium' | 'hard'
  category: string
  categoryIcon: string
}

// Variables that make for interesting questions (excluding some that might be too sensitive or boring)
const QUIZ_VARIABLES = [
  'lifestyle.happinessIndex',
  'lifestyle.coffeeConsumption',
  'lifestyle.beerConsumption',
  'lifestyle.wineConsumption',
  'lifestyle.chocolateConsumption',
  'lifestyle.pizzaConsumption',
  'lifestyle.teaConsumption',
  'lifestyle.workHoursWeek',
  'lifestyle.internetPenetration',
  'lifestyle.videoGamePlayers',
  'lifestyle.tattooRate',
  'health.lifeExpectancy',
  'health.maleHeight',
  'health.obesityRate',
  'health.alcoholConsumption',
  'health.sleepDuration',
  'health.plasticSurgeryRate',
  'education.avgIQ',
  'education.pisaMath',
  'education.nobelPrizesPerCapita',
  'education.chessGrandmasters',
  'education.englishProficiency',
  'economy.touristArrivals',
  'economy.mcdonaldsPerCapita',
  'economy.starbucksPerCapita',
  'economy.billionairesPerCapita',
  'economy.startupUnicorns',
  'economy.evAdoption',
  'poverty.gdpPerCapita',
  'democracy.score',
  'freedom.corruptionIndex',
  'freedom.pressFreedom',
  'freedom.cryptoAdoption',
  'crime.safetyIndex',
  'crime.gunOwnership',
  'transport.carOwnership',
  'transport.bicycleUsage',
  'demographics.medianAge',
  'demographics.urbanPopulation',
  'demographics.ethnicDiversity',
  'environment.co2PerCapita',
  'environment.recyclingRate',
  'environment.forestCoverage',
  'sex.lgbtAcceptance',
  'sex.datingAppUsage',
  'health.fertilityRate',
] as const

// Fun facts templates for different variables
const FUN_FACTS: Record<string, string[]> = {
  'lifestyle.coffeeConsumption': [
    'Finland drinks more coffee per capita than any other country!',
    'The average Finn consumes about 12kg of coffee per year.',
    'Nordic countries dominate coffee consumption rankings.',
  ],
  'lifestyle.beerConsumption': [
    'Czech Republic has been the top beer drinking nation for decades.',
    'The word "beer" comes from the Latin "bibere" meaning "to drink".',
    'Germany has over 1,500 breweries.',
  ],
  'lifestyle.chocolateConsumption': [
    'Switzerland consumes the most chocolate per capita in the world.',
    'The Swiss invented milk chocolate in 1875.',
    'Belgium has over 2,000 chocolate shops.',
  ],
  'health.lifeExpectancy': [
    'Japan has one of the highest life expectancies, partly due to diet.',
    'Monaco technically has the highest life expectancy at 89+ years.',
    'Life expectancy has doubled globally since 1900.',
  ],
  'health.maleHeight': [
    'The Netherlands has the tallest average male height in the world.',
    'Average height has increased by about 10cm in the last 150 years.',
    'Genetics and nutrition both play major roles in height.',
  ],
  'education.nobelPrizesPerCapita': [
    'Luxembourg, Switzerland, and Sweden lead in Nobel Prizes per capita.',
    'The Nobel Prize has been awarded since 1901.',
    'Only 4 people have won multiple Nobel Prizes.',
  ],
  'economy.mcdonaldsPerCapita': [
    "The US has the most McDonald's restaurants in total.",
    "The Big Mac Index is used by economists to compare currencies.",
    "McDonald's serves about 69 million customers daily.",
  ],
  'crime.gunOwnership': [
    'The US has more civilian guns than people.',
    'Yemen has the second-highest gun ownership rate.',
    'Japan has one of the lowest gun ownership rates in the world.',
  ],
  'transport.bicycleUsage': [
    'The Netherlands has more bikes than people.',
    'Copenhagen has more bikes than cars in the city center.',
    'Amsterdam has over 800,000 bicycles.',
  ],
}

function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array]
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[newArray[i], newArray[j]] = [newArray[j], newArray[i]]
  }
  return newArray
}

function getRandomItems<T>(array: T[], count: number): T[] {
  const shuffled = shuffleArray(array)
  return shuffled.slice(0, count)
}

function getCountriesWithValue(countries: Country[], variablePath: string): Array<{ country: Country; value: number }> {
  return countries
    .map((country) => {
      const value = getNestedValue(country as unknown as Record<string, unknown>, variablePath) as number
      return { country, value }
    })
    .filter((item) => item.value !== null && item.value !== undefined && !isNaN(item.value))
}

function getCategoryInfo(variableId: string): { name: string; icon: string } {
  const variable = VARIABLES[variableId as keyof typeof VARIABLES]
  if (!variable) return { name: 'General', icon: '🌍' }

  const category = VARIABLE_CATEGORIES.find((cat) => cat.id === variable.category)
  return {
    name: category?.name || 'General',
    icon: category?.icon || '🌍',
  }
}

function generateHighestQuestion(
  countries: Country[],
  variablePath: string,
  usedCountries: Set<string>
): QuizQuestion | null {
  const variable = VARIABLES[variablePath as keyof typeof VARIABLES]
  if (!variable) return null

  const countriesWithValue = getCountriesWithValue(countries, variablePath)
  if (countriesWithValue.length < 4) return null

  // Sort to find highest
  const sorted = [...countriesWithValue].sort((a, b) => b.value - a.value)

  // Get the top country and 3 random others (not in top 5 to make it interesting)
  const topCountry = sorted[0]
  const otherCountries = sorted.slice(5).filter((c) => !usedCountries.has(c.country.iso3))

  if (otherCountries.length < 3) return null

  const wrongAnswers = getRandomItems(otherCountries, 3)
  const allOptions = shuffleArray([topCountry, ...wrongAnswers])
  const correctIndex = allOptions.findIndex((opt) => opt.country.iso3 === topCountry.country.iso3)

  const categoryInfo = getCategoryInfo(variablePath)
  const funFacts = FUN_FACTS[variablePath]

  usedCountries.add(topCountry.country.iso3)

  return {
    id: `highest-${variablePath}-${Date.now()}`,
    type: 'highest',
    question: `Which country has the HIGHEST ${variable.name.toLowerCase()}?`,
    options: allOptions.map((opt) => opt.country.name),
    correctAnswer: correctIndex,
    explanation: `${topCountry.country.name} has ${variable.format(topCountry.value)}, the highest in the world!`,
    funFact: funFacts ? funFacts[Math.floor(Math.random() * funFacts.length)] : undefined,
    difficulty: 'medium',
    category: categoryInfo.name,
    categoryIcon: categoryInfo.icon,
  }
}

function generateLowestQuestion(
  countries: Country[],
  variablePath: string,
  usedCountries: Set<string>
): QuizQuestion | null {
  const variable = VARIABLES[variablePath as keyof typeof VARIABLES]
  if (!variable) return null

  const countriesWithValue = getCountriesWithValue(countries, variablePath)
  if (countriesWithValue.length < 4) return null

  // Sort to find lowest
  const sorted = [...countriesWithValue].sort((a, b) => a.value - b.value)

  const lowestCountry = sorted[0]
  const otherCountries = sorted.slice(5).filter((c) => !usedCountries.has(c.country.iso3))

  if (otherCountries.length < 3) return null

  const wrongAnswers = getRandomItems(otherCountries, 3)
  const allOptions = shuffleArray([lowestCountry, ...wrongAnswers])
  const correctIndex = allOptions.findIndex((opt) => opt.country.iso3 === lowestCountry.country.iso3)

  const categoryInfo = getCategoryInfo(variablePath)

  usedCountries.add(lowestCountry.country.iso3)

  return {
    id: `lowest-${variablePath}-${Date.now()}`,
    type: 'lowest',
    question: `Which country has the LOWEST ${variable.name.toLowerCase()}?`,
    options: allOptions.map((opt) => opt.country.name),
    correctAnswer: correctIndex,
    explanation: `${lowestCountry.country.name} has ${variable.format(lowestCountry.value)}, the lowest among these countries.`,
    difficulty: 'medium',
    category: categoryInfo.name,
    categoryIcon: categoryInfo.icon,
  }
}

function generateCompareQuestion(
  countries: Country[],
  variablePath: string,
  usedCountries: Set<string>
): QuizQuestion | null {
  const variable = VARIABLES[variablePath as keyof typeof VARIABLES]
  if (!variable) return null

  const countriesWithValue = getCountriesWithValue(countries, variablePath)
    .filter((c) => !usedCountries.has(c.country.iso3))

  if (countriesWithValue.length < 2) return null

  // Get two countries with significantly different values
  const sorted = [...countriesWithValue].sort((a, b) => b.value - a.value)
  const highIndex = Math.floor(Math.random() * Math.floor(sorted.length / 3))
  const lowIndex = Math.floor(sorted.length * 2 / 3) + Math.floor(Math.random() * Math.floor(sorted.length / 3))

  const higherCountry = sorted[highIndex]
  const lowerCountry = sorted[lowIndex]

  if (!higherCountry || !lowerCountry) return null

  const options = shuffleArray([higherCountry.country.name, lowerCountry.country.name])
  const correctIndex = options.indexOf(higherCountry.country.name)

  const categoryInfo = getCategoryInfo(variablePath)

  usedCountries.add(higherCountry.country.iso3)
  usedCountries.add(lowerCountry.country.iso3)

  return {
    id: `compare-${variablePath}-${Date.now()}`,
    type: 'compare',
    question: `Which country has a HIGHER ${variable.name.toLowerCase()}?`,
    options,
    correctAnswer: correctIndex,
    explanation: `${higherCountry.country.name} (${variable.format(higherCountry.value)}) vs ${lowerCountry.country.name} (${variable.format(lowerCountry.value)})`,
    difficulty: 'easy',
    category: categoryInfo.name,
    categoryIcon: categoryInfo.icon,
  }
}

function generateTrueFalseQuestion(
  countries: Country[],
  variablePath: string,
  usedCountries: Set<string>
): QuizQuestion | null {
  const variable = VARIABLES[variablePath as keyof typeof VARIABLES]
  if (!variable) return null

  const countriesWithValue = getCountriesWithValue(countries, variablePath)
    .filter((c) => !usedCountries.has(c.country.iso3))

  if (countriesWithValue.length < 2) return null

  const sorted = [...countriesWithValue].sort((a, b) => b.value - a.value)

  // Pick two countries with clear difference
  const country1Index = Math.floor(Math.random() * Math.floor(sorted.length / 2))
  const country2Index = Math.floor(sorted.length / 2) + Math.floor(Math.random() * Math.floor(sorted.length / 2))

  const country1 = sorted[country1Index]
  const country2 = sorted[country2Index]

  if (!country1 || !country2) return null

  // Randomly decide if statement is true or false
  const statementIsTrue = Math.random() > 0.5

  let questionCountry1, questionCountry2
  if (statementIsTrue) {
    questionCountry1 = country1 // higher
    questionCountry2 = country2 // lower
  } else {
    questionCountry1 = country2 // lower
    questionCountry2 = country1 // higher
  }

  const categoryInfo = getCategoryInfo(variablePath)

  usedCountries.add(country1.country.iso3)
  usedCountries.add(country2.country.iso3)

  return {
    id: `truefalse-${variablePath}-${Date.now()}`,
    type: 'true_false',
    question: `True or False: ${questionCountry1.country.name} has a higher ${variable.name.toLowerCase()} than ${questionCountry2.country.name}`,
    options: ['True', 'False'],
    correctAnswer: statementIsTrue ? 0 : 1,
    explanation: `${country1.country.name} (${variable.format(country1.value)}) has higher ${variable.name.toLowerCase()} than ${country2.country.name} (${variable.format(country2.value)})`,
    difficulty: 'easy',
    category: categoryInfo.name,
    categoryIcon: categoryInfo.icon,
  }
}

function generateGuessValueQuestion(
  countries: Country[],
  variablePath: string,
  usedCountries: Set<string>
): QuizQuestion | null {
  const variable = VARIABLES[variablePath as keyof typeof VARIABLES]
  if (!variable || variable.type !== 'numeric') return null

  const countriesWithValue = getCountriesWithValue(countries, variablePath)
    .filter((c) => !usedCountries.has(c.country.iso3))

  if (countriesWithValue.length < 1) return null

  const randomCountry = countriesWithValue[Math.floor(Math.random() * countriesWithValue.length)]
  const actualValue = randomCountry.value

  // Generate 4 options around the actual value
  const variance = actualValue * 0.3 // 30% variance
  const options: number[] = [actualValue]

  // Add wrong answers
  options.push(actualValue + variance)
  options.push(actualValue - variance)
  options.push(actualValue + variance * 2)

  // Make sure no negative values if doesn't make sense
  const finalOptions = options.map((v) => Math.max(0, v))
  const shuffledOptions = shuffleArray(finalOptions)
  const correctIndex = shuffledOptions.findIndex((v) => Math.abs(v - actualValue) < 0.001)

  const categoryInfo = getCategoryInfo(variablePath)

  usedCountries.add(randomCountry.country.iso3)

  return {
    id: `guess-${variablePath}-${Date.now()}`,
    type: 'guess_value',
    question: `What is ${randomCountry.country.name}'s ${variable.name.toLowerCase()}?`,
    options: shuffledOptions.map((v) => variable.format(v)),
    correctAnswer: correctIndex,
    explanation: `${randomCountry.country.name}'s ${variable.name.toLowerCase()} is ${variable.format(actualValue)}`,
    difficulty: 'hard',
    category: categoryInfo.name,
    categoryIcon: categoryInfo.icon,
  }
}

export function generateQuizQuestions(countries: Country[], count: number = 20): QuizQuestion[] {
  const questions: QuizQuestion[] = []
  const usedCountries = new Set<string>()
  const usedVariables = new Set<string>()

  const questionGenerators = [
    generateHighestQuestion,
    generateLowestQuestion,
    generateCompareQuestion,
    generateTrueFalseQuestion,
    generateGuessValueQuestion,
  ]

  let attempts = 0
  const maxAttempts = count * 10

  while (questions.length < count && attempts < maxAttempts) {
    attempts++

    // Pick a random variable that hasn't been used too much
    const availableVariables = QUIZ_VARIABLES.filter((v) => {
      const timesUsed = questions.filter((q) => q.id.includes(v)).length
      return timesUsed < 2 // Each variable can be used max 2 times
    })

    if (availableVariables.length === 0) break

    const variablePath = availableVariables[Math.floor(Math.random() * availableVariables.length)]

    // Pick a random question type
    const generator = questionGenerators[Math.floor(Math.random() * questionGenerators.length)]

    const question = generator(countries, variablePath, usedCountries)

    if (question) {
      questions.push(question)
      usedVariables.add(variablePath)
    }
  }

  return shuffleArray(questions)
}

export function calculateScore(
  correctAnswers: number,
  totalQuestions: number,
  streakBonus: number
): { score: number; grade: string; message: string } {
  const baseScore = (correctAnswers / totalQuestions) * 100
  const finalScore = Math.round(baseScore + streakBonus)

  let grade: string
  let message: string

  if (finalScore >= 90) {
    grade = 'S'
    message = 'World Geography Master! You know your stuff!'
  } else if (finalScore >= 80) {
    grade = 'A'
    message = 'Excellent! You could be a diplomat!'
  } else if (finalScore >= 70) {
    grade = 'B'
    message = 'Great job! You know more than most!'
  } else if (finalScore >= 60) {
    grade = 'C'
    message = 'Not bad! Keep exploring the world!'
  } else if (finalScore >= 50) {
    grade = 'D'
    message = 'Room for improvement. Time to travel more?'
  } else {
    grade = 'F'
    message = "Geography isn't your strong suit... yet!"
  }

  return { score: finalScore, grade, message }
}

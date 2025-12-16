import type { Country } from '@/types/country'
import { VARIABLES, VARIABLE_CATEGORIES } from '@/lib/constants/variables'
import { getNestedValue } from '@/lib/utils'

export interface TruthleQuestion {
  id: string
  type: 'highest' | 'lowest' | 'compare'
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
  variablePath: string
  category: string
  categoryIcon: string
}

// Seeded random number generator (Mulberry32)
function seededRandom(seed: number): () => number {
  return function() {
    let t = seed += 0x6D2B79F5
    t = Math.imul(t ^ t >>> 15, t | 1)
    t ^= t + Math.imul(t ^ t >>> 7, t | 61)
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

// Convert date string to numeric seed
function dateToSeed(dateStr: string): number {
  let hash = 0
  for (let i = 0; i < dateStr.length; i++) {
    const char = dateStr.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash)
}

// Get today's date string (UTC)
export function getTodayDateString(): string {
  const now = new Date()
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`
}

// Calculate Truthle day number (days since launch)
export function getTruthleDay(dateStr?: string): number {
  const launchDate = new Date('2024-12-16')
  const targetDate = dateStr ? new Date(dateStr) : new Date()
  const diffTime = targetDate.getTime() - launchDate.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  return diffDays + 1
}

// Variables suitable for Truthle (numeric only, interesting)
const TRUTHLE_VARIABLES = [
  'lifestyle.happinessIndex',
  'lifestyle.coffeeConsumption',
  'lifestyle.beerConsumption',
  'lifestyle.wineConsumption',
  'lifestyle.chocolateConsumption',
  'lifestyle.workHoursWeek',
  'lifestyle.internetPenetration',
  'health.lifeExpectancy',
  'health.maleHeight',
  'health.obesityRate',
  'health.alcoholConsumption',
  'health.fertilityRate',
  'health.penisSize',
  'health.breastSize',
  'health.suicideRate',
  'health.diabetesRate',
  'sex.sexualPartners',
  'sex.ageFirstSex',
  'sex.divorceRate',
  'sex.lgbtAcceptance',
  'sex.datingAppUsage',
  'sex.consanguinityRate',
  'education.avgIQ',
  'education.pisaMath',
  'education.literacyRate',
  'education.nobelPrizesPerCapita',
  'education.englishProficiency',
  'economy.touristArrivals',
  'economy.mcdonaldsPerCapita',
  'economy.billionairesPerCapita',
  'economy.unemploymentRate',
  'economy.gdpGrowth',
  'economy.inflation',
  'economy.corporateTax',
  'economy.incomeTax',
  'economy.giniIndex',
  'economy.economicFreedom',
  'economy.bigMacIndex',
  'poverty.gdpPerCapita',
  'poverty.hdi',
  'democracy.score',
  'freedom.corruptionIndex',
  'freedom.pressFreedom',
  'crime.safetyIndex',
  'crime.homicideRate',
  'crime.gunOwnership',
  'transport.carOwnership',
  'transport.bicycleUsage',
  'demographics.medianAge',
  'demographics.urbanPopulation',
  'demographics.ethnicDiversity',
  'environment.co2PerCapita',
  'environment.recyclingRate',
  'environment.forestCoverage',
]

function shuffleWithRng<T>(array: T[], rng: () => number): T[] {
  const newArray = [...array]
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[newArray[i], newArray[j]] = [newArray[j], newArray[i]]
  }
  return newArray
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
  rng: () => number
): TruthleQuestion | null {
  const variable = VARIABLES[variablePath as keyof typeof VARIABLES]
  if (!variable) return null

  const countriesWithValue = getCountriesWithValue(countries, variablePath)
  if (countriesWithValue.length < 10) return null

  const sorted = [...countriesWithValue].sort((a, b) => b.value - a.value)
  const topCountry = sorted[0]

  // Get 3 wrong answers from outside top 10
  const otherCountries = sorted.slice(10)
  if (otherCountries.length < 3) return null

  const wrongAnswers = shuffleWithRng(otherCountries, rng).slice(0, 3)
  const allOptions = shuffleWithRng([topCountry, ...wrongAnswers], rng)
  const correctIndex = allOptions.findIndex((opt) => opt.country.iso3 === topCountry.country.iso3)

  const categoryInfo = getCategoryInfo(variablePath)

  return {
    id: `highest-${variablePath}`,
    type: 'highest',
    question: `Which country has the HIGHEST ${variable.name.toLowerCase()}?`,
    options: allOptions.map((opt) => opt.country.name),
    correctAnswer: correctIndex,
    explanation: `${topCountry.country.name} has ${variable.format(topCountry.value)}, the highest in the world!`,
    variablePath,
    category: categoryInfo.name,
    categoryIcon: categoryInfo.icon,
  }
}

function generateLowestQuestion(
  countries: Country[],
  variablePath: string,
  rng: () => number
): TruthleQuestion | null {
  const variable = VARIABLES[variablePath as keyof typeof VARIABLES]
  if (!variable) return null

  const countriesWithValue = getCountriesWithValue(countries, variablePath)
  if (countriesWithValue.length < 10) return null

  const sorted = [...countriesWithValue].sort((a, b) => a.value - b.value)
  const lowestCountry = sorted[0]

  const otherCountries = sorted.slice(10)
  if (otherCountries.length < 3) return null

  const wrongAnswers = shuffleWithRng(otherCountries, rng).slice(0, 3)
  const allOptions = shuffleWithRng([lowestCountry, ...wrongAnswers], rng)
  const correctIndex = allOptions.findIndex((opt) => opt.country.iso3 === lowestCountry.country.iso3)

  const categoryInfo = getCategoryInfo(variablePath)

  return {
    id: `lowest-${variablePath}`,
    type: 'lowest',
    question: `Which country has the LOWEST ${variable.name.toLowerCase()}?`,
    options: allOptions.map((opt) => opt.country.name),
    correctAnswer: correctIndex,
    explanation: `${lowestCountry.country.name} has ${variable.format(lowestCountry.value)}, the lowest among all countries.`,
    variablePath,
    category: categoryInfo.name,
    categoryIcon: categoryInfo.icon,
  }
}

function generateCompareQuestion(
  countries: Country[],
  variablePath: string,
  rng: () => number
): TruthleQuestion | null {
  const variable = VARIABLES[variablePath as keyof typeof VARIABLES]
  if (!variable) return null

  const countriesWithValue = getCountriesWithValue(countries, variablePath)
  if (countriesWithValue.length < 20) return null

  const sorted = [...countriesWithValue].sort((a, b) => b.value - a.value)

  // Pick one from top third and one from bottom third
  const topThird = Math.floor(sorted.length / 3)
  const bottomStart = Math.floor(sorted.length * 2 / 3)

  const highIndex = Math.floor(rng() * topThird)
  const lowIndex = bottomStart + Math.floor(rng() * (sorted.length - bottomStart))

  const higherCountry = sorted[highIndex]
  const lowerCountry = sorted[lowIndex]

  if (!higherCountry || !lowerCountry) return null

  const options = shuffleWithRng([higherCountry.country.name, lowerCountry.country.name], rng)
  const correctIndex = options.indexOf(higherCountry.country.name)

  const categoryInfo = getCategoryInfo(variablePath)

  return {
    id: `compare-${variablePath}`,
    type: 'compare',
    question: `Which country has a HIGHER ${variable.name.toLowerCase()}?`,
    options,
    correctAnswer: correctIndex,
    explanation: `${higherCountry.country.name} (${variable.format(higherCountry.value)}) vs ${lowerCountry.country.name} (${variable.format(lowerCountry.value)})`,
    variablePath,
    category: categoryInfo.name,
    categoryIcon: categoryInfo.icon,
  }
}

export function generateDailyQuestions(countries: Country[], dateStr?: string, count: number = 10): TruthleQuestion[] {
  const date = dateStr || getTodayDateString()
  const seed = dateToSeed(date)
  const rng = seededRandom(seed)

  const questions: TruthleQuestion[] = []
  const usedVariables = new Set<string>()

  // Shuffle variables for this day
  const shuffledVariables = shuffleWithRng([...TRUTHLE_VARIABLES], rng)

  const questionGenerators = [
    generateHighestQuestion,
    generateLowestQuestion,
    generateCompareQuestion,
  ]

  let varIndex = 0
  let attempts = 0
  const maxAttempts = 100

  while (questions.length < count && attempts < maxAttempts && varIndex < shuffledVariables.length) {
    attempts++

    const variablePath = shuffledVariables[varIndex]
    if (usedVariables.has(variablePath)) {
      varIndex++
      continue
    }

    // Pick question type based on RNG
    const typeIndex = Math.floor(rng() * questionGenerators.length)
    const generator = questionGenerators[typeIndex]

    const question = generator(countries, variablePath, rng)

    if (question) {
      questions.push(question)
      usedVariables.add(variablePath)
    }

    varIndex++
  }

  return questions
}

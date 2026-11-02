import type { Country } from '@/types/country'
import { VARIABLES, VARIABLE_CATEGORIES } from '@/lib/constants/variables'
import { getNestedValue } from '@/lib/utils'
import correlationsData from '../../../data/correlations.json'
import { generateCorrelationQuestions, type Correlation, type CorrelationQuestion } from './correlationQuestions'
import { getUtcDay } from './dailyLifecycle'
import { TRUTHLE_QUESTIONS_PER_DAY } from './questionCount'
import {
  defaultProvenanceResolver,
  getQuizProvenance,
  questionProvenanceFields,
  type ProvenanceResolver,
  type QuestionProvenanceFields,
} from './questionProvenance'
export { TRUTHLE_QUESTIONS_PER_DAY }

export interface TruthleQuestion extends QuestionProvenanceFields {
  id: string
  type: 'highest' | 'lowest' | 'compare' | 'direction' | 'yes_no' | 'strongest_pair'
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
  variablePath?: string
  category: string
  categoryIcon: string
  correlationData?: {
    var1Name: string
    var2Name: string
    coefficient: number
    direction: string
  }
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
  return getUtcDay()
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
  'lifestyle.metalBandsPerCapita',
  'lifestyle.vegetarianRate',
  'lifestyle.teaConsumption',
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
  'conflict.peaceIndex',
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

// Politics bias: most days lead with 3–4 politics/governance questions
const POLITICS_VARIABLES = [
  'freedom.pressFreedom',
  'freedom.corruptionIndex',
  'democracy.score',
  'conflict.peaceIndex',
  'economy.economicFreedom',
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
  rng: () => number,
  provenance: QuestionProvenanceFields
): TruthleQuestion | null {
  const variable = VARIABLES[variablePath as keyof typeof VARIABLES]
  if (!variable) return null

  const countriesWithValue = getCountriesWithValue(countries, variablePath)
  if (countriesWithValue.length < 10) return null

  const sorted = [...countriesWithValue].sort((a, b) => b.value - a.value)
  const topCountry = sorted[0]
  if (sorted[1]?.value === topCountry.value) return null

  // Get 3 wrong answers from outside top 10
  const otherCountries = sorted.slice(10)
  if (otherCountries.length < 3) return null

  const wrongAnswers = shuffleWithRng(otherCountries, rng).slice(0, 3)
  const allOptions = shuffleWithRng([topCountry, ...wrongAnswers], rng)
  const correctIndex = allOptions.findIndex((opt) => opt.country.iso3 === topCountry.country.iso3)

  const categoryInfo = getCategoryInfo(variablePath)

  return {
    id: `highest-${variablePath}-${topCountry.country.iso3}`,
    type: 'highest',
    question: `Which country has the HIGHEST ${variable.name.toLowerCase()}?`,
    options: allOptions.map((opt) => opt.country.name),
    correctAnswer: correctIndex,
    explanation: `${topCountry.country.name} has ${variable.format(topCountry.value)}, the highest in our data.`,
    variablePath,
    category: categoryInfo.name,
    categoryIcon: categoryInfo.icon,
    ...provenance,
  }
}

function generateLowestQuestion(
  countries: Country[],
  variablePath: string,
  rng: () => number,
  provenance: QuestionProvenanceFields
): TruthleQuestion | null {
  const variable = VARIABLES[variablePath as keyof typeof VARIABLES]
  if (!variable) return null

  const countriesWithValue = getCountriesWithValue(countries, variablePath)
  if (countriesWithValue.length < 10) return null

  const sorted = [...countriesWithValue].sort((a, b) => a.value - b.value)
  const lowestCountry = sorted[0]
  if (sorted[1]?.value === lowestCountry.value) return null

  const otherCountries = sorted.slice(10)
  if (otherCountries.length < 3) return null

  const wrongAnswers = shuffleWithRng(otherCountries, rng).slice(0, 3)
  const allOptions = shuffleWithRng([lowestCountry, ...wrongAnswers], rng)
  const correctIndex = allOptions.findIndex((opt) => opt.country.iso3 === lowestCountry.country.iso3)

  const categoryInfo = getCategoryInfo(variablePath)

  return {
    id: `lowest-${variablePath}-${lowestCountry.country.iso3}`,
    type: 'lowest',
    question: `Which country has the LOWEST ${variable.name.toLowerCase()}?`,
    options: allOptions.map((opt) => opt.country.name),
    correctAnswer: correctIndex,
    explanation: `${lowestCountry.country.name} has ${variable.format(lowestCountry.value)}, the lowest in our data.`,
    variablePath,
    category: categoryInfo.name,
    categoryIcon: categoryInfo.icon,
    ...provenance,
  }
}

function generateCompareQuestion(
  countries: Country[],
  variablePath: string,
  rng: () => number,
  provenance: QuestionProvenanceFields
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

  if (!higherCountry || !lowerCountry || higherCountry.value <= lowerCountry.value) return null

  const options = shuffleWithRng([higherCountry.country.name, lowerCountry.country.name], rng)
  const correctIndex = options.indexOf(higherCountry.country.name)

  const categoryInfo = getCategoryInfo(variablePath)

  return {
    id: `compare-${variablePath}-${higherCountry.country.iso3}-${lowerCountry.country.iso3}`,
    type: 'compare',
    question: `Which country has a HIGHER ${variable.name.toLowerCase()}?`,
    options,
    correctAnswer: correctIndex,
    explanation: `${higherCountry.country.name} (${variable.format(higherCountry.value)}) vs ${lowerCountry.country.name} (${variable.format(lowerCountry.value)})`,
    variablePath,
    category: categoryInfo.name,
    categoryIcon: categoryInfo.icon,
    ...provenance,
  }
}

// Convert CorrelationQuestion to TruthleQuestion format
function convertCorrelationQuestion(cq: CorrelationQuestion): TruthleQuestion {
  return {
    id: cq.id,
    type: cq.type,
    question: cq.question,
    options: cq.options,
    correctAnswer: cq.correctAnswer,
    explanation: cq.explanation,
    category: cq.category,
    categoryIcon: cq.categoryIcon,
    correlationData: cq.correlationData,
    sourceUrl: cq.sourceUrl,
    sourceName: cq.sourceName,
    year: cq.year,
    coverage: cq.coverage,
    limitations: cq.limitations,
    provenance: cq.provenance,
  }
}

type RegularQuestionType = 'highest' | 'lowest' | 'compare'

function quizEligibleVariables(resolver: ProvenanceResolver): string[] {
  const candidates = [
    ...POLITICS_VARIABLES,
    ...TRUTHLE_VARIABLES,
    ...Object.keys(VARIABLES),
  ]
  return Array.from(new Set(candidates)).filter((variablePath) => (
    variablePath in VARIABLES && getQuizProvenance(variablePath, resolver) !== null
  ))
}

function hasVerifiedProvenance(question: TruthleQuestion): boolean {
  return question.provenance.length > 0 && question.provenance.every((item) => item.quizEligible === true)
}

export function generateDailyQuestions(
  countries: Country[],
  dateStr?: string,
  count: number = TRUTHLE_QUESTIONS_PER_DAY,
  resolver: ProvenanceResolver = defaultProvenanceResolver
): TruthleQuestion[] {
  const date = dateStr || getTodayDateString()
  const seed = dateToSeed(date)
  const rng = seededRandom(seed)

  const questions: TruthleQuestion[] = []
  const usedQuestionIds = new Set<string>()

  if (count <= 0) return questions

  // Scale correlation mix to quiz length (1 for 5Q; 2–3 for longer)
  const correlationCount = count <= 5 ? 1 : 2 + Math.floor(rng() * 2)
  const correlations = (correlationsData as { correlations: Correlation[] }).correlations
  const correlationQuestions = generateCorrelationQuestions(correlations, rng, correlationCount, resolver)
    .map(convertCorrelationQuestion)
    .filter((question) => question.provenance.length >= 2 && hasVerifiedProvenance(question))

  correlationQuestions.forEach((question) => usedQuestionIds.add(question.id))

  // Determine positions for correlation questions (spread throughout the game)
  const correlationPositions = new Set<number>()
  const positionOptions = count <= 5 ? [1, 2, 3] : [2, 4, 6, 8]
  const shuffledPositions = shuffleWithRng(positionOptions, rng)
  for (let i = 0; i < correlationQuestions.length && i < shuffledPositions.length; i++) {
    correlationPositions.add(shuffledPositions[i])
  }

  // Generate regular questions
  const regularQuestionCount = count - correlationQuestions.length
  const regularQuestions: TruthleQuestion[] = []

  const verifiedVariables = quizEligibleVariables(resolver)
  if (regularQuestionCount > 0 && verifiedVariables.length === 0) return []

  const questionGenerators: Record<RegularQuestionType, typeof generateHighestQuestion> = {
    highest: generateHighestQuestion,
    lowest: generateLowestQuestion,
    compare: generateCompareQuestion,
  }
  const typeCycle = shuffleWithRng<RegularQuestionType>(['highest', 'lowest', 'compare'], rng)
  const typePlan: RegularQuestionType[] = []
  for (let i = 0; i < regularQuestionCount; i++) {
    typePlan.push(typeCycle[i % typeCycle.length])
  }

  for (const type of typePlan) {
    const generator = questionGenerators[type]
    const variableOrder = shuffleWithRng(verifiedVariables, rng)
    const maxAttempts = Math.max(24, verifiedVariables.length * 12)
    let selected: TruthleQuestion | null = null

    for (let attempt = 0; attempt < maxAttempts && !selected; attempt++) {
      const variablePath = variableOrder[attempt % variableOrder.length]
      const provenance = getQuizProvenance(variablePath, resolver)
      if (!provenance) continue

      const question = generator(
        countries,
        variablePath,
        rng,
        questionProvenanceFields([provenance])
      )
      if (!question || !hasVerifiedProvenance(question) || usedQuestionIds.has(question.id)) continue

      selected = question
    }

    if (!selected) return []

    regularQuestions.push(selected)
    usedQuestionIds.add(selected.id)
  }

  const mixedRegular = shuffleWithRng(regularQuestions, rng)
  regularQuestions.length = 0
  regularQuestions.push(...mixedRegular)

  // Interleave questions - place correlation questions at designated positions
  let regularIndex = 0
  let correlationIndex = 0

  for (let i = 0; i < count; i++) {
    if (correlationPositions.has(i) && correlationIndex < correlationQuestions.length) {
      questions.push(correlationQuestions[correlationIndex])
      correlationIndex++
    } else if (regularIndex < regularQuestions.length) {
      questions.push(regularQuestions[regularIndex])
      regularIndex++
    }
  }

  // Add any remaining questions
  while (correlationIndex < correlationQuestions.length && questions.length < count) {
    questions.push(correlationQuestions[correlationIndex])
    correlationIndex++
  }
  while (regularIndex < regularQuestions.length && questions.length < count) {
    questions.push(regularQuestions[regularIndex])
    regularIndex++
  }

  return questions.length === count ? questions : []
}

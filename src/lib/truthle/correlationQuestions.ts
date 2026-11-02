import {
  defaultProvenanceResolver,
  getQuizProvenance,
  questionProvenanceFields,
  type ProvenanceResolver,
  type QuestionProvenanceFields,
} from './questionProvenance'

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

export interface CorrelationQuestion extends QuestionProvenanceFields {
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
    sampleSize: number
  }
}

const CAUSATION_NOTE = 'Correlation does not establish causation.'

interface VerifiedCorrelation {
  correlation: Correlation
  fields: QuestionProvenanceFields
}

function shuffleWithRng<T>(array: T[], rng: () => number): T[] {
  const newArray = [...array]
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[newArray[i], newArray[j]] = [newArray[j], newArray[i]]
  }
  return newArray
}

function pairKey(correlation: Correlation): string {
  return [correlation.var1, correlation.var2].sort().join('|')
}

function isUsableCorrelation(correlation: Correlation): boolean {
  if (!correlation.var1 || !correlation.var2 || correlation.var1 === correlation.var2) return false
  if (!Number.isFinite(correlation.coefficient) || Math.abs(correlation.coefficient) > 1) return false
  if (!Number.isInteger(correlation.sampleSize) || correlation.sampleSize < 1) return false
  if (correlation.direction === 'positive' && correlation.coefficient < 0) return false
  if (correlation.direction === 'negative' && correlation.coefficient > 0) return false
  return true
}

function verifyCorrelation(
  correlation: Correlation,
  resolver: ProvenanceResolver
): VerifiedCorrelation | null {
  if (!isUsableCorrelation(correlation)) return null
  const var1 = getQuizProvenance(correlation.var1, resolver)
  const var2 = getQuizProvenance(correlation.var2, resolver)
  if (!var1 || !var2) return null

  return {
    correlation,
    fields: questionProvenanceFields([var1, var2], [CAUSATION_NOTE]),
  }
}

function verifiedPool(
  correlations: Correlation[],
  rng: () => number,
  usedPairs: Set<string>,
  resolver: ProvenanceResolver
): VerifiedCorrelation[] {
  const seen = new Set<string>()
  const pool: VerifiedCorrelation[] = []

  for (const correlation of shuffleWithRng(correlations, rng)) {
    const key = pairKey(correlation)
    if (usedPairs.has(key) || seen.has(key)) continue
    seen.add(key)
    const verified = verifyCorrelation(correlation, resolver)
    if (verified) pool.push(verified)
  }

  return pool
}

function directionExplanation(correlation: Correlation): string {
  const direction = correlation.direction === 'positive' ? 'positively' : 'negatively'
  return `${correlation.var1Name} and ${correlation.var2Name} are ${direction} correlated in our data (r = ${correlation.coefficient.toFixed(2)}, n = ${correlation.sampleSize}). ${CAUSATION_NOTE}`
}

function correlationData(correlation: Correlation): NonNullable<CorrelationQuestion['correlationData']> {
  return {
    var1Name: correlation.var1Name,
    var2Name: correlation.var2Name,
    coefficient: correlation.coefficient,
    direction: correlation.direction,
    sampleSize: correlation.sampleSize,
  }
}

export function generateDirectionQuestion(
  correlations: Correlation[],
  rng: () => number,
  usedPairs: Set<string>,
  resolver: ProvenanceResolver = defaultProvenanceResolver
): CorrelationQuestion | null {
  const pool = verifiedPool(correlations, rng, usedPairs, resolver)
    .filter(({ correlation }) => Math.abs(correlation.coefficient) >= 0.5)
  const selected = pool[0]
  if (!selected) return null

  const { correlation, fields } = selected
  usedPairs.add(pairKey(correlation))

  return {
    id: `direction-${correlation.var1}-${correlation.var2}`,
    type: 'direction',
    question: `Are ${correlation.var1Name} and ${correlation.var2Name} positively, negatively, or not correlated?`,
    options: ['Positively correlated', 'Negatively correlated', 'Not significantly correlated'],
    correctAnswer: correlation.direction === 'positive' ? 0 : 1,
    explanation: directionExplanation(correlation),
    category: 'Correlations',
    categoryIcon: 'chart',
    correlationData: correlationData(correlation),
    ...fields,
  }
}

export function generateYesNoQuestion(
  correlations: Correlation[],
  rng: () => number,
  usedPairs: Set<string>,
  resolver: ProvenanceResolver = defaultProvenanceResolver
): CorrelationQuestion | null {
  const pool = verifiedPool(correlations, rng, usedPairs, resolver)
    .filter(({ correlation }) => Math.abs(correlation.coefficient) >= 0.5)
  const selected = pool[0]
  if (!selected) return null

  const { correlation, fields } = selected
  usedPairs.add(pairKey(correlation))

  return {
    id: `yesno-${correlation.var1}-${correlation.var2}`,
    type: 'yes_no',
    question: `Is ${correlation.var1Name} correlated with ${correlation.var2Name}?`,
    options: ['Yes', 'No'],
    correctAnswer: 0,
    explanation: `Yes. ${directionExplanation(correlation)}`,
    category: 'Correlations',
    categoryIcon: 'chart',
    correlationData: correlationData(correlation),
    ...fields,
  }
}

export function generateStrongestPairQuestion(
  correlations: Correlation[],
  rng: () => number,
  usedPairs: Set<string>,
  resolver: ProvenanceResolver = defaultProvenanceResolver
): CorrelationQuestion | null {
  const pool = verifiedPool(correlations, rng, usedPairs, resolver)
    .sort((a, b) => Math.abs(b.correlation.coefficient) - Math.abs(a.correlation.coefficient))
  if (pool.length < 4) return null

  const strongest = pool[0]
  const weaker = pool
    .slice(1)
    .filter(({ correlation }) => Math.abs(correlation.coefficient) < Math.abs(strongest.correlation.coefficient))
    .slice(0, 3)
  if (weaker.length < 3) return null

  const options = shuffleWithRng([strongest, ...weaker], rng)
  const correctIndex = options.findIndex(({ correlation }) => (
    correlation.var1 === strongest.correlation.var1 &&
    correlation.var2 === strongest.correlation.var2
  ))
  if (correctIndex < 0) return null

  options.forEach(({ correlation }) => usedPairs.add(pairKey(correlation)))
  const selectedCorrelation = strongest.correlation
  const combinedFields = questionProvenanceFields(
    options.flatMap(({ fields }) => fields.provenance),
    [CAUSATION_NOTE]
  )

  return {
    id: `strongest-${selectedCorrelation.var1}-${selectedCorrelation.var2}`,
    type: 'strongest_pair',
    question: 'Which of these pairs has the strongest absolute correlation?',
    options: options.map(({ correlation }) => `${correlation.var1Name} & ${correlation.var2Name}`),
    correctAnswer: correctIndex,
    explanation: `Of these pairs, ${selectedCorrelation.var1Name} and ${selectedCorrelation.var2Name} have the largest absolute correlation in our data (r = ${selectedCorrelation.coefficient.toFixed(2)}, n = ${selectedCorrelation.sampleSize}). ${CAUSATION_NOTE}`,
    category: 'Correlations',
    categoryIcon: 'chart',
    correlationData: correlationData(selectedCorrelation),
    ...combinedFields,
  }
}

export function generateCorrelationQuestions(
  correlations: Correlation[],
  rng: () => number,
  count: number = 3,
  resolver: ProvenanceResolver = defaultProvenanceResolver
): CorrelationQuestion[] {
  const questions: CorrelationQuestion[] = []
  const usedPairs = new Set<string>()
  const generators = shuffleWithRng([
    generateDirectionQuestion,
    generateYesNoQuestion,
    generateStrongestPairQuestion,
  ], rng)

  for (const generator of generators) {
    if (questions.length >= count) break
    const question = generator(correlations, rng, usedPairs, resolver)
    if (question) questions.push(question)
  }

  return questions
}

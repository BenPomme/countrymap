export interface QuizProvenanceLike {
  quizEligible?: boolean
}

export type ProvenanceLookup = (metricId: string) => QuizProvenanceLike | null | undefined

export interface QuizQuestionIdentityLike {
  question?: unknown
  options?: unknown
  correctAnswer?: unknown
}

const QUESTION_METRIC_PATTERN = /^(?:highest|lowest|compare|truefalse|guess)-(.+)-\d+$/

function normalizeQuizText(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const normalized = value.normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim()
  return normalized || null
}

function quizQuestionMeaningKey(question: QuizQuestionIdentityLike): string | null {
  const prompt = normalizeQuizText(question.question)
  const options = Array.isArray(question.options) ? question.options : null
  const correctAnswer = question.correctAnswer

  if (
    !prompt ||
    !options ||
    typeof correctAnswer !== 'number' ||
    !Number.isInteger(correctAnswer) ||
    correctAnswer < 0 ||
    correctAnswer >= options.length
  ) {
    return null
  }

  const answer = normalizeQuizText(options[correctAnswer])
  return answer ? JSON.stringify([prompt, answer]) : null
}

export function quizMetricId(questionId: string): string | null {
  if (typeof questionId !== 'string') return null
  const match = QUESTION_METRIC_PATTERN.exec(questionId)
  return match?.[1] ?? null
}

export function selectProvenanceEligibleQuestions<T extends { id: string }>(
  questions: readonly T[],
  lookup: ProvenanceLookup,
  limit = 20,
): T[] {
  const seenIds = new Set<string>()
  const seenMeanings = new Set<string>()
  const selected: T[] = []

  for (const question of questions) {
    if (selected.length >= limit) break
    if (seenIds.has(question.id)) continue
    seenIds.add(question.id)

    const metricId = quizMetricId(question.id)
    if (!metricId) continue

    try {
      if (lookup(metricId)?.quizEligible === true) {
        const meaningKey = quizQuestionMeaningKey(question as T & QuizQuestionIdentityLike)
        if (meaningKey) {
          if (seenMeanings.has(meaningKey)) continue
          seenMeanings.add(meaningKey)
        }
        selected.push(question)
      }
    } catch {
      // Unknown provenance is not adequate provenance.
    }
  }

  return selected
}

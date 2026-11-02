export interface QuizProvenanceLike {
  quizEligible?: boolean
}

export type ProvenanceLookup = (metricId: string) => QuizProvenanceLike | null | undefined

const QUESTION_METRIC_PATTERN = /^(?:highest|lowest|compare|truefalse|guess)-(.+)-\d+$/

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
  const selected: T[] = []

  for (const question of questions) {
    if (selected.length >= limit) break
    if (seenIds.has(question.id)) continue
    seenIds.add(question.id)

    const metricId = quizMetricId(question.id)
    if (!metricId) continue

    try {
      if (lookup(metricId)?.quizEligible === true) {
        selected.push(question)
      }
    } catch {
      // Unknown provenance is not adequate provenance.
    }
  }

  return selected
}

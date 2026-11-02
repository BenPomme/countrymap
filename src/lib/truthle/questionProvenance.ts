import {
  getMetricProvenance,
  type MetricProvenance,
} from '@/lib/seo/provenance'

export type ProvenanceResolver = (variableId: string) => MetricProvenance

export interface QuestionProvenanceFields {
  sourceUrl?: string
  sourceName?: string
  year?: string
  coverage?: number
  limitations: string[]
  provenance: MetricProvenance[]
}

export const defaultProvenanceResolver: ProvenanceResolver = getMetricProvenance

function uniqueStrings(values: Array<string | undefined>): string[] {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value && value.trim()))))
}

function limitations(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return uniqueStrings(value.filter((item): item is string => typeof item === 'string'))
}

export function getQuizProvenance(
  variableId: string,
  resolver: ProvenanceResolver = defaultProvenanceResolver
): MetricProvenance | null {
  try {
    const provenance = resolver(variableId)
    if (!provenance || provenance.quizEligible !== true) return null
    return {
      ...(typeof provenance.sourceUrl === 'string' && provenance.sourceUrl.trim()
        ? { sourceUrl: provenance.sourceUrl }
        : {}),
      ...(typeof provenance.sourceName === 'string' && provenance.sourceName.trim()
        ? { sourceName: provenance.sourceName }
        : {}),
      ...(typeof provenance.year === 'string' && provenance.year.trim()
        ? { year: provenance.year }
        : {}),
      ...(typeof provenance.coverage === 'number' && Number.isFinite(provenance.coverage)
        ? { coverage: provenance.coverage }
        : {}),
      limitations: limitations(provenance.limitations),
      featuredEligible: provenance.featuredEligible === true,
      quizEligible: true,
    }
  } catch {
    return null
  }
}

export function questionProvenanceFields(
  provenance: MetricProvenance[],
  extraLimitations: string[] = []
): QuestionProvenanceFields {
  const items = provenance.map((item) => ({
    ...(typeof item.sourceUrl === 'string' && item.sourceUrl.trim() ? { sourceUrl: item.sourceUrl } : {}),
    ...(typeof item.sourceName === 'string' && item.sourceName.trim() ? { sourceName: item.sourceName } : {}),
    ...(typeof item.year === 'string' && item.year.trim() ? { year: item.year } : {}),
    ...(typeof item.coverage === 'number' && Number.isFinite(item.coverage) ? { coverage: item.coverage } : {}),
    limitations: limitations(item.limitations),
    featuredEligible: item.featuredEligible === true,
    quizEligible: item.quizEligible === true,
  }))
  const sourceUrls = uniqueStrings(items.map((item) => item.sourceUrl))
  const sourceNames = uniqueStrings(items.map((item) => item.sourceName))
  const years = uniqueStrings(items.map((item) => item.year))

  return {
    ...(sourceUrls.length === 1 ? { sourceUrl: sourceUrls[0] } : {}),
    ...(sourceNames.length > 0 ? { sourceName: sourceNames.join('; ') } : {}),
    ...(years.length > 0 ? { year: years.join('; ') } : {}),
    ...(items.length === 1 && typeof items[0].coverage === 'number'
      ? { coverage: items[0].coverage }
      : {}),
    limitations: uniqueStrings([
      ...items.flatMap((item) => item.limitations),
      ...extraLimitations,
    ]),
    provenance: items,
  }
}

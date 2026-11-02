import type { ColorVariable } from '@/types/country'

import { sourceNote } from './sourceNotes'

export type MetricAuditStatus =
  | 'verified-complete'
  | 'verified-sample'
  | 'metadata-only'
  | 'contradicted'
  | 'unknown'

export type MetricMatchStatus = 'complete' | 'sample' | 'unknown'

/**
 * Internal audit evidence for a documented metric. This stays separate from
 * the public provenance contract so that promotional eligibility cannot be
 * inferred from a source URL alone.
 */
export interface MetricProvenanceAudit {
  auditStatus: MetricAuditStatus
  matchStatus: MetricMatchStatus
  verifiedDate: string
  evidence: readonly string[]
  primaryYear: string | null
  definition: string
  denominatorVintage: string | null
  bundledValues: number
  verifiedValues: number
  coverage: number
  limitations: readonly string[]
}

/** Public provenance shape consumed by discovery, map and quiz surfaces. */
export interface MetricProvenance {
  sourceUrl?: string
  sourceName?: string
  year?: string
  coverage?: number
  limitations: string[]
  featuredEligible: boolean
  quizEligible: boolean
}

const DATASET_COUNTRY_COUNT = 164
const AUDIT_DATE = '2026-11-02'

function coveragePercentage(values: number): number {
  return Math.round((values / DATASET_COUNTRY_COUNT) * 1000) / 10
}

const BROWSE_ONLY_FALLBACK =
  'No complete primary-source reconciliation is recorded for this metric. It remains browseable but is not eligible for featured or quiz promotion.'

const IMF_LIMITATIONS = [
  'The bundled data labels this as IMF World Economic Outlook October 2026, but the edition and exact values were not independently verified on 2026-11-02.',
  'The public landing page did not expose a checkable value table and raw API requests were blocked with HTTP 403 during the audit, so primary-source parity remains unknown rather than contradicted.',
  'The denominator basis and vintage could not be checked. Do not infer parity from the source URL or displayed definition alone.',
]

/**
 * Six existing documented metrics, audited individually. Only records whose
 * bundled non-null values have all been matched to primary data are promoted.
 */
export const METRIC_PROVENANCE_AUDITS: Readonly<
  Partial<Record<ColorVariable, MetricProvenanceAudit>>
> = {
  'freedom.pressFreedom': {
    auditStatus: 'verified-complete',
    matchStatus: 'complete',
    verifiedDate: AUDIT_DATE,
    evidence: [
      'Official RSF 2026 CSV: 180 source rows, 164 bundled ISO3 values compared, 164 exact two-decimal matches, 0 mismatches.',
      'The 16 official rows outside the bundled 164-country set were identified separately and were not used as silent replacements.',
    ],
    primaryYear: '2026',
    definition: 'RSF World Press Freedom Index score on a 0 to 100 scale, higher is more press freedom.',
    denominatorVintage: 'Not applicable because this is an index score, not a rate.',
    bundledValues: 164,
    verifiedValues: 164,
    coverage: coveragePercentage(164),
    limitations: [
      'All 164 bundled values match the official 2026 CSV exactly, but 16 official rows are outside the bundled country set.',
      'The score is a composite index rather than a direct count or survey percentage.',
    ],
  },
  'lifestyle.happinessIndex': {
    auditStatus: 'verified-complete',
    matchStatus: 'complete',
    verifiedDate: AUDIT_DATE,
    evidence: [
      'Official WHR 2026 Figure 2.1 XLSX: 147 rows for the 2025 evaluation year, 140 bundled values compared, 140 exact three-decimal matches, 0 mismatches.',
      'Seven source rows are outside the bundled country set. All 24 bundled countries without a WHR value remain null.',
    ],
    primaryYear: '2023-2025',
    definition: 'Gallup World Poll life evaluation, reported as a three-year average on a 0 to 10 scale.',
    denominatorVintage: 'Not applicable because this is an average life-evaluation score, not a rate.',
    bundledValues: 140,
    verifiedValues: 140,
    coverage: coveragePercentage(140),
    limitations: [
      'WHR 2026 ranks 147 countries and territories. Only 140 are in the bundled 164-country set, so coverage is 85.4 percent.',
      'The 24 bundled countries without a WHR 2026 value remain unpublished in the map rather than being filled from another source.',
    ],
  },
  'poverty.gdpPerCapita': {
    auditStatus: 'unknown',
    matchStatus: 'unknown',
    verifiedDate: AUDIT_DATE,
    evidence: [
      'The IMF DataMapper landing URL exists, but raw October 2026 nominal GDP-per-capita data was not available during the audit.',
      'No bundled value was called false or correct because the edition and raw series could not be compared.',
    ],
    primaryYear: null,
    definition: 'Bundled label: nominal GDP per capita in current US dollars from IMF World Economic Outlook NGDPDPC.',
    denominatorVintage: 'Unknown because the raw IMF per-capita series was unavailable.',
    bundledValues: 157,
    verifiedValues: 0,
    coverage: coveragePercentage(157),
    limitations: IMF_LIMITATIONS,
  },
  'poverty.gdpPerCapitaPPP': {
    auditStatus: 'unknown',
    matchStatus: 'unknown',
    verifiedDate: AUDIT_DATE,
    evidence: [
      'The IMF DataMapper PPP landing URL exists, but raw October 2026 PPP data was not available during the audit.',
      'No parity claim is made for the bundled international-dollar values.',
    ],
    primaryYear: null,
    definition: 'Bundled label: GDP per capita in current international dollars at purchasing power parity from IMF World Economic Outlook PPPPC.',
    denominatorVintage: 'Unknown because the raw IMF PPP series was unavailable.',
    bundledValues: 157,
    verifiedValues: 0,
    coverage: coveragePercentage(157),
    limitations: [
      ...IMF_LIMITATIONS,
      'Purchasing-power parity values must not be treated as interchangeable with the nominal GDP-per-capita series.',
    ],
  },
  'economy.mcdonaldsPerCapita': {
    auditStatus: 'verified-sample',
    matchStatus: 'sample',
    verifiedDate: AUDIT_DATE,
    evidence: [
      'Coordinator-verified year-end 2025 source counts: United States 13,706; France 1,630; United Kingdom 1,507; Australia 1,092.',
      'Using the rounded bundled populations, US, France and UK reconcile after one-decimal rounding. Australia implies 42.0 per million from 1,092 restaurants and 26,000,000 people, while the bundle stores 41.4.',
      'Full market-level source parity across all 85 bundled values was not available.',
    ],
    primaryYear: '2025',
    definition: "McDonald's restaurants per million people, computed from market restaurant counts and a population denominator.",
    denominatorVintage: 'Unknown. The population vintage and exact denominator are not established for every market.',
    bundledValues: 85,
    verifiedValues: 3,
    coverage: coveragePercentage(85),
    limitations: [
      'Only four published market counts were checked, and only three reconcile with the rounded bundled population; Australia differs (42.0 implied versus 41.4 stored).',
      'Market counts consolidate territories unevenly. The United States count includes Cuba, Guam and Saipan, so territory treatment is not consistent across markets.',
      'The population denominator vintage is unknown. This metric remains browseable but is not eligible for featured or quiz promotion.',
    ],
  },
  'economy.billionairesPerCapita': {
    auditStatus: 'verified-sample',
    matchStatus: 'sample',
    verifiedDate: AUDIT_DATE,
    evidence: [
      'Coordinator-verified Forbes 11 March 2026 citizenship counts: United States 989; China 539; India 229; Germany 212; Russia 147.',
      'All five sample counts reconcile to the stored one-decimal rates using the rounded bundled populations.',
      'The article reports 3,428 billionaires across 80 countries and territories. Full source parity for all 70 bundled values was not available.',
    ],
    primaryYear: '2026',
    definition: "Billionaires per 10 million people using Forbes country-of-citizenship counts and a population denominator.",
    denominatorVintage: 'Unknown. The bundled population vintage is not established as the denominator used by Forbes.',
    bundledValues: 70,
    verifiedValues: 5,
    coverage: coveragePercentage(70),
    limitations: [
      'Only five of the 70 bundled rates have a checked source count. The full 80-market source table was not available for a complete match.',
      'Forbes assigns people by citizenship, not residence, and reports Hong Kong separately from China.',
      'The population denominator vintage is unknown. This metric remains browseable but is not eligible for featured or quiz promotion.',
    ],
  },
}

function isCompleteMatch(audit: MetricProvenanceAudit): boolean {
  return (
    audit.auditStatus === 'verified-complete' &&
    audit.matchStatus === 'complete' &&
    audit.bundledValues === audit.verifiedValues
  )
}

export function getMetricProvenance(variableId: string): MetricProvenance {
  const audit = METRIC_PROVENANCE_AUDITS[variableId as ColorVariable]
  const note = sourceNote(variableId as ColorVariable)
  const eligible = audit ? isCompleteMatch(audit) : false

  if (!audit) {
    return {
      ...(note ? { sourceUrl: note.url, sourceName: note.source } : {}),
      limitations: [BROWSE_ONLY_FALLBACK],
      featuredEligible: false,
      quizEligible: false,
    }
  }

  return {
    ...(note ? { sourceUrl: note.url, sourceName: note.source } : {}),
    ...(audit.primaryYear ? { year: audit.primaryYear } : {}),
    coverage: audit.coverage,
    limitations: [...audit.limitations],
    featuredEligible: eligible,
    quizEligible: eligible,
  }
}

export function getMetricProvenanceAudit(variableId: string): MetricProvenanceAudit | undefined {
  return METRIC_PROVENANCE_AUDITS[variableId as ColorVariable]
}

export function isFeaturedEligible(variableId: string): boolean {
  return getMetricProvenance(variableId).featuredEligible
}

export function isQuizEligible(variableId: string): boolean {
  return getMetricProvenance(variableId).quizEligible
}

export function metricCoverage(variableId: string): number | undefined {
  return getMetricProvenance(variableId).coverage
}

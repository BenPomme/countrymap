import descriptorData from './claim-descriptors.json'
import { VARIABLES } from '@/lib/constants/variables'
import { countries, getVariableById, rankCountries, type RankedRow } from '@/lib/seo/catalog'
import { countrySlug } from '@/lib/seo/slugs'
import { getMetricProvenance, metricCoverage } from '@/lib/seo/provenance'
import {
  rankFiniteValues,
  type RankedValue,
  type ValueOrder,
} from '@/lib/seo/ranking'
import type { ColorVariable } from '@/types/country'

export type ClaimDirection = 'higher' | 'lower'

export type ClaimDescriptor = {
  countryA: string
  countryB: string
  direction: ClaimDirection
  slug: string
}

export type ClaimDescriptorMap = Record<string, readonly ClaimDescriptor[]>

export type ClaimRank = {
  competitionRank: number
  rankMin: number
  rankMax: number
  tied: boolean
}

export type Claim = {
  slug: string
  variableId: ColorVariable
  variableSlug: string
  variableName: string
  countryAIso3: string
  countryBIso3: string
  direction: ClaimDirection
  a: RankedRow
  b: RankedRow
  rankA: ClaimRank
  rankB: ClaimRank
  rankOrder: ValueOrder
  total: number
  datasetTotal: number
  coveragePct: number
  text: string
  answer: boolean
}

export type ClaimSourceDetails = {
  sourceName: string
  sourceUrl?: string
  vintage: string
  coveragePct: number
  coverageLabel: string
  comparisonBasis: string
  limitations: string[]
  editorialReviewRequired: boolean
}

const CLAIM_RANK_ORDER: ValueOrder = 'highest-first'
const DESCRIPTOR_MAP = descriptorData as ClaimDescriptorMap
const DATASET_COUNTRY_COUNT = countries.length
const EDITORIAL_REVIEW_COVERAGE_THRESHOLD = 80

const SENSITIVE_VARIABLES = new Set<ColorVariable>([
  'democracy.score',
  'freedom.corruptionIndex',
  'freedom.pressFreedom',
  'health.maleHeight',
  'health.suicideRate',
  'sex.divorceRate',
  'sex.lgbtAcceptance',
  'education.avgIQ',
  'crime.homicideRate',
  'crime.gunOwnership',
  'conflict.militarySpendingGdp',
  'freedom.drugPolicyScore',
  'freedom.gamblingLegal',
  'sex.childMarriageRate',
  'sex.marriageAge',
  'sex.polyamoryRate',
  'sex.prostitutionLegal',
  'sex.teenPregnancy',
])

function isLegalStatusMetric(variableId: ColorVariable): boolean {
  return /^Whether /.test(VARIABLES[variableId]?.description ?? '')
}

function publicLimitations(limitations: readonly string[]): string[] {
  return limitations
    .map((limitation) =>
      limitation
        .replace(/\s+(?:It|This metric) remains browseable but is not eligible for featured or quiz promotion\./gi, '')
        .trim(),
    )
    .filter(Boolean)
}

function claimText(
  a: RankedRow,
  b: RankedRow,
  direction: ClaimDirection,
  variableId: ColorVariable,
  variableName: string,
): string {
  const qualifier = isLegalStatusMetric(variableId) ? 'legal-status value' : 'value'
  return `${a.country.name} has a ${direction} ${qualifier} for the ${variableName} metric than ${b.country.name}.`
}

function toClaimRank(row: RankedValue<RankedRow>): ClaimRank {
  return {
    competitionRank: row.competitionRank,
    rankMin: row.rankMin,
    rankMax: row.rankMax,
    tied: row.tied,
  }
}

export function resolveClaimDescriptors(
  descriptorMap: ClaimDescriptorMap,
  resolveVariableRows: (variableId: ColorVariable) => readonly RankedRow[],
): Claim[] {
  const claims: Claim[] = []
  const seenSlugs = new Set<string>()

  for (const [rawVariableId, descriptors] of Object.entries(descriptorMap)) {
    const variableId = rawVariableId as ColorVariable
    const entry = getVariableById(variableId)
    const config = VARIABLES[variableId]
    if (!entry || !config || config.type !== 'numeric') {
      throw new Error(`Claim descriptors reference a non-numeric or unknown variable: ${rawVariableId}`)
    }

    const ranked = rankFiniteValues(resolveVariableRows(variableId), (row) => row.value, CLAIM_RANK_ORDER)
    const byIso3 = new Map<string, RankedValue<RankedRow>>()
    for (const row of ranked) {
      if (byIso3.has(row.item.country.iso3)) {
        throw new Error(`Duplicate country identity ${row.item.country.iso3} for ${rawVariableId}`)
      }
      byIso3.set(row.item.country.iso3, row)
    }

    for (const descriptor of descriptors) {
      if (!descriptor.slug.endsWith(`-${entry.slug}`)) {
        throw new Error(`Descriptor slug does not match variable ${rawVariableId}: ${descriptor.slug}`)
      }
      if (seenSlugs.has(descriptor.slug)) {
        throw new Error(`Duplicate claim descriptor slug: ${descriptor.slug}`)
      }
      if (descriptor.direction !== 'higher' && descriptor.direction !== 'lower') {
        throw new Error(`Invalid claim direction for ${descriptor.slug}`)
      }
      if (descriptor.countryA === descriptor.countryB) {
        throw new Error(`Claim descriptor compares one country with itself: ${descriptor.slug}`)
      }

      const a = byIso3.get(descriptor.countryA)
      const b = byIso3.get(descriptor.countryB)
      if (!a || !b) {
        throw new Error(`Claim descriptor cannot resolve stored country values: ${descriptor.slug}`)
      }
      if (a.value === b.value) {
        throw new Error(`Claim descriptor resolves to tied values; refusing to drop or reinterpret ${descriptor.slug}`)
      }

      const answer = descriptor.direction === 'higher' ? a.value > b.value : a.value < b.value
      seenSlugs.add(descriptor.slug)
      claims.push({
        slug: descriptor.slug,
        variableId,
        variableSlug: entry.slug,
        variableName: config.name,
        countryAIso3: descriptor.countryA,
        countryBIso3: descriptor.countryB,
        direction: descriptor.direction,
        a: a.item,
        b: b.item,
        rankA: toClaimRank(a),
        rankB: toClaimRank(b),
        rankOrder: CLAIM_RANK_ORDER,
        total: ranked.length,
        datasetTotal: DATASET_COUNTRY_COUNT,
        coveragePct: Math.round((ranked.length / DATASET_COUNTRY_COUNT) * 1000) / 10,
        text: claimText(a.item, b.item, descriptor.direction, variableId, config.name),
        answer,
      })
    }
  }

  return claims
}

let cache: Claim[] | null = null

export function getClaimDescriptors(): ClaimDescriptorMap {
  return DESCRIPTOR_MAP
}

export function getAllClaims(): Claim[] {
  if (!cache) cache = resolveClaimDescriptors(DESCRIPTOR_MAP, rankCountries)
  return cache
}

export function getClaim(slug: string): Claim | undefined {
  return getAllClaims().find((claim) => claim.slug === slug)
}

export function claimsForVariable(id: string, limit = 3): Claim[] {
  return getAllClaims().filter((claim) => claim.variableId === id).slice(0, limit)
}

export function claimsForCountry(iso3: string, limit = 6): Claim[] {
  return getAllClaims()
    .filter((claim) => claim.a.country.iso3 === iso3 || claim.b.country.iso3 === iso3)
    .slice(0, limit)
}

export function claimSourceDetails(claim: Claim): ClaimSourceDetails {
  const provenance = getMetricProvenance(claim.variableId)
  const coveragePct = metricCoverage(claim.variableId) ?? claim.coveragePct
  return {
    sourceName: provenance.sourceName?.trim() || 'Unknown',
    sourceUrl: provenance.sourceUrl,
    vintage: provenance.year?.trim() || 'Unknown',
    coveragePct,
    coverageLabel: `${claim.total} of ${claim.datasetTotal} country records (${coveragePct.toFixed(1)}%)`,
    comparisonBasis:
      'This comparison uses stored dataset values only. It does not establish current real-world conditions, and a source link alone is not verification.',
    limitations: publicLimitations(provenance.limitations),
    editorialReviewRequired:
      SENSITIVE_VARIABLES.has(claim.variableId) ||
      coveragePct < EDITORIAL_REVIEW_COVERAGE_THRESHOLD,
  }
}

export { ranksHighFirst } from '@/lib/seo/catalog'

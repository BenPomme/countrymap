import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import test from 'node:test'

import { mergeOverlay } from '../src/lib/data/mergeOverlay'
import {
  getMetricProvenance,
  getMetricProvenanceAudit,
  isFeaturedEligible,
  isQuizEligible,
  metricCoverage,
} from '../src/lib/seo/provenance'
import { sourceNote } from '../src/lib/seo/sourceNotes'

interface TestCountry {
  iso3: string
  name: string
  population: number | null
  [key: string]: unknown
}

const DATA_DIR = resolve(process.cwd(), 'data')
const PUBLIC_SOURCES_DIR = process.env.TWT_PUBLIC_SOURCES_DIR ?? resolve(process.cwd(), '../coordination/public-sources')
const baseCountries = JSON.parse(
  readFileSync(resolve(DATA_DIR, 'countries.json'), 'utf8'),
) as TestCountry[]
const overlay = JSON.parse(readFileSync(resolve(DATA_DIR, 'stat-overlay.json'), 'utf8')) as Record<
  string,
  unknown
>
const mergedCountries = mergeOverlay(baseCountries, overlay)

const DOCUMENTED_METRICS = [
  'freedom.pressFreedom',
  'lifestyle.happinessIndex',
  'poverty.gdpPerCapita',
  'poverty.gdpPerCapitaPPP',
  'economy.mcdonaldsPerCapita',
  'economy.billionairesPerCapita',
] as const

const COMPLETE_METRICS = new Set<string>([
  'freedom.pressFreedom',
  'lifestyle.happinessIndex',
])

function nestedValue(country: TestCountry, path: string): unknown {
  let current: unknown = country
  for (const key of path.split('.')) {
    if (!current || typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[key]
  }
  return current
}

function presentValues(metricId: string): number[] {
  return mergedCountries
    .map((country) => nestedValue(country, metricId))
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value))
}

function countryByIso(iso3: string): TestCountry {
  const country = mergedCountries.find((candidate) => candidate.iso3 === iso3)
  assert.ok(country, `missing bundled country ${iso3}`)
  return country
}

function ratePer(count: number, population: number, scale: number): number {
  return Number(((count / population) * scale).toFixed(1))
}

function normalizeCountryName(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

const WHR_NAME_ALIASES: Record<string, string> = {
  'hong kong sar of china': 'hong kong',
  'lao pdr': 'laos',
  'republic of korea': 'south korea',
  'republic of moldova': 'moldova',
  'russian federation': 'russia',
  'state of palestine': 'palestine',
  'taiwan province of china': 'taiwan',
  'turkiye': 'turkey',
  'united states of america': 'united states',
  'viet nam': 'vietnam',
}

function whrNameKey(name: string): string {
  const normalized = normalizeCountryName(name)
  return WHR_NAME_ALIASES[normalized] ?? normalized
}

function decodeXmlText(value: string): string {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}

function readZipEntry(path: string, entry: string): string {
  return execFileSync('unzip', ['-p', path, entry], {
    encoding: 'utf8',
    maxBuffer: 4 * 1024 * 1024,
  })
}

function parseSharedStrings(xml: string): string[] {
  return Array.from(xml.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)).map((match) =>
    Array.from(match[1].matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g))
      .map((text) => decodeXmlText(text[1]))
      .join(''),
  )
}

function parseWhr2025Rows(path: string): Array<Record<string, string>> {
  const sharedStrings = parseSharedStrings(readZipEntry(path, 'xl/sharedStrings.xml'))
  const sheet = readZipEntry(path, 'xl/worksheets/sheet1.xml')
  const rows: Array<Record<string, string>> = []

  for (const row of Array.from(sheet.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g))) {
    const cells: Record<string, string> = {}
    for (const cell of Array.from(row[1].matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g))) {
      const column = /\br="([A-Z]+)\d+"/.exec(cell[1])?.[1]
      const type = /\bt="([^"]+)"/.exec(cell[1])?.[1]
      const value = /<v>([\s\S]*?)<\/v>/.exec(cell[2])?.[1]
      if (!column || value === undefined) continue
      cells[column] = type === 's' ? sharedStrings[Number(value)] : decodeXmlText(value)
    }
    if (Number(cells.A) === 2025) rows.push(cells)
  }

  return rows
}

test('audit counts, coverage and promotional gates match the merged dataset', () => {
  assert.equal(mergedCountries.length, 164)

  for (const metricId of DOCUMENTED_METRICS) {
    const audit = getMetricProvenanceAudit(metricId)
    const provenance = getMetricProvenance(metricId)
    const values = presentValues(metricId)

    assert.ok(audit, metricId)
    assert.equal(audit.verifiedDate, '2026-11-02', metricId)
    assert.equal(audit.bundledValues, values.length, metricId)
    assert.equal(
      audit.coverage,
      Math.round((values.length / mergedCountries.length) * 1000) / 10,
      metricId,
    )
    assert.ok(Number.isFinite(provenance.coverage), metricId)
    assert.match(provenance.sourceUrl ?? '', /^https:\/\//, metricId)
    assert.ok(provenance.sourceName, metricId)
    assert.ok(provenance.limitations.length > 0, metricId)

    const shouldPromote = COMPLETE_METRICS.has(metricId)
    assert.equal(audit.auditStatus, shouldPromote ? 'verified-complete' : audit.auditStatus)
    assert.equal(audit.matchStatus, shouldPromote ? 'complete' : audit.matchStatus)
    assert.equal(provenance.featuredEligible, shouldPromote, metricId)
    assert.equal(provenance.quizEligible, shouldPromote, metricId)
    assert.equal(isFeaturedEligible(metricId), shouldPromote, metricId)
    assert.equal(isQuizEligible(metricId), shouldPromote, metricId)
    assert.equal(metricCoverage(metricId), audit.coverage, metricId)

    if (shouldPromote) {
      assert.equal(audit.verifiedValues, audit.bundledValues, metricId)
      assert.ok(provenance.year, metricId)
    } else {
      assert.ok(audit.verifiedValues < audit.bundledValues, metricId)
    }
  }
})

test('known official RSF and WHR values are present exactly', () => {
  const rsfSamples: Record<string, number> = {
    NOR: 92.72,
    NLD: 88.92,
    EST: 88.54,
    DNK: 88.47,
    SWE: 87.61,
    FIN: 86.22,
  }
  for (const [iso3, expected] of Object.entries(rsfSamples)) {
    assert.equal(nestedValue(countryByIso(iso3), 'freedom.pressFreedom'), expected, iso3)
  }

  const whrSamples: Record<string, number> = {
    FIN: 7.764,
    DNK: 7.539,
    AUS: 6.916,
    AFG: 1.446,
  }
  for (const [iso3, expected] of Object.entries(whrSamples)) {
    assert.equal(nestedValue(countryByIso(iso3), 'lifestyle.happinessIndex'), expected, iso3)
  }
})

test('every bundled RSF value matches the official CSV when available', (t) => {
  const csvPath = resolve(PUBLIC_SOURCES_DIR, 'rsf-2026.csv')
  if (!existsSync(csvPath)) {
    t.skip('coordinator public source CSV is not present')
    return
  }

  const text = new TextDecoder('windows-1252').decode(readFileSync(csvPath))
  const [header, ...lines] = text.trim().split(/\r?\n/)
  const columns = header.split(';')
  const isoColumn = columns.indexOf('ISO')
  const scoreColumn = columns.indexOf('Score 2026')
  assert.ok(isoColumn >= 0 && scoreColumn >= 0)

  const official = new Map<string, number>()
  for (const line of lines) {
    const fields = line.split(';')
    const iso3 = fields[isoColumn]
    const score = Number(fields[scoreColumn].replace(',', '.'))
    assert.match(iso3, /^[A-Z]{3}$/)
    assert.ok(Number.isFinite(score), iso3)
    official.set(iso3, score)
  }

  assert.equal(official.size, 180)
  const mismatches: string[] = []
  for (const country of mergedCountries) {
    const bundled = nestedValue(country, 'freedom.pressFreedom')
    if (typeof bundled !== 'number') continue
    const primary = official.get(country.iso3)
    if (primary === undefined || Math.abs(bundled - primary) > 1e-9) {
      mismatches.push(`${country.iso3}: bundled ${bundled}, primary ${primary ?? 'missing'}`)
    }
  }
  assert.deepEqual(mismatches, [])
})

test('every bundled WHR value matches the official Figure 2.1 workbook when available', (t) => {
  const workbookPath = resolve(PUBLIC_SOURCES_DIR, 'whr-2026.xlsx')
  if (!existsSync(workbookPath)) {
    t.skip('coordinator public source workbook is not present')
    return
  }

  let rows: Array<Record<string, string>>
  try {
    rows = parseWhr2025Rows(workbookPath)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      t.skip('unzip is not available to read the coordinator workbook')
      return
    }
    throw error
  }

  assert.equal(rows.length, 147)
  const countriesByName = new Map(
    mergedCountries.map((country) => [whrNameKey(country.name), country]),
  )
  assert.equal(countriesByName.size, mergedCountries.length)

  const matched = new Set<string>()
  const outside: string[] = []
  const mismatches: string[] = []

  for (const row of rows) {
    const country = countriesByName.get(whrNameKey(row.C))
    if (!country) {
      outside.push(row.C)
      continue
    }
    assert.equal(matched.has(country.iso3), false, `duplicate WHR match for ${country.iso3}`)
    matched.add(country.iso3)

    const bundled = nestedValue(country, 'lifestyle.happinessIndex')
    assert.equal(typeof bundled, 'number', `${country.iso3} has no bundled WHR value`)
    const primary = Number(row.D)
    assert.ok(Number.isFinite(primary), `${row.C} has no primary WHR value`)
    if (Math.abs((bundled as number) - primary) > 1e-9) {
      mismatches.push(`${country.iso3}: bundled ${bundled}, primary ${primary}`)
    }
  }

  assert.equal(matched.size, 140)
  assert.deepEqual(mismatches, [])
  assert.deepEqual(
    outside.sort(),
    [
      'Belize',
      'Comoros',
      'Hong Kong SAR of China',
      'Kosovo',
      'Malta',
      'North Macedonia',
      'State of Palestine',
    ],
  )

  const unmatched = mergedCountries
    .filter(
      (country) =>
        typeof nestedValue(country, 'lifestyle.happinessIndex') === 'number' &&
        !matched.has(country.iso3),
    )
    .map((country) => country.iso3)
  assert.deepEqual(unmatched, [])
})

test('Forbes sample counts reconcile to stored rates at published precision', () => {
  const counts: Record<string, number> = {
    USA: 989,
    CHN: 539,
    IND: 229,
    DEU: 212,
    RUS: 147,
  }

  for (const [iso3, count] of Object.entries(counts)) {
    const country = countryByIso(iso3)
    assert.ok(country.population && country.population > 0, iso3)
    const stored = nestedValue(country, 'economy.billionairesPerCapita')
    assert.equal(stored, ratePer(count, country.population, 10_000_000), iso3)
  }

  const audit = getMetricProvenanceAudit('economy.billionairesPerCapita')
  assert.equal(audit?.auditStatus, 'verified-sample')
  assert.equal(audit?.verifiedValues, 5)
  assert.ok(audit?.limitations.some((item) => item.includes('citizenship')))
})

test("McDonald's sample exposes the unreconciled denominator and stays browse-only", () => {
  const counts: Record<string, number> = {
    USA: 13_706,
    FRA: 1_630,
    GBR: 1_507,
    AUS: 1_092,
  }

  for (const iso3 of ['USA', 'FRA', 'GBR']) {
    const country = countryByIso(iso3)
    assert.ok(country.population && country.population > 0, iso3)
    assert.equal(
      nestedValue(country, 'economy.mcdonaldsPerCapita'),
      ratePer(counts[iso3], country.population, 1_000_000),
      iso3,
    )
  }

  const australia = countryByIso('AUS')
  assert.ok(australia.population && australia.population > 0)
  assert.equal(ratePer(counts.AUS, australia.population, 1_000_000), 42)
  assert.equal(nestedValue(australia, 'economy.mcdonaldsPerCapita'), 41.4)

  const provenance = getMetricProvenance('economy.mcdonaldsPerCapita')
  assert.equal(provenance.featuredEligible, false)
  assert.equal(provenance.quizEligible, false)
  assert.ok(provenance.limitations.some((item) => item.includes('Cuba, Guam and Saipan')))
  assert.ok(provenance.limitations.some((item) => item.includes('Australia differs')))
})

test('IMF metrics and undocumented metrics fail closed without a verified year', () => {
  for (const metricId of ['poverty.gdpPerCapita', 'poverty.gdpPerCapitaPPP']) {
    const audit = getMetricProvenanceAudit(metricId)
    const provenance = getMetricProvenance(metricId)
    assert.equal(audit?.auditStatus, 'unknown', metricId)
    assert.equal(audit?.matchStatus, 'unknown', metricId)
    assert.equal(audit?.primaryYear, null, metricId)
    assert.equal(audit?.verifiedValues, 0, metricId)
    assert.equal(provenance.year, undefined, metricId)
    assert.equal(provenance.featuredEligible, false, metricId)
    assert.equal(provenance.quizEligible, false, metricId)
    assert.ok(provenance.limitations.some((item) => item.includes('HTTP 403')), metricId)
  }

  const unknown = getMetricProvenance('not.a.real.metric')
  assert.deepEqual(unknown, {
    limitations: [
      'No complete primary-source reconciliation is recorded for this metric. It remains browseable but is not eligible for featured or quiz promotion.',
    ],
    featuredEligible: false,
    quizEligible: false,
  })
  assert.equal(metricCoverage('not.a.real.metric'), undefined)
})

test('source notes preserve every documented primary URL and avoid dash characters', () => {
  for (const metricId of DOCUMENTED_METRICS) {
    const note = sourceNote(metricId)
    const provenance = getMetricProvenance(metricId)
    assert.ok(note, metricId)
    assert.equal(provenance.sourceUrl, note.url, metricId)
    assert.equal(provenance.sourceName, note.source, metricId)
    assert.doesNotMatch(
      [note.source, note.vintage, ...note.notes].join(' '),
      /[\u2013\u2014]/,
      metricId,
    )
  }
})

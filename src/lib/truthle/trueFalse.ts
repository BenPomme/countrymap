import type { Country, DataSource } from '@/types/country'
import { VARIABLES } from '@/lib/constants/variables'
import { getNestedValue } from '@/lib/utils'
import { getTodayDateString } from './generator'

export interface TrueFalseClaim {
  id: string
  claim: string
  answer: boolean
  fact: string
  source?: string
  sourceUrl?: string
  mapSlugVar: string
  variableName: string
}

// Politics-first pool (always 2 per day) + general stats pool.
const POLITICS_VARS = [
  'democracy.score',
  'freedom.pressFreedom',
  'freedom.corruptionIndex',
  'conflict.peaceIndex',
  'economy.economicFreedom',
  'poverty.hdi',
]
const STATS_VARS = [
  'health.lifeExpectancy',
  'health.obesityRate',
  'health.fertilityRate',
  'health.alcoholConsumption',
  'lifestyle.happinessIndex',
  'lifestyle.coffeeConsumption',
  'lifestyle.beerConsumption',
  'lifestyle.internetPenetration',
  'education.literacyRate',
  'education.englishProficiency',
  'economy.unemploymentRate',
  'economy.inflation',
  'economy.touristArrivals',
  'poverty.gdpPerCapita',
  'crime.homicideRate',
  'crime.gunOwnership',
  'demographics.medianAge',
  'demographics.urbanPopulation',
  'environment.co2PerCapita',
  'environment.forestCoverage',
]

// Unambiguous wording (e.g. CPI: higher = cleaner; GPI: higher = less peaceful).
const LABELS: Record<string, string> = {
  'freedom.corruptionIndex': 'anti-corruption score (Transparency International CPI, higher = cleaner)',
  'conflict.peaceIndex': 'Global Peace Index score (higher = less peaceful)',
  'freedom.pressFreedom': 'press freedom score',
  'environment.co2PerCapita': 'CO2 emissions per person',
  'poverty.gdpPerCapita': 'GDP per capita',
  'poverty.hdi': 'Human Development Index',
}

function rngFrom(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
function hash(s: string) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0
  return Math.abs(h)
}
function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)]
}

type Row = { c: Country; v: number }

function rows(countries: Country[], path: string): Row[] {
  return countries
    .map((c) => ({ c, v: getNestedValue(c as unknown as Record<string, unknown>, path) as number }))
    .filter((r) => typeof r.v === 'number' && !isNaN(r.v))
    .sort((a, b) => b.v - a.v)
}

function sourceFor(c: Country, path: string): DataSource | undefined {
  const key = path.split('.')[0] as keyof Country['sources']
  return c.sources?.[key]
}

function meta(path: string) {
  const v = VARIABLES[path as keyof typeof VARIABLES]
  return v ? { name: v.name, fmt: (n: number) => v.format(n) } : null
}

function build(countries: Country[], path: string, rng: () => number, wantTrue: boolean): TrueFalseClaim | null {
  const m = meta(path)
  if (!m) return null
  const data = rows(countries, path)
  if (data.length < 30) return null
  const name = LABELS[path] ?? m.name.toLowerCase()
  const kind = Math.floor(rng() * 3)
  const rankOf = (r: Row) => data.indexOf(r) + 1
  const n = data.length

  let claim = ''
  let fact = ''
  let subject: Row

  if (kind === 0) {
    // Compare two countries with a clear gap.
    const hi = data[Math.floor(rng() * Math.floor(n / 3))]
    const lo = data[Math.floor((2 * n) / 3) + Math.floor(rng() * (n - Math.floor((2 * n) / 3)))]
    if (!hi || !lo || hi.v === lo.v) return null
    const [a, b] = wantTrue ? [hi, lo] : [lo, hi]
    claim = `${a.c.name} has a higher ${name} than ${b.c.name}.`
    fact = `${hi.c.name}: ${m.fmt(hi.v)} vs ${lo.c.name}: ${m.fmt(lo.v)}.`
    subject = hi
  } else if (kind === 1) {
    // Top 10 membership.
    const r = wantTrue ? data[Math.floor(rng() * 10)] : data[Math.floor(n / 2) + Math.floor(rng() * (n - Math.floor(n / 2)))]
    claim = `${r.c.name} ranks in the world's top 10 for ${name}.`
    fact = `${r.c.name} ranks #${rankOf(r)} of ${n} (${m.fmt(r.v)}). #1 is ${data[0].c.name} (${m.fmt(data[0].v)}).`
    subject = r
  } else {
    // Who is #1 — false swaps in a country ranked #2–#6.
    const top = data[0]
    if (data[1].v === top.v) return null
    const imposter = data[1 + Math.floor(rng() * 5)]
    if (imposter.v === top.v) return null
    const shown = wantTrue ? top : imposter
    claim = `${shown.c.name} has the highest ${name} of any country in our data.`
    fact = wantTrue
      ? `Yes — ${top.c.name} leads with ${m.fmt(top.v)}.`
      : `${top.c.name} is #1 (${m.fmt(top.v)}); ${imposter.c.name} is #${rankOf(imposter)} (${m.fmt(imposter.v)}).`
    subject = top
  }

  const src = sourceFor(subject.c, path)
  return {
    id: `${path}-${kind}`,
    claim,
    answer: wantTrue,
    fact,
    source: src ? `${src.source}${src.year ? ` (${src.year})` : ''}` : undefined,
    sourceUrl: src?.url,
    mapSlugVar: path,
    variableName: m.name,
  }
}

export function generateTrueFalseClaims(countries: Country[], date = getTodayDateString()): TrueFalseClaim[] {
  const rng = rngFrom(hash(`tf-world-${date}`))
  // 2 or 3 true answers, shuffled.
  const truths = [true, true, false, false, rng() < 0.5]
  for (let i = truths.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[truths[i], truths[j]] = [truths[j], truths[i]]
  }
  const out: TrueFalseClaim[] = []
  const used = new Set<string>()
  let guard = 0
  while (out.length < 5 && guard++ < 200) {
    const pool = out.length < 2 ? POLITICS_VARS : STATS_VARS
    const path = pick(pool, rng)
    if (used.has(path)) continue
    const c = build(countries, path, rng, truths[out.length])
    if (!c) continue
    used.add(path)
    out.push(c)
  }
  // Interleave so politics isn't always first
  return [out[0], out[2], out[1], out[3], out[4]].filter(Boolean)
}

// ---- local stats ----
const KEY = 'tf_world_v1'
export interface TFState {
  lastDate?: string
  lastResults?: boolean[]
  streak: number
  maxStreak: number
  played: number
  wins: number // 5/5 runs
}
export function loadTF(): TFState {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { streak: 0, maxStreak: 0, played: 0, wins: 0 }
}
export function recordTF(date: string, results: boolean[], isExtra: boolean): TFState {
  const s = loadTF()
  if (!isExtra && s.lastDate !== date) {
    const y = new Date(date + 'T00:00:00Z')
    y.setUTCDate(y.getUTCDate() - 1)
    const yStr = y.toISOString().slice(0, 10)
    s.streak = s.lastDate === yStr ? s.streak + 1 : 1
    s.maxStreak = Math.max(s.maxStreak, s.streak)
    s.played += 1
    if (results.every(Boolean)) s.wins += 1
    s.lastDate = date
    s.lastResults = results
  }
  try { localStorage.setItem(KEY, JSON.stringify(s)) } catch {}
  return s
}

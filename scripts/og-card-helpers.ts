import { buildMainFact, type MainFact } from '../src/components/map/mapFacts'
import { ranksHighFirst, type RankedRow } from '../src/lib/seo/catalog'
import type { MetricProvenance } from '../src/lib/seo/provenance'
import type { VariableConfig } from '../src/types/country'

export const OG_CARD_WIDTH = 1200
export const OG_CARD_HEIGHT = 630

export const MAGAZINE_COLORS = {
  paper: '#fff9e8',
  ink: '#192947',
  blue: '#294cc4',
  yellow: '#ffda62',
  coral: '#dc654e',
  green: '#246e55',
  white: '#ffffff',
  rule: '#d8d2bf',
  noData: '#d9dee7',
} as const

export const NUMERIC_BLUE_GRADIENT = ['#e8eeff', '#91a7e8', '#294cc4'] as const

export const CATEGORY_COLORS: Readonly<Record<string, string>> = {
  Christianity: '#294cc4',
  Islam: '#246e55',
  Hinduism: '#dc654e',
  Buddhism: '#b45309',
  Judaism: '#7c3aed',
  'Folk/Traditional': '#be185d',
  Other: '#0e7490',
  'None/Unaffiliated': '#64748b',
  Unknown: '#9aa3b2',
}

const CATEGORY_FALLBACKS = [
  '#a21caf',
  '#0f766e',
  '#c2410c',
  '#4338ca',
  '#4d7c0f',
  '#9f1239',
] as const

export interface MapCardCopyInput {
  config: VariableConfig
  ranked: RankedRow[]
  totalCountryCount: number
  provenance: MetricProvenance
  longform?: {
    title?: string
    ogTitle?: string
  } | null
}

export interface MapCardCopy {
  fact: MainFact
  higher: boolean
  question: string
  title: string
  ogTitle: string
  description: string
  keywords: string[]
  source: string
  vintage: string
  sourceCaption: string
  vintageCaption: string
}

export interface GameOgCopy {
  kicker: string
  titleLines: readonly string[]
  subtitleLines: readonly string[]
  cta: string
  url: string
}

export const TRUTHLE_OG_COPY: GameOgCopy = {
  kicker: 'THE WORLD TRUTH / DAILY QUIZ',
  titleLines: ['Truthle'],
  subtitleLines: ['A short daily set of questions', 'about how the world works.'],
  cta: 'Play Truthle',
  url: 'theworldtruth.com/truthle',
}

export const TRUE_FALSE_OG_COPY: GameOgCopy = {
  kicker: 'THE WORLD TRUTH / DAILY QUIZ',
  titleLines: ['True or False:', 'World'],
  subtitleLines: ['Read a few claims about the world.', 'Decide what holds up.'],
  cta: 'Play True or False',
  url: 'theworldtruth.com/true-false',
}

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export function wrapText(value: string, maxCharacters: number): string[] {
  const words = value.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean)
  if (words.length === 0) return ['']

  const lines: string[] = []
  let current = words[0]
  for (const word of words.slice(1)) {
    if (`${current} ${word}`.length <= maxCharacters) {
      current = `${current} ${word}`
    } else {
      lines.push(current)
      current = word
    }
  }
  lines.push(current)
  return lines
}

export function buildCategoryColorMap(categories: readonly string[]): Record<string, string> {
  const all = Array.from(new Set([...categories, 'Unknown']))
  const used = new Set<string>()
  const colors: Record<string, string> = {}

  for (const category of all) {
    const preferred = CATEGORY_COLORS[category]
    if (preferred && !used.has(preferred)) {
      colors[category] = preferred
      used.add(preferred)
      continue
    }

    const fallback = CATEGORY_FALLBACKS.find((color) => !used.has(color))
    colors[category] = fallback || CATEGORY_COLORS.Unknown
    used.add(colors[category])
  }

  return colors
}

export function mapOgAssetPath(slug: string): string {
  return `/og/map/${slug}.png`
}

function lowerMetricName(name: string): string {
  return name.toLowerCase().replace(/mcdonald's/g, "McDonald's")
}

function mapQuestion(fact: MainFact, config: VariableConfig, higher: boolean): string {
  const metricName = lowerMetricName(config.name)

  if (config.type === 'categorical') {
    return fact.empty
      ? `Which categories are reported for ${metricName}?`
      : `Which category is most commonly reported for ${metricName}?`
  }

  if (fact.empty) {
    return `Which countries report ${metricName}?`
  }

  return `Which country has the ${higher ? 'highest' : 'lowest'} ${metricName}?`
}

export function buildMapCardCopy({
  config,
  ranked,
  totalCountryCount,
  provenance,
  longform,
}: MapCardCopyInput): MapCardCopy {
  const higher = ranksHighFirst(config)
  const fact = buildMainFact(config, ranked, higher, totalCountryCount)
  const question = mapQuestion(fact, config, higher)
  const source = provenance.sourceName?.trim() || 'Unknown'
  const vintage = provenance.year?.trim() || 'Unknown'
  const sourceCaption = `Source: ${source}`
  const vintageCaption = `Vintage: ${vintage}`
  const description = `${fact.detail} ${sourceCaption}. ${vintageCaption}.`
  const metricName = lowerMetricName(config.name)
  const dataQuestion =
    config.type === 'categorical'
      ? `most commonly reported ${metricName} category`
      : `which country has the ${higher ? 'highest' : 'lowest'} ${metricName}`

  return {
    fact,
    higher,
    question,
    title: longform?.title ?? `${question} ${config.name} by Country`,
    ogTitle: longform?.ogTitle ?? question,
    description,
    keywords: [
      `${config.name} by country`,
      dataQuestion,
      `${config.name} map`,
      `${config.name} ranking`,
      'world statistics',
    ],
    source,
    vintage,
    sourceCaption,
    vintageCaption,
  }
}

export function buildGameOgSvg(copy: GameOgCopy): string {
  const title = copy.titleLines
    .map(
      (line, index) =>
        `<tspan x="76" dy="${index === 0 ? 0 : 78}">${escapeXml(line)}</tspan>`
    )
    .join('')
  const subtitle = copy.subtitleLines
    .map(
      (line, index) =>
        `<tspan x="80" dy="${index === 0 ? 0 : 42}">${escapeXml(line)}</tspan>`
    )
    .join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${OG_CARD_WIDTH}" height="${OG_CARD_HEIGHT}" viewBox="0 0 ${OG_CARD_WIDTH} ${OG_CARD_HEIGHT}">
  <rect width="${OG_CARD_WIDTH}" height="${OG_CARD_HEIGHT}" fill="${MAGAZINE_COLORS.paper}"/>
  <rect width="18" height="${OG_CARD_HEIGHT}" fill="${MAGAZINE_COLORS.blue}"/>
  <circle cx="1040" cy="104" r="176" fill="${MAGAZINE_COLORS.yellow}"/>
  <circle cx="1102" cy="430" r="114" fill="${MAGAZINE_COLORS.blue}" opacity="0.12"/>
  <text x="76" y="72" fill="${MAGAZINE_COLORS.blue}" font-family="Source Sans 3, sans-serif" font-size="18" font-weight="700" letter-spacing="3">${escapeXml(copy.kicker)}</text>
  <text x="76" y="190" fill="${MAGAZINE_COLORS.ink}" font-family="Bricolage Grotesque, sans-serif" font-size="82" font-weight="800">${title}</text>
  <text x="80" y="304" fill="${MAGAZINE_COLORS.ink}" font-family="Source Sans 3, sans-serif" font-size="30" font-weight="600">${subtitle}</text>
  <rect x="80" y="406" width="338" height="68" rx="10" fill="${MAGAZINE_COLORS.blue}"/>
  <text x="249" y="450" text-anchor="middle" fill="${MAGAZINE_COLORS.white}" font-family="Source Sans 3, sans-serif" font-size="24" font-weight="700">${escapeXml(copy.cta)}</text>
  <rect x="854" y="194" width="268" height="322" rx="22" fill="${MAGAZINE_COLORS.yellow}"/>
  <rect x="838" y="178" width="268" height="322" rx="22" fill="${MAGAZINE_COLORS.white}" stroke="${MAGAZINE_COLORS.ink}" stroke-width="4"/>
  <text x="972" y="334" text-anchor="middle" fill="${MAGAZINE_COLORS.blue}" font-family="Bricolage Grotesque, sans-serif" font-size="164" font-weight="800">?</text>
  <circle cx="894" cy="230" r="10" fill="${MAGAZINE_COLORS.coral}"/>
  <circle cx="1058" cy="448" r="10" fill="${MAGAZINE_COLORS.green}"/>
  <line x1="76" y1="548" x2="1124" y2="548" stroke="${MAGAZINE_COLORS.ink}" stroke-width="3"/>
  <text x="76" y="590" fill="${MAGAZINE_COLORS.ink}" font-family="Source Sans 3, sans-serif" font-size="21" font-weight="700">${escapeXml(copy.url)}</text>
  <text x="1124" y="590" text-anchor="end" fill="${MAGAZINE_COLORS.ink}" font-family="Source Sans 3, sans-serif" font-size="18" font-weight="600">THE WORLD TRUTH</text>
</svg>`
}

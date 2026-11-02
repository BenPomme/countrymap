/**
 * Build 1200x630 choropleth OG images for every statistic route.
 * Run: npx tsx scripts/generate-og-maps.ts
 */
import * as fs from 'fs'
import * as path from 'path'
import { feature } from 'topojson-client'
import { geoMercator, geoPath } from 'd3-geo'
import { scaleLinear } from 'd3-scale'
import { Resvg } from '@resvg/resvg-js'
import { numericToIso3 } from '../src/lib/maps/iso3'
import { VARIABLES } from '../src/lib/constants/variables'
import '../src/lib/constants/extraVariables'
import {
  rankCountries,
  variableEntries,
  type VariableEntry,
} from '../src/lib/seo/catalog'
import { getMetricProvenance } from '../src/lib/seo/provenance'
import { getNestedValue } from '../src/lib/utils'
import type { VariableConfig } from '../src/types/country'
import { mergeOverlay } from '../src/lib/data/mergeOverlay'
import {
  buildCategoryColorMap,
  buildMapCardCopy,
  escapeXml,
  MAGAZINE_COLORS,
  NUMERIC_BLUE_GRADIENT,
  OG_CARD_HEIGHT,
  OG_CARD_WIDTH,
  wrapText,
} from './og-card-helpers'

const outDir = path.join(__dirname, '../public/og/map')
const fontFiles = [
  path.join(__dirname, '../public/fonts/bricolage-grotesque/BricolageGrotesque-Variable.ttf'),
  path.join(__dirname, '../public/fonts/source-sans-3/SourceSans3-Variable.ttf'),
]
const countries = mergeOverlay(
  JSON.parse(fs.readFileSync(path.join(__dirname, '../data/countries.json'), 'utf8')) as { iso3: string }[],
  JSON.parse(fs.readFileSync(path.join(__dirname, '../data/stat-overlay.json'), 'utf8')) as Record<string, unknown>
) as Record<string, unknown>[]
const topo = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../public/geo/world-110m.json'), 'utf8')
)
const geojson = feature(topo, topo.objects[Object.keys(topo.objects)[0]]) as unknown as {
  features: { id?: string | number; geometry: unknown; properties?: Record<string, unknown> }[]
}

const projection = geoMercator().fitExtent(
  [
    [54, 168],
    [OG_CARD_WIDTH - 54, 536],
  ],
  geojson as never
)
const pathGen = geoPath(projection)

function colorResolver(config: VariableConfig): (value: unknown) => string {
  if (config.type === 'categorical') {
    const categoryColors = buildCategoryColorMap(config.categories ?? [])
    return (value) => {
      if (typeof value !== 'string' || value.trim() === '') {
        return categoryColors.Unknown
      }
      return categoryColors[config.format(value)] || categoryColors.Unknown
    }
  }

  const domain = config.domain || [0, 100]
  const scale = scaleLinear<string>()
    .domain([domain[0], (domain[0] + domain[1]) / 2, domain[1]])
    .range([...NUMERIC_BLUE_GRADIENT])
    .clamp(true)

  return (value) =>
    typeof value === 'number' && Number.isFinite(value)
      ? scale(value)
      : MAGAZINE_COLORS.noData
}

function fitHeading(question: string): { lines: string[]; fontSize: number; lineHeight: number } {
  const candidates = [
    { characters: 40, fontSize: 34 },
    { characters: 48, fontSize: 31 },
    { characters: 58, fontSize: 27 },
    { characters: 68, fontSize: 23 },
  ]

  for (const candidate of candidates) {
    const lines = wrapText(question, candidate.characters)
    if (lines.length <= 2 || candidate === candidates[candidates.length - 1]) {
      return {
        lines,
        fontSize: candidate.fontSize,
        lineHeight: candidate.fontSize + 9,
      }
    }
  }

  return { lines: [question], fontSize: 23, lineHeight: 32 }
}

function renderMapSvg(entry: VariableEntry): string {
  const config = VARIABLES[entry.id]
  const copy = buildMapCardCopy({
    config,
    ranked: rankCountries(entry.id),
    totalCountryCount: countries.length,
    provenance: getMetricProvenance(entry.id),
  })
  const heading = fitHeading(copy.question)
  const headingMarkup = heading.lines
    .map(
      (line, lineIndex) =>
        `<tspan x="68" dy="${lineIndex === 0 ? 0 : heading.lineHeight}">${escapeXml(line)}</tspan>`
    )
    .join('')
  const leadMarkup = wrapText(copy.fact.lead, 22)
    .map(
      (line, lineIndex) =>
        `<tspan x="876" dy="${lineIndex === 0 ? 0 : 26}">${escapeXml(line)}</tspan>`
    )
    .join('')
  const valueMarkup = wrapText(`${copy.fact.value} | ${copy.fact.valueLabel}`, 38)
    .map(
      (line, lineIndex) =>
        `<tspan x="876" dy="${lineIndex === 0 ? 0 : 18}">${escapeXml(line)}</tspan>`
    )
    .join('')
  const sourceLines = wrapText(copy.sourceCaption, 125)
  const sourceMarkup = sourceLines
    .map(
      (line, lineIndex) =>
        `<tspan x="54" dy="${lineIndex === 0 ? 0 : 17}">${escapeXml(line)}</tspan>`
    )
    .join('')
  const vintageY = 592 + Math.max(0, sourceLines.length - 1) * 17
  const colors = colorResolver(config)
  const valueByIso3 = new Map<string, unknown>()
  for (const country of countries) {
    valueByIso3.set(String(country.iso3), getNestedValue(country, entry.id))
  }

  const paths: string[] = []
  for (const feat of geojson.features) {
    const rawId = feat.id == null ? '' : String(feat.id).padStart(3, '0')
    const iso3 = numericToIso3[rawId]
    const d = pathGen(feat as never)
    if (!d) continue
    const fill = iso3 ? colors(valueByIso3.get(iso3)) : MAGAZINE_COLORS.noData
    paths.push(
      `<path d="${d}" fill="${fill}" stroke="${MAGAZINE_COLORS.paper}" stroke-width="0.6"/>`
    )
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${OG_CARD_WIDTH}" height="${OG_CARD_HEIGHT}" viewBox="0 0 ${OG_CARD_WIDTH} ${OG_CARD_HEIGHT}">
  <rect width="${OG_CARD_WIDTH}" height="${OG_CARD_HEIGHT}" fill="${MAGAZINE_COLORS.paper}"/>
  <rect width="${OG_CARD_WIDTH}" height="10" fill="${MAGAZINE_COLORS.blue}"/>
  <rect x="40" y="38" width="10" height="104" fill="${MAGAZINE_COLORS.yellow}"/>
  <text x="68" y="58" fill="${MAGAZINE_COLORS.blue}" font-family="Source Sans 3, sans-serif" font-size="15" font-weight="700" letter-spacing="2.4">THE WORLD TRUTH / WORLD MAP</text>
  <text x="68" y="102" fill="${MAGAZINE_COLORS.ink}" font-family="Bricolage Grotesque, sans-serif" font-size="${heading.fontSize}" font-weight="800">${headingMarkup}</text>
  <rect x="866" y="44" width="294" height="122" rx="12" fill="${MAGAZINE_COLORS.yellow}"/>
  <rect x="854" y="32" width="294" height="122" rx="12" fill="${MAGAZINE_COLORS.white}" stroke="${MAGAZINE_COLORS.ink}" stroke-width="3"/>
  <text x="876" y="58" fill="${MAGAZINE_COLORS.blue}" font-family="Source Sans 3, sans-serif" font-size="12" font-weight="700" letter-spacing="1.25">${escapeXml(copy.fact.label.toUpperCase())}</text>
  <text x="876" y="88" fill="${MAGAZINE_COLORS.ink}" font-family="Bricolage Grotesque, sans-serif" font-size="23" font-weight="800">${leadMarkup}</text>
  <text x="876" y="140" fill="${MAGAZINE_COLORS.ink}" font-family="Source Sans 3, sans-serif" font-size="15" font-weight="600">${valueMarkup}</text>
  <rect x="44" y="166" width="1112" height="374" rx="16" fill="#f4eedc"/>
  <g>${paths.join('')}</g>
  <line x1="54" y1="552" x2="1146" y2="552" stroke="${MAGAZINE_COLORS.ink}" stroke-width="2"/>
  <text x="1146" y="576" text-anchor="end" fill="${MAGAZINE_COLORS.blue}" font-family="Source Sans 3, sans-serif" font-size="15" font-weight="700">theworldtruth.com</text>
  <text x="54" y="578" fill="${MAGAZINE_COLORS.ink}" font-family="Source Sans 3, sans-serif" font-size="13" font-weight="600">${sourceMarkup}</text>
  <text x="54" y="${vintageY}" fill="${MAGAZINE_COLORS.ink}" font-family="Source Sans 3, sans-serif" font-size="13" font-weight="600">${escapeXml(copy.vintageCaption)}</text>
</svg>`
}

fs.mkdirSync(outDir, { recursive: true })

let count = 0
for (const entry of variableEntries) {
  const png = new Resvg(renderMapSvg(entry), {
    fitTo: { mode: 'width', value: OG_CARD_WIDTH },
    font: {
      fontFiles,
      loadSystemFonts: false,
      defaultFontFamily: 'Source Sans 3',
    },
  }).render().asPng()
  fs.writeFileSync(path.join(outDir, `${entry.slug}.png`), png)
  count += 1
}

console.log(`OG maps written: ${count} files in public/og/map`)

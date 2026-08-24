/**
 * Build 1200x630 choropleth OG images for every statistic.
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
import { variableSlug } from '../src/lib/seo/slugs'
import { getNestedValue } from '../src/lib/utils'
import type { ColorVariable } from '../src/types/country'
import { mergeOverlay } from '../src/lib/data/mergeOverlay'

const WIDTH = 1200
const HEIGHT = 630
const outDir = path.join(__dirname, '../public/og/map')
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

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function colorFor(variableId: ColorVariable, value: unknown): string {
  const config = VARIABLES[variableId]
  if (value === null || value === undefined) return '#d1d5db'
  if (config.type === 'categorical') return '#64748b'
  const domain = config.domain || [0, 100]
  const colors = config.higherIsBetter ? ['#dc2626', '#22c55e'] : ['#22c55e', '#dc2626']
  const scale = scaleLinear<string>().domain(domain).range(colors)
  return scale(value as number) || '#d1d5db'
}

function topLabel(variableId: ColorVariable): { title: string; subtitle: string } {
  const config = VARIABLES[variableId]
  let best: { name: string; formatted: string } | null = null
  let bestVal = config.higherIsBetter ? -Infinity : Infinity
  for (const country of countries) {
    const value = getNestedValue(country, variableId)
    if (typeof value !== 'number' || Number.isNaN(value)) continue
    const better = config.higherIsBetter ? value > bestVal : value < bestVal
    if (better) {
      bestVal = value
      best = {
        name: String(country.name),
        formatted: config.format(value),
      }
    }
  }
  const question = `Which country has the ${config.higherIsBetter ? 'highest' : 'lowest'} ${config.name.toLowerCase()}?`
  const subtitle = best ? `${best.name} · ${best.formatted}` : config.name
  return { title: question, subtitle }
}

fs.mkdirSync(outDir, { recursive: true })

const projection = geoMercator()
  .fitExtent(
    [
      [40, 90],
      [WIDTH - 40, HEIGHT - 24],
    ],
    geojson as never
  )
const pathGen = geoPath(projection)

let count = 0
for (const [id, config] of Object.entries(VARIABLES)) {
  const variableId = id as ColorVariable
  const slug = variableSlug(config.name)
  const { title, subtitle } = topLabel(variableId)
  const valueByIso3 = new Map<string, unknown>()
  for (const country of countries) {
    valueByIso3.set(String(country.iso3), getNestedValue(country, variableId))
  }

  const paths: string[] = []
  for (const feat of geojson.features) {
    const rawId = feat.id == null ? '' : String(feat.id).padStart(3, '0')
    const iso3 = numericToIso3[rawId]
    const d = pathGen(feat as never)
    if (!d) continue
    const fill = iso3 ? colorFor(variableId, valueByIso3.get(iso3)) : '#e5e7eb'
    paths.push(`<path d="${d}" fill="${fill}" stroke="#ffffff" stroke-width="0.6"/>`)
  }

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <rect width="100%" height="100%" fill="#0f172a"/>
  <g>${paths.join('')}</g>
  <rect x="0" y="0" width="${WIDTH}" height="86" fill="#0f172a" fill-opacity="0.82"/>
  <text x="40" y="38" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="26" font-weight="700">${escapeXml(title.slice(0, 88))}</text>
  <text x="40" y="68" fill="#86efac" font-family="Arial, Helvetica, sans-serif" font-size="22">${escapeXml(subtitle)}</text>
  <text x="40" y="${HEIGHT - 18}" fill="#94a3b8" font-family="Arial, Helvetica, sans-serif" font-size="16">theworldtruth.com</text>
</svg>`

  const png = new Resvg(svg, {
    fitTo: { mode: 'width', value: WIDTH },
  }).render().asPng()
  fs.writeFileSync(path.join(outDir, `${slug}.png`), png)
  count += 1
}

console.log(`OG maps written: ${count} files in public/og/map`)

/**
 * Build the 1200x630 home and general sharing image.
 * Run: npx tsx scripts/generate-home-og.ts
 */
import * as fs from 'fs'
import * as path from 'path'
import { geoGraticule10, geoNaturalEarth1, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import { Resvg } from '@resvg/resvg-js'
import {
  escapeXml,
  MAGAZINE_COLORS,
  OG_CARD_HEIGHT,
  OG_CARD_WIDTH,
} from './og-card-helpers'

const outPath = path.join(__dirname, '../public/og-image.png')
const fontFiles = [
  path.join(__dirname, '../public/fonts/bricolage-grotesque/BricolageGrotesque-Variable.ttf'),
  path.join(__dirname, '../public/fonts/source-sans-3/SourceSans3-Variable.ttf'),
]

const COPY = {
  kicker: 'THE WORLD TRUTH / DATA MAGAZINE',
  title: ['The world,', 'measured', 'and mapped.'],
  body: [
    'Explore country maps, daily puzzles',
    'and the stories behind the numbers.',
  ],
  tags: ['COUNTRY MAPS', 'DATA STORIES', 'DAILY QUIZZES'],
  cardKicker: 'THE WORLD, IN VIEW',
  cardFooter: 'MAPS  /  STORIES  /  QUIZZES',
  url: 'theworldtruth.com',
} as const

const topo = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../public/geo/world-110m.json'), 'utf8')
)
const geojson = feature(topo, topo.objects[Object.keys(topo.objects)[0]]) as unknown as {
  features: { geometry: unknown }[]
}
const projection = geoNaturalEarth1().fitExtent(
  [
    [777, 120],
    [1061, 404],
  ],
  geojson as never
)
const pathGen = geoPath(projection)
const graticulePath = pathGen(geoGraticule10()) ?? ''

const countryPaths = geojson.features
  .map((country) => pathGen(country as never))
  .filter((pathData): pathData is string => Boolean(pathData))
  .map(
    (pathData) =>
      `<path d="${pathData}" fill="${MAGAZINE_COLORS.blue}" stroke="${MAGAZINE_COLORS.paper}" stroke-width="0.8"/>`
  )
  .join('')

function renderTag(label: string, x: number, width: number): string {
  return `<rect x="${x}" y="452" width="${width}" height="42" rx="21" fill="${MAGAZINE_COLORS.white}" stroke="${MAGAZINE_COLORS.ink}" stroke-width="2"/>
  <text x="${x + width / 2}" y="479" text-anchor="middle" fill="${MAGAZINE_COLORS.ink}" font-family="Source Sans 3, sans-serif" font-size="13" font-weight="700" letter-spacing="1.1">${escapeXml(label)}</text>`
}

function renderSvg(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${OG_CARD_WIDTH}" height="${OG_CARD_HEIGHT}" viewBox="0 0 ${OG_CARD_WIDTH} ${OG_CARD_HEIGHT}">
  <defs>
    <pattern id="editorial-grid" width="42" height="42" patternUnits="userSpaceOnUse">
      <path d="M 42 0 L 0 0 0 42" fill="none" stroke="${MAGAZINE_COLORS.blue}" stroke-opacity="0.08" stroke-width="1"/>
    </pattern>
    <clipPath id="world-clip">
      <circle cx="919" cy="266" r="152"/>
    </clipPath>
  </defs>

  <rect width="${OG_CARD_WIDTH}" height="${OG_CARD_HEIGHT}" fill="${MAGAZINE_COLORS.paper}"/>
  <rect width="${OG_CARD_WIDTH}" height="${OG_CARD_HEIGHT}" fill="url(#editorial-grid)"/>
  <circle cx="28" cy="92" r="164" fill="${MAGAZINE_COLORS.yellow}" opacity="0.42"/>
  <rect width="14" height="${OG_CARD_HEIGHT}" fill="${MAGAZINE_COLORS.blue}"/>
  <rect width="${OG_CARD_WIDTH}" height="10" fill="${MAGAZINE_COLORS.blue}"/>

  <circle cx="82" cy="68" r="6" fill="${MAGAZINE_COLORS.coral}"/>
  <text x="100" y="74" fill="${MAGAZINE_COLORS.blue}" font-family="Source Sans 3, sans-serif" font-size="16" font-weight="700" letter-spacing="2.5">${escapeXml(COPY.kicker)}</text>

  <text fill="${MAGAZINE_COLORS.ink}" font-family="Bricolage Grotesque, sans-serif" font-size="74" font-weight="800" letter-spacing="-3">
    <tspan x="70" y="168">${escapeXml(COPY.title[0])}</tspan>
    <tspan x="70" y="242">${escapeXml(COPY.title[1])}</tspan>
    <tspan x="70" y="316">${escapeXml(COPY.title[2])}</tspan>
  </text>

  <text fill="${MAGAZINE_COLORS.ink}" fill-opacity="0.76" font-family="Source Sans 3, sans-serif" font-size="26" font-weight="600">
    <tspan x="72" y="382">${escapeXml(COPY.body[0])}</tspan>
    <tspan x="72" y="416">${escapeXml(COPY.body[1])}</tspan>
  </text>

  <g>
    ${renderTag(COPY.tags[0], 70, 162)}
    ${renderTag(COPY.tags[1], 242, 148)}
    ${renderTag(COPY.tags[2], 400, 166)}
  </g>

  <rect x="744" y="64" width="394" height="470" rx="30" fill="${MAGAZINE_COLORS.yellow}"/>
  <rect x="722" y="42" width="394" height="470" rx="30" fill="${MAGAZINE_COLORS.white}" stroke="${MAGAZINE_COLORS.ink}" stroke-width="4"/>
  <text x="754" y="88" fill="${MAGAZINE_COLORS.blue}" font-family="Source Sans 3, sans-serif" font-size="14" font-weight="700" letter-spacing="2.1">${escapeXml(COPY.cardKicker)}</text>

  <circle cx="937" cy="282" r="156" fill="${MAGAZINE_COLORS.yellow}"/>
  <circle cx="915" cy="262" r="156" fill="#e8eeff"/>
  <g clip-path="url(#world-clip)">
    <path d="${graticulePath}" fill="none" stroke="${MAGAZINE_COLORS.blue}" stroke-opacity="0.16" stroke-width="1"/>
    ${countryPaths}
  </g>
  <circle cx="915" cy="262" r="156" fill="none" stroke="${MAGAZINE_COLORS.ink}" stroke-width="4"/>

  <rect x="754" y="430" width="330" height="44" rx="22" fill="${MAGAZINE_COLORS.yellow}"/>
  <text x="919" y="458" text-anchor="middle" fill="${MAGAZINE_COLORS.ink}" font-family="Source Sans 3, sans-serif" font-size="14" font-weight="700" letter-spacing="1.2">${escapeXml(COPY.cardFooter)}</text>

  <line x1="70" y1="554" x2="1130" y2="554" stroke="${MAGAZINE_COLORS.ink}" stroke-width="2"/>
  <text x="70" y="590" fill="${MAGAZINE_COLORS.blue}" font-family="Source Sans 3, sans-serif" font-size="20" font-weight="700">${escapeXml(COPY.url)}</text>
  <text x="1130" y="590" text-anchor="end" fill="${MAGAZINE_COLORS.ink}" font-family="Source Sans 3, sans-serif" font-size="16" font-weight="700" letter-spacing="1.6">THE WORLD TRUTH</text>
</svg>`
}

const png = new Resvg(renderSvg(), {
  fitTo: { mode: 'width', value: OG_CARD_WIDTH },
  font: {
    fontFiles,
    loadSystemFonts: false,
    defaultFontFamily: 'Source Sans 3',
  },
}).render().asPng()

fs.writeFileSync(outPath, png)
console.log(`Wrote ${outPath} (${png.length} bytes)`)

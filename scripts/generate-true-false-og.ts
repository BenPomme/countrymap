/**
 * Build the static 1200x630 True or False landing OG image.
 * Run: npx tsx scripts/generate-true-false-og.ts
 */
import * as fs from 'fs'
import * as path from 'path'
import { Resvg } from '@resvg/resvg-js'
import {
  buildGameOgSvg,
  OG_CARD_WIDTH,
  TRUE_FALSE_OG_COPY,
} from './og-card-helpers'

const outPath = path.join(__dirname, '../public/og/true-false.png')
const fontFiles = [
  path.join(__dirname, '../public/fonts/bricolage-grotesque/BricolageGrotesque-Variable.ttf'),
  path.join(__dirname, '../public/fonts/source-sans-3/SourceSans3-Variable.ttf'),
]

fs.mkdirSync(path.dirname(outPath), { recursive: true })
const png = new Resvg(buildGameOgSvg(TRUE_FALSE_OG_COPY), {
  fitTo: { mode: 'width', value: OG_CARD_WIDTH },
  font: {
    fontFiles,
    loadSystemFonts: false,
    defaultFontFamily: 'Source Sans 3',
  },
}).render().asPng()
fs.writeFileSync(outPath, png)
console.log(`Wrote ${outPath} (${png.length} bytes)`)

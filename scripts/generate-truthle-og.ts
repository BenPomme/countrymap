/**
 * Build the static 1200x630 Truthle landing OG image.
 * Used by Open Graph / Twitter summary_large_image tags.
 * Run: npx tsx scripts/generate-truthle-og.ts
 */
import * as fs from "fs"
import * as path from "path"
import { Resvg } from "@resvg/resvg-js"

const WIDTH = 1200
const HEIGHT = 630
const outPath = path.join(__dirname, "../public/og/truthle.png")
const logoPath = path.join(__dirname, "../public/truthle.png")

const logoB64 = fs.existsSync(logoPath)
  ? fs.readFileSync(logoPath).toString("base64")
  : ""

const logoImage = logoB64
  ? `<image href="data:image/png;base64,${logoB64}" x="510" y="70" width="180" height="180" />`
  : `<text x="600" y="180" text-anchor="middle" font-size="48" font-weight="800" fill="#111827" font-family="Liberation Sans, DejaVu Sans, Nimbus Sans, sans-serif">TRUTHLE</text>`

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ecfdf5"/>
      <stop offset="55%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f8fafc"/>
    </linearGradient>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
  <rect width="${WIDTH}" height="16" fill="#10b981"/>
  <rect y="${HEIGHT - 16}" width="${WIDTH}" height="16" fill="#10b981"/>
  ${logoImage}
  <text x="600" y="300" text-anchor="middle" font-size="64" font-weight="800" fill="#111827" font-family="Liberation Sans, DejaVu Sans, Nimbus Sans, sans-serif">Truthle</text>
  <text x="600" y="352" text-anchor="middle" font-size="28" font-weight="600" fill="#4b5563" font-family="Liberation Sans, DejaVu Sans, Nimbus Sans, sans-serif">Daily World Facts Quiz</text>
  <text x="600" y="400" text-anchor="middle" font-size="22" font-weight="500" fill="#6b7280" font-family="Liberation Sans, DejaVu Sans, Nimbus Sans, sans-serif">5 questions · same for everyone · one attempt per day</text>
  <rect x="430" y="430" width="340" height="56" rx="12" fill="#10b981"/>
  <text x="600" y="467" text-anchor="middle" font-size="22" font-weight="700" fill="#ffffff" font-family="Liberation Sans, DejaVu Sans, Nimbus Sans, sans-serif">Play Today&apos;s Truthle</text>
  <text x="600" y="560" text-anchor="middle" font-size="22" font-weight="600" fill="#10b981" font-family="Liberation Sans, DejaVu Sans, Nimbus Sans, sans-serif">theworldtruth.com/truthle</text>
</svg>`

fs.mkdirSync(path.dirname(outPath), { recursive: true })
const png = new Resvg(svg, {
  fitTo: { mode: "width", value: WIDTH },
}).render().asPng()
fs.writeFileSync(outPath, png)
console.log(`Wrote ${outPath} (${png.length} bytes)`)

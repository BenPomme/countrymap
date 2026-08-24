/**
 * Generate sitemap.xml with all country + statistic pages
 */
import * as fs from 'fs'
import * as path from 'path'
import { VARIABLES } from '../src/lib/constants/variables'
import '../src/lib/constants/extraVariables'
import { variableSlug, countrySlug } from '../src/lib/seo/slugs'
import { mergeOverlay } from '../src/lib/data/mergeOverlay'

interface Country {
  name: string
  iso3: string
  iso2: string
}

const countriesData: Country[] = mergeOverlay(
  JSON.parse(fs.readFileSync(path.join(__dirname, '../data/countries.json'), 'utf8')) as Country[],
  JSON.parse(fs.readFileSync(path.join(__dirname, '../data/stat-overlay.json'), 'utf8')) as Record<string, unknown>
)

const today = new Date().toISOString().split('T')[0]

const staticPages = [
  { loc: '/', changefreq: 'weekly', priority: '1.0' },
  { loc: '/truthle/', changefreq: 'daily', priority: '1.0' },
  { loc: '/truthle/shop/', changefreq: 'monthly', priority: '0.7' },
  { loc: '/charts/', changefreq: 'weekly', priority: '0.9' },
  { loc: '/discoveries/', changefreq: 'weekly', priority: '0.9' },
  { loc: '/quiz/', changefreq: 'monthly', priority: '0.8' },
]

const countryPages = countriesData.map((country) => ({
  loc: `/country/${countrySlug(country.name)}/`,
  changefreq: 'monthly',
  priority: '0.7',
}))

const statPages = Object.values(VARIABLES).map((config) => ({
  loc: `/map/${variableSlug(config.name)}/`,
  changefreq: 'weekly',
  priority: '0.9',
}))
// /embed/{slug}/ widgets are intentionally omitted (noindex iframe copies).

const allPages = [...staticPages, ...statPages, ...countryPages]

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages
  .map(
    (page) => `  <url>
    <loc>https://theworldtruth.com${page.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`

fs.writeFileSync(path.join(__dirname, '../public/sitemap.xml'), sitemap)

console.log(`Sitemap generated with ${allPages.length} URLs`)
console.log(`   - ${staticPages.length} static pages`)
console.log(`   - ${statPages.length} statistic pages`)
console.log(`   - ${countryPages.length} country pages`)

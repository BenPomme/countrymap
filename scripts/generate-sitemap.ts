/**
 * Generate sitemap.xml with all country pages
 */

import * as fs from 'fs'
import * as path from 'path'

interface Country {
  name: string
  iso3: string
  iso2: string
}

const countriesData: Country[] = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../data/countries.json'), 'utf8')
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
  loc: `/country/${country.name.toLowerCase().replace(/\s+/g, '-')}/`,
  changefreq: 'monthly',
  priority: '0.7',
}))

const allPages = [...staticPages, ...countryPages]

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

console.log(`✅ Sitemap generated with ${allPages.length} URLs`)
console.log(`   - ${staticPages.length} static pages`)
console.log(`   - ${countryPages.length} country pages`)

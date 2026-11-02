/**
 * Generate sitemap.xml with all country + statistic pages
 */
import * as fs from 'fs'
import * as path from 'path'
import { VARIABLES } from '../src/lib/constants/variables'
import '../src/lib/constants/extraVariables'
import { variableSlug, countrySlug } from '../src/lib/seo/slugs'
import { getAllClaims } from '../src/lib/seo/claims'
import { mergeOverlay } from '../src/lib/data/mergeOverlay'

interface Country {
  name: string
  iso3: string
  iso2: string
}

export interface SitemapPage {
  loc: string
  changefreq: string
  priority: string
}

const countriesData: Country[] = mergeOverlay(
  JSON.parse(fs.readFileSync(path.join(__dirname, '../data/countries.json'), 'utf8')) as Country[],
  JSON.parse(fs.readFileSync(path.join(__dirname, '../data/stat-overlay.json'), 'utf8')) as Record<string, unknown>
)

export function buildSitemapPages(): SitemapPage[] {
  const staticPages: SitemapPage[] = [
    { loc: '/', changefreq: 'weekly', priority: '1.0' },
    { loc: '/truthle/', changefreq: 'daily', priority: '1.0' },
    { loc: '/true-false/', changefreq: 'daily', priority: '0.9' },
    { loc: '/truthle/shop/', changefreq: 'monthly', priority: '0.7' },
    { loc: '/truthle-vs-worldle/', changefreq: 'monthly', priority: '0.6' },
    { loc: '/charts/', changefreq: 'weekly', priority: '0.9' },
    { loc: '/discoveries/', changefreq: 'weekly', priority: '0.9' },
    { loc: '/quiz/', changefreq: 'monthly', priority: '0.8' },
    { loc: '/rewards/', changefreq: 'monthly', priority: '0.7' },
    { loc: '/challenge/', changefreq: 'daily', priority: '0.8' },
    { loc: '/privacy/', changefreq: 'yearly', priority: '0.3' },
  ]

  const countryPages: SitemapPage[] = countriesData.map((country) => ({
    loc: `/country/${countrySlug(country.name)}/`,
    changefreq: 'monthly',
    priority: '0.7',
  }))

  const statPages: SitemapPage[] = Object.values(VARIABLES).map((config) => ({
    loc: `/map/${variableSlug(config.name)}/`,
    changefreq: 'weekly',
    priority: '0.9',
  }))

  // /embed/{slug}/ widgets are intentionally omitted because they are noindex copies.
  const claimPages: SitemapPage[] = [
    { loc: '/true-false/claims/', changefreq: 'weekly', priority: '0.8' },
    ...getAllClaims().map((claim) => ({
      loc: `/true-false/claims/${claim.slug}/`,
      changefreq: 'monthly',
      priority: '0.6',
    })),
  ]

  const byLocation = new Map<string, SitemapPage>()
  for (const page of [...staticPages, ...statPages, ...countryPages, ...claimPages]) {
    if (!byLocation.has(page.loc)) byLocation.set(page.loc, page)
  }

  return Array.from(byLocation.values()).sort((left, right) =>
    left.loc < right.loc ? -1 : left.loc > right.loc ? 1 : 0
  )
}

export function renderSitemap(pages: SitemapPage[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
  .map(
    (page) => `  <url>
    <loc>https://theworldtruth.com${page.loc}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`
}

const isDirectRun = /[\\/]generate-sitemap\.ts$/.test(process.argv[1] || '')

if (isDirectRun) {
  const pages = buildSitemapPages()
  fs.writeFileSync(path.join(__dirname, '../public/sitemap.xml'), renderSitemap(pages))
  console.log(`Sitemap generated with ${pages.length} unique, sorted URLs and no synthetic lastmod values`)
}

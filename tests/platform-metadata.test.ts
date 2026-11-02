import test from 'node:test'
import assert from 'node:assert/strict'
import {
  auditHtml,
  expectedCanonicalForRoute,
  routeFromOutputFile,
  validateHtmlAudits,
} from '../scripts/validate-metadata'
import { buildSitemapPages, renderSitemap } from '../scripts/generate-sitemap'

function html(input: {
  canonical?: string
  title?: string
  description?: string
  robots?: string
  h1s?: string[]
}): string {
  return `<!doctype html><html><head>
${input.title === undefined ? '' : `<title>${input.title}</title>`}
${input.description === undefined ? '' : `<meta name="description" content="${input.description}">`}
${input.robots === undefined ? '' : `<meta name="robots" content="${input.robots}">`}
${input.canonical === undefined ? '' : `<link rel="canonical" href="${input.canonical}">`}
</head><body>${(input.h1s ?? []).map((heading) => `<h1>${heading}</h1>`).join('')}</body></html>`
}

test('output files map to trailing-slash routes', () => {
  assert.equal(routeFromOutputFile('index.html'), '/')
  assert.equal(routeFromOutputFile('privacy/index.html'), '/privacy/')
  assert.equal(routeFromOutputFile('country/france/index.html'), '/country/france/')
  assert.equal(routeFromOutputFile('404.html'), null)
  assert.equal(routeFromOutputFile('_next/static/chunk.html'), '/_next/static/chunk/')
})

test('expected canonical handles self routes, aliases and embed copies', () => {
  assert.equal(
    expectedCanonicalForRoute('/privacy/'),
    'https://theworldtruth.com/privacy/'
  )
  assert.equal(
    expectedCanonicalForRoute("/country/cote-d'ivoire/"),
    'https://theworldtruth.com/country/cote-d-ivoire/'
  )
  assert.equal(
    expectedCanonicalForRoute('/embed/beer-consumption/'),
    'https://theworldtruth.com/map/beer-consumption/'
  )
})

test('valid self canonicals, aliases and noindex embeds pass', () => {
  const pages = [
    auditHtml(
      'privacy/index.html',
      html({
        canonical: 'https://theworldtruth.com/privacy/',
        title: 'Privacy policy',
        description: 'How privacy choices work.',
        h1s: ['Privacy policy'],
      })
    ),
    auditHtml(
      'country/cote-d-ivoire/index.html',
      html({
        canonical: 'https://theworldtruth.com/country/cote-d-ivoire/',
        title: 'Cote d Ivoire statistics',
        description: 'Country statistics for Cote d Ivoire.',
        h1s: ['Cote d Ivoire'],
      })
    ),
    auditHtml(
      "country/cote-d'ivoire/index.html",
      html({
        canonical: 'https://theworldtruth.com/country/cote-d-ivoire/',
        title: 'Cote d Ivoire statistics',
        description: 'Country statistics for Cote d Ivoire.',
        h1s: ['Cote d Ivoire'],
      })
    ),
    auditHtml(
      'embed/beer-consumption/index.html',
      html({
        canonical: 'https://theworldtruth.com/map/beer-consumption/',
        robots: 'noindex, nofollow',
        title: 'Beer map embed',
        description: 'Embeddable beer map.',
      })
    ),
  ].filter((page): page is NonNullable<typeof page> => page !== null)

  assert.deepEqual(validateHtmlAudits(pages), [])
})

test('metadata audit rejects canonical, robots, uniqueness and heading failures', () => {
  const pages = [
    auditHtml(
      'one/index.html',
      html({
        canonical: 'https://theworldtruth.com/one/',
        title: 'Same title',
        description: 'Same description',
        h1s: [],
      })
    ),
    auditHtml(
      'two/index.html',
      html({
        canonical: 'https://theworldtruth.com/two/',
        title: 'Same title',
        description: 'Same description',
        h1s: ['Useful heading', 'Second heading'],
      })
    ),
    auditHtml(
      'three/index.html',
      html({
        canonical: 'https://theworldtruth.com/three/',
        title: 'Third title',
        description: 'Third description',
        h1s: ['   '],
      })
    ),
    auditHtml(
      'wrong/index.html',
      html({
        canonical: 'https://theworldtruth.com/not-wrong/',
        title: 'Wrong canonical page',
        description: 'This page points at the wrong canonical URL.',
        h1s: ['Wrong canonical page'],
      })
    ),
    auditHtml(
      'embed/beer-consumption/index.html',
      html({
        canonical: 'https://theworldtruth.com/embed/beer-consumption/',
        title: 'Beer map embed',
        description: 'Embeddable beer map.',
      })
    ),
  ].filter((page): page is NonNullable<typeof page> => page !== null)

  const errors = validateHtmlAudits(pages)
  assert.ok(errors.some((error) => error.includes('canonical') && error.includes('/wrong/')))
  assert.ok(errors.some((error) => error.includes('/one/: expected one h1, found 0')))
  assert.ok(errors.some((error) => error.includes('/two/: expected one h1, found 2')))
  assert.ok(errors.some((error) => error.includes('/three/: h1 is not descriptive')))
  assert.ok(errors.some((error) => error.includes('/two/: duplicate title')))
  assert.ok(errors.some((error) => error.includes('/two/: duplicate description')))
  assert.ok(errors.some((error) => error.includes('/embed/beer-consumption/: canonical')))
  assert.ok(errors.some((error) => error.includes('/embed/beer-consumption/: embed must be noindex')))
})

test('sitemap is unique, sorted, complete and free of synthetic timestamps', () => {
  const pages = buildSitemapPages()
  const locations = pages.map((page) => page.loc)

  assert.equal(new Set(locations).size, locations.length)
  assert.deepEqual(locations, [...locations].sort((left, right) => (left < right ? -1 : left > right ? 1 : 0)))
  assert.ok(locations.includes('/rewards/'))
  assert.ok(locations.includes('/challenge/'))
  assert.ok(locations.includes('/privacy/'))
  assert.ok(locations.includes('/map/beer-consumption/'))
  assert.ok(locations.includes('/country/cote-d-ivoire/'))
  assert.ok(!locations.includes("/country/cote-d'ivoire/"))
  assert.ok(!locations.some((location) => location.startsWith('/embed/')))

  const sitemap = renderSitemap(pages)
  assert.ok(!sitemap.includes('<lastmod>'))
  assert.ok(!sitemap.includes(new Date().toISOString().slice(0, 10)))
  assert.equal((sitemap.match(/<loc>/g) ?? []).length, pages.length)
})

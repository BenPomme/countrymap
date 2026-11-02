import * as fs from 'fs'
import * as path from 'path'
import { findCountryBySlug, getVariableBySlug } from '../src/lib/seo/catalog'
import { countrySlug } from '../src/lib/seo/slugs'

const SITE_ORIGIN = 'https://theworldtruth.com'

export type HtmlAudit = {
  file: string
  route: string
  canonical?: string
  title?: string
  description?: string
  robots?: string
  h1s: string[]
}

export type MetadataAuditResult = {
  pages: number
  indexable: number
  embeds: number
  errors: string[]
}

function decodeHtml(value: string): string {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#([0-9]+);/g, (_, decimal: string) => String.fromCodePoint(Number(decimal)))
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
}

function parseAttributes(tag: string): Record<string, string> {
  const attributes: Record<string, string> = {}
  const pattern = /([^\s=/>]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g
  for (const match of tag.matchAll(pattern)) {
    attributes[match[1].toLowerCase()] = decodeHtml(match[2] ?? match[3] ?? match[4] ?? '')
  }
  return attributes
}

function findMeta(html: string, name: string): string | undefined {
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const attributes = parseAttributes(match[0])
    if (attributes.name?.toLowerCase() === name) return attributes.content
  }
  return undefined
}

function findCanonical(html: string): string | undefined {
  for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
    const attributes = parseAttributes(match[0])
    if (attributes.rel?.toLowerCase().split(/\s+/).includes('canonical')) return attributes.href
  }
  return undefined
}

function normalizeText(value: string | undefined): string {
  return (value ?? '').replace(/\s+/g, ' ').trim()
}

export function routeFromOutputFile(relativeFile: string): string | null {
  const normalized = relativeFile.replace(/\\/g, '/').replace(/^\.?\//, '')
  if (normalized === '404.html' || normalized.startsWith('404/')) return null
  if (normalized === 'index.html') return '/'
  if (normalized.endsWith('/index.html')) {
    return `/${normalized.slice(0, -'index.html'.length)}`
  }
  if (normalized.endsWith('.html')) return `/${normalized.slice(0, -'.html'.length)}/`
  return null
}

export function expectedCanonicalForRoute(route: string): string {
  const embed = route.match(/^\/embed\/([^/]+)\/$/)
  if (embed) {
    const slug = decodeURIComponent(embed[1])
    if (getVariableBySlug(slug)) return `${SITE_ORIGIN}/map/${slug}/`
  }

  const country = route.match(/^\/country\/([^/]+)\/$/)
  if (country) {
    const decoded = decodeURIComponent(country[1])
    const match = findCountryBySlug(decoded)
    if (match) return `${SITE_ORIGIN}/country/${countrySlug(match.name)}/`
  }

  return `${SITE_ORIGIN}${route}`
}

export function isEmbedRoute(route: string): boolean {
  return /^\/embed\/[^/]+\/$/.test(route)
}

export function auditHtml(relativeFile: string, html: string): HtmlAudit | null {
  const route = routeFromOutputFile(relativeFile)
  if (!route) return null

  const titleMatch = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)
  const h1s = Array.from(html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)).map((match) =>
    normalizeText(decodeHtml(match[1].replace(/<[^>]*>/g, ' ')))
  )

  return {
    file: relativeFile,
    route,
    canonical: findCanonical(html),
    title: normalizeText(titleMatch ? decodeHtml(titleMatch[1]) : undefined),
    description: normalizeText(findMeta(html, 'description')),
    robots: findMeta(html, 'robots'),
    h1s,
  }
}

function isNoindex(audit: HtmlAudit): boolean {
  return /(?:^|[\s,])noindex(?:$|[\s,])/i.test(audit.robots ?? '')
}

function normalizeCanonical(value: string): string {
  try {
    const url = new URL(value)
    return `${url.origin}${url.pathname}`
  } catch {
    return value
  }
}

export function validateHtmlAudits(audits: HtmlAudit[]): string[] {
  const errors: string[] = []
  const titles = new Map<string, string>()
  const descriptions = new Map<string, string>()

  for (const audit of audits) {
    const expected = expectedCanonicalForRoute(audit.route)
    const canonical = normalizeCanonical(audit.canonical ?? '')

    if (!audit.canonical) {
      errors.push(`${audit.route}: missing canonical link`)
    } else if (canonical !== expected) {
      errors.push(`${audit.route}: canonical ${audit.canonical} should be ${expected}`)
    }

    if (isEmbedRoute(audit.route)) {
      if (!isNoindex(audit)) errors.push(`${audit.route}: embed must be noindex`)
      continue
    }

    if (!audit.title) errors.push(`${audit.route}: missing title`)
    if (!audit.description) errors.push(`${audit.route}: missing meta description`)
    if (audit.h1s.length !== 1) {
      errors.push(`${audit.route}: expected one h1, found ${audit.h1s.length}`)
    } else if (audit.h1s[0].length < 3) {
      errors.push(`${audit.route}: h1 is not descriptive`)
    }

    if (isNoindex(audit) || canonical !== `${SITE_ORIGIN}${audit.route}`) continue

    if (audit.title) {
      const key = audit.title.toLocaleLowerCase('en-US')
      const previous = titles.get(key)
      if (previous) {
        errors.push(`${audit.route}: duplicate title also used by ${previous}`)
      } else {
        titles.set(key, audit.route)
      }
    }

    if (audit.description) {
      const key = audit.description.toLocaleLowerCase('en-US')
      const previous = descriptions.get(key)
      if (previous) {
        errors.push(`${audit.route}: duplicate description also used by ${previous}`)
      } else {
        descriptions.set(key, audit.route)
      }
    }
  }

  return errors
}

function listHtmlFiles(directory: string, root = directory): string[] {
  const files: string[] = []
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === '_next') continue
    const absolute = path.join(directory, entry.name)
    if (entry.isDirectory()) files.push(...listHtmlFiles(absolute, root))
    if (entry.isFile() && entry.name.endsWith('.html')) files.push(path.relative(root, absolute))
  }
  return files.sort()
}

export function validateGeneratedOutput(outputDirectory: string): MetadataAuditResult {
  if (!fs.existsSync(outputDirectory)) {
    throw new Error(`Generated output directory not found: ${outputDirectory}`)
  }

  const audits: HtmlAudit[] = []
  for (const file of listHtmlFiles(outputDirectory)) {
    const html = fs.readFileSync(path.join(outputDirectory, file), 'utf8')
    const audit = auditHtml(file, html)
    if (audit) audits.push(audit)
  }

  const errors = validateHtmlAudits(audits)
  return {
    pages: audits.length,
    indexable: audits.filter((audit) => !isEmbedRoute(audit.route) && !isNoindex(audit)).length,
    embeds: audits.filter((audit) => isEmbedRoute(audit.route)).length,
    errors,
  }
}

const isDirectRun = /[\\/]validate-metadata\.ts$/.test(process.argv[1] || '')

if (isDirectRun) {
  const outputDirectory = path.resolve(process.argv[2] || path.join(__dirname, '../out'))
  try {
    const result = validateGeneratedOutput(outputDirectory)
    console.log(
      `Metadata audit checked ${result.pages} HTML pages (${result.indexable} indexable, ${result.embeds} embeds)`
    )
    if (result.errors.length > 0) {
      for (const error of result.errors) console.error(`- ${error}`)
      process.exitCode = 1
    } else {
      console.log('Metadata audit passed')
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}

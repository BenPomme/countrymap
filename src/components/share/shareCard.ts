import { normalizeShareCopy } from './shareState'
import type { ValueOrder } from '../../lib/seo/ranking'

export const VISUAL_SHARE_WIDTH = 1200
export const VISUAL_SHARE_HEIGHT = 630
export const MAP_CAPTURE_WIDTH = 952
export const MAP_CAPTURE_HEIGHT = 612
const CARD_DISCLOSURE_MAX_LINES = 2
const CARD_DISCLOSURE_WIDTH = VISUAL_SHARE_WIDTH - 128

export interface VisualShareCardInput {
  title: string
  description: string
  url: string
  stat?: string
  detail?: string
  sourceName?: string
  sourceVintage?: string
  target?: HTMLElement | null
}

export interface MapShareRow {
  countryName: string
  formatted: string
  rankMin: number
}

export interface MapShareCopy {
  title: string
  description: string
  stat?: string
  detail?: string
}

export interface CardSourceLayout {
  lines: string[]
  fontSize: number
  lineHeight: number
}

interface CaptureBounds {
  x: number
  y: number
  width: number
  height: number
}

const COLORS = {
  paper: '#fff9e8',
  ink: '#192947',
  blue: '#294cc4',
  yellow: '#ffda62',
  coral: '#dc654e',
  green: '#246e55',
  white: '#ffffff',
  softBlue: '#e8edff',
}

function font(weight: number, size: number): string {
  return `${weight} ${size}px "Bricolage Grotesque", "Avenir Next", "Segoe UI", sans-serif`
}

function roundRectPath(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  const safeRadius = Math.min(radius, width / 2, height / 2)
  context.beginPath()
  context.moveTo(x + safeRadius, y)
  context.arcTo(x + width, y, x + width, y + height, safeRadius)
  context.arcTo(x + width, y + height, x, y + height, safeRadius)
  context.arcTo(x, y + height, x, y, safeRadius)
  context.arcTo(x, y, x + width, y, safeRadius)
  context.closePath()
}

function appendEllipsis(
  text: string,
  maxWidth: number,
  measureText: (value: string) => number,
): string {
  let trimmed = text.trimEnd()
  while (trimmed.length > 0 && measureText(`${trimmed}...`) > maxWidth) {
    trimmed = trimmed.slice(0, -1).trimEnd()
  }
  if (trimmed) return `${trimmed}...`
  return measureText('...') <= maxWidth ? '...' : ''
}

function listWithAnd(items: string[]): string {
  if (items.length < 2) return items[0] || ''
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`
}

function listForSentence(items: string[]): string {
  if (items.length <= 3) return listWithAnd(items)
  return `${items[0]}, ${items[1]} and ${items.length - 2} others`
}

export function buildMapShareCopy(input: {
  metricName: string
  categorical: boolean
  rankOrder: ValueOrder
  rows: readonly MapShareRow[]
  filteredCountryCount: number
}): MapShareCopy {
  const { metricName, categorical, rankOrder, rows, filteredCountryCount } = input
  const title = normalizeShareCopy(metricName)
  const reportingNoun = categorical ? 'category' : 'value'
  const viewScope = `${filteredCountryCount} ${filteredCountryCount === 1 ? 'country' : 'countries'} in this view`

  if (rows.length === 0) {
    return {
      title,
      description: normalizeShareCopy(
        `${metricName} map for the current filters. No reported ${reportingNoun} among the ${viewScope}.`,
      ),
      detail: normalizeShareCopy(`0 of ${viewScope} have a reported ${reportingNoun}.`),
    }
  }

  if (categorical) {
    const counts = new Map<string, number>()
    for (const row of rows) {
      const category = normalizeShareCopy(row.formatted)
      counts.set(category, (counts.get(category) || 0) + 1)
    }

    const highestCount = Math.max(...counts.values())
    const categories = Array.from(counts.entries())
      .filter(([, count]) => count === highestCount)
      .map(([category]) => category)
    const categoryList = listForSentence(categories)
    const tied = categories.length > 1
    const allOnce = highestCount === 1 && categories.length === rows.length

    if (allOnce) {
      return {
        title,
        description: normalizeShareCopy(
          `Each reported category appears once in this filtered view. ${rows.length} of ${viewScope} have a reported category.`,
        ),
      }
    }

    return {
      title,
      description: normalizeShareCopy(
        tied
          ? `Most commonly reported categories in this filtered view: ${categoryList}, each reported by ${highestCount} of ${viewScope}.`
          : `Most commonly reported category in this filtered view: ${categoryList}, reported by ${highestCount} of ${viewScope}.`,
      ),
    }
  }

  const extremeRank = Math.min(...rows.map((row) => row.rankMin))
  const leaders = rows.filter((row) => row.rankMin === extremeRank)
  const first = leaders[0] || rows[0]
  const leaderNames = leaders.map((row) => normalizeShareCopy(row.countryName))
  const direction = rankOrder === 'highest-first' ? 'largest' : 'smallest'
  const tied = leaders.length > 1
  const formatted = normalizeShareCopy(first.formatted)

  return {
    title,
    description: normalizeShareCopy(
      tied
        ? `Observed ${direction} reported value in this filtered view: ${listForSentence(leaderNames)} tied at ${formatted}.`
        : `Observed ${direction} reported value in this filtered view: ${leaderNames[0]} at ${formatted}.`,
    ),
    stat: formatted,
    detail: normalizeShareCopy(
      `${rows.length} of ${viewScope} have a reported ${reportingNoun}.`,
    ),
  }
}

export function wrapTextLines(
  text: string,
  maxWidth: number,
  maxLines: number,
  measureText: (value: string) => number,
): string[] {
  const words = normalizeShareCopy(text).split(' ').filter(Boolean)
  if (words.length === 0 || maxLines <= 0) return ['']

  const lines: string[] = []
  let wordIndex = 0

  for (let lineIndex = 0; lineIndex < maxLines && wordIndex < words.length; lineIndex++) {
    let line = words[wordIndex]
    wordIndex += 1

    while (wordIndex < words.length) {
      const candidate = `${line} ${words[wordIndex]}`
      if (measureText(candidate) > maxWidth) break
      line = candidate
      wordIndex += 1
    }

    const hasMoreWords = wordIndex < words.length
    if ((hasMoreWords && lineIndex === maxLines - 1) || measureText(line) > maxWidth) {
      line = appendEllipsis(line, maxWidth, measureText)
    }
    lines.push(line)
  }

  return lines.length > 0 ? lines : ['']
}

export function wrapExactText(
  text: string,
  maxWidth: number,
  maxLines: number,
  measureText: (value: string) => number,
): string[] | null {
  if (!text || maxLines <= 0) return text ? null : ['']

  const lines: string[] = []
  let remaining = text

  while (remaining && lines.length < maxLines) {
    if (measureText(remaining) <= maxWidth) {
      lines.push(remaining)
      remaining = ''
      break
    }

    let splitAt = remaining.length - 1
    while (splitAt > 0 && measureText(remaining.slice(0, splitAt)) > maxWidth) {
      splitAt -= 1
    }
    if (splitAt <= 0) return null

    const candidate = remaining.slice(0, splitAt)
    const preferredBreak = Math.max(
      candidate.lastIndexOf('/'),
      candidate.lastIndexOf('?'),
      candidate.lastIndexOf('&'),
      candidate.lastIndexOf('='),
      candidate.lastIndexOf('-'),
    )
    if (preferredBreak > 0 && preferredBreak >= Math.floor(candidate.length * 0.5)) {
      splitAt = preferredBreak + 1
    }

    lines.push(remaining.slice(0, splitAt))
    remaining = remaining.slice(splitAt)
  }

  return remaining ? null : lines
}

export function buildCardSourceLines(
  sourceName: string,
  sourceVintage: string,
  measureText: (value: string) => number,
  maxWidth = VISUAL_SHARE_WIDTH - 128,
): string[] {
  const disclosure = `Source: ${normalizeShareCopy(sourceName)} | Vintage: ${normalizeShareCopy(sourceVintage)}`
  const lines = wrapExactText(disclosure, maxWidth, CARD_DISCLOSURE_MAX_LINES, measureText)
  if (!lines) {
    throw new Error('The full source and vintage are too long to render on the share card')
  }
  return lines
}

export function buildCardSourceLayout(
  sourceName: string,
  sourceVintage: string,
  measureAt: (value: string, fontSize: number) => number,
): CardSourceLayout {
  const disclosure = `Source: ${normalizeShareCopy(sourceName)} | Vintage: ${normalizeShareCopy(sourceVintage)}`
  const attempts = [
    { fontSize: 19, lineHeight: 20, maxLines: 2 },
    { fontSize: 17, lineHeight: 18, maxLines: 3 },
    { fontSize: 16, lineHeight: 17, maxLines: 3 },
  ]

  for (const attempt of attempts) {
    const lines = wrapExactText(
      disclosure,
      CARD_DISCLOSURE_WIDTH,
      attempt.maxLines,
      (value) => measureAt(value, attempt.fontSize),
    )
    if (lines) {
      return { lines, fontSize: attempt.fontSize, lineHeight: attempt.lineHeight }
    }
  }

  throw new Error('The full source and vintage are too long to render on the share card')
}

export function buildMapCaptureViewBox(
  bounds: CaptureBounds,
  sourceWidth: number,
  sourceHeight: number,
  padding = 8,
): string | null {
  if (![bounds.x, bounds.y, bounds.width, bounds.height, sourceWidth, sourceHeight].every(Number.isFinite)) {
    return null
  }
  if (bounds.width <= 0 || bounds.height <= 0 || sourceWidth <= 0 || sourceHeight <= 0) return null

  const left = Math.max(0, bounds.x - padding)
  const right = Math.min(sourceWidth, bounds.x + bounds.width + padding)
  const visibleWidth = right - left
  if (visibleWidth <= 0) return null

  const captureAspect = MAP_CAPTURE_WIDTH / MAP_CAPTURE_HEIGHT
  let viewHeight = visibleWidth / captureAspect
  if (viewHeight > sourceHeight) {
    viewHeight = sourceHeight
  }

  let top = Math.max(0, bounds.y - padding)
  if (top + viewHeight > sourceHeight) {
    top = Math.max(0, sourceHeight - viewHeight)
  }

  return `${left.toFixed(3)} ${top.toFixed(3)} ${visibleWidth.toFixed(3)} ${viewHeight.toFixed(3)}`
}

function wrapLines(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  return wrapTextLines(text, maxWidth, maxLines, (value) => context.measureText(value).width)
}

function drawWrappedText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number,
): number {
  const lines = wrapLines(context, text, maxWidth, maxLines)
  lines.forEach((line, index) => context.fillText(line, x, y + index * lineHeight))
  return y + lines.length * lineHeight
}

async function captureTarget(target: HTMLElement | null | undefined): Promise<HTMLCanvasElement | null> {
  if (!target) return null
  if (typeof document === 'undefined') throw new Error('Share cards can only be generated in a browser')
  if (target.scrollWidth <= 0 || target.scrollHeight <= 0) {
    throw new Error('The selected visual is not ready to capture')
  }

  const mapStage = target.dataset.shareVisual === 'map' ? createMapCaptureStage(target) : null

  try {
    const html2canvas = (await import('html2canvas')).default
    const capture = html2canvas(mapStage?.element || target, {
      backgroundColor: COLORS.white,
      scale: 1,
      useCORS: true,
      logging: false,
    })
    let timeoutId: number | null = null
    const timeout = new Promise<never>((_resolve, reject) => {
      timeoutId = window.setTimeout(() => reject(new Error('The selected visual took too long to capture')), 12000)
    })
    try {
      return await Promise.race([capture, timeout])
    } finally {
      if (timeoutId !== null) window.clearTimeout(timeoutId)
    }
  } catch {
    throw new Error('The selected visual could not be captured')
  } finally {
    mapStage?.cleanup()
  }
}

function createMapCaptureStage(
  target: HTMLElement,
): { element: HTMLDivElement; cleanup: () => void } | null {
  const svg = target.querySelector<SVGSVGElement>('svg.rsm-svg')
  if (!svg) return null

  const rawViewBox = svg.getAttribute('viewBox')?.trim().split(/\s+/).map(Number)
  if (!rawViewBox || rawViewBox.length !== 4 || rawViewBox.some((value) => !Number.isFinite(value))) {
    return null
  }
  const sourceWidth = rawViewBox[2]
  const sourceHeight = rawViewBox[3]
  const geography = svg.querySelector<SVGGraphicsElement>('.rsm-geographies')
  if (!geography) return null

  let bounds: DOMRect
  try {
    bounds = geography.getBBox()
  } catch {
    return null
  }
  const viewBox = buildMapCaptureViewBox(bounds, sourceWidth, sourceHeight)
  if (!viewBox) return null

  const stage = document.createElement('div')
  stage.setAttribute('aria-hidden', 'true')
  stage.style.position = 'fixed'
  stage.style.left = '-10000px'
  stage.style.top = '0'
  stage.style.width = `${MAP_CAPTURE_WIDTH}px`
  stage.style.height = `${MAP_CAPTURE_HEIGHT}px`
  stage.style.overflow = 'hidden'
  stage.style.background = COLORS.white
  stage.style.pointerEvents = 'none'

  const clonedSvg = svg.cloneNode(true) as SVGSVGElement
  clonedSvg.querySelector('.rsm-zoomable-group')?.removeAttribute('transform')
  clonedSvg.setAttribute('viewBox', viewBox)
  clonedSvg.setAttribute('preserveAspectRatio', 'xMidYMid meet')
  clonedSvg.style.display = 'block'
  clonedSvg.style.width = `${MAP_CAPTURE_WIDTH}px`
  clonedSvg.style.height = `${MAP_CAPTURE_HEIGHT}px`
  stage.appendChild(clonedSvg)
  document.body.appendChild(stage)

  return {
    element: stage,
    cleanup: () => stage.remove(),
  }
}

function drawCapturedVisual(
  context: CanvasRenderingContext2D,
  captured: HTMLCanvasElement | null,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  context.save()
  roundRectPath(context, x, y, width, height, 28)
  context.fillStyle = COLORS.white
  context.fill()
  context.clip()
  context.fillStyle = COLORS.softBlue
  context.fillRect(x, y, width, height)

  if (captured) {
    const scale = Math.min(width / captured.width, height / captured.height)
    const drawWidth = captured.width * scale
    const drawHeight = captured.height * scale
    context.drawImage(
      captured,
      x + (width - drawWidth) / 2,
      y + (height - drawHeight) / 2,
      drawWidth,
      drawHeight,
    )
  } else {
    ctxDotPattern(context, x, y, width, height)
    context.fillStyle = COLORS.blue
    context.font = font(800, 92)
    context.textAlign = 'center'
    context.fillText('TWT', x + width / 2, y + height / 2 + 18)
    context.font = font(700, 22)
    context.fillStyle = COLORS.ink
    context.fillText('COUNTRY DATA', x + width / 2, y + height / 2 + 58)
    context.textAlign = 'left'
  }
  context.restore()

  context.save()
  roundRectPath(context, x, y, width, height, 28)
  context.strokeStyle = COLORS.ink
  context.lineWidth = 3
  context.stroke()
  context.restore()
}

function ctxDotPattern(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  context.save()
  context.fillStyle = 'rgba(41, 76, 196, 0.18)'
  for (let dotX = x + 20; dotX < x + width - 10; dotX += 26) {
    for (let dotY = y + 20; dotY < y + height - 10; dotY += 26) {
      context.beginPath()
      context.arc(dotX, dotY, 2, 0, Math.PI * 2)
      context.fill()
    }
  }
  context.restore()
}

function paintCard(
  context: CanvasRenderingContext2D,
  input: VisualShareCardInput,
  captured: HTMLCanvasElement | null,
): void {
  const title = normalizeShareCopy(input.title)
  const description = normalizeShareCopy(input.description)
  const url = normalizeShareCopy(input.url)
  const sourceName = normalizeShareCopy(input.sourceName || 'The World Truth')
  const sourceVintage = normalizeShareCopy(input.sourceVintage || 'Unknown')
  const stat = input.stat ? normalizeShareCopy(input.stat) : ''
  const detail = input.detail ? normalizeShareCopy(input.detail) : ''

  if (!url) throw new Error('The share link is missing')

  context.fillStyle = COLORS.paper
  context.fillRect(0, 0, VISUAL_SHARE_WIDTH, VISUAL_SHARE_HEIGHT)
  context.fillStyle = COLORS.yellow
  context.fillRect(0, 0, VISUAL_SHARE_WIDTH, 14)
  context.fillStyle = COLORS.blue
  context.fillRect(0, 14, 14, VISUAL_SHARE_HEIGHT - 14)

  context.textAlign = 'left'
  context.textBaseline = 'alphabetic'
  context.fillStyle = COLORS.ink
  context.font = font(800, 24)
  context.fillText('THE WORLD TRUTH', 64, 66)
  context.fillStyle = COLORS.blue
  context.font = font(700, 16)
  context.fillText('COUNTRY DATA, MADE VISIBLE', 64, 96)

  context.fillStyle = COLORS.ink
  context.font = font(800, 52)
  const titleEnd = drawWrappedText(context, title, 64, 168, 560, 56, 2)

  context.fillStyle = COLORS.ink
  context.font = font(500, 25)
  const descriptionEnd = drawWrappedText(
    context,
    description,
    64,
    Math.max(246, titleEnd + 8),
    550,
    32,
    stat ? 3 : 4,
  )

  if (stat) {
    const statY = Math.max(402, descriptionEnd + 36)
    context.fillStyle = COLORS.coral
    context.font = font(800, 68)
    context.fillText(stat, 64, statY, 540)
    if (detail) {
      context.fillStyle = COLORS.ink
      context.font = font(600, 21)
      drawWrappedText(context, detail, 64, statY + 28, 540, 23, 1)
    }
  }

  drawCapturedVisual(context, captured, 660, 154, 476, 306)

  context.fillStyle = COLORS.ink
  context.fillRect(0, 500, VISUAL_SHARE_WIDTH, 130)
  context.fillStyle = COLORS.yellow
  const sourceLayout = buildCardSourceLayout(sourceName, sourceVintage, (value, fontSize) => {
    context.font = font(700, fontSize)
    return context.measureText(value).width
  })
  context.font = font(700, sourceLayout.fontSize)
  sourceLayout.lines.forEach((line, index) => {
    context.fillText(line, 64, 529 + index * sourceLayout.lineHeight)
  })

  context.fillStyle = COLORS.paper
  context.font = font(600, 18)
  const urlLines = wrapExactText(url, 1072, 2, (value) => context.measureText(value).width)
  if (!urlLines) throw new Error('The exact share link is too long to render')
  const lastSourceBaseline = 529 + (sourceLayout.lines.length - 1) * sourceLayout.lineHeight
  const urlY = Math.max(574, lastSourceBaseline + 22)
  urlLines.forEach((line, index) => context.fillText(line, 64, urlY + index * 22))
}

export async function generateVisualShareCard(input: VisualShareCardInput): Promise<Blob> {
  if (typeof document === 'undefined') throw new Error('Share cards can only be generated in a browser')

  const captured = await captureTarget(input.target)
  const canvas = document.createElement('canvas')
  canvas.width = VISUAL_SHARE_WIDTH
  canvas.height = VISUAL_SHARE_HEIGHT
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas is unavailable')

  paintCard(context, input, captured)

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) resolve(result)
      else reject(new Error('The share image could not be encoded'))
    }, 'image/png')
  })

  return blob
}

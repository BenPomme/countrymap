import { normalizeShareCopy } from './shareState'

export const VISUAL_SHARE_WIDTH = 1200
export const VISUAL_SHARE_HEIGHT = 630
const CARD_DISCLOSURE_MAX_LINES = 2

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

  try {
    const html2canvas = (await import('html2canvas')).default
    const capture = html2canvas(target, {
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
  context.font = font(700, 19)
  const sourceLines = buildCardSourceLines(sourceName, sourceVintage, (value) =>
    context.measureText(value).width,
  )
  sourceLines.forEach((line, index) => context.fillText(line, 64, 529 + index * 20))

  context.fillStyle = COLORS.paper
  context.font = font(600, 18)
  const urlLines = wrapExactText(url, 1072, 2, (value) => context.measureText(value).width)
  if (!urlLines) throw new Error('The exact share link is too long to render')
  urlLines.forEach((line, index) => context.fillText(line, 64, 574 + index * 22))
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

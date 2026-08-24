import { estimatePercentile } from './scoring'

export const SHARE_CARD_WIDTH = 1200
export const SHARE_CARD_HEIGHT = 630

export interface ShareCardInput {
  truthleDay: number
  score: number
  results: boolean[]
  streak: number
}

let cachedLogo: HTMLImageElement | null = null
let logoLoad: Promise<HTMLImageElement | null> | null = null

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load ${src}`))
    img.src = src
  })
}

export function preloadShareCardLogo(): void {
  if (typeof window === 'undefined' || logoLoad) return
  logoLoad = loadImage('/truthle.png')
    .then((img) => {
      cachedLogo = img
      return img
    })
    .catch(() => null)
}

async function getLogo(): Promise<HTMLImageElement | null> {
  if (cachedLogo) return cachedLogo
  if (!logoLoad) preloadShareCardLogo()
  if (!logoLoad) return null

  const timeout = new Promise<null>((resolve) => {
    window.setTimeout(() => resolve(null), 400)
  })
  const img = await Promise.race([logoLoad, timeout])
  return img
}

function fillRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
  ctx.fill()
}

function font(weight: number, size: number): string {
  return `${weight} ${size}px Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
}

export async function generateShareCardBlob(input: ShareCardInput): Promise<Blob> {
  const { truthleDay, score, results, streak } = input
  const percentile = estimatePercentile(score)
  const correctCount = results.filter(Boolean).length
  const logo = await getLogo()

  const canvas = document.createElement('canvas')
  canvas.width = SHARE_CARD_WIDTH
  canvas.height = SHARE_CARD_HEIGHT
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas is not available')

  const bg = ctx.createLinearGradient(0, 0, 0, SHARE_CARD_HEIGHT)
  bg.addColorStop(0, '#ecfdf5')
  bg.addColorStop(0.55, '#ffffff')
  bg.addColorStop(1, '#f8fafc')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, SHARE_CARD_WIDTH, SHARE_CARD_HEIGHT)

  ctx.fillStyle = '#10b981'
  ctx.fillRect(0, 0, SHARE_CARD_WIDTH, 14)
  ctx.fillRect(0, SHARE_CARD_HEIGHT - 14, SHARE_CARD_WIDTH, 14)

  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'

  const cx = SHARE_CARD_WIDTH / 2
  let y = 36

  if (logo) {
    const logoSize = 86
    ctx.drawImage(logo, cx - logoSize / 2, y, logoSize, logoSize)
    y += logoSize + 18
  } else {
    y += 28
    ctx.fillStyle = '#111827'
    ctx.font = font(800, 36)
    ctx.fillText('TRUTHLE', cx, y)
    y += 18
  }

  ctx.fillStyle = '#6b7280'
  ctx.font = font(600, 28)
  ctx.fillText(`Truthle #${truthleDay}`, cx, y + 28)

  ctx.fillStyle = '#111827'
  ctx.font = font(800, 118)
  ctx.fillText(score.toLocaleString(), cx, y + 156)

  ctx.fillStyle = '#059669'
  ctx.font = font(700, 36)
  ctx.fillText(`Top ${percentile}%`, cx, y + 208)

  const squares = 10
  const size = 74
  const gap = 14
  const gridWidth = squares * size + (squares - 1) * gap
  const startX = (SHARE_CARD_WIDTH - gridWidth) / 2
  const gridY = y + 236
  for (let i = 0; i < squares; i++) {
    const correct = results[i]
    ctx.fillStyle = correct === true ? '#10b981' : correct === false ? '#ef4444' : '#e5e7eb'
    fillRoundRect(ctx, startX + i * (size + gap), gridY, size, size, 14)
  }

  ctx.fillStyle = '#374151'
  ctx.font = font(600, 28)
  const streakLabel = streak > 0 ? `   ·   ${streak}-day streak` : ''
  ctx.fillText(`${correctCount}/10 correct${streakLabel}`, cx, gridY + size + 56)

  ctx.fillStyle = '#10b981'
  ctx.font = font(600, 24)
  ctx.fillText('theworldtruth.com/truthle', cx, SHARE_CARD_HEIGHT - 42)

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) resolve(result)
      else reject(new Error('Failed to encode share card PNG'))
    }, 'image/png')
  })
  return blob
}

export function shareCardFileName(truthleDay: number): string {
  return `truthle-${truthleDay}.png`
}

export function canShareFiles(file: File): boolean {
  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') return false
  if (typeof navigator.canShare !== 'function') return false
  try {
    return navigator.canShare({ files: [file] })
  } catch {
    return false
  }
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function isShareAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

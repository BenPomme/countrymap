import type { ShareResultData } from './resultShare'
import { GAME_TITLES } from './resultShare'

const WIDTH = 1080
const HEIGHT = 1080

export function drawShareCard(
  context: CanvasRenderingContext2D,
  data: ShareResultData,
  challengeUrl?: string,
): void {
  context.fillStyle = '#fff9e8'
  context.fillRect(0, 0, WIDTH, HEIGHT)

  context.fillStyle = '#192947'
  context.fillRect(0, 0, WIDTH, 164)
  context.fillStyle = '#ffda62'
  context.fillRect(64, 44, 82, 18)
  context.fillStyle = '#fff9e8'
  context.font = '700 34px Georgia, serif'
  context.fillText('THE WORLD TRUTH', 64, 112)

  context.fillStyle = '#192947'
  context.font = '800 72px Georgia, serif'
  context.fillText(GAME_TITLES[data.game], 64, 292)
  context.font = '600 30px Arial, sans-serif'
  context.fillStyle = '#59647a'
  context.fillText(`Day ${data.day}`, 64, 342)

  const score = data.game === 'truthle'
    ? `${data.score.toLocaleString('en-GB')} points`
    : `${data.correct}/${data.total}`
  context.fillStyle = '#192947'
  context.font = '800 118px Georgia, serif'
  context.fillText(score, 64, 526)

  context.fillStyle = '#246e55'
  context.font = '700 42px Arial, sans-serif'
  context.fillText(`${data.correct}/${data.total} correct`, 64, 598)

  context.fillStyle = '#dc654e'
  context.font = '700 42px Arial, sans-serif'
  context.fillText(`Streak: ${data.streak} ${data.streak === 1 ? 'day' : 'days'}`, 64, 664)

  context.strokeStyle = '#d8d2c2'
  context.lineWidth = 4
  context.beginPath()
  context.moveTo(64, 820)
  context.lineTo(1016, 820)
  context.stroke()

  context.fillStyle = '#192947'
  context.font = '700 30px Arial, sans-serif'
  context.fillText('Same daily challenge. Fresh questions at 00:00 UTC.', 64, 884)
  context.fillStyle = '#294cc4'
  context.font = '700 24px Arial, sans-serif'
  const destination = (challengeUrl || 'https://theworldtruth.com/challenge/').replace(/^https?:\/\//, '')
  context.fillText(destination, 64, 970)

  context.fillStyle = '#ffda62'
  context.fillRect(864, 884, 152, 96)
  context.fillStyle = '#192947'
  context.font = '800 30px Georgia, serif'
  context.fillText('PLAY', 900, 943)
}

export async function generateResultCard(data: ShareResultData, challengeUrl?: string): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = WIDTH
  canvas.height = HEIGHT
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas is not available')

  drawShareCard(context, data, challengeUrl)

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Image generation failed'))
    }, 'image/png')
  })
}

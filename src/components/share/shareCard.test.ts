import assert from 'node:assert/strict'
import test from 'node:test'
import {
  MAP_CAPTURE_HEIGHT,
  MAP_CAPTURE_WIDTH,
  buildCardSourceLayout,
  buildMapCaptureViewBox,
  buildMapShareCopy,
  type MapShareRow,
} from './shareCard'

function row(
  countryName: string,
  formatted: string,
  rankMin: number,
): MapShareRow {
  return { countryName, formatted, rankMin }
}

test('map share copy leads with the observed numeric extreme in the filtered view', () => {
  const copy = buildMapShareCopy({
    metricName: 'Happiness Index',
    categorical: false,
    rankOrder: 'highest-first',
    rows: [
      row('Finland', '7.764', 1),
      row('Denmark', '7.540', 2),
      row('Iceland', '7.500', 3),
    ],
    filteredCountryCount: 164,
  })

  assert.equal(copy.title, 'Happiness Index')
  assert.equal(copy.stat, '7.764')
  assert.equal(
    copy.description,
    'Observed largest reported value in this filtered view: Finland at 7.764.',
  )
  assert.equal(copy.detail, '3 of 164 countries in this view have a reported value.')
  assert.doesNotMatch(copy.description, /\b(best|global)\b/i)
})

test('map share copy names tied numeric leaders without inventing a winner', () => {
  const copy = buildMapShareCopy({
    metricName: 'Happiness Index',
    categorical: false,
    rankOrder: 'highest-first',
    rows: [
      row('Finland', '7.764', 1),
      row('Denmark', '7.764', 1),
      row('Iceland', '7.500', 3),
    ],
    filteredCountryCount: 12,
  })

  assert.equal(copy.stat, '7.764')
  assert.match(copy.description, /Finland and Denmark tied at 7.764/)
  assert.equal(copy.detail, '3 of 12 countries in this view have a reported value.')
})

test('map share copy follows rank order for numeric extremes', () => {
  const copy = buildMapShareCopy({
    metricName: 'Debt to GDP',
    categorical: false,
    rankOrder: 'lowest-first',
    rows: [
      row('Country A', '4.2%', 1),
      row('Country B', '8.1%', 2),
    ],
    filteredCountryCount: 20,
  })

  assert.match(copy.description, /Observed smallest reported value/)
  assert.match(copy.description, /Country A at 4.2%/)
})

test('map share copy reports tied categorical leaders honestly', () => {
  const copy = buildMapShareCopy({
    metricName: 'Major Religion',
    categorical: true,
    rankOrder: 'highest-first',
    rows: [
      row('Brazil', 'Christianity', 1),
      row('France', 'Christianity', 2),
      row('Indonesia', 'Islam', 3),
      row('Pakistan', 'Islam', 4),
      row('Thailand', 'Buddhism', 5),
    ],
    filteredCountryCount: 6,
  })

  assert.equal(copy.stat, undefined)
  assert.match(copy.description, /Christianity and Islam/)
  assert.match(copy.description, /each reported by 2 of 6 countries in this view/)
  assert.match(copy.description, /Most commonly reported categories/)
})

test('map share copy uses a short map description when no comparable fact exists', () => {
  const copy = buildMapShareCopy({
    metricName: 'Happiness Index',
    categorical: false,
    rankOrder: 'highest-first',
    rows: [],
    filteredCountryCount: 4,
  })

  assert.equal(copy.stat, undefined)
  assert.match(copy.description, /No reported value/)
  assert.equal(copy.detail, '0 of 4 countries in this view have a reported value.')
})

test('map capture crop keeps a landscape geography frame inside the source viewBox', () => {
  const viewBox = buildMapCaptureViewBox(
    { x: 23, y: 19, width: 754, height: 724 },
    800,
    600,
  )
  assert.ok(viewBox)

  const [x, y, width, height] = viewBox.split(' ').map(Number)
  assert.equal(x, 15)
  assert.equal(y, 11)
  assert.equal(width, 770)
  assert.ok(Math.abs(width / height - MAP_CAPTURE_WIDTH / MAP_CAPTURE_HEIGHT) < 0.001)
  assert.ok(y + height <= 600)
})

test('map capture dimensions match the card image slot at 2x', () => {
  assert.equal(MAP_CAPTURE_WIDTH, 476 * 2)
  assert.equal(MAP_CAPTURE_HEIGHT, 306 * 2)
})

test('map capture crop fails closed for unusable bounds', () => {
  assert.equal(buildMapCaptureViewBox({ x: 0, y: 0, width: 0, height: 0 }, 800, 600), null)
  assert.equal(buildMapCaptureViewBox({ x: 0, y: 0, width: 100, height: 100 }, 0, 600), null)
})

test('long source disclosures stay readable in the card footer', () => {
  const source = "McDonald's Corporation, Restaurants by Market 2025 (restaurant counts as of December 31, 2025), divided by a population denominator whose vintage is not established"
  const vintage = "McDonald's restaurant counts as of December 31, 2025; population denominator vintage unknown"
  const layout = buildCardSourceLayout(
    source,
    vintage,
    (value, fontSize) => value.length * fontSize * 0.55,
  )

  assert.equal(layout.lines.join(''), `Source: ${source} | Vintage: ${vintage}`)
  assert.ok(layout.fontSize >= 16)
  assert.ok(layout.lines.length <= 3)
  assert.ok(layout.lines.length * layout.lineHeight <= 54)
})

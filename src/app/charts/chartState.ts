export const CHART_KINDS = ['correlation', 'ranking', 'scatter', 'distribution'] as const
export type ChartKind = (typeof CHART_KINDS)[number]
export type ChartColor = 'religion' | 'region'

export interface ChartState {
  chart: ChartKind
  x: string
  y: string
  color: ChartColor
  metric: string
}

export const DEFAULT_CHART_STATE: ChartState = {
  chart: 'correlation',
  x: 'health.penisSize',
  y: 'democracy.score',
  color: 'religion',
  metric: 'democracy.score',
}

export interface UrlParamSource {
  get(name: string): string | null
}

export type ChartStateCandidate = Partial<Record<keyof ChartState, unknown>>

function cleanParam(value: string | null): string | null {
  if (value === null) return null
  const trimmed = value.trim()
  return trimmed.length > 0 && trimmed.length <= 120 ? trimmed : null
}

export function isChartKind(value: string | null): value is ChartKind {
  return value !== null && (CHART_KINDS as readonly string[]).includes(value)
}

export function isChartColor(value: string | null): value is ChartColor {
  return value === 'religion' || value === 'region'
}

export function normalizeChartState(
  candidate: ChartStateCandidate,
  numericVariables: ReadonlySet<string>,
): ChartState {
  const chart = typeof candidate.chart === 'string' ? candidate.chart : null
  const color = typeof candidate.color === 'string' ? candidate.color : null
  const pickVariable = (value: unknown, fallback: string) =>
    typeof value === 'string' && numericVariables.has(value) ? value : fallback

  return {
    chart: isChartKind(chart) ? chart : DEFAULT_CHART_STATE.chart,
    x: pickVariable(candidate.x, DEFAULT_CHART_STATE.x),
    y: pickVariable(candidate.y, DEFAULT_CHART_STATE.y),
    color: isChartColor(color) ? color : DEFAULT_CHART_STATE.color,
    metric: pickVariable(candidate.metric, DEFAULT_CHART_STATE.metric),
  }
}

export function parseChartState(
  params: UrlParamSource,
  numericVariables: ReadonlySet<string>,
): ChartState {
  return normalizeChartState(
    {
      chart: cleanParam(params.get('chart')) ?? undefined,
      x: cleanParam(params.get('x')) ?? undefined,
      y: cleanParam(params.get('y')) ?? undefined,
      color: cleanParam(params.get('color')) ?? undefined,
      metric: cleanParam(params.get('metric')) ?? undefined,
    },
    numericVariables,
  )
}

export function serializeChartState(state: ChartState): string {
  const params = new URLSearchParams()
  params.set('chart', state.chart)
  params.set('x', state.x)
  params.set('y', state.y)
  params.set('color', state.color)
  params.set('metric', state.metric)
  return params.toString()
}

export function chartStateHref(state: ChartState): string {
  return `/charts?${serializeChartState(state)}`
}

export function chartStatesEqual(left: ChartState, right: ChartState): boolean {
  return serializeChartState(left) === serializeChartState(right)
}

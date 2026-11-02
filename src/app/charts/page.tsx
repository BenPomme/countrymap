'use client'

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ArrowUpRight, BarChart3, CircleDot, PieChart, Trophy } from 'lucide-react'
import type { ColorVariable, Country } from '@/types/country'
import { countries, getNestedValue } from './chartData'
import { VARIABLES, VARIABLE_CATEGORIES } from '@/lib/constants/variables'
import { AdBanner } from '@/components/ads'
import { AD_SLOTS } from '@/lib/constants/ads'
import { VisualShare } from '@/components/share'
import { resolveShareProvenance } from '@/components/share/provenance'
import {
  absoluteSiteUrl,
  FALLBACK_SHARE_CONTENT_ID,
  metricShareContentId,
} from '@/components/share/shareState'
import { useEmbeddedAppMode } from '@/lib/useEmbeddedAppMode'
import {
  chartStateHref,
  chartStatesEqual,
  normalizeChartState,
  parseChartState,
  serializeChartState,
  type ChartKind,
  type ChartState,
} from './chartState'

const religionColors: Record<string, string> = {
  Christianity: '#3b82f6',
  Islam: '#22c55e',
  Hinduism: '#f97316',
  Buddhism: '#eab308',
  Judaism: '#8b5cf6',
  'Folk/Traditional': '#ec4899',
  'None/Unaffiliated': '#6b7280',
  Other: '#94a3b8',
}

const regionColors: Record<string, string> = {
  Africa: '#f97316',
  Americas: '#3b82f6',
  Asia: '#eab308',
  Europe: '#22c55e',
  Oceania: '#8b5cf6',
}

const numericVariables = Object.entries(VARIABLES)
  .filter(([, config]) => config.type === 'numeric')
  .map(([id, config]) => ({ ...config, id: id as ColorVariable }))

const numericVariableIds = new Set(numericVariables.map((variable) => variable.id))

const variablesByCategory = VARIABLE_CATEGORIES.map((category) => ({
  ...category,
  variables: numericVariables.filter((variable) => variable.category === category.id),
})).filter((category) => category.variables.length > 0)

const chartOptions: Array<{
  id: ChartKind
  label: string
  shortLabel: string
  icon: typeof BarChart3
}> = [
  { id: 'correlation', label: 'Custom Correlations', shortLabel: 'Correlation', icon: CircleDot },
  { id: 'ranking', label: 'Country Rankings', shortLabel: 'Rankings', icon: Trophy },
  { id: 'scatter', label: 'Democracy vs Wealth', shortLabel: 'Wealth', icon: BarChart3 },
  { id: 'distribution', label: 'Religion Distribution', shortLabel: 'Religion', icon: PieChart },
]

const correlationPresets = [
  { x: 'health.penisSize', y: 'education.avgIQ', label: 'Penis size vs IQ' },
  { x: 'lifestyle.happinessIndex', y: 'poverty.gdpPerCapita', label: 'Happiness vs wealth' },
  { x: 'sex.lgbtAcceptance', y: 'democracy.score', label: 'LGBT acceptance vs democracy' },
  { x: 'health.alcoholConsumption', y: 'lifestyle.happinessIndex', label: 'Alcohol vs happiness' },
  { x: 'education.avgIQ', y: 'freedom.corruptionIndex', label: 'IQ vs corruption' },
  { x: 'health.obesityRate', y: 'poverty.gdpPerCapita', label: 'Obesity vs wealth' },
]

function ChartsLoading() {
  return (
    <div className="twt-shell min-h-screen bg-[#fff9e8] px-4 py-12 text-[#192947]">
      <div className="mx-auto max-w-5xl animate-pulse rounded-3xl bg-white/70 p-8 motion-reduce:animate-none">
        Loading charts...
      </div>
    </div>
  )
}

function ChartsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const embeddedMode = useEmbeddedAppMode()
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const firstUrlCheckRef = useRef(true)
  const [state, setState] = useState<ChartState>(() =>
    parseChartState(searchParams, numericVariableIds),
  )
  const stateRef = useRef(state)

  useEffect(() => {
    const nextState = parseChartState(searchParams, numericVariableIds)
    stateRef.current = nextState
    setState((current) => (chartStatesEqual(current, nextState) ? current : nextState))
  }, [searchParams])

  useEffect(() => {
    if (!firstUrlCheckRef.current) return
    firstUrlCheckRef.current = false
    const rawQuery = searchParams.toString()
    if (!rawQuery) return
    const canonical = serializeChartState(parseChartState(searchParams, numericVariableIds))
    if (rawQuery !== canonical) {
      router.replace(chartStateHref(parseChartState(searchParams, numericVariableIds)), {
        scroll: false,
      })
    }
  }, [router, searchParams])

  const commitState = useCallback(
    (patch: Partial<ChartState>) => {
      const nextState = normalizeChartState({ ...stateRef.current, ...patch }, numericVariableIds)
      if (chartStatesEqual(stateRef.current, nextState)) return
      stateRef.current = nextState
      setState(nextState)
      router.push(chartStateHref(nextState), { scroll: false })
    },
    [router],
  )

  const rankingMetric = state.metric as ColorVariable
  const rankingConfig = VARIABLES[rankingMetric]
  const isHigherBetter = rankingConfig?.higherIsBetter ?? true

  const rankingRows = useMemo(() => {
    const sorted = (countries as Country[])
      .map((country) => ({
        name: country.name,
        value: getNestedValue(country as unknown as Record<string, unknown>, rankingMetric),
      }))
      .filter((row): row is { name: string; value: number } => typeof row.value === 'number' && Number.isFinite(row.value))
      .sort((left, right) => (isHigherBetter ? right.value - left.value : left.value - right.value))

    return {
      top: sorted.slice(0, 15),
      bottom: sorted.slice(-15).reverse(),
    }
  }, [isHigherBetter, rankingMetric])

  const formatMetricValue = useCallback(
    (value: number | null) => {
      if (value === null || !Number.isFinite(value)) return 'Not available'
      return rankingConfig?.format(value) || value.toLocaleString()
    },
    [rankingConfig],
  )

  const correlationData = useMemo(() => {
    return (countries as Country[])
      .map((country) => {
        const lookup = country as unknown as Record<string, unknown>
        const x = getNestedValue(lookup, state.x)
        const y = getNestedValue(lookup, state.y)
        return { name: country.name, x, y, religion: country.religion.major, region: country.region }
      })
      .filter(
        (row): row is { name: string; x: number; y: number; religion: string; region: string } =>
          typeof row.x === 'number' && Number.isFinite(row.x) && typeof row.y === 'number' && Number.isFinite(row.y),
      )
  }, [state.x, state.y])

  const correlation = useMemo(() => {
    if (correlationData.length < 3) return null
    const count = correlationData.length
    const sumX = correlationData.reduce((sum, row) => sum + row.x, 0)
    const sumY = correlationData.reduce((sum, row) => sum + row.y, 0)
    const sumXY = correlationData.reduce((sum, row) => sum + row.x * row.y, 0)
    const sumX2 = correlationData.reduce((sum, row) => sum + row.x * row.x, 0)
    const sumY2 = correlationData.reduce((sum, row) => sum + row.y * row.y, 0)
    const numerator = count * sumXY - sumX * sumY
    const denominator = Math.sqrt((count * sumX2 - sumX * sumX) * (count * sumY2 - sumY * sumY))
    return denominator === 0 ? null : numerator / denominator
  }, [correlationData])

  const scatterData = useMemo(() => {
    return (countries as Country[])
      .filter((country) => country.poverty.gdpPerCapita !== null && country.democracy.score > 0)
      .map((country) => ({
        name: country.name,
        x: country.democracy.score,
        y: country.poverty.gdpPerCapita as number,
        religion: country.religion.major,
      }))
  }, [])

  const religionDistribution = useMemo(() => {
    const counts: Record<string, number> = {}
    ;(countries as Country[]).forEach((country) => {
      const religion = country.religion.major || 'Unknown'
      counts[religion] = (counts[religion] || 0) + 1
    })
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((left, right) => right.count - left.count)
  }, [])

  const xConfig = VARIABLES[state.x as ColorVariable]
  const yConfig = VARIABLES[state.y as ColorVariable]
  const colorFor = (entry: { religion: string; region: string }) =>
    state.color === 'religion'
      ? religionColors[entry.religion] || '#94a3b8'
      : regionColors[entry.region] || '#94a3b8'

  const shareDetails = useMemo(() => {
    if (state.chart === 'correlation') {
      const title = `${xConfig?.name || state.x} and ${yConfig?.name || state.y}`
      const stat = correlation === null ? 'Not enough data' : `r = ${correlation.toFixed(2)}`
      return {
        title,
        description: `Country level correlation from ${correlationData.length} countries with values for both measures.`,
        stat,
        detail: `${correlationData.length} countries compared`,
        metricIds: [state.x, state.y],
      }
    }
    if (state.chart === 'ranking') {
      const leader = rankingRows.top[0]
      return {
        title: `Countries ranked by ${rankingConfig?.name || state.metric}`,
        description: `Top and bottom country values for ${rankingConfig?.name || state.metric}.`,
        stat: leader ? formatMetricValue(leader.value) : 'No ranked values',
        detail: leader ? `${leader.name} leads this ranking` : 'No country has a value for this measure',
        metricIds: [state.metric],
      }
    }
    if (state.chart === 'scatter') {
      return {
        title: 'Democracy score and GDP per capita',
        description: `Each point is a country with a democracy score and a GDP per capita value. ${scatterData.length} countries are shown.`,
        stat: `${scatterData.length} countries`,
        detail: 'Democracy score against nominal GDP per capita',
        metricIds: ['democracy.score', 'poverty.gdpPerCapita'],
      }
    }
    const largestGroup = religionDistribution[0]
    return {
      title: 'Countries by majority religion',
      description: `Majority religion groups across ${(countries as Country[]).length} countries in the dataset.`,
      stat: largestGroup ? `${largestGroup.count} countries` : 'No group values',
      detail: largestGroup ? `${largestGroup.name} is the largest group` : 'No religion groups available',
      metricIds: [],
    }
  }, [
    correlation,
    correlationData.length,
    formatMetricValue,
    rankingConfig?.name,
    rankingRows.top,
    religionDistribution,
    scatterData.length,
    state.chart,
    state.metric,
    state.x,
    state.y,
    xConfig?.name,
    yConfig?.name,
  ])

  const provenance = useMemo(
    () => resolveShareProvenance(shareDetails.metricIds),
    [shareDetails.metricIds],
  )
  const shareContentId = useMemo(() => {
    if (state.chart === 'correlation') {
      return metricShareContentId('chart_correlation', [state.x, state.y])
    }
    if (state.chart === 'ranking') {
      return metricShareContentId('chart_ranking', [state.metric])
    }
    if (state.chart === 'scatter') {
      return metricShareContentId('chart_scatter', ['democracy.score', 'poverty.gdpPerCapita'])
    }
    return FALLBACK_SHARE_CONTENT_ID
  }, [state.chart, state.metric, state.x, state.y])
  const shareUrl = absoluteSiteUrl(chartStateHref(state))

  return (
    <div className="twt-shell min-h-screen bg-[#fff9e8] text-[#192947]">
      <main
        className={`twt-container mx-auto max-w-6xl px-4 ${embeddedMode ? 'py-4' : 'py-8 md:py-12'}`}
      >
        <header className="mb-7 grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <p className="twt-kicker text-xs font-black uppercase tracking-[0.2em] text-[#294cc4]">
              Explore the data
            </p>
            <h1 className="twt-display mt-2 max-w-3xl text-4xl font-black leading-[0.98] tracking-tight md:text-6xl">
              Charts that make country data visible
            </h1>
            <p className="twt-prose mt-4 max-w-2xl text-base leading-7 text-[#192947]/72 md:text-lg">
              Compare two measures, rank a whole catalogue or inspect broad patterns. Every chart link keeps its exact selection.
            </p>
          </div>
          <VisualShare
            targetRef={chartContainerRef}
            title={shareDetails.title}
            description={shareDetails.description}
            url={shareUrl}
            stat={shareDetails.stat}
            detail={shareDetails.detail}
            sourceName={provenance.sourceName}
            sourceVintage={provenance.sourceVintage}
            sourceUrl={provenance.sourceUrl}
            contentId={shareContentId}
            placement="charts_header"
            className="justify-self-start lg:justify-self-end"
          />
        </header>

        {!embeddedMode && (
          <AdBanner slotId={AD_SLOTS.chartsBanner} hideOnMobile={true} className="mb-7" />
        )}

        <nav aria-label="Chart type" className="mb-5 flex gap-2 overflow-x-auto pb-2">
          {chartOptions.map((option) => {
            const Icon = option.icon
            const selected = state.chart === option.id
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={selected}
                onClick={() => commitState({ chart: option.id })}
                className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-bold transition-colors motion-reduce:transition-none ${
                  selected
                    ? 'border-[#294cc4] bg-[#294cc4] text-white'
                    : 'border-[#192947]/15 bg-white text-[#192947] hover:border-[#294cc4]/45'
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span className="sm:hidden">{option.shortLabel}</span>
                <span className="hidden sm:inline">{option.label}</span>
              </button>
            )
          })}
        </nav>

        <div ref={chartContainerRef} className="twt-panel rounded-[28px] border border-[#192947]/12 bg-white p-4 shadow-sm md:p-7">
          {state.chart === 'correlation' && (
            <section aria-labelledby="correlation-heading">
              <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 id="correlation-heading" className="text-2xl font-black tracking-tight">
                    Custom correlation explorer
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-[#192947]/65">
                    Choose two numeric country measures. The coefficient describes this dataset, not cause and effect.
                  </p>
                </div>
                <p className="rounded-full bg-[#294cc4]/8 px-3 py-1.5 text-sm font-bold text-[#294cc4]">
                  {correlation === null ? 'Not enough matching values' : `r = ${correlation.toFixed(2)}`}
                </p>
              </div>

              <div className="mb-6 grid gap-3 md:grid-cols-3">
                <label className="text-sm font-bold">
                  Horizontal axis
                  <select
                    value={state.x}
                    onChange={(event) => commitState({ x: event.target.value })}
                    className="mt-2 w-full rounded-xl border border-[#192947]/20 bg-[#fff9e8] px-3 py-2.5 font-normal"
                  >
                    {variablesByCategory.map((category) => (
                      <optgroup key={category.id} label={`${category.icon} ${category.name}`}>
                        {category.variables.map((variable) => (
                          <option key={variable.id} value={variable.id}>{variable.name}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-bold">
                  Vertical axis
                  <select
                    value={state.y}
                    onChange={(event) => commitState({ y: event.target.value })}
                    className="mt-2 w-full rounded-xl border border-[#192947]/20 bg-[#fff9e8] px-3 py-2.5 font-normal"
                  >
                    {variablesByCategory.map((category) => (
                      <optgroup key={category.id} label={`${category.icon} ${category.name}`}>
                        {category.variables.map((variable) => (
                          <option key={variable.id} value={variable.id}>{variable.name}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-bold">
                  Colour points by
                  <select
                    value={state.color}
                    onChange={(event) => commitState({ color: event.target.value as ChartState['color'] })}
                    className="mt-2 w-full rounded-xl border border-[#192947]/20 bg-[#fff9e8] px-3 py-2.5 font-normal"
                  >
                    <option value="religion">Major religion</option>
                    <option value="region">Region</option>
                  </select>
                </label>
              </div>

              <div className="h-[380px] w-full md:h-[520px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 12, right: 24, bottom: 54, left: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#19294722" />
                    <XAxis
                      type="number"
                      dataKey="x"
                      name={xConfig?.name || state.x}
                      tick={{ fontSize: 12 }}
                      label={{ value: xConfig?.name || state.x, position: 'bottom', offset: 34 }}
                    />
                    <YAxis
                      type="number"
                      dataKey="y"
                      name={yConfig?.name || state.y}
                      tick={{ fontSize: 12 }}
                      width={72}
                      label={{ value: yConfig?.name || state.y, angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter name="Countries" data={correlationData}>
                      {correlationData.map((entry) => (
                        <Cell key={`${entry.name}-${entry.x}-${entry.y}`} fill={colorFor(entry)} />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-5 border-t border-[#192947]/10 pt-5">
                <p className="mb-2 text-xs font-black uppercase tracking-[0.15em] text-[#192947]/55">
                  Try a known pairing
                </p>
                <div className="flex flex-wrap gap-2">
                  {correlationPresets.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => commitState({ x: preset.x, y: preset.y })}
                      className="rounded-full border border-[#192947]/15 bg-[#fff9e8] px-3 py-1.5 text-xs font-bold hover:border-[#294cc4]/45"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </section>
          )}

          {state.chart === 'ranking' && (
            <section aria-labelledby="ranking-heading">
              <div className="mb-5 grid gap-4 md:grid-cols-[minmax(0,1fr)_320px] md:items-end">
                <div>
                  <h2 id="ranking-heading" className="text-2xl font-black tracking-tight">
                    Country rankings
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-[#192947]/65">
                    The top and bottom 15 countries with a value for the selected measure.
                  </p>
                </div>
                <label className="text-sm font-bold">
                  Ranking measure
                  <select
                    value={state.metric}
                    onChange={(event) => commitState({ metric: event.target.value })}
                    className="mt-2 w-full rounded-xl border border-[#192947]/20 bg-[#fff9e8] px-3 py-2.5 font-normal"
                  >
                    {variablesByCategory.map((category) => (
                      <optgroup key={category.id} label={`${category.icon} ${category.name}`}>
                        {category.variables.map((variable) => (
                          <option key={variable.id} value={variable.id}>{variable.name}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </label>
              </div>

              {rankingRows.top.length === 0 ? (
                <p className="rounded-2xl bg-[#fff9e8] p-6 text-[#192947]/70">
                  No countries have a value for this measure.
                </p>
              ) : (
                <div className="grid gap-5 xl:grid-cols-2">
                  <div>
                    <h3 className="mb-2 flex items-center gap-2 text-sm font-black uppercase tracking-[0.12em] text-[#294cc4]">
                      <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                      First ranked group
                    </h3>
                    <div className="h-[480px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={rankingRows.top} layout="vertical" margin={{ top: 5, right: 22, bottom: 5, left: 4 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#19294722" />
                          <XAxis type="number" tick={{ fontSize: 11 }} />
                          <YAxis type="category" dataKey="name" width={112} tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Bar dataKey="value" name={rankingConfig?.name || state.metric} fill="#294cc4" radius={[0, 6, 6, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div>
                    <h3 className="mb-2 flex items-center gap-2 text-sm font-black uppercase tracking-[0.12em] text-[#dc654e]">
                      <ArrowUpRight className="h-4 w-4 rotate-180" aria-hidden="true" />
                      Final ranked group
                    </h3>
                    <div className="h-[480px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={rankingRows.bottom} layout="vertical" margin={{ top: 5, right: 22, bottom: 5, left: 4 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#19294722" />
                          <XAxis type="number" tick={{ fontSize: 11 }} />
                          <YAxis type="category" dataKey="name" width={112} tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Bar dataKey="value" name={rankingConfig?.name || state.metric} fill="#dc654e" radius={[0, 6, 6, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}

          {state.chart === 'scatter' && (
            <section aria-labelledby="wealth-heading">
              <h2 id="wealth-heading" className="text-2xl font-black tracking-tight">
                Democracy score and GDP per capita
              </h2>
              <p className="mt-1 text-sm leading-6 text-[#192947]/65">
                Each dot is a country with both values. Colour shows the majority religion in the dataset.
              </p>
              <div className="mt-5 h-[380px] md:h-[560px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 16, right: 24, bottom: 56, left: 34 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#19294722" />
                    <XAxis
                      type="number"
                      dataKey="x"
                      name="Democracy score"
                      domain={[0, 100]}
                      label={{ value: 'Democracy score', position: 'bottom', offset: 36 }}
                    />
                    <YAxis
                      type="number"
                      dataKey="y"
                      name="GDP per capita"
                      tickFormatter={(value) => `$${Math.round(Number(value) / 1000)}k`}
                      width={72}
                      label={{ value: 'GDP per capita in USD', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip />
                    <Scatter name="Countries" data={scatterData}>
                      {scatterData.map((entry) => (
                        <Cell key={entry.name} fill={religionColors[entry.religion] || '#94a3b8'} />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 flex flex-wrap justify-center gap-3">
                {Object.entries(religionColors).map(([religion, color]) => (
                  <span key={religion} className="inline-flex items-center gap-1.5 text-xs text-[#192947]/70">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                    {religion}
                  </span>
                ))}
              </div>
            </section>
          )}

          {state.chart === 'distribution' && (
            <section aria-labelledby="religion-heading">
              <h2 id="religion-heading" className="text-2xl font-black tracking-tight">
                Countries by majority religion
              </h2>
              <p className="mt-1 text-sm leading-6 text-[#192947]/65">
                Number of countries where each group is the majority religion in the country dataset.
              </p>
              <div className="mt-5 h-[340px] md:h-[460px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={religionDistribution} margin={{ top: 18, right: 24, bottom: 72, left: 18 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#19294722" />
                    <XAxis dataKey="name" angle={-38} textAnchor="end" height={92} tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} label={{ value: 'Countries', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Bar dataKey="count" name="Countries">
                      {religionDistribution.map((entry) => (
                        <Cell key={entry.name} fill={religionColors[entry.name] || '#94a3b8'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}
        </div>

        {!embeddedMode && <AdBanner slotId={AD_SLOTS.chartsInFeed} className="mt-7" />}

        <footer className="mt-7 flex flex-col gap-3 rounded-2xl border border-[#192947]/10 bg-white/60 p-5 text-sm text-[#192947]/65 sm:flex-row sm:items-center sm:justify-between">
          <p>Correlation is a descriptive statistic. It does not establish that one measure causes another.</p>
          <p className="font-bold text-[#192947]">{numericVariables.length} numeric measures available</p>
        </footer>
      </main>
    </div>
  )
}

export default function ChartsPage() {
  return (
    <Suspense fallback={<ChartsLoading />}>
      <ChartsContent />
    </Suspense>
  )
}

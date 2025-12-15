'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  Cell,
  Legend,
} from 'recharts'
import type { Country, ColorVariable } from '@/types/country'
import { Globe, ArrowLeft } from 'lucide-react'
import countriesData from '../../../data/countries.json'
import { VARIABLES, VARIABLE_CATEGORIES } from '@/lib/constants/variables'

const religionColors: Record<string, string> = {
  'Christianity': '#3b82f6',
  'Islam': '#22c55e',
  'Hinduism': '#f97316',
  'Buddhism': '#eab308',
  'Judaism': '#8b5cf6',
  'Folk/Traditional': '#ec4899',
  'None/Unaffiliated': '#6b7280',
  'Other': '#94a3b8',
}

// Helper to get nested value from object path like 'health.penisSize'
function getNestedValue(obj: Record<string, unknown>, path: string): number | string | null {
  const keys = path.split('.')
  let value: unknown = obj
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = (value as Record<string, unknown>)[key]
    } else {
      return null
    }
  }
  return value as number | string | null
}

// Get numeric variables only (for correlation charts)
const numericVariables = Object.entries(VARIABLES)
  .filter(([, config]) => config.type === 'numeric')
  .map(([varId, config]) => ({ ...config, id: varId as ColorVariable }))

// Group variables by category
const variablesByCategory = VARIABLE_CATEGORIES.map(cat => ({
  ...cat,
  variables: numericVariables.filter(v => v.category === cat.id)
})).filter(cat => cat.variables.length > 0)

export default function ChartsPage() {
  const countries = countriesData as Country[]
  const [selectedChart, setSelectedChart] = useState<'ranking' | 'scatter' | 'correlation' | 'distribution'>('correlation')
  const [rankingMetric, setRankingMetric] = useState<'democracy' | 'gdp' | 'gender' | 'homicide'>('democracy')

  // Custom correlation state
  const [xVariable, setXVariable] = useState<ColorVariable>('health.penisSize')
  const [yVariable, setYVariable] = useState<ColorVariable>('democracy.score')
  const [colorBy, setColorBy] = useState<'religion' | 'region'>('religion')

  // Top/Bottom countries by selected metric
  const rankedCountries = useMemo(() => {
    const sorted = [...countries].filter((c) => {
      if (rankingMetric === 'democracy') return c.democracy.score > 0
      if (rankingMetric === 'gdp') return c.poverty.gdpPerCapita !== null
      if (rankingMetric === 'gender') return c.gender.wblIndex !== null
      if (rankingMetric === 'homicide') return c.crime.homicideRate !== null
      return true
    }).sort((a, b) => {
      if (rankingMetric === 'democracy') return b.democracy.score - a.democracy.score
      if (rankingMetric === 'gdp') return (b.poverty.gdpPerCapita || 0) - (a.poverty.gdpPerCapita || 0)
      if (rankingMetric === 'gender') return (b.gender.wblIndex || 0) - (a.gender.wblIndex || 0)
      if (rankingMetric === 'homicide') return (a.crime.homicideRate || 0) - (b.crime.homicideRate || 0)
      return 0
    })

    if (rankingMetric === 'homicide') {
      return {
        top: sorted.slice(0, 15),
        bottom: sorted.slice(-15).reverse(),
      }
    }

    return {
      top: sorted.slice(0, 15),
      bottom: sorted.slice(-15).reverse(),
    }
  }, [countries, rankingMetric])

  const getMetricValue = (country: Country) => {
    if (rankingMetric === 'democracy') return country.democracy.score
    if (rankingMetric === 'gdp') return country.poverty.gdpPerCapita
    if (rankingMetric === 'gender') return country.gender.wblIndex
    if (rankingMetric === 'homicide') return country.crime.homicideRate
    return 0
  }

  const formatMetricValue = (value: number | null) => {
    if (value === null) return 'N/A'
    if (rankingMetric === 'gdp') return `$${value.toLocaleString()}`
    if (rankingMetric === 'homicide') return `${value.toFixed(1)} per 100k`
    return value.toString()
  }

  const getMetricLabel = () => {
    if (rankingMetric === 'democracy') return 'Democracy Score'
    if (rankingMetric === 'gdp') return 'GDP per Capita'
    if (rankingMetric === 'gender') return 'Gender Equality'
    if (rankingMetric === 'homicide') return 'Homicide Rate'
    return ''
  }

  // Custom correlation data
  const correlationData = useMemo(() => {
    return countries
      .filter((c) => {
        const xVal = getNestedValue(c as unknown as Record<string, unknown>, xVariable)
        const yVal = getNestedValue(c as unknown as Record<string, unknown>, yVariable)
        return xVal !== null && yVal !== null && typeof xVal === 'number' && typeof yVal === 'number'
      })
      .map((c) => ({
        name: c.name,
        x: getNestedValue(c as unknown as Record<string, unknown>, xVariable) as number,
        y: getNestedValue(c as unknown as Record<string, unknown>, yVariable) as number,
        religion: c.religion.major,
        region: c.region,
      }))
  }, [countries, xVariable, yVariable])

  // Calculate correlation coefficient
  const correlation = useMemo(() => {
    if (correlationData.length < 3) return null
    const n = correlationData.length
    const sumX = correlationData.reduce((sum, d) => sum + d.x, 0)
    const sumY = correlationData.reduce((sum, d) => sum + d.y, 0)
    const sumXY = correlationData.reduce((sum, d) => sum + d.x * d.y, 0)
    const sumX2 = correlationData.reduce((sum, d) => sum + d.x * d.x, 0)
    const sumY2 = correlationData.reduce((sum, d) => sum + d.y * d.y, 0)

    const numerator = n * sumXY - sumX * sumY
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))

    if (denominator === 0) return null
    return numerator / denominator
  }, [correlationData])

  // Scatter data: Democracy vs GDP
  const scatterData = useMemo(() => {
    return countries
      .filter((c) => c.poverty.gdpPerCapita !== null && c.democracy.score > 0)
      .map((c) => ({
        name: c.name,
        x: c.democracy.score,
        y: c.poverty.gdpPerCapita,
        religion: c.religion.major,
      }))
  }, [countries])

  // Religion distribution
  const religionDistribution = useMemo(() => {
    const counts: Record<string, number> = {}
    countries.forEach((c) => {
      const religion = c.religion.major || 'Unknown'
      counts[religion] = (counts[religion] || 0) + 1
    })
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
  }, [countries])

  const regionColors: Record<string, string> = {
    'Africa': '#f97316',
    'Americas': '#3b82f6',
    'Asia': '#eab308',
    'Europe': '#22c55e',
    'Oceania': '#8b5cf6',
  }

  const getColor = (entry: { religion: string; region: string }) => {
    if (colorBy === 'religion') {
      return religionColors[entry.religion] || '#94a3b8'
    }
    return regionColors[entry.region] || '#94a3b8'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">The World Truth Map</h1>
              <p className="text-sm text-gray-500">Country rankings & correlations</p>
            </div>
          </div>
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Map
          </Link>
        </div>
      </header>

      {/* Chart Selection */}
      <div className="p-6">
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setSelectedChart('correlation')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedChart === 'correlation'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Custom Correlations
          </button>
          <button
            onClick={() => setSelectedChart('ranking')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedChart === 'ranking'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Country Rankings
          </button>
          <button
            onClick={() => setSelectedChart('scatter')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedChart === 'scatter'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Democracy vs Wealth
          </button>
          <button
            onClick={() => setSelectedChart('distribution')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedChart === 'distribution'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Religion Distribution
          </button>
        </div>

        {/* Custom Correlation Chart */}
        {selectedChart === 'correlation' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-2">Custom Correlation Explorer</h2>
            <p className="text-sm text-gray-500 mb-4">
              Select any two variables to explore correlations between them
            </p>

            {/* Variable Selectors */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">X-Axis Variable</label>
                <select
                  value={xVariable}
                  onChange={(e) => setXVariable(e.target.value as ColorVariable)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  {variablesByCategory.map(cat => (
                    <optgroup key={cat.id} label={`${cat.icon} ${cat.name}`}>
                      {cat.variables.map(v => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Y-Axis Variable</label>
                <select
                  value={yVariable}
                  onChange={(e) => setYVariable(e.target.value as ColorVariable)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  {variablesByCategory.map(cat => (
                    <optgroup key={cat.id} label={`${cat.icon} ${cat.name}`}>
                      {cat.variables.map(v => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color By</label>
                <select
                  value={colorBy}
                  onChange={(e) => setColorBy(e.target.value as 'religion' | 'region')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="religion">Religion</option>
                  <option value="region">Region</option>
                </select>
              </div>
            </div>

            {/* Correlation Stats */}
            <div className="flex flex-wrap gap-4 mb-4">
              <div className="bg-gray-50 rounded-lg px-4 py-2">
                <span className="text-sm text-gray-500">Countries with data:</span>
                <span className="ml-2 font-semibold">{correlationData.length}</span>
              </div>
              {correlation !== null && (
                <div className={`rounded-lg px-4 py-2 ${
                  Math.abs(correlation) > 0.7 ? 'bg-green-50' :
                  Math.abs(correlation) > 0.4 ? 'bg-yellow-50' : 'bg-gray-50'
                }`}>
                  <span className="text-sm text-gray-500">Correlation (r):</span>
                  <span className={`ml-2 font-semibold ${
                    Math.abs(correlation) > 0.7 ? 'text-green-700' :
                    Math.abs(correlation) > 0.4 ? 'text-yellow-700' : 'text-gray-700'
                  }`}>
                    {correlation.toFixed(3)}
                    {Math.abs(correlation) > 0.7 ? ' (Strong)' :
                     Math.abs(correlation) > 0.4 ? ' (Moderate)' : ' (Weak)'}
                  </span>
                </div>
              )}
            </div>

            {/* Scatter Plot */}
            <div className="h-[500px]">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 60, left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    dataKey="x"
                    name={VARIABLES[xVariable]?.name || xVariable}
                    domain={['auto', 'auto']}
                    label={{
                      value: VARIABLES[xVariable]?.name || xVariable,
                      position: 'bottom',
                      offset: 40
                    }}
                    tickFormatter={(v) => {
                      const config = VARIABLES[xVariable]
                      if (config?.format) {
                        const formatted = config.format(v)
                        return formatted.replace(/[^\d.,]/g, '').slice(0, 6)
                      }
                      return v
                    }}
                  />
                  <YAxis
                    type="number"
                    dataKey="y"
                    name={VARIABLES[yVariable]?.name || yVariable}
                    domain={['auto', 'auto']}
                    label={{
                      value: VARIABLES[yVariable]?.name || yVariable,
                      angle: -90,
                      position: 'left',
                      offset: 60
                    }}
                    tickFormatter={(v) => {
                      const config = VARIABLES[yVariable]
                      if (config?.format) {
                        const formatted = config.format(v)
                        return formatted.replace(/[^\d.,]/g, '').slice(0, 6)
                      }
                      return v
                    }}
                  />
                  <Tooltip
                    content={({ payload }) => {
                      if (!payload || payload.length === 0) return null
                      const data = payload[0]?.payload
                      if (!data) return null
                      const xConfig = VARIABLES[xVariable]
                      const yConfig = VARIABLES[yVariable]
                      return (
                        <div className="bg-white border border-gray-200 rounded p-3 shadow-lg">
                          <p className="font-semibold text-gray-900">{data.name}</p>
                          <p className="text-sm text-gray-600">
                            {xConfig?.name}: {xConfig?.format(data.x) || data.x}
                          </p>
                          <p className="text-sm text-gray-600">
                            {yConfig?.name}: {yConfig?.format(data.y) || data.y}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {colorBy === 'religion' ? data.religion : data.region}
                          </p>
                        </div>
                      )
                    }}
                  />
                  <Scatter name="Countries" data={correlationData}>
                    {correlationData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={getColor(entry)}
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 mb-2">
                Points colored by {colorBy === 'religion' ? 'major religion' : 'region'}:
              </p>
              <div className="flex flex-wrap gap-3">
                {Object.entries(colorBy === 'religion' ? religionColors : regionColors).map(([label, color]) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                    <span className="text-xs text-gray-600">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Presets */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 mb-2">Interesting correlations to explore:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { x: 'health.penisSize', y: 'education.avgIQ', label: 'Penis Size vs IQ' },
                  { x: 'lifestyle.happinessIndex', y: 'poverty.gdpPerCapita', label: 'Happiness vs Wealth' },
                  { x: 'sex.lgbtAcceptance', y: 'democracy.score', label: 'LGBT Acceptance vs Democracy' },
                  { x: 'health.alcoholConsumption', y: 'lifestyle.happinessIndex', label: 'Alcohol vs Happiness' },
                  { x: 'education.avgIQ', y: 'freedom.corruptionIndex', label: 'IQ vs Corruption' },
                  { x: 'health.obesityRate', y: 'poverty.gdpPerCapita', label: 'Obesity vs Wealth' },
                  { x: 'lifestyle.coffeeConsumption', y: 'education.avgIQ', label: 'Coffee vs IQ' },
                  { x: 'sex.sexualPartners', y: 'sex.lgbtAcceptance', label: 'Partners vs LGBT Acceptance' },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => {
                      setXVariable(preset.x as ColorVariable)
                      setYVariable(preset.y as ColorVariable)
                    }}
                    className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700 transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Rankings Chart */}
        {selectedChart === 'ranking' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Country Rankings</h2>
              <select
                value={rankingMetric}
                onChange={(e) => setRankingMetric(e.target.value as typeof rankingMetric)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="democracy">Democracy Score</option>
                <option value="gdp">GDP per Capita</option>
                <option value="gender">Gender Equality</option>
                <option value="homicide">Homicide Rate (per 100k)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="text-sm font-medium text-green-600 mb-4">
                  {rankingMetric === 'homicide' ? 'Safest 15 Countries (Lowest Homicide Rate)' : 'Top 15 Countries'}
                </h3>
                <div className="h-[500px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={rankedCountries.top.map(c => ({
                        ...c,
                        value: getMetricValue(c),
                        displayName: c.name,
                        religion: c.religion.major,
                      }))}
                      margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, rankingMetric === 'gdp' ? 'auto' : rankingMetric === 'homicide' ? 'auto' : 100]} />
                      <YAxis
                        dataKey="displayName"
                        type="category"
                        width={95}
                        tick={{ fontSize: 11 }}
                      />
                      <Tooltip
                        content={({ payload }) => {
                          if (!payload || payload.length === 0) return null
                          const data = payload[0]?.payload
                          if (!data) return null
                          return (
                            <div className="bg-white border border-gray-200 rounded p-2 shadow">
                              <p className="font-medium">{data.name}</p>
                              <p className="text-sm">{getMetricLabel()}: {formatMetricValue(data.value)}</p>
                              <p className="text-sm flex items-center gap-1">
                                Religion:
                                <span
                                  className="inline-block w-2 h-2 rounded-full"
                                  style={{ backgroundColor: religionColors[data.religion] || '#94a3b8' }}
                                />
                                {data.religion}
                              </p>
                            </div>
                          )
                        }}
                      />
                      <Bar dataKey="value">
                        {rankedCountries.top.map((entry) => (
                          <Cell
                            key={entry.iso3}
                            fill={religionColors[entry.religion.major] || '#94a3b8'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-red-600 mb-4">
                  {rankingMetric === 'homicide' ? 'Most Dangerous 15 Countries (Highest Homicide Rate)' : 'Bottom 15 Countries'}
                </h3>
                <div className="h-[500px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={rankedCountries.bottom.map(c => ({
                        ...c,
                        value: getMetricValue(c),
                        displayName: c.name,
                        religion: c.religion.major,
                      }))}
                      margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, rankingMetric === 'gdp' ? 'auto' : rankingMetric === 'homicide' ? 'auto' : 100]} />
                      <YAxis
                        dataKey="displayName"
                        type="category"
                        width={95}
                        tick={{ fontSize: 11 }}
                      />
                      <Tooltip
                        content={({ payload }) => {
                          if (!payload || payload.length === 0) return null
                          const data = payload[0]?.payload
                          if (!data) return null
                          return (
                            <div className="bg-white border border-gray-200 rounded p-2 shadow">
                              <p className="font-medium">{data.name}</p>
                              <p className="text-sm">{getMetricLabel()}: {formatMetricValue(data.value)}</p>
                              <p className="text-sm flex items-center gap-1">
                                Religion:
                                <span
                                  className="inline-block w-2 h-2 rounded-full"
                                  style={{ backgroundColor: religionColors[data.religion] || '#94a3b8' }}
                                />
                                {data.religion}
                              </p>
                            </div>
                          )
                        }}
                      />
                      <Bar dataKey="value">
                        {rankedCountries.bottom.map((entry) => (
                          <Cell
                            key={entry.iso3}
                            fill={religionColors[entry.religion.major] || '#94a3b8'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Religion Legend */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 mb-2">Bars colored by major religion:</p>
              <div className="flex flex-wrap gap-3">
                {Object.entries(religionColors).map(([religion, color]) => (
                  <div key={religion} className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: color }} />
                    <span className="text-xs text-gray-600">{religion}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Scatter Chart */}
        {selectedChart === 'scatter' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-2">Democracy Score vs GDP per Capita</h2>
            <p className="text-sm text-gray-500 mb-6">
              Each dot represents a country, colored by major religion
            </p>
            <div className="h-[600px]">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 60, left: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    dataKey="x"
                    name="Democracy"
                    domain={[0, 100]}
                    label={{ value: 'Democracy Score', position: 'bottom', offset: 40 }}
                  />
                  <YAxis
                    type="number"
                    dataKey="y"
                    name="GDP"
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                    label={{ value: 'GDP per Capita (USD)', angle: -90, position: 'left', offset: 40 }}
                  />
                  <Tooltip
                    content={({ payload }) => {
                      if (!payload || payload.length === 0) return null
                      const data = payload[0]?.payload
                      if (!data) return null
                      return (
                        <div className="bg-white border border-gray-200 rounded p-2 shadow">
                          <p className="font-medium">{data.name}</p>
                          <p className="text-sm">Democracy: {data.x}</p>
                          <p className="text-sm">GDP: ${data.y?.toLocaleString()}</p>
                          <p className="text-sm text-gray-500">{data.religion}</p>
                        </div>
                      )
                    }}
                  />
                  <Scatter name="Countries" data={scatterData}>
                    {scatterData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={religionColors[entry.religion] || '#94a3b8'}
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-4 mt-4 justify-center">
              {Object.entries(religionColors).slice(0, 6).map(([religion, color]) => (
                <div key={religion} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-sm text-gray-600">{religion}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Distribution Chart */}
        {selectedChart === 'distribution' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-2">Countries by Major Religion</h2>
            <p className="text-sm text-gray-500 mb-6">
              Number of countries where each religion is the majority
            </p>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={religionDistribution} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 12 }} />
                  <YAxis label={{ value: 'Number of Countries', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Bar dataKey="count" name="Countries">
                    {religionDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={religionColors[entry.name] || '#94a3b8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

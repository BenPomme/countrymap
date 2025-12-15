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
} from 'recharts'
import type { Country } from '@/types/country'
import { Globe, ArrowLeft } from 'lucide-react'
import countriesData from '../../../data/countries.json'

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

export default function ChartsPage() {
  const countries = countriesData as Country[]
  const [selectedChart, setSelectedChart] = useState<'ranking' | 'scatter' | 'distribution'>('ranking')
  const [rankingMetric, setRankingMetric] = useState<'democracy' | 'gdp' | 'gender' | 'homicide'>('democracy')

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
      if (rankingMetric === 'homicide') return (a.crime.homicideRate || 0) - (b.crime.homicideRate || 0) // Lower is better
      return 0
    })

    // For homicide, "top" means safest (lowest rate), "bottom" means most dangerous
    if (rankingMetric === 'homicide') {
      return {
        top: sorted.slice(0, 15), // Safest
        bottom: sorted.slice(-15).reverse(), // Most dangerous
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Charts & Analytics</h1>
              <p className="text-sm text-gray-500">Explore country data through visualizations</p>
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
        <div className="flex gap-2 mb-6">
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

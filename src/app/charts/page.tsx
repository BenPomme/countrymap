'use client'

import { useState, useMemo, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
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
import type { Country, ColorVariable } from '@/types/country'
import { Globe, ArrowLeft, Share2, Twitter, Facebook, Linkedin, Link2, Check, Menu } from 'lucide-react'
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

const regionColors: Record<string, string> = {
  'Africa': '#f97316',
  'Americas': '#3b82f6',
  'Asia': '#eab308',
  'Europe': '#22c55e',
  'Oceania': '#8b5cf6',
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

// Loading fallback component
function ChartsLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-gray-500">Loading charts...</div>
    </div>
  )
}

// Main charts component that uses useSearchParams
function ChartsContent() {
  const countries = countriesData as Country[]
  const router = useRouter()
  const searchParams = useSearchParams()

  // Read initial state from URL params
  const initialChart = (searchParams.get('chart') as 'ranking' | 'scatter' | 'correlation' | 'distribution') || 'correlation'
  const initialX = (searchParams.get('x') as ColorVariable) || 'health.penisSize'
  const initialY = (searchParams.get('y') as ColorVariable) || 'democracy.score'
  const initialColor = (searchParams.get('color') as 'religion' | 'region') || 'religion'
  const initialMetric = (searchParams.get('metric') as ColorVariable) || 'democracy.score'

  const [selectedChart, setSelectedChart] = useState<'ranking' | 'scatter' | 'correlation' | 'distribution'>(initialChart)
  const [rankingMetric, setRankingMetric] = useState<ColorVariable>(initialMetric)
  const [xVariable, setXVariable] = useState<ColorVariable>(initialX)
  const [yVariable, setYVariable] = useState<ColorVariable>(initialY)
  const [colorBy, setColorBy] = useState<'religion' | 'region'>(initialColor)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [copied, setCopied] = useState(false)

  // Update URL when state changes
  const updateURL = useCallback(() => {
    const params = new URLSearchParams()
    params.set('chart', selectedChart)
    if (selectedChart === 'correlation') {
      params.set('x', xVariable)
      params.set('y', yVariable)
      params.set('color', colorBy)
    } else if (selectedChart === 'ranking') {
      params.set('metric', rankingMetric)
    }
    router.replace(`/charts?${params.toString()}`, { scroll: false })
  }, [selectedChart, xVariable, yVariable, colorBy, rankingMetric, router])

  useEffect(() => {
    updateURL()
  }, [updateURL])

  // Generate share URL
  const getShareURL = () => {
    if (typeof window === 'undefined') return ''
    return window.location.href
  }

  // Generate share text based on current chart
  const getShareText = () => {
    if (selectedChart === 'correlation') {
      const xName = VARIABLES[xVariable]?.name || xVariable
      const yName = VARIABLES[yVariable]?.name || yVariable
      const r = correlation !== null ? ` (r=${correlation.toFixed(2)})` : ''
      return `Check out the correlation between ${xName} and ${yName} across countries${r}!`
    }
    if (selectedChart === 'ranking') {
      const metricName = VARIABLES[rankingMetric]?.name || rankingMetric
      return `Check out the country rankings by ${metricName}!`
    }
    if (selectedChart === 'scatter') {
      return 'Check out how Democracy and GDP correlate across countries!'
    }
    return 'Check out this interesting country comparison data!'
  }

  // Share functions
  const shareOnTwitter = () => {
    const url = encodeURIComponent(getShareURL())
    const text = encodeURIComponent(getShareText())
    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank')
    setShowShareMenu(false)
  }

  const shareOnFacebook = () => {
    const url = encodeURIComponent(getShareURL())
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank')
    setShowShareMenu(false)
  }

  const shareOnLinkedIn = () => {
    const url = encodeURIComponent(getShareURL())
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank')
    setShowShareMenu(false)
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(getShareURL())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea')
      textarea.value = getShareURL()
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
    setShowShareMenu(false)
  }

  // Get variable config for ranking
  const rankingConfig = VARIABLES[rankingMetric]
  const isHigherBetter = rankingConfig?.higherIsBetter ?? true

  // Top/Bottom countries by selected metric
  const rankedCountries = useMemo(() => {
    const sorted = [...countries].filter((c) => {
      const val = getNestedValue(c as unknown as Record<string, unknown>, rankingMetric)
      return val !== null && typeof val === 'number'
    }).sort((a, b) => {
      const aVal = getNestedValue(a as unknown as Record<string, unknown>, rankingMetric) as number
      const bVal = getNestedValue(b as unknown as Record<string, unknown>, rankingMetric) as number
      // Sort descending if higher is better, ascending if lower is better
      return isHigherBetter ? bVal - aVal : aVal - bVal
    })

    return {
      top: sorted.slice(0, 15),
      bottom: sorted.slice(-15).reverse(),
    }
  }, [countries, rankingMetric, isHigherBetter])

  const getMetricValue = (country: Country) => {
    return getNestedValue(country as unknown as Record<string, unknown>, rankingMetric) as number | null
  }

  const formatMetricValue = (value: number | null) => {
    if (value === null) return 'N/A'
    return rankingConfig?.format(value) || value.toString()
  }

  const getMetricLabel = () => {
    return rankingConfig?.name || rankingMetric
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

  const getColor = (entry: { religion: string; region: string }) => {
    if (colorBy === 'religion') {
      return religionColors[entry.religion] || '#94a3b8'
    }
    return regionColors[entry.region] || '#94a3b8'
  }

  const [showMobileMenu, setShowMobileMenu] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 md:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <Globe className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
            <div>
              <h1 className="text-base md:text-xl font-bold text-gray-900">The World Truth Map</h1>
              <p className="text-xs md:text-sm text-gray-500 hidden sm:block">Country rankings & correlations</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            {/* Share Button */}
            <div className="relative">
              <button
                onClick={() => setShowShareMenu(!showShareMenu)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>

              {/* Share Menu Dropdown */}
              {showShareMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <button
                    onClick={shareOnTwitter}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Twitter className="w-4 h-4 text-[#1DA1F2]" />
                    Share on Twitter
                  </button>
                  <button
                    onClick={shareOnFacebook}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Facebook className="w-4 h-4 text-[#4267B2]" />
                    Share on Facebook
                  </button>
                  <button
                    onClick={shareOnLinkedIn}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Linkedin className="w-4 h-4 text-[#0077B5]" />
                    Share on LinkedIn
                  </button>
                  <hr className="my-2 border-gray-200" />
                  <button
                    onClick={copyLink}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-green-600" />
                        <span className="text-green-600">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Link2 className="w-4 h-4" />
                        Copy Link
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            <Link
              href="/"
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Map
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* Mobile Navigation Dropdown */}
        {showMobileMenu && (
          <nav className="md:hidden mt-3 pt-3 border-t border-gray-200 flex flex-col gap-2">
            <button
              onClick={() => {
                setShowShareMenu(!showShareMenu)
                setShowMobileMenu(false)
              }}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors text-left"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
            <Link
              href="/"
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              onClick={() => setShowMobileMenu(false)}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Map
            </Link>
          </nav>
        )}
      </header>

      {/* Click outside to close share menu */}
      {showShareMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowShareMenu(false)}
        />
      )}

      {/* Mobile Share Modal */}
      {showShareMenu && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white rounded-t-xl shadow-xl border-t border-gray-200 z-50 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Share</h3>
            <button
              onClick={() => setShowShareMenu(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <button
              onClick={shareOnTwitter}
              className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-gray-100"
            >
              <Twitter className="w-6 h-6 text-[#1DA1F2]" />
              <span className="text-xs text-gray-600">Twitter</span>
            </button>
            <button
              onClick={shareOnFacebook}
              className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-gray-100"
            >
              <Facebook className="w-6 h-6 text-[#4267B2]" />
              <span className="text-xs text-gray-600">Facebook</span>
            </button>
            <button
              onClick={shareOnLinkedIn}
              className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-gray-100"
            >
              <Linkedin className="w-6 h-6 text-[#0077B5]" />
              <span className="text-xs text-gray-600">LinkedIn</span>
            </button>
            <button
              onClick={copyLink}
              className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-gray-100"
            >
              {copied ? (
                <>
                  <Check className="w-6 h-6 text-green-600" />
                  <span className="text-xs text-green-600">Copied!</span>
                </>
              ) : (
                <>
                  <Link2 className="w-6 h-6 text-gray-600" />
                  <span className="text-xs text-gray-600">Copy Link</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Chart Selection */}
      <div className="p-4 md:p-6">
        <div className="grid grid-cols-2 md:flex md:flex-wrap gap-2 mb-6">
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
          <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base md:text-lg font-semibold">Custom Correlation Explorer</h2>
            </div>
            <p className="text-xs md:text-sm text-gray-500 mb-4">
              Select any two variables to explore correlations between them ({numericVariables.length} numeric variables available)
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
            <div className="h-[350px] md:h-[500px]">
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
          <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <h2 className="text-base md:text-lg font-semibold">Country Rankings</h2>
              <select
                value={rankingMetric}
                onChange={(e) => setRankingMetric(e.target.value as ColorVariable)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm w-full md:w-auto md:max-w-xs"
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
              <div>
                <h3 className="text-xs md:text-sm font-medium text-green-600 mb-4">
                  {isHigherBetter ? `Top 15 Countries (Highest ${getMetricLabel()})` : `Best 15 Countries (Lowest ${getMetricLabel()})`}
                </h3>
                <div className="h-[400px] md:h-[500px]">
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
                      <XAxis type="number" domain={[0, 'auto']} />
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
                <h3 className="text-xs md:text-sm font-medium text-red-600 mb-4">
                  {isHigherBetter ? `Bottom 15 Countries (Lowest ${getMetricLabel()})` : `Worst 15 Countries (Highest ${getMetricLabel()})`}
                </h3>
                <div className="h-[400px] md:h-[500px]">
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
                      <XAxis type="number" domain={[0, 'auto']} />
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
          <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
            <h2 className="text-base md:text-lg font-semibold mb-2">Democracy Score vs GDP per Capita</h2>
            <p className="text-xs md:text-sm text-gray-500 mb-4 md:mb-6">
              Each dot represents a country, colored by major religion
            </p>
            <div className="h-[350px] md:h-[600px]">
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
          <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
            <h2 className="text-base md:text-lg font-semibold mb-2">Countries by Major Religion</h2>
            <p className="text-xs md:text-sm text-gray-500 mb-4 md:mb-6">
              Number of countries where each religion is the majority
            </p>
            <div className="h-[300px] md:h-[400px]">
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

// Export default with Suspense boundary
export default function ChartsPage() {
  return (
    <Suspense fallback={<ChartsLoading />}>
      <ChartsContent />
    </Suspense>
  )
}

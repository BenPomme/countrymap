'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, Trophy, TrendingDown, Share2, Globe, BarChart3 } from 'lucide-react'
import countriesData from '@/../../data/countries.json'
import { VARIABLES } from '@/lib/constants/variables'
import { getNestedValue } from '@/lib/utils'
import type { Country } from '@/types/country'
import VisualShare from '@/components/share/VisualShare'

interface RankedStat {
  variableId: string
  name: string
  value: number
  rank: number
  total: number
  percentile: number
  formattedValue: string
  higherIsBetter: boolean
  icon: string
}

// Get all countries with value for a variable
function getCountryRankings(variableId: string): { country: Country; value: number }[] {
  return (countriesData as Country[])
    .map(country => ({
      country,
      value: getNestedValue(country as unknown as Record<string, unknown>, variableId) as number
    }))
    .filter(item => item.value !== null && item.value !== undefined && !isNaN(item.value))
}

// Get rank and percentile for a country on a variable
function getCountryRank(country: Country, variableId: string): { rank: number; total: number; percentile: number } | null {
  const rankings = getCountryRankings(variableId)
  if (rankings.length === 0) return null

  const variable = VARIABLES[variableId as keyof typeof VARIABLES]
  const higherIsBetter = variable?.higherIsBetter ?? true

  // Sort: if higher is better, sort descending; otherwise ascending
  rankings.sort((a, b) => higherIsBetter ? b.value - a.value : a.value - b.value)

  const index = rankings.findIndex(r => r.country.iso3 === country.iso3)
  if (index === -1) return null

  return {
    rank: index + 1,
    total: rankings.length,
    percentile: Math.round(((rankings.length - index) / rankings.length) * 100)
  }
}

// Get all stats for a country with rankings
function getAllCountryStats(country: Country): RankedStat[] {
  const stats: RankedStat[] = []

  for (const [variableId, config] of Object.entries(VARIABLES)) {
    if (config.type !== 'numeric') continue

    const value = getNestedValue(country as unknown as Record<string, unknown>, variableId) as number
    if (value === null || value === undefined || isNaN(value)) continue

    const rankData = getCountryRank(country, variableId)
    if (!rankData) continue

    const categoryIcons: Record<string, string> = {
      governance: '🏛️',
      economy: '💰',
      health: '🏥',
      sex: '❤️',
      demographics: '👥',
      education: '🎓',
      lifestyle: '🍕',
      safety: '🛡️',
      transport: '🚗',
      environment: '🌍',
      religion: '🙏',
    }

    stats.push({
      variableId,
      name: config.name,
      value,
      rank: rankData.rank,
      total: rankData.total,
      percentile: rankData.percentile,
      formattedValue: config.format(value),
      higherIsBetter: config.higherIsBetter,
      icon: categoryIcons[config.category] || '📊'
    })
  }

  return stats
}

// Get flag emoji from ISO2 code
function getFlagEmoji(iso2: string): string {
  const codePoints = iso2
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0))
  return String.fromCodePoint(...codePoints)
}

export default function CountryPage() {
  const params = useParams()
  const slug = params?.slug as string
  const shareRef = useRef<HTMLDivElement>(null)

  const [country, setCountry] = useState<Country | null>(null)
  const [stats, setStats] = useState<RankedStat[]>([])
  const [topStats, setTopStats] = useState<RankedStat[]>([])
  const [bottomStats, setBottomStats] = useState<RankedStat[]>([])

  useEffect(() => {
    if (!slug) return

    // Find country by slug (name with dashes)
    const foundCountry = (countriesData as Country[]).find(c =>
      c.name.toLowerCase().replace(/\s+/g, '-') === slug.toLowerCase() ||
      c.iso3.toLowerCase() === slug.toLowerCase() ||
      c.iso2.toLowerCase() === slug.toLowerCase()
    )

    if (foundCountry) {
      setCountry(foundCountry)

      const allStats = getAllCountryStats(foundCountry)
      setStats(allStats)

      // Top 10: where they rank in top 15%
      const top = allStats
        .filter(s => s.rank <= Math.ceil(s.total * 0.15))
        .sort((a, b) => a.rank - b.rank)
        .slice(0, 10)
      setTopStats(top)

      // Bottom 10: where they rank in bottom 15%
      const bottom = allStats
        .filter(s => s.rank >= Math.floor(s.total * 0.85))
        .sort((a, b) => b.rank - a.rank)
        .slice(0, 10)
      setBottomStats(bottom)
    }
  }, [slug])

  if (!country) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🌍</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Country not found</h1>
          <Link href="/" className="text-blue-600 hover:underline">
            ← Back to map
          </Link>
        </div>
      </div>
    )
  }

  const flag = getFlagEmoji(country.iso2)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Map</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/truthle" className="text-green-600 hover:text-green-700 font-medium">
              Play Truthle
            </Link>
            <VisualShare
              targetRef={shareRef as React.RefObject<HTMLElement>}
              title={`${country.name} Country Stats`}
              description={`${flag} ${country.name} ranks #${topStats[0]?.rank || '?'} in ${topStats[0]?.name || 'the world'}! See all country rankings at The World Truth Map.`}
              className="!bg-blue-500 hover:!bg-blue-600"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Country Header Card */}
        <div ref={shareRef} className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center gap-6 mb-6">
            <div className="text-7xl">{flag}</div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{country.name}</h1>
              <div className="flex items-center gap-4 text-gray-600">
                <span className="flex items-center gap-1">
                  <Globe className="w-4 h-4" />
                  {country.region}
                </span>
                <span className="flex items-center gap-1">
                  <BarChart3 className="w-4 h-4" />
                  {stats.length} statistics available
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {country.population && (
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-sm text-gray-500 mb-1">Population</div>
                <div className="text-xl font-bold text-gray-900">
                  {(country.population / 1000000).toFixed(1)}M
                </div>
              </div>
            )}
            {(country.poverty as any)?.gdpPerCapita && (
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-sm text-gray-500 mb-1">GDP per Capita</div>
                <div className="text-xl font-bold text-gray-900">
                  ${((country.poverty as any).gdpPerCapita / 1000).toFixed(1)}k
                </div>
              </div>
            )}
            {(country.lifestyle as any)?.happinessIndex && (
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-sm text-gray-500 mb-1">Happiness</div>
                <div className="text-xl font-bold text-gray-900">
                  {(country.lifestyle as any).happinessIndex.toFixed(1)}/10
                </div>
              </div>
            )}
            {country.democracy?.score && (
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-sm text-gray-500 mb-1">Democracy</div>
                <div className="text-xl font-bold text-gray-900">
                  {country.democracy.score}/100
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Rankings Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Top Rankings */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Trophy className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Top Rankings</h2>
                <p className="text-sm text-gray-500">What {country.name} excels at</p>
              </div>
            </div>

            {topStats.length > 0 ? (
              <div className="space-y-3">
                {topStats.map((stat, i) => (
                  <div key={stat.variableId} className="flex items-center gap-3 p-3 bg-gradient-to-r from-yellow-50 to-transparent rounded-xl">
                    <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center text-sm font-bold text-yellow-700">
                      #{stat.rank}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {stat.icon} {stat.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {stat.formattedValue}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">
                      of {stat.total}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No standout rankings found</p>
            )}
          </div>

          {/* Bottom Rankings */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Lowest Rankings</h2>
                <p className="text-sm text-gray-500">Where {country.name} ranks last</p>
              </div>
            </div>

            {bottomStats.length > 0 ? (
              <div className="space-y-3">
                {bottomStats.map((stat, i) => (
                  <div key={stat.variableId} className="flex items-center gap-3 p-3 bg-gradient-to-r from-red-50 to-transparent rounded-xl">
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center text-sm font-bold text-red-700">
                      #{stat.rank}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {stat.icon} {stat.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {stat.formattedValue}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">
                      of {stat.total}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No low rankings found</p>
            )}
          </div>
        </div>

        {/* All Stats Table */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">All Statistics</h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Statistic</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Value</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Rank</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600 hidden md:table-cell">Percentile</th>
                </tr>
              </thead>
              <tbody>
                {stats.sort((a, b) => a.rank - b.rank).map(stat => (
                  <tr key={stat.variableId} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <span className="mr-2">{stat.icon}</span>
                      {stat.name}
                    </td>
                    <td className="py-3 px-4 text-right font-medium">{stat.formattedValue}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        stat.rank <= 10 ? 'bg-yellow-100 text-yellow-800' :
                        stat.rank <= stat.total * 0.25 ? 'bg-green-100 text-green-800' :
                        stat.rank >= stat.total * 0.75 ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        #{stat.rank}/{stat.total}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right hidden md:table-cell">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              stat.percentile >= 75 ? 'bg-green-500' :
                              stat.percentile >= 50 ? 'bg-blue-500' :
                              stat.percentile >= 25 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${stat.percentile}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-500 w-10">{stat.percentile}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 mb-4">How well do you know world facts?</p>
          <Link
            href="/truthle"
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition-colors"
          >
            Play Truthle - Daily World Quiz
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center text-gray-500 text-sm">
          <p>© {new Date().getFullYear()} The World Truth Map. Data from various public sources.</p>
          <p className="mt-2">
            <Link href="/" className="text-blue-600 hover:underline">Explore the Map</Link>
            {' · '}
            <Link href="/charts" className="text-blue-600 hover:underline">Charts</Link>
            {' · '}
            <Link href="/discoveries" className="text-blue-600 hover:underline">Discoveries</Link>
          </p>
        </div>
      </footer>
    </div>
  )
}

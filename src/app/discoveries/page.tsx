'use client'

import { useState, useMemo, useRef } from 'react'
import Link from 'next/link'
import {
  Globe,
  Home,
  BarChart2,
  Sparkles,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ChevronDown,
  Lightbulb,
  Shuffle,
  X,
} from 'lucide-react'
import correlationsData from '../../../data/correlations.json'
import { VisualShare } from '@/components/share'

interface Correlation {
  var1: string
  var2: string
  var1Name: string
  var2Name: string
  coefficient: number
  strength: 'moderate' | 'strong' | 'very_strong'
  sampleSize: number
  categories: [string, string]
  categoryNames: [string, string]
  crossCategory: boolean
  interestingScore: number
  direction: 'positive' | 'negative'
}

const CATEGORY_COLORS: Record<string, string> = {
  governance: 'bg-blue-100 text-blue-700 border-blue-200',
  economy: 'bg-green-100 text-green-700 border-green-200',
  health: 'bg-red-100 text-red-700 border-red-200',
  sex: 'bg-pink-100 text-pink-700 border-pink-200',
  demographics: 'bg-purple-100 text-purple-700 border-purple-200',
  education: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  lifestyle: 'bg-orange-100 text-orange-700 border-orange-200',
  safety: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  transport: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  environment: 'bg-emerald-100 text-emerald-700 border-emerald-200',
}

const CATEGORY_ICONS: Record<string, string> = {
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
}

const STRENGTH_CONFIG = {
  very_strong: { label: 'Very Strong', color: 'bg-purple-600', minR: 0.8 },
  strong: { label: 'Strong', color: 'bg-blue-500', minR: 0.6 },
  moderate: { label: 'Moderate', color: 'bg-gray-400', minR: 0.4 },
}

type SortOption = 'interesting' | 'strength' | 'sample'
type StrengthFilter = 'all' | 'very_strong' | 'strong'

export default function DiscoveriesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [strengthFilter, setStrengthFilter] = useState<StrengthFilter>('all')
  const [sortBy, setSortBy] = useState<SortOption>('interesting')
  const [directionFilter, setDirectionFilter] = useState<'all' | 'positive' | 'negative'>('all')
  const [crossCategoryOnly, setCrossCategoryOnly] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedCorrelation, setSelectedCorrelation] = useState<Correlation | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  const correlations = correlationsData.correlations as Correlation[]
  const metadata = correlationsData.metadata
  const stats = correlationsData.stats

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set<string>()
    correlations.forEach((c) => {
      cats.add(c.categories[0])
      cats.add(c.categories[1])
    })
    return Array.from(cats).sort()
  }, [correlations])

  // Filter and sort correlations
  const filteredCorrelations = useMemo(() => {
    let filtered = correlations

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (c) =>
          c.var1Name.toLowerCase().includes(query) ||
          c.var2Name.toLowerCase().includes(query) ||
          c.categoryNames[0].toLowerCase().includes(query) ||
          c.categoryNames[1].toLowerCase().includes(query)
      )
    }

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter(
        (c) => c.categories[0] === selectedCategory || c.categories[1] === selectedCategory
      )
    }

    // Strength filter
    if (strengthFilter === 'very_strong') {
      filtered = filtered.filter((c) => c.strength === 'very_strong')
    } else if (strengthFilter === 'strong') {
      filtered = filtered.filter((c) => c.strength === 'very_strong' || c.strength === 'strong')
    }

    // Direction filter
    if (directionFilter === 'positive') {
      filtered = filtered.filter((c) => c.direction === 'positive')
    } else if (directionFilter === 'negative') {
      filtered = filtered.filter((c) => c.direction === 'negative')
    }

    // Cross-category filter
    if (crossCategoryOnly) {
      filtered = filtered.filter((c) => c.crossCategory)
    }

    // Sort
    switch (sortBy) {
      case 'strength':
        filtered = [...filtered].sort((a, b) => Math.abs(b.coefficient) - Math.abs(a.coefficient))
        break
      case 'sample':
        filtered = [...filtered].sort((a, b) => b.sampleSize - a.sampleSize)
        break
      case 'interesting':
      default:
        filtered = [...filtered].sort((a, b) => b.interestingScore - a.interestingScore)
        break
    }

    return filtered
  }, [correlations, searchQuery, selectedCategory, strengthFilter, directionFilter, crossCategoryOnly, sortBy])

  // Get a random interesting correlation
  const getRandomCorrelation = () => {
    const interesting = correlations.filter((c) => c.crossCategory && c.strength !== 'moderate')
    const random = interesting[Math.floor(Math.random() * interesting.length)]
    setSelectedCorrelation(random)
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedCategory(null)
    setStrengthFilter('all')
    setDirectionFilter('all')
    setCrossCategoryOnly(false)
    setSortBy('interesting')
  }

  const hasActiveFilters = searchQuery || selectedCategory || strengthFilter !== 'all' || directionFilter !== 'all' || crossCategoryOnly

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-500 flex flex-col">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-sm px-4 md:px-6 py-3 md:py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 md:gap-3">
            <Globe className="w-6 h-6 md:w-8 md:h-8 text-white" />
            <div>
              <h1 className="text-base md:text-xl font-bold text-white">The World Truth Map</h1>
            </div>
          </Link>
          <nav className="flex items-center gap-2 md:gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-md transition-colors"
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Map</span>
            </Link>
            <Link
              href="/charts"
              className="flex items-center gap-2 px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-md transition-colors"
            >
              <BarChart2 className="w-4 h-4" />
              <span className="hidden sm:inline">Charts</span>
            </Link>
            <Link
              href="/quiz"
              className="flex items-center gap-2 px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-md transition-colors"
            >
              <Lightbulb className="w-4 h-4" />
              <span className="hidden sm:inline">Quiz</span>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <div className="px-4 py-8 md:py-12 text-center text-white">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-8 h-8 text-yellow-300" />
            <h1 className="text-3xl md:text-4xl font-bold">Data Discoveries</h1>
            <Sparkles className="w-8 h-8 text-yellow-300" />
          </div>
          <p className="text-lg text-white/80 mb-6">
            Explore {stats.total.toLocaleString()} surprising correlations found across {metadata.totalVariables} variables
          </p>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto mb-6">
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-2xl font-bold text-purple-200">{stats.veryStrong}</div>
              <div className="text-xs text-white/60">Very Strong</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-2xl font-bold text-blue-200">{stats.strong}</div>
              <div className="text-xs text-white/60">Strong</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-2xl font-bold text-green-200">{stats.crossCategory}</div>
              <div className="text-xs text-white/60">Cross-Category</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-2xl font-bold text-yellow-200">{metadata.totalPairsTested.toLocaleString()}</div>
              <div className="text-xs text-white/60">Pairs Tested</div>
            </div>
          </div>

          {/* Random Discovery Button */}
          <button
            onClick={getRandomCorrelation}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-purple-600 font-semibold rounded-xl hover:bg-yellow-300 hover:text-purple-700 transition-all shadow-lg"
          >
            <Shuffle className="w-5 h-5" />
            Show Random Discovery
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-gray-50 rounded-t-3xl px-4 py-6">
        <div className="max-w-6xl mx-auto">
          {/* Search and Filters */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search variables..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                  hasActiveFilters
                    ? 'bg-purple-100 border-purple-300 text-purple-700'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Filter className="w-4 h-4" />
                Filters
                {hasActiveFilters && (
                  <span className="bg-purple-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {[selectedCategory, strengthFilter !== 'all', directionFilter !== 'all', crossCategoryOnly].filter(Boolean).length}
                  </span>
                )}
                <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
                >
                  <X className="w-4 h-4" />
                  Clear
                </button>
              )}
            </div>

            {/* Expanded Filters */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={selectedCategory || ''}
                    onChange={(e) => setSelectedCategory(e.target.value || null)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {CATEGORY_ICONS[cat]} {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Strength Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Strength</label>
                  <select
                    value={strengthFilter}
                    onChange={(e) => setStrengthFilter(e.target.value as StrengthFilter)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="all">All (|r| &ge; 0.4)</option>
                    <option value="strong">Strong+ (|r| &ge; 0.6)</option>
                    <option value="very_strong">Very Strong (|r| &ge; 0.8)</option>
                  </select>
                </div>

                {/* Direction Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Direction</label>
                  <select
                    value={directionFilter}
                    onChange={(e) => setDirectionFilter(e.target.value as 'all' | 'positive' | 'negative')}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="all">All Directions</option>
                    <option value="positive">Positive Only</option>
                    <option value="negative">Negative Only</option>
                  </select>
                </div>

                {/* Sort By */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="interesting">Most Interesting</option>
                    <option value="strength">Strongest First</option>
                    <option value="sample">Most Data Points</option>
                  </select>
                </div>

                {/* Cross-Category Toggle */}
                <div className="md:col-span-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={crossCategoryOnly}
                      onChange={(e) => setCrossCategoryOnly(e.target.checked)}
                      className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700">Cross-category correlations only</span>
                    <span className="text-xs text-gray-500">(more surprising discoveries)</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Results Count */}
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-600">
              Showing <span className="font-semibold text-purple-600">{filteredCorrelations.length}</span> correlations
            </div>
          </div>

          {/* Correlation Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCorrelations.slice(0, 50).map((correlation, index) => (
              <CorrelationCard
                key={`${correlation.var1}-${correlation.var2}`}
                correlation={correlation}
                rank={index + 1}
                onSelect={() => setSelectedCorrelation(correlation)}
              />
            ))}
          </div>

          {filteredCorrelations.length > 50 && (
            <div className="text-center text-gray-500 mt-6">
              Showing 50 of {filteredCorrelations.length} correlations. Use filters to narrow down.
            </div>
          )}

          {filteredCorrelations.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No correlations found</h3>
              <p className="text-gray-500">Try adjusting your filters or search query</p>
            </div>
          )}
        </div>
      </div>

      {/* Selected Correlation Modal */}
      {selectedCorrelation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedCorrelation(null)}>
          <div
            ref={cardRef}
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{CATEGORY_ICONS[selectedCorrelation.categories[0]]}</span>
                <span className="text-gray-400">×</span>
                <span className="text-2xl">{CATEGORY_ICONS[selectedCorrelation.categories[1]]}</span>
              </div>
              <button
                onClick={() => setSelectedCorrelation(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <h2 className="text-xl font-bold text-gray-800 mb-2">
              {selectedCorrelation.var1Name} vs {selectedCorrelation.var2Name}
            </h2>

            <div className="flex items-center gap-3 mb-4">
              <div
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-white text-sm font-medium ${
                  selectedCorrelation.direction === 'positive' ? 'bg-green-500' : 'bg-red-500'
                }`}
              >
                {selectedCorrelation.direction === 'positive' ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                r = {selectedCorrelation.coefficient > 0 ? '+' : ''}{selectedCorrelation.coefficient.toFixed(3)}
              </div>
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${
                  selectedCorrelation.strength === 'very_strong'
                    ? 'bg-purple-100 text-purple-700'
                    : selectedCorrelation.strength === 'strong'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {STRENGTH_CONFIG[selectedCorrelation.strength].label}
              </span>
            </div>

            <div className="flex gap-2 mb-4">
              <span className={`px-2 py-1 rounded-full text-xs border ${CATEGORY_COLORS[selectedCorrelation.categories[0]]}`}>
                {selectedCorrelation.categoryNames[0]}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs border ${CATEGORY_COLORS[selectedCorrelation.categories[1]]}`}>
                {selectedCorrelation.categoryNames[1]}
              </span>
              {selectedCorrelation.crossCategory && (
                <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700 border border-yellow-200">
                  Cross-Category
                </span>
              )}
            </div>

            <p className="text-gray-600 mb-4">
              {selectedCorrelation.direction === 'positive' ? (
                <>
                  Countries with higher <strong>{selectedCorrelation.var1Name}</strong> tend to have higher{' '}
                  <strong>{selectedCorrelation.var2Name}</strong>.
                </>
              ) : (
                <>
                  Countries with higher <strong>{selectedCorrelation.var1Name}</strong> tend to have lower{' '}
                  <strong>{selectedCorrelation.var2Name}</strong>.
                </>
              )}
            </p>

            <div className="text-sm text-gray-500 mb-6">
              Based on data from {selectedCorrelation.sampleSize} countries
            </div>

            <div className="flex gap-3">
              <Link
                href={`/charts?chart=correlation&x=${selectedCorrelation.var1}&y=${selectedCorrelation.var2}`}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
              >
                <BarChart2 className="w-4 h-4" />
                View Scatter Plot
                <ArrowUpRight className="w-4 h-4" />
              </Link>
              <VisualShare
                targetRef={cardRef}
                title="Correlation Discovery"
                description={`${selectedCorrelation.var1Name} vs ${selectedCorrelation.var2Name} (r=${selectedCorrelation.coefficient.toFixed(2)})`}
                className="px-4 py-3 border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Correlation Card Component
function CorrelationCard({
  correlation,
  rank,
  onSelect,
}: {
  correlation: Correlation
  rank: number
  onSelect: () => void
}) {
  const isTopTen = rank <= 10

  return (
    <button
      onClick={onSelect}
      className={`text-left bg-white rounded-xl shadow-sm border hover:shadow-md hover:border-purple-300 transition-all p-4 ${
        isTopTen ? 'border-purple-200' : 'border-gray-100'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{CATEGORY_ICONS[correlation.categories[0]]}</span>
          <span className="text-gray-300">×</span>
          <span className="text-lg">{CATEGORY_ICONS[correlation.categories[1]]}</span>
        </div>
        {isTopTen && (
          <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold px-2 py-1 rounded">
            #{rank}
          </span>
        )}
      </div>

      {/* Variables */}
      <h3 className="font-semibold text-gray-800 mb-1 line-clamp-1">{correlation.var1Name}</h3>
      <h3 className="font-semibold text-gray-800 mb-3 line-clamp-1">vs {correlation.var2Name}</h3>

      {/* Correlation Value */}
      <div className="flex items-center gap-2 mb-3">
        <div
          className={`flex items-center gap-1 px-2 py-1 rounded text-sm font-mono font-bold ${
            correlation.direction === 'positive'
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {correlation.direction === 'positive' ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
          {correlation.coefficient > 0 ? '+' : ''}{correlation.coefficient.toFixed(3)}
        </div>
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            correlation.strength === 'very_strong'
              ? 'bg-purple-100 text-purple-700'
              : correlation.strength === 'strong'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          {STRENGTH_CONFIG[correlation.strength].label}
        </span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>n = {correlation.sampleSize}</span>
        {correlation.crossCategory && (
          <span className="text-yellow-600 font-medium">Cross-Category</span>
        )}
      </div>
    </button>
  )
}

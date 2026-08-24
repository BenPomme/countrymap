'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import type { Country, CountryFilters, ColorVariable } from '@/types/country'
import { filterCountries } from '@/lib/data'
import FilterPanel from '@/components/filters/FilterPanel'
import { DEFAULT_VARIABLE, VARIABLES } from '@/lib/constants/variables'
import { BarChart2, Globe, Info, X, Menu, SlidersHorizontal, HelpCircle, Share2, Sparkles, Calendar } from 'lucide-react'
import CoinBalance from '@/components/truthle/CoinBalance'
import { countries } from '@/lib/data/loadCountries'
import { AdBanner, AdSidebar } from '@/components/ads'
import { AD_SLOTS } from '@/lib/constants/ads'
import { VisualShare } from '@/components/share'
import { useEmbeddedAppMode } from '@/lib/useEmbeddedAppMode'
import { getVariableById, getVariableBySlug } from '@/lib/seo/catalog'

// Dynamic import for map to avoid SSR issues
const WorldMap = dynamic(() => import('@/components/maps/WorldMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[500px] bg-gray-100 animate-pulse flex items-center justify-center">
      <span className="text-gray-400">Loading map...</span>
    </div>
  ),
})

export default function HomePage() {
  const [filters, setFilters] = useState<CountryFilters>({})
  const [colorVariable, setColorVariable] = useState<ColorVariable>(DEFAULT_VARIABLE)
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null)
  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get('var')
    if (!raw) return
    const entry = getVariableById(raw) || getVariableBySlug(raw)
    if (entry) setColorVariable(entry.id)
  }, [])
  const [showDataSources, setShowDataSources] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const embeddedMode = useEmbeddedAppMode()

  const currentVariable = VARIABLES[colorVariable]

  const filteredCountries = useMemo(
    () => filterCountries(countries, filters),
    [countries, filters]
  )

  return (
    <div className={embeddedMode ? "min-h-[100svh] bg-slate-50" : "h-screen flex flex-col"}>
      {/* Header */}
      {!embeddedMode && (
      <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 md:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <Globe className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
            <div>
              <h1 className="text-base md:text-xl font-bold text-gray-900">The World Truth Map</h1>
              <p className="text-xs md:text-sm text-gray-500 hidden sm:block">
                Compare countries across interesting criteria
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-4">
            <Link
              href="/charts"
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              <BarChart2 className="w-4 h-4" />
              Charts
            </Link>
            <Link
              href="/discoveries"
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Discoveries
            </Link>
            <Link
              href="/truthle"
              className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 rounded-md transition-colors font-medium shadow-sm"
            >
              <Calendar className="w-4 h-4" />
              Truthle
              <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-bold">DAILY</span>
            </Link>
            <Link
              href="/quiz"
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
              Quiz
            </Link>
            <button
              onClick={() => setShowDataSources(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              <Info className="w-4 h-4" />
              Data Sources
            </button>
            <VisualShare
              targetRef={mapContainerRef}
              title={`World Map - ${currentVariable?.name || 'Data'}`}
              description={`Check out this world map showing ${currentVariable?.name || 'country data'} on The World Truth Map!`}
            />
            <CoinBalance size="sm" />
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

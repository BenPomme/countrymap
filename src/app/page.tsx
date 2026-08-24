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

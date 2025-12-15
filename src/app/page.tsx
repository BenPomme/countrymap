'use client'

import { useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import type { Country, CountryFilters, ColorVariable } from '@/types/country'
import { filterCountries } from '@/lib/data'
import FilterPanel from '@/components/filters/FilterPanel'
import { DEFAULT_VARIABLE } from '@/lib/constants/variables'
import { BarChart2, Globe, Info, X, Menu, SlidersHorizontal } from 'lucide-react'
import countriesData from '../../data/countries.json'
import { AdBanner, AdSidebar } from '@/components/ads'
import { AD_SLOTS } from '@/lib/constants/ads'

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
  const [showDataSources, setShowDataSources] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  const countries = countriesData as Country[]

  const filteredCountries = useMemo(
    () => filterCountries(countries, filters),
    [countries, filters]
  )

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
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
            <button
              onClick={() => setShowDataSources(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              <Info className="w-4 h-4" />
              Data Sources
            </button>
          </nav>

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
            <Link
              href="/charts"
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              onClick={() => setShowMobileMenu(false)}
            >
              <BarChart2 className="w-4 h-4" />
              Charts
            </Link>
            <button
              onClick={() => {
                setShowDataSources(true)
                setShowMobileMenu(false)
              }}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors text-left"
            >
              <Info className="w-4 h-4" />
              Data Sources
            </button>
          </nav>
        )}
      </header>

      {/* Ad Banner - Desktop only */}
      <AdBanner slotId={AD_SLOTS.headerBanner} hideOnMobile={true} className="bg-gray-50 border-b border-gray-200" />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile Filter Overlay */}
        {showMobileFilters && (
          <div
            className="md:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowMobileFilters(false)}
          />
        )}

        {/* Filter Panel - Desktop sidebar, Mobile drawer */}
        <div
          className={`
            fixed md:relative inset-y-0 left-0 z-50 md:z-auto
            transform transition-transform duration-300 ease-in-out
            ${showMobileFilters ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          `}
        >
          <FilterPanel
            filters={filters}
            onFiltersChange={setFilters}
            colorVariable={colorVariable}
            onColorVariableChange={setColorVariable}
            totalCountries={countries.length}
            filteredCount={filteredCountries.length}
            onClose={() => setShowMobileFilters(false)}
          />
        </div>

        {/* Map Area */}
        <div className="flex-1 relative bg-gray-50">
          <WorldMap
            countries={countries}
            filteredCountries={filteredCountries}
            colorVariable={colorVariable}
            onCountryClick={setSelectedCountry}
          />

          {/* Mobile Filter Toggle Button */}
          <button
            onClick={() => setShowMobileFilters(true)}
            className="md:hidden fixed bottom-4 left-4 z-30 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
          >
            <SlidersHorizontal className="w-6 h-6" />
          </button>

          {/* Selected Country Panel */}
          {selectedCountry && (
            <CountryDetailPanel
              country={selectedCountry}
              onClose={() => setSelectedCountry(null)}
            />
          )}
        </div>
      </div>

      {/* Data Sources Modal */}
      {showDataSources && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50">
          <div className="bg-white rounded-t-xl md:rounded-lg shadow-xl max-w-2xl w-full md:mx-4 max-h-[90vh] md:max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Data Sources</h2>
              <button
                onClick={() => setShowDataSources(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Governance & Economy</h3>
                <DataSourceItem
                  title="Religion Data"
                  source="CIA World Factbook"
                  description="Religious affiliation percentages for each country."
                  url="https://www.cia.gov/the-world-factbook/"
                />
                <DataSourceItem
                  title="Democracy Score"
                  source="V-Dem Institute & Freedom House"
                  description="Liberal democracy index (0-100 scale)."
                  url="https://www.v-dem.net/"
                />
                <DataSourceItem
                  title="GDP & Poverty"
                  source="World Bank"
                  description="GDP per capita, poverty rates, and Human Development Index."
                  url="https://data.worldbank.org/"
                />
                <DataSourceItem
                  title="Corruption Index"
                  source="Transparency International"
                  description="Corruption Perceptions Index (0-100, higher = less corrupt)."
                  url="https://www.transparency.org/"
                />
                <DataSourceItem
                  title="Press Freedom"
                  source="Reporters Without Borders"
                  description="Press freedom index measuring journalist safety and media independence."
                  url="https://rsf.org/"
                />

                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide pt-4">Health & Body</h3>
                <DataSourceItem
                  title="Life Expectancy & Health"
                  source="World Health Organization"
                  description="Life expectancy, obesity rates, alcohol consumption, suicide rates."
                  url="https://www.who.int/data"
                />
                <DataSourceItem
                  title="Height Data"
                  source="NCD Risk Factor Collaboration"
                  description="Average adult height by country from standardized measurements."
                  url="https://ncdrisc.org/"
                />
                <DataSourceItem
                  title="Fertility Rate"
                  source="UN Population Division"
                  description="Average children per woman (total fertility rate)."
                  url="https://population.un.org/"
                />

                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide pt-4">Demographics & Education</h3>
                <DataSourceItem
                  title="IQ & Education"
                  source="OECD PISA & Various Studies"
                  description="National IQ estimates, PISA scores, literacy rates."
                  url="https://www.oecd.org/pisa/"
                />
                <DataSourceItem
                  title="Ethnic Diversity"
                  source="Alesina et al. (2003)"
                  description="Ethnic fractionalization index from academic research."
                  url="https://scholar.harvard.edu/"
                />
                <DataSourceItem
                  title="Demographics"
                  source="UN Population Division"
                  description="Median age, urban population percentage, population density."
                  url="https://population.un.org/"
                />

                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide pt-4">Lifestyle & Society</h3>
                <DataSourceItem
                  title="Happiness Index"
                  source="World Happiness Report"
                  description="Life satisfaction score based on Gallup World Poll surveys."
                  url="https://worldhappiness.report/"
                />
                <DataSourceItem
                  title="LGBT Acceptance"
                  source="ILGA World & Gallup"
                  description="Social acceptance of LGBT+ people based on surveys."
                  url="https://ilga.org/"
                />
                <DataSourceItem
                  title="Work & Internet"
                  source="OECD & ITU"
                  description="Average work hours, internet penetration rates."
                  url="https://data.oecd.org/"
                />

                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide pt-4">Safety & Crime</h3>
                <DataSourceItem
                  title="Homicide Rate"
                  source="UN Office on Drugs and Crime"
                  description="Intentional homicides per 100,000 population."
                  url="https://dataunodc.un.org/"
                />
                <DataSourceItem
                  title="Gun Ownership"
                  source="Small Arms Survey"
                  description="Civilian firearms per 100 people."
                  url="https://www.smallarmssurvey.org/"
                />
                <DataSourceItem
                  title="Conflict Status"
                  source="Uppsala Conflict Data Program"
                  description="Active armed conflicts and battle-related deaths."
                  url="https://ucdp.uu.se/"
                />
                <DataSourceItem
                  title="Peace Index"
                  source="Institute for Economics & Peace"
                  description="Global Peace Index measuring national peacefulness."
                  url="https://www.visionofhumanity.org/"
                />
              </div>
              <p className="mt-6 text-sm text-gray-500">
                Data is aggregated from multiple authoritative sources. Coverage varies by country. Last updated: 2024.
              </p>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <Link
                  href="/privacy"
                  className="text-sm text-blue-600 hover:text-blue-800"
                  onClick={() => setShowDataSources(false)}
                >
                  Privacy Policy
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface CountryDetailPanelProps {
  country: Country
  onClose: () => void
}

function CountryDetailPanel({ country, onClose }: CountryDetailPanelProps) {
  return (
    <div className="fixed md:absolute bottom-0 md:bottom-auto md:top-4 left-0 right-0 md:left-auto md:right-4 md:w-80 bg-white rounded-t-xl md:rounded-lg shadow-xl border border-gray-200 overflow-hidden z-20 max-h-[70vh] md:max-h-none">
      <div className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between">
        <h3 className="font-semibold">{country.name}</h3>
        <button
          onClick={onClose}
          className="text-white/80 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="p-4 space-y-4 overflow-y-auto max-h-[60vh] md:max-h-none">
        <div className="grid grid-cols-2 gap-4">
          <StatItem
            label="Region"
            value={country.region}
          />
          <StatItem
            label="Population"
            value={country.population ? `${(country.population / 1000000).toFixed(1)}M` : 'N/A'}
          />
        </div>

        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-700 mb-2">Religion</h4>
          <div className="text-sm">
            <span className="font-medium">{country.religion.major}</span>
            <div className="mt-2 space-y-1">
              {Object.entries(country.religion.breakdown)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 3)
                .map(([religion, percent]) => (
                  <div key={religion} className="flex justify-between">
                    <span className="text-gray-600">{religion}</span>
                    <span>{percent.toFixed(1)}%</span>
                  </div>
                ))}
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-700 mb-2">Democracy & Governance</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Democracy Score</span>
              <span className="font-medium">{country.democracy.score}/100</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${country.democracy.score}%` }}
              />
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-700 mb-2">Economic</h4>
          <div className="grid grid-cols-2 gap-4">
            <StatItem
              label="GDP/capita"
              value={country.poverty.gdpPerCapita ? `$${country.poverty.gdpPerCapita.toLocaleString()}` : 'N/A'}
            />
            <StatItem
              label="HDI"
              value={country.poverty.hdi?.toFixed(3) || 'N/A'}
            />
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-700 mb-2">Gender & Safety</h4>
          <div className="grid grid-cols-2 gap-4">
            <StatItem
              label="Women's Rights"
              value={country.gender.wblIndex ? `${country.gender.wblIndex.toFixed(0)}/100` : 'N/A'}
            />
            <StatItem
              label="Conflict"
              value={country.conflict.hasActiveConflict ? 'Active' : 'Peace'}
              highlight={country.conflict.hasActiveConflict}
            />
          </div>
        </div>

        <div className="border-t pt-4 text-xs text-gray-400">
          Sources: CIA Factbook, V-Dem, World Bank, UCDP
        </div>

        {/* Ad in country detail - hidden on mobile */}
        <div className="hidden md:block border-t pt-4 mt-4">
          <AdSidebar slotId={AD_SLOTS.countryDetail} size="square" />
        </div>
      </div>
    </div>
  )
}

interface StatItemProps {
  label: string
  value: string
  highlight?: boolean
}

function StatItem({ label, value, highlight }: StatItemProps) {
  return (
    <div>
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`font-medium ${highlight ? 'text-red-600' : 'text-gray-900'}`}>
        {value}
      </div>
    </div>
  )
}

interface DataSourceItemProps {
  title: string
  source: string
  description: string
  url: string
}

function DataSourceItem({ title, source, description, url }: DataSourceItemProps) {
  return (
    <div className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
      <h3 className="font-medium text-gray-900">{title}</h3>
      <p className="text-sm text-blue-600 mt-1">
        <a href={url} target="_blank" rel="noopener noreferrer" className="hover:underline">
          {source}
        </a>
      </p>
      <p className="text-sm text-gray-600 mt-1">{description}</p>
    </div>
  )
}

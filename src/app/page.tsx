'use client'

import { useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import type { Country, CountryFilters, ColorVariable } from '@/types/country'
import { filterCountries } from '@/lib/data'
import FilterPanel from '@/components/filters/FilterPanel'
import { DEFAULT_VARIABLE } from '@/lib/constants/variables'
import { BarChart2, Globe, Info, X } from 'lucide-react'
import countriesData from '../../data/countries.json'

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

  const countries = countriesData as Country[]

  const filteredCountries = useMemo(
    () => filterCountries(countries, filters),
    [countries, filters]
  )

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Country Comparison Map</h1>
              <p className="text-sm text-gray-500">
                Compare countries by religion, democracy, wealth, and more
              </p>
            </div>
          </div>
          <nav className="flex items-center gap-4">
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
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Filter Panel */}
        <FilterPanel
          filters={filters}
          onFiltersChange={setFilters}
          colorVariable={colorVariable}
          onColorVariableChange={setColorVariable}
          totalCountries={countries.length}
          filteredCount={filteredCountries.length}
        />

        {/* Map Area */}
        <div className="flex-1 relative bg-gray-50">
          <WorldMap
            countries={countries}
            filteredCountries={filteredCountries}
            colorVariable={colorVariable}
            onCountryClick={setSelectedCountry}
          />

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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
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
              <div className="space-y-6">
                <DataSourceItem
                  title="Religion Data"
                  source="CIA World Factbook"
                  description="Religious affiliation percentages for each country, updated annually."
                  url="https://www.cia.gov/the-world-factbook/"
                />
                <DataSourceItem
                  title="Democracy Score"
                  source="V-Dem Institute & Freedom House"
                  description="Liberal democracy index combining electoral democracy with liberal principles (0-100 scale)."
                  url="https://www.v-dem.net/"
                />
                <DataSourceItem
                  title="GDP per Capita"
                  source="World Bank"
                  description="Gross domestic product divided by midyear population, in current US dollars."
                  url="https://data.worldbank.org/"
                />
                <DataSourceItem
                  title="Gender Equality (WBL Index)"
                  source="World Bank - Women, Business and the Law"
                  description="Measures legal gender equality across 8 indicators (0-100 scale)."
                  url="https://wbl.worldbank.org/"
                />
                <DataSourceItem
                  title="Homicide Rate"
                  source="UN Office on Drugs and Crime"
                  description="Intentional homicides per 100,000 population."
                  url="https://dataunodc.un.org/"
                />
                <DataSourceItem
                  title="Conflict Status"
                  source="Uppsala Conflict Data Program (UCDP)"
                  description="Active armed conflicts with at least 25 battle-related deaths per year."
                  url="https://ucdp.uu.se/"
                />
              </div>
              <p className="mt-6 text-sm text-gray-500">
                Data is aggregated from multiple authoritative sources. Last updated: 2024.
              </p>
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
    <div className="absolute top-4 right-4 w-80 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
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

      <div className="p-4 space-y-4">
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

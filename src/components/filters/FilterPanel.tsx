'use client'

import { useState } from 'react'
import type { CountryFilters, ColorVariable } from '@/types/country'
import { MAJOR_RELIGIONS, REGIONS, VARIABLES, VARIABLE_CATEGORIES } from '@/lib/constants/variables'
import { ChevronDown, ChevronUp, Filter, X } from 'lucide-react'

// Get all variables (both numeric and categorical)
const allVariables = Object.entries(VARIABLES).map(([varId, config]) => ({
  ...config,
  id: varId as ColorVariable
}))

// Group variables by category
const variablesByCategory = VARIABLE_CATEGORIES.map(cat => ({
  ...cat,
  variables: allVariables.filter(v => v.category === cat.id)
})).filter(cat => cat.variables.length > 0)

interface FilterPanelProps {
  filters: CountryFilters
  onFiltersChange: (filters: CountryFilters) => void
  colorVariable: ColorVariable
  onColorVariableChange: (variable: ColorVariable) => void
  totalCountries: number
  filteredCount: number
  onClose?: () => void
}

export default function FilterPanel({
  filters,
  onFiltersChange,
  colorVariable,
  onColorVariableChange,
  totalCountries,
  filteredCount,
  onClose,
}: FilterPanelProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['colorBy', 'religion', 'democracy'])
  )

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  const updateFilter = <K extends keyof CountryFilters>(
    key: K,
    value: CountryFilters[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const clearAllFilters = () => {
    onFiltersChange({})
  }

  const hasActiveFilters = Object.keys(filters).some((key) => {
    const value = filters[key as keyof CountryFilters]
    if (Array.isArray(value)) return value.length > 0
    return value !== undefined
  })

  return (
    <div className="w-72 md:w-72 bg-white border-r border-gray-200 h-full overflow-y-auto">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </h2>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Clear all
              </button>
            )}
            {/* Mobile Close Button */}
            {onClose && (
              <button
                onClick={onClose}
                className="md:hidden p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
        <p className="text-sm text-gray-500">
          Showing {filteredCount} of {totalCountries} countries
        </p>
      </div>

      {/* Color By Section */}
      <FilterSection
        title="Color Map By"
        id="colorBy"
        expanded={expandedSections.has('colorBy')}
        onToggle={() => toggleSection('colorBy')}
      >
        <select
          value={colorVariable}
          onChange={(e) => onColorVariableChange(e.target.value as ColorVariable)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {variablesByCategory.map(cat => (
            <optgroup key={cat.id} label={`${cat.icon} ${cat.name}`}>
              {cat.variables.map(v => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </optgroup>
          ))}
        </select>
        <p className="mt-2 text-xs text-gray-400">{allVariables.length} variables available</p>
      </FilterSection>

      {/* Religion Filter */}
      <FilterSection
        title="Religion"
        id="religion"
        expanded={expandedSections.has('religion')}
        onToggle={() => toggleSection('religion')}
        badge={filters.majorReligion?.length}
      >
        <div className="space-y-2">
          {MAJOR_RELIGIONS.map((religion) => (
            <label key={religion} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.majorReligion?.includes(religion) || false}
                onChange={(e) => {
                  const current = filters.majorReligion || []
                  if (e.target.checked) {
                    updateFilter('majorReligion', [...current, religion])
                  } else {
                    updateFilter(
                      'majorReligion',
                      current.filter((r) => r !== religion)
                    )
                  }
                }}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm">{religion}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Democracy Score Filter */}
      <FilterSection
        title="Democracy Score"
        id="democracy"
        expanded={expandedSections.has('democracy')}
        onToggle={() => toggleSection('democracy')}
      >
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">
              Min: {filters.democracyMin ?? 0}
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={filters.democracyMin ?? 0}
              onChange={(e) => updateFilter('democracyMin', Number(e.target.value))}
              className="w-full"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">
              Max: {filters.democracyMax ?? 100}
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={filters.democracyMax ?? 100}
              onChange={(e) => updateFilter('democracyMax', Number(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
      </FilterSection>

      {/* GDP Filter */}
      <FilterSection
        title="GDP per Capita"
        id="gdp"
        expanded={expandedSections.has('gdp')}
        onToggle={() => toggleSection('gdp')}
      >
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">
              Min: ${(filters.gdpMin ?? 0).toLocaleString()}
            </label>
            <input
              type="range"
              min="0"
              max="100000"
              step="1000"
              value={filters.gdpMin ?? 0}
              onChange={(e) => updateFilter('gdpMin', Number(e.target.value))}
              className="w-full"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">
              Max: ${(filters.gdpMax ?? 100000).toLocaleString()}
            </label>
            <input
              type="range"
              min="0"
              max="100000"
              step="1000"
              value={filters.gdpMax ?? 100000}
              onChange={(e) => updateFilter('gdpMax', Number(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
      </FilterSection>

      {/* Gender Equality Filter */}
      <FilterSection
        title="Gender Equality (WBL Index)"
        id="gender"
        expanded={expandedSections.has('gender')}
        onToggle={() => toggleSection('gender')}
      >
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">
              Min: {filters.genderMin ?? 0}
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={filters.genderMin ?? 0}
              onChange={(e) => updateFilter('genderMin', Number(e.target.value))}
              className="w-full"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">
              Max: {filters.genderMax ?? 100}
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={filters.genderMax ?? 100}
              onChange={(e) => updateFilter('genderMax', Number(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
      </FilterSection>

      {/* Conflict Filter */}
      <FilterSection
        title="Conflict Status"
        id="conflict"
        expanded={expandedSections.has('conflict')}
        onToggle={() => toggleSection('conflict')}
      >
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="conflict"
              checked={filters.hasConflict === undefined}
              onChange={() => updateFilter('hasConflict', undefined)}
              className="text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm">All countries</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="conflict"
              checked={filters.hasConflict === false}
              onChange={() => updateFilter('hasConflict', false)}
              className="text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm">At peace</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="conflict"
              checked={filters.hasConflict === true}
              onChange={() => updateFilter('hasConflict', true)}
              className="text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm">Active conflict</span>
          </label>
        </div>
      </FilterSection>

      {/* Region Filter */}
      <FilterSection
        title="Region"
        id="region"
        expanded={expandedSections.has('region')}
        onToggle={() => toggleSection('region')}
        badge={filters.regions?.length}
      >
        <div className="space-y-2">
          {REGIONS.map((region) => (
            <label key={region} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.regions?.includes(region) || false}
                onChange={(e) => {
                  const current = filters.regions || []
                  if (e.target.checked) {
                    updateFilter('regions', [...current, region])
                  } else {
                    updateFilter(
                      'regions',
                      current.filter((r) => r !== region)
                    )
                  }
                }}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm">{region}</span>
            </label>
          ))}
        </div>
      </FilterSection>
    </div>
  )
}

interface FilterSectionProps {
  title: string
  id: string
  expanded: boolean
  onToggle: () => void
  badge?: number
  children: React.ReactNode
}

function FilterSection({
  title,
  expanded,
  onToggle,
  badge,
  children,
}: FilterSectionProps) {
  return (
    <div className="border-b border-gray-200">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50"
      >
        <span className="font-medium text-sm text-gray-700 flex items-center gap-2">
          {title}
          {badge !== undefined && badge > 0 && (
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
              {badge}
            </span>
          )}
        </span>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>
      {expanded && <div className="px-4 pb-4">{children}</div>}
    </div>
  )
}

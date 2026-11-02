'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { RotateCcw, SlidersHorizontal } from 'lucide-react'
import type { Country, ColorVariable } from '@/types/country'
import { REGIONS, VARIABLES } from '@/lib/constants/variables'
import { ranksHighFirst } from '@/lib/seo/catalog'
import type { ValueOrder } from '@/lib/seo/ranking'
import { VisualShare } from '@/components/share'
import ContextualOffers from '@/components/affiliate/ContextualOffers'
import NeutralMapLegend from './NeutralMapLegend'
import ProvenancePanel, { type ProvenancePanelProps } from './ProvenancePanel'
import RankingTable, { type RankingRow } from './RankingTable'
import {
  buildMapFilterHref,
  buildMapShareUrl,
  filterCountriesByMapFilters,
  hasActiveMapFilters,
  parseMapFilters,
  type MapFilters,
} from './mapFilters'

const WorldMap = dynamic(() => import('@/components/maps/WorldMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[540px] w-full items-center justify-center bg-[#eef1f5]">
      <span className="text-sm font-bold text-[#192947]/55">Loading the map</span>
    </div>
  ),
})

export interface MapFeatureProps extends Omit<ProvenancePanelProps, 'coverageCount' | 'totalCount'> {
  countries: Country[]
  colorVariable: ColorVariable
  canonicalPath: string
  rankingRows: RankingRow[]
  slug: string
  category: string
  name: string
}

interface RangeFieldProps {
  id: string
  label: string
  value: number | undefined
  onChange: (value: number | undefined) => void
  placeholder: string
  description?: string
}

function RangeField({
  id,
  label,
  value,
  onChange,
  placeholder,
  description,
}: RangeFieldProps) {
  return (
    <label htmlFor={id} className="block text-xs font-bold text-[#192947]/70">
      {label}
      <input
        id={id}
        type="number"
        min="0"
        step="1"
        inputMode="numeric"
        value={value ?? ''}
        placeholder={placeholder}
        aria-describedby={description ? `${id}-description` : undefined}
        onChange={(event) => {
          const rawValue = event.target.value
          if (rawValue.trim() === '') {
            onChange(undefined)
            return
          }
          const nextValue = Number(rawValue)
          onChange(Number.isFinite(nextValue) ? Math.max(0, nextValue) : undefined)
        }}
        className="mt-1.5 w-full rounded-xl border border-[#192947]/20 bg-white px-3 py-2 text-sm font-semibold text-[#192947] placeholder:text-[#192947]/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294cc4]"
      />
      {description && (
        <span id={`${id}-description`} className="mt-1 block text-[10px] font-normal leading-4 text-[#192947]/50">
          {description}
        </span>
      )}
    </label>
  )
}

export default function MapFeature({
  countries,
  colorVariable,
  canonicalPath,
  rankingRows,
  slug,
  category,
  name,
  sourceName,
  sourceUrl,
  vintage,
  limitations,
}: MapFeatureProps) {
  const [filters, setFilters] = useState<MapFilters>({})
  const mapCaptureRef = useRef<HTMLDivElement>(null)
  const config = VARIABLES[colorVariable]
  const categorical = config.type === 'categorical'
  const reportingNoun = categorical ? 'category' : 'value'
  const rankOrder: ValueOrder = ranksHighFirst(config) ? 'highest-first' : 'lowest-first'

  useEffect(() => {
    const restoreFromUrl = () => {
      setFilters(parseMapFilters(new URLSearchParams(window.location.search)))
    }

    restoreFromUrl()
    window.addEventListener('popstate', restoreFromUrl)
    return () => window.removeEventListener('popstate', restoreFromUrl)
  }, [])

  const commitFilters = useCallback((nextFilters: MapFilters) => {
    setFilters(nextFilters)
    if (typeof window === 'undefined') return

    const nextHref = buildMapFilterHref(window.location.pathname, nextFilters)
    window.history.replaceState(null, '', `${nextHref}${window.location.hash}`)
  }, [])

  const toggleRegion = (region: string) => {
    const selected = new Set(filters.regions || [])
    if (selected.has(region)) {
      selected.delete(region)
    } else {
      selected.add(region)
    }

    const nextRegions = REGIONS.filter((candidate) => selected.has(candidate))
    const nextFilters: MapFilters = { ...filters }
    if (nextRegions.length > 0) {
      nextFilters.regions = [...nextRegions]
    } else {
      delete nextFilters.regions
    }
    commitFilters(nextFilters)
  }

  const filteredCountries = useMemo(
    () => filterCountriesByMapFilters(countries, filters),
    [countries, filters]
  )

  const filteredIso3Set = useMemo(
    () => new Set(filteredCountries.map((country) => country.iso3)),
    [filteredCountries]
  )

  const filteredRankingRows = useMemo(
    () => rankingRows.filter((row) => filteredIso3Set.has(row.iso3)),
    [filteredIso3Set, rankingRows]
  )

  const activeFilters = hasActiveMapFilters(filters)
  const missingMetricCount = filteredCountries.length - filteredRankingRows.length
  const shareUrl = useMemo(() => {
    const origin = typeof window === 'undefined'
      ? 'https://theworldtruth.com'
      : window.location.origin
    return buildMapShareUrl(origin, canonicalPath, filters)
  }, [canonicalPath, filters])

  const shareDescription = useMemo(() => {
    const count = `${filteredCountries.length} of ${countries.length} countries shown.`
    const coverage = `${rankingRows.length} countries have a reported ${reportingNoun} in the full dataset.`
    return `${config.name} map. ${count} ${coverage} Source, vintage and limitations are on the page.`
  }, [config.name, countries.length, filteredCountries.length, rankingRows.length, reportingNoun])

  return (
    <section aria-labelledby="map-heading" className="mt-5 md:mt-8">
      <div className="mb-3 flex flex-col gap-2.5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="twt-kicker text-[11px] font-black uppercase tracking-[0.18em] text-[#294cc4]">
            Map
          </p>
          <h2 id="map-heading" className="twt-display mt-1 text-2xl font-black leading-tight text-[#192947] md:text-4xl">
            Explore {config.name}
          </h2>
          <p className="mt-1 text-xs font-semibold leading-5 text-[#192947]/65 sm:text-sm sm:leading-6" aria-live="polite">
            {filteredCountries.length} of {countries.length} countries match the filters. {filteredRankingRows.length} have a reported {reportingNoun}.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href="#map-filters"
            className="twt-button-secondary inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-[#192947]/20 bg-white px-4 py-2 text-sm font-black text-[#192947] hover:border-[#192947]/45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294cc4] lg:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            Filters
          </a>
          <VisualShare
            targetRef={mapCaptureRef}
            title={`${config.name} by country`}
            description={shareDescription}
            url={shareUrl}
            className="twt-button !rounded-full !bg-[#294cc4] !px-5 !py-2.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294cc4]"
          />
        </div>
      </div>

      <div className="grid gap-0 overflow-hidden rounded-[1.75rem] border-2 border-[#192947]/20 bg-white shadow-[8px_8px_0_rgba(25,41,71,0.08)] lg:grid-cols-[19rem_minmax(0,1fr)]">
        <div
          ref={mapCaptureRef}
          className="relative order-1 h-[540px] overflow-hidden bg-[#eef1f5] lg:order-2 lg:h-auto lg:min-h-[620px]"
        >
          <WorldMap
            countries={countries}
            filteredCountries={filteredCountries}
            colorVariable={colorVariable}
            className="[&>div.absolute.bottom-4.left-4]:hidden"
          />
          <NeutralMapLegend colorVariable={colorVariable} />

          {filteredCountries.length === 0 && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#fff9e8]/55 p-5">
              <div className="max-w-sm rounded-2xl border-2 border-[#192947] bg-white p-5 text-center shadow-[6px_6px_0_#ffda62]">
                <p className="twt-display text-2xl font-black text-[#192947]">No countries match these filters.</p>
                <p className="mt-2 text-sm leading-6 text-[#192947]/65">
                  Try a wider region, population or income range.
                </p>
                <button
                  type="button"
                  onClick={() => commitFilters({})}
                  className="twt-button mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-[#294cc4] px-5 py-2 text-sm font-black text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294cc4]"
                >
                  Clear all filters
                </button>
              </div>
            </div>
          )}
        </div>

        <div
          id="map-filters"
          className="twt-panel order-2 scroll-mt-24 border-t-2 border-[#192947]/15 bg-[#fff9e8] p-5 lg:order-1 lg:border-r-2 lg:border-t-0"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#294cc4]">Country filters</p>
              <h3 className="twt-display mt-1 text-2xl font-black text-[#192947]">Narrow the map</h3>
            </div>
            <button
              type="button"
              onClick={() => commitFilters({})}
              disabled={!activeFilters}
              className="mt-0.5 inline-flex min-h-10 items-center gap-1.5 rounded-full border border-[#192947]/15 bg-white px-3 py-1.5 text-xs font-black text-[#294cc4] hover:border-[#294cc4]/45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294cc4] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Clear
            </button>
          </div>

          <fieldset className="mt-5 border-t border-[#192947]/10 pt-4">
            <legend className="text-xs font-black uppercase tracking-[0.14em] text-[#192947]/65">Region</legend>
            <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2 lg:grid-cols-1">
              {REGIONS.map((region) => (
                <label key={region} className="flex min-h-9 cursor-pointer items-center gap-2 rounded-lg text-sm font-semibold text-[#192947]/75">
                  <input
                    type="checkbox"
                    checked={filters.regions?.includes(region) || false}
                    onChange={() => toggleRegion(region)}
                    className="h-4 w-4 rounded border-[#192947]/30 accent-[#294cc4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294cc4]"
                  />
                  {region}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="mt-4 border-t border-[#192947]/10 pt-4">
            <legend className="text-xs font-black uppercase tracking-[0.14em] text-[#192947]/65">Population</legend>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <RangeField
                id="population-min"
                label="Minimum"
                value={filters.populationMin}
                onChange={(value) => {
                  const next = { ...filters }
                  if (value === undefined) delete next.populationMin
                  else next.populationMin = value
                  commitFilters(next)
                }}
                placeholder="0"
              />
              <RangeField
                id="population-max"
                label="Maximum"
                value={filters.populationMax}
                onChange={(value) => {
                  const next = { ...filters }
                  if (value === undefined) delete next.populationMax
                  else next.populationMax = value
                  commitFilters(next)
                }}
                placeholder="Any"
              />
            </div>
            <p className="mt-2 text-[10px] leading-4 text-[#192947]/50">
              Countries without a population value are excluded when a bound is set.
            </p>
          </fieldset>

          <fieldset className="mt-4 border-t border-[#192947]/10 pt-4">
            <legend className="text-xs font-black uppercase tracking-[0.14em] text-[#192947]/65">Income</legend>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <RangeField
                id="income-min"
                label="Minimum"
                value={filters.gdpMin}
                onChange={(value) => {
                  const next = { ...filters }
                  if (value === undefined) delete next.gdpMin
                  else next.gdpMin = value
                  commitFilters(next)
                }}
                placeholder="0"
              />
              <RangeField
                id="income-max"
                label="Maximum"
                value={filters.gdpMax}
                onChange={(value) => {
                  const next = { ...filters }
                  if (value === undefined) delete next.gdpMax
                  else next.gdpMax = value
                  commitFilters(next)
                }}
                placeholder="Any"
              />
            </div>
            <p className="mt-2 text-[10px] leading-4 text-[#192947]/50">
              Income uses nominal GDP per capita in US dollars. Countries without this value are excluded when a bound is set.
            </p>
          </fieldset>

          {missingMetricCount > 0 && (
            <p className="mt-4 rounded-xl border border-[#dc654e]/25 bg-[#dc654e]/10 px-3 py-2 text-xs font-semibold leading-5 text-[#192947]/70">
              {missingMetricCount} matching {missingMetricCount === 1 ? 'country has' : 'countries have'} no reported {reportingNoun} for {config.name} and {missingMetricCount === 1 ? 'is' : 'are'} not in the table.
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <ProvenancePanel
          sourceName={sourceName}
          sourceUrl={sourceUrl}
          vintage={vintage}
          limitations={limitations}
          categorical={categorical}
          coverageCount={rankingRows.length}
          totalCount={countries.length}
        />

        <div className="min-w-0 lg:mt-6">
          <div className="rounded-t-[1.5rem] border-2 border-b-0 border-[#192947]/15 bg-[#ffda62] px-5 pb-4 pt-5">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#192947]/60">Ordinary links</p>
            <h2 className="twt-display mt-1 text-2xl font-black leading-tight text-[#192947]">Books and contextual links</h2>
            <p className="mt-2 text-xs leading-5 text-[#192947]/65">
              These include Amazon search and related partner links, not verified deals. They do not affect the ranking or the data.
            </p>
          </div>
          <div className="[&>aside]:mt-0 [&>aside]:rounded-t-none [&>aside]:border-2 [&>aside]:border-[#192947]/15">
            <ContextualOffers slug={slug} category={category} name={name} />
          </div>
        </div>
      </div>

      <div className="mt-6">
        <RankingTable
          rows={filteredRankingRows}
          metricName={config.name}
          categorical={categorical}
          filteredCountryCount={filteredCountries.length}
          hasActiveFilters={activeFilters}
          rankOrder={rankOrder}
        />
      </div>
    </section>
  )
}

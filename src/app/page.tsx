'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import {
  ArrowUpRight,
  Check,
  Copy,
  Database,
  ExternalLink,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import type { Country, CountryFilters, ColorVariable } from '@/types/country'
import { filterCountries } from '@/lib/data'
import FilterPanel from '@/components/filters/FilterPanel'
import { DEFAULT_VARIABLE, VARIABLES } from '@/lib/constants/variables'
import { countries } from '@/lib/data/loadCountries'
import { AdBanner, AdSidebar } from '@/components/ads'
import { AD_SLOTS } from '@/lib/constants/ads'
import { VisualShare } from '@/components/share'
import { useEmbeddedAppMode } from '@/lib/useEmbeddedAppMode'
import {
  getVariableById,
  getVariableBySlug,
  rankCountries,
  variableEntries,
  type VariableEntry,
} from '@/lib/seo/catalog'
import { getMetricProvenance } from '@/lib/seo/provenance'
import { countrySlug } from '@/lib/seo/slugs'
import { getNestedValue } from '@/lib/utils'
import {
  activeFilterLabels,
  buildMapShareUrl,
  parseMapFilters,
} from '@/components/site/mapLinks'

const WorldMap = dynamic(() => import('@/components/maps/WorldMap'), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[520px] w-full items-center justify-center bg-twt-map-surface">
      <span className="text-sm font-semibold text-twt-ink/70">Loading the map</span>
    </div>
  ),
})

const FEATURED_METRIC_PRIORITY = ['freedom.pressFreedom']

type FeaturedMetric = {
  entry: VariableEntry
  ranked: ReturnType<typeof rankCountries>
  provenance: ReturnType<typeof getMetricProvenance>
}

function selectFeaturedMetric(): FeaturedMetric | null {
  const orderedEntries = [
    ...FEATURED_METRIC_PRIORITY.map((id) => getVariableById(id)).filter(
      (entry): entry is VariableEntry => Boolean(entry)
    ),
    ...variableEntries.filter((entry) => !FEATURED_METRIC_PRIORITY.includes(entry.id)),
  ]

  for (const entry of orderedEntries) {
    const provenance = getMetricProvenance(entry.id)
    if (!provenance.featuredEligible) continue
    if (VARIABLES[entry.id]?.type !== 'numeric') continue

    const ranked = rankCountries(entry.id)
    if (ranked.length === 0) continue
    return { entry, ranked, provenance }
  }

  return null
}

const FEATURED = selectFeaturedMetric()
const FEATURED_LEADER = FEATURED?.ranked[0]
const FEATURED_TOP = FEATURED?.ranked.slice(0, 5) ?? []

const DATA_SOURCE_GROUPS = [
  {
    title: 'Governance and economy',
    items: [
      {
        title: 'Religion data',
        source: 'CIA World Factbook',
        description: 'Religious affiliation percentages for each country.',
        url: 'https://www.cia.gov/the-world-factbook/',
      },
      {
        title: 'Democracy score',
        source: 'V-Dem Institute and Freedom House',
        description: 'Liberal democracy measures on a 0 to 100 scale.',
        url: 'https://www.v-dem.net/',
      },
      {
        title: 'GDP and poverty',
        source: 'World Bank and IMF',
        description: 'GDP per capita, poverty rates, and the Human Development Index.',
        url: 'https://data.worldbank.org/',
      },
      {
        title: 'Corruption index',
        source: 'Transparency International',
        description: 'Corruption Perceptions Index on a 0 to 100 scale.',
        url: 'https://www.transparency.org/',
      },
      {
        title: 'Press freedom',
        source: 'Reporters Without Borders',
        description: 'World Press Freedom Index scores on a 0 to 100 scale.',
        url: 'https://rsf.org/en/index?year=2026',
      },
    ],
  },
  {
    title: 'Health and body',
    items: [
      {
        title: 'Life expectancy and health',
        source: 'World Health Organization',
        description: 'Life expectancy, obesity, alcohol use, and suicide rates.',
        url: 'https://www.who.int/data',
      },
      {
        title: 'Height data',
        source: 'NCD Risk Factor Collaboration',
        description: 'Average adult height from standardized measurements.',
        url: 'https://ncdrisc.org/',
      },
      {
        title: 'Fertility rate',
        source: 'UN Population Division',
        description: 'Average children per woman, also called the total fertility rate.',
        url: 'https://population.un.org/',
      },
    ],
  },
  {
    title: 'Demographics and education',
    items: [
      {
        title: 'IQ and education',
        source: 'OECD PISA and academic studies',
        description: 'PISA scores, literacy rates, and national IQ estimates.',
        url: 'https://www.oecd.org/pisa/',
      },
      {
        title: 'Ethnic diversity',
        source: 'Alesina et al. (2003)',
        description: 'Ethnic fractionalization index from academic research.',
        url: 'https://scholar.harvard.edu/',
      },
      {
        title: 'Demographics',
        source: 'UN Population Division',
        description: 'Median age, urban population share, and population density.',
        url: 'https://population.un.org/',
      },
    ],
  },
  {
    title: 'Lifestyle and society',
    items: [
      {
        title: 'Happiness index',
        source: 'World Happiness Report',
        description: 'Life evaluations based on Gallup World Poll surveys.',
        url: 'https://worldhappiness.report/',
      },
      {
        title: 'LGBT acceptance',
        source: 'ILGA World and Gallup',
        description: 'Survey measures of social acceptance.',
        url: 'https://ilga.org/',
      },
      {
        title: 'Work and internet',
        source: 'OECD and ITU',
        description: 'Average work hours and internet penetration.',
        url: 'https://data.oecd.org/',
      },
    ],
  },
  {
    title: 'Safety and conflict',
    items: [
      {
        title: 'Homicide rate',
        source: 'UN Office on Drugs and Crime',
        description: 'Intentional homicides per 100,000 people.',
        url: 'https://dataunodc.un.org/',
      },
      {
        title: 'Gun ownership',
        source: 'Small Arms Survey',
        description: 'Civilian firearms per 100 people.',
        url: 'https://www.smallarmssurvey.org/',
      },
      {
        title: 'Conflict status',
        source: 'Uppsala Conflict Data Program',
        description: 'Active armed conflicts and battle-related deaths.',
        url: 'https://ucdp.uu.se/',
      },
      {
        title: 'Peace index',
        source: 'Institute for Economics and Peace',
        description: 'Global Peace Index measures of national peacefulness.',
        url: 'https://www.visionofhumanity.org/',
      },
    ],
  },
]

export default function HomePage() {
  const [filters, setFilters] = useState<CountryFilters>({})
  const [colorVariable, setColorVariable] = useState<ColorVariable>(DEFAULT_VARIABLE)
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null)
  const [showDataSources, setShowDataSources] = useState(false)
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle')
  const copyResetTimer = useRef<number | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const embeddedMode = useEmbeddedAppMode()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const raw = params.get('var')
    if (raw) {
      const entry = getVariableById(raw) || getVariableBySlug(raw)
      if (entry) setColorVariable(entry.id)
    }
    setFilters(parseMapFilters(params))
  }, [])

  const currentVariable = VARIABLES[colorVariable]
  const currentEntry = getVariableById(colorVariable)
  const filteredCountries = useMemo(
    () => filterCountries(countries, filters),
    [filters]
  )
  const filterLabels = activeFilterLabels(filters)
  const mapShareUrl = currentEntry
    ? buildMapShareUrl(currentEntry.slug, filters)
    : buildMapShareUrl('press-freedom', filters)

  useEffect(() => {
    if (
      selectedCountry &&
      !filteredCountries.some((country) => country.iso3 === selectedCountry.iso3)
    ) {
      setSelectedCountry(null)
    }
  }, [filteredCountries, selectedCountry])

  useEffect(() => {
    if (!showDataSources) return

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowDataSources(false)
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [showDataSources])

  useEffect(() => {
    return () => {
      if (copyResetTimer.current !== null) {
        window.clearTimeout(copyResetTimer.current)
      }
    }
  }, [])

  const copyMapLink = async () => {
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error('Clipboard access is unavailable')
      }
      await navigator.clipboard.writeText(mapShareUrl)
      setCopyState('copied')
    } catch {
      setCopyState('error')
    } finally {
      if (copyResetTimer.current !== null) {
        window.clearTimeout(copyResetTimer.current)
      }
      copyResetTimer.current = window.setTimeout(() => {
        setCopyState('idle')
        copyResetTimer.current = null
      }, 2500)
    }
  }

  return (
    <div className={embeddedMode ? 'min-h-[100svh] bg-twt-paper' : 'twt-shell'}>
      <main id="main-content">
        {!embeddedMode && (
          <>
            <section className="relative overflow-hidden border-b-2 border-twt-ink/15 bg-twt-paper">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-60"
                style={{
                  backgroundImage:
                    'radial-gradient(circle at 15% 20%, rgba(255,218,98,0.85), transparent 24%), linear-gradient(rgba(41,76,196,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(41,76,196,0.08) 1px, transparent 1px)',
                  backgroundSize: 'auto, 42px 42px, 42px 42px',
                }}
              />
              <div className="twt-container relative grid gap-10 py-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)] lg:items-center lg:py-16">
                <div>
                  <p className="twt-kicker flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-twt-coral" aria-hidden="true" />
                    Featured map{FEATURED ? `: ${FEATURED.entry.name}` : ''}
                  </p>
                  <h1 className="twt-display mt-5 max-w-4xl text-balance text-5xl leading-[0.95] text-twt-ink sm:text-6xl lg:text-7xl">
                    {FEATURED && FEATURED_LEADER
                      ? `${FEATURED_LEADER.country.name} leads the ${FEATURED.entry.name.toLowerCase()} map at ${FEATURED_LEADER.formatted}.`
                      : 'The world, measured and mapped.'}
                  </h1>
                  <p className="mt-6 max-w-2xl text-lg leading-8 text-twt-ink/75">
                    {FEATURED && FEATURED_LEADER
                      ? `Compare ${FEATURED.ranked.length} countries with recorded values, find your country, and share the map.`
                      : 'Explore country maps, daily puzzles and the stories behind the numbers.'}
                  </p>

                  {FEATURED && FEATURED_LEADER && (
                    <div className="mt-4 max-w-2xl space-y-1 text-sm leading-6 text-twt-ink/70">
                      <p>
                        Source:{' '}
                        {FEATURED.provenance.sourceUrl ? (
                          <a
                            href={FEATURED.provenance.sourceUrl}
                            target="_blank"
                            rel="nofollow noopener noreferrer"
                            className="font-semibold text-twt-blue underline decoration-twt-blue/30 underline-offset-4 hover:decoration-twt-blue"
                          >
                            {FEATURED.provenance.sourceName ?? 'Source record'}
                          </a>
                        ) : (
                          FEATURED.provenance.sourceName ?? 'Source record'
                        )}
                        . Vintage: {FEATURED.provenance.year ?? 'not stated'}.
                      </p>
                      <p>
                        Coverage:{' '}
                        {FEATURED.provenance.coverage !== undefined
                          ? `${FEATURED.provenance.coverage}% of mapped countries with a recorded value`
                          : 'not stated'}
                        .{' '}
                        <Link
                          href={`/map/${FEATURED.entry.slug}/`}
                          className="font-semibold text-twt-blue underline decoration-twt-blue/30 underline-offset-4 hover:decoration-twt-blue"
                        >
                          Coverage and limitations
                        </Link>
                      </p>
                    </div>
                  )}

                  <div className="mt-7 flex flex-wrap gap-3">
                    <Link href={`/map/${FEATURED?.entry.slug ?? 'press-freedom'}/`} className="twt-button">
                      Open {FEATURED ? `the ${FEATURED.entry.name.toLowerCase()}` : 'the map'} map
                      <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                    <a href="#explore" className="twt-button-secondary">
                      Explore all measures
                    </a>
                  </div>
                </div>

                <div className="grid gap-4">
                  {FEATURED && FEATURED_LEADER ? (
                    <article className="relative overflow-hidden rounded-[2rem] border-2 border-twt-ink bg-twt-blue p-6 text-white shadow-[10px_10px_0_#ffda62] sm:p-8">
                      <div aria-hidden="true" className="absolute -right-10 -top-14 h-40 w-40 rounded-full border-[22px] border-white/10" />
                      <div className="relative">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-twt-butter">Leading mapped value</p>
                            <p className="twt-display mt-2 truncate text-3xl">{FEATURED_LEADER.country.name}</p>
                            <p className="mt-2 text-xs font-semibold text-white/75">{FEATURED.entry.name}</p>
                          </div>
                          <div className="max-w-[55%] text-right">
                            <p className="twt-display break-words text-4xl leading-none sm:text-5xl">{FEATURED_LEADER.formatted}</p>
                            <p className="mt-2 text-xs font-semibold text-white/75">{FEATURED.ranked.length} countries with data</p>
                          </div>
                        </div>

                        <div className="mt-7 border-t border-white/20 pt-5">
                          <div className="flex items-center justify-between gap-4">
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/75">
                              {FEATURED_TOP.length >= 5 ? 'Top five on this map' : 'Leading values'}
                            </p>
                            <span className="text-xs text-white/75">{FEATURED.provenance.year ?? 'Vintage not stated'}</span>
                          </div>
                          <ol className="mt-4 space-y-3">
                            {FEATURED_TOP.map((row, index) => {
                              const maxValue = Math.max(...FEATURED_TOP.map((item) => Math.abs(item.value)), 1)
                              const barWidth = Math.max(4, Math.min(100, (Math.abs(row.value) / maxValue) * 100))
                              return (
                                <li key={row.country.iso3} className="grid grid-cols-[1.25rem_minmax(0,1fr)] items-start gap-3 text-sm">
                                  <span className="pt-0.5 font-bold text-twt-butter">{index + 1}</span>
                                  <div>
                                    <div className="flex items-center justify-between gap-3">
                                      <span className="truncate font-semibold">{row.country.name}</span>
                                      <span className="shrink-0 tabular-nums text-white/75">{row.formatted}</span>
                                    </div>
                                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/15">
                                      <div className="h-full rounded-full bg-twt-butter" style={{ width: `${barWidth}%` }} />
                                    </div>
                                  </div>
                                </li>
                              )
                            })}
                          </ol>
                        </div>
                      </div>
                    </article>
                  ) : (
                    <article className="relative overflow-hidden rounded-[2rem] border-2 border-twt-ink bg-twt-blue p-6 text-white shadow-[10px_10px_0_#ffda62] sm:p-8">
                      <div aria-hidden="true" className="absolute -right-10 -top-14 h-40 w-40 rounded-full border-[22px] border-white/10" />
                      <div className="relative">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-twt-butter">Source review pending</p>
                        <p className="twt-display mt-3 text-3xl leading-tight">Featured facts appear after review.</p>
                        <p className="mt-3 text-sm leading-6 text-white/75">
                          Browse the dataset now. A metric is promoted here only when its source record is eligible.
                        </p>
                        <Link href="#explore" className="twt-button mt-6 !border-white !bg-white !text-twt-ink">
                          Explore the dataset
                          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                        </Link>
                      </div>
                    </article>
                  )}

                  <aside className="twt-panel bg-twt-butter p-5 sm:p-6" aria-labelledby="daily-game-heading">
                    <p className="twt-kicker !text-twt-ink/75">Daily game</p>
                    <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
                      <div>
                        <h2 id="daily-game-heading" className="twt-display text-3xl leading-none text-twt-ink">
                          Play today&apos;s round
                        </h2>
                        <p className="mt-2 max-w-sm text-sm leading-6 text-twt-ink/70">
                          Answer a short set of world questions, then explore the data behind them.
                        </p>
                      </div>
                      <Link href="/truthle/" className="twt-button">
                        Play Truthle
                        <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                      </Link>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-4 text-sm font-bold text-twt-ink">
                      <Link href="/true-false/" className="underline decoration-twt-ink/25 underline-offset-4 hover:decoration-twt-ink">
                        Play True or False
                      </Link>
                      <Link href="/rewards/" className="underline decoration-twt-ink/25 underline-offset-4 hover:decoration-twt-ink">
                        Rewards and codes
                      </Link>
                    </div>
                  </aside>
                </div>
              </div>
            </section>

            <div className="border-b border-twt-ink/10 bg-white/70 py-3">
              <div className="twt-container flex flex-wrap items-center justify-between gap-3 text-xs font-semibold text-twt-ink/70">
                <p>Browse {variableEntries.length} map topics.</p>
                <Link href="/discoveries/" className="inline-flex items-center gap-1 text-twt-blue hover:underline">
                  Browse discoveries
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </div>
            </div>

            <AdBanner slotId={AD_SLOTS.headerBanner} hideOnMobile={false} className="bg-twt-paper py-3" />
          </>
        )}

        <section id="explore" className={embeddedMode ? 'bg-twt-paper' : 'scroll-mt-24 bg-twt-paper py-12 sm:py-16'}>
          {!embeddedMode && (
            <div className="twt-container mb-7">
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                <div>
                  <p className="twt-kicker">Explore the map</p>
                  <h2 className="twt-display mt-3 text-balance text-4xl leading-[0.98] sm:text-5xl">
                    Pick a measure. Filter the world.
                  </h2>
                  <p className="twt-prose mt-4">
                    Choose from the full country dataset, narrow the map by region or context, and select any country for a quick profile.
                  </p>
                </div>
                <Link href="/discoveries/" className="twt-button-secondary justify-self-start md:justify-self-end">
                  Find a discovery
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          )}

          <div className={embeddedMode ? '' : 'twt-container'}>
            {!embeddedMode && (
              <div className="mb-4 flex flex-col gap-4 rounded-[1.5rem] border border-twt-ink/15 bg-white/80 p-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-twt-ink" aria-live="polite">
                    Showing {filteredCountries.length} of {countries.length} countries
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {filterLabels.length > 0 ? (
                      filterLabels.map((label) => (
                        <span key={label} className="rounded-full bg-twt-paper px-3 py-1 text-xs font-semibold text-twt-ink/70">
                          {label}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-twt-ink/70">No filters applied</span>
                    )}
                    {filterLabels.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setFilters({})}
                        className="text-xs font-bold text-twt-blue underline decoration-twt-blue/30 underline-offset-4 hover:decoration-twt-blue"
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <VisualShare
                    targetRef={mapContainerRef}
                    title={`${currentVariable.name} map`}
                    description={`Explore ${currentVariable.name} by country on The World Truth.`}
                    url={mapShareUrl}
                    className="!min-h-11 !rounded-full !border-2 !border-twt-ink/20 !bg-white !px-4 !py-2 !text-sm !font-bold !text-twt-ink hover:!border-twt-ink hover:!bg-twt-butter"
                  />
                  <button
                    type="button"
                    onClick={copyMapLink}
                    aria-live="polite"
                    className="twt-button-secondary !min-h-11 !px-4 !py-2 !text-xs"
                  >
                    {copyState === 'copied' ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
                    {copyState === 'copied' ? 'Link copied' : copyState === 'error' ? 'Copy failed' : 'Copy map link'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDataSources(true)}
                    className="twt-button-secondary !min-h-11 !px-4 !py-2 !text-xs"
                  >
                    <Database className="h-4 w-4" aria-hidden="true" />
                    Data sources
                  </button>
                </div>
              </div>
            )}

            <div className={`relative overflow-hidden border-twt-ink/15 bg-white md:grid md:grid-cols-[300px_minmax(0,1fr)] ${embeddedMode ? 'min-h-[100svh] border-y-0' : 'min-h-[660px] rounded-[2rem] border-2 shadow-[10px_10px_0_rgba(25,41,71,0.08)]'}`}>
              {showMobileFilters && (
                <div
                  className="fixed inset-0 z-40 bg-twt-ink/55 md:hidden"
                  onClick={() => setShowMobileFilters(false)}
                  aria-hidden="true"
                />
              )}

              <div
                className={`
                  fixed inset-y-0 left-0 z-50 transform motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-in-out md:relative md:inset-auto md:z-auto md:translate-x-0
                  ${showMobileFilters ? 'translate-x-0' : '-translate-x-full'}
                  ${embeddedMode ? 'w-[min(92vw,360px)]' : 'w-[min(92vw,340px)] md:w-auto'}
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
                  containerClassName="h-full w-full overflow-y-auto border-r-2 border-twt-ink/10 bg-twt-paper"
                />
              </div>

              <div
                ref={mapContainerRef}
                className={`twt-map-surface relative h-[68svh] min-h-[540px] md:h-auto md:min-h-[660px] ${embeddedMode ? 'min-h-[100svh]' : ''}`}
              >
                <WorldMap
                  countries={countries}
                  filteredCountries={filteredCountries}
                  colorVariable={colorVariable}
                  onCountryClick={setSelectedCountry}
                />

                <button
                  type="button"
                  onClick={() => setShowMobileFilters(true)}
                  className="absolute bottom-4 left-4 z-30 inline-flex h-12 w-12 items-center justify-center rounded-full border-2 border-twt-ink bg-twt-butter text-twt-ink shadow-lg md:hidden"
                  aria-label="Open map filters"
                >
                  <SlidersHorizontal className="h-5 w-5" aria-hidden="true" />
                </button>

                {filteredCountries.length === 0 && (
                  <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center p-5">
                    <div className="pointer-events-auto max-w-sm rounded-[1.5rem] border-2 border-twt-ink bg-white p-6 text-center shadow-[7px_7px_0_#ffda62]">
                      <p className="twt-display text-2xl">No countries match these filters.</p>
                      <p className="mt-2 text-sm leading-6 text-twt-ink/65">Try a wider range or remove one of the active filter groups.</p>
                      <button type="button" onClick={() => setFilters({})} className="twt-button mt-4">
                        Clear all filters
                      </button>
                    </div>
                  </div>
                )}

                {selectedCountry && (
                  <CountryDetailPanel
                    country={selectedCountry}
                    colorVariable={colorVariable}
                    onClose={() => setSelectedCountry(null)}
                  />
                )}
              </div>
            </div>

            {!embeddedMode && (
              <div className="mt-4 flex flex-col gap-2 text-xs leading-5 text-twt-ink/70 sm:flex-row sm:items-center sm:justify-between">
                <p>Map colors follow the selected value. They do not imply better or worse.</p>
                <Link href="/charts/" className="inline-flex items-center gap-1 font-bold text-twt-blue hover:underline">
                  Open charts
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </div>
            )}
          </div>
        </section>
      </main>

      {showDataSources && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-twt-ink/60 p-0 sm:items-center sm:p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="data-sources-heading"
            className="max-h-[92vh] w-full max-w-3xl overflow-hidden rounded-t-[2rem] border-2 border-twt-ink bg-twt-paper shadow-2xl sm:rounded-[2rem]"
          >
            <div className="flex items-center justify-between border-b border-twt-ink/15 px-5 py-4 sm:px-7">
              <div>
                <p className="twt-kicker">Reference</p>
                <h2 id="data-sources-heading" className="twt-display mt-1 text-2xl">Data sources</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowDataSources(false)}
                autoFocus
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border-2 border-twt-ink/15 bg-white text-twt-ink hover:bg-twt-butter"
                aria-label="Close data sources"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div className="max-h-[72vh] overflow-y-auto px-5 py-6 sm:px-7">
              <div className="grid gap-7 sm:grid-cols-2">
                {DATA_SOURCE_GROUPS.map((group) => (
                  <section key={group.title}>
                    <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-twt-blue">{group.title}</h3>
                    <div className="mt-3 space-y-4">
                      {group.items.map((item) => (
                        <DataSourceItem key={item.title} {...item} />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
              <div className="mt-7 rounded-2xl border border-twt-ink/15 bg-white p-4 text-sm leading-6 text-twt-ink/65">
                <p>Source years and country coverage differ by metric. Each map page is the place to check the current source note and limitations.</p>
                <Link href="/privacy/" onClick={() => setShowDataSources(false)} className="mt-2 inline-flex items-center gap-1 font-bold text-twt-blue hover:underline">
                  Privacy policy
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
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
  colorVariable: ColorVariable
  onClose: () => void
}

function CountryDetailPanel({ country, colorVariable, onClose }: CountryDetailPanelProps) {
  const variableConfig = VARIABLES[colorVariable]
  const value = getNestedValue(
    country as unknown as Record<string, unknown>,
    colorVariable
  )

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 max-h-[82vh] overflow-hidden rounded-t-[1.75rem] border-2 border-twt-ink bg-white shadow-2xl md:absolute md:inset-x-auto md:bottom-auto md:right-4 md:top-4 md:w-[340px] md:rounded-[1.5rem]">
      <div className="flex items-center justify-between bg-twt-ink px-5 py-4 text-white">
        <div>
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-twt-butter">Country profile</p>
          <h3 className="twt-display mt-1 text-2xl">{country.name}</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          aria-label={`Close ${country.name} profile`}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="max-h-[68vh] space-y-5 overflow-y-auto p-5">
        <div className="rounded-2xl bg-twt-blue p-4 text-white">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-twt-butter">{variableConfig.name}</p>
          <p className="mt-2 text-3xl font-bold tabular-nums">
            {value === null || value === undefined
              ? 'No data for this measure'
              : variableConfig.format(value as number | string)}
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-4">
          <StatItem label="Region" value={country.region || 'Not available'} />
          <StatItem
            label="Population"
            value={country.population ? `${(country.population / 1000000).toFixed(1)}M` : 'Not available'}
          />
          <StatItem label="GDP per capita" value={country.poverty.gdpPerCapita ? `$${country.poverty.gdpPerCapita.toLocaleString()}` : 'Not available'} />
          <StatItem label="Democracy score" value={country.democracy.score ? `${country.democracy.score}/100` : 'Not available'} />
        </dl>

        <div className="border-t border-twt-ink/10 pt-4">
          <h4 className="text-xs font-bold uppercase tracking-[0.16em] text-twt-ink/70">Religion</h4>
          <p className="mt-2 text-sm font-bold">{country.religion.major || 'Not available'}</p>
          <div className="mt-2 space-y-1.5">
            {Object.entries(country.religion.breakdown)
              .sort(([, first], [, second]) => second - first)
              .slice(0, 3)
              .map(([religion, percent]) => (
                <div key={religion} className="flex justify-between gap-4 text-sm">
                  <span className="text-twt-ink/70">{religion}</span>
                  <span className="font-semibold tabular-nums">{percent.toFixed(1)}%</span>
                </div>
              ))}
          </div>
        </div>

        <div className="border-t border-twt-ink/10 pt-4">
          <h4 className="text-xs font-bold uppercase tracking-[0.16em] text-twt-ink/70">Context</h4>
          <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded-full bg-twt-paper px-3 py-1.5">Women&apos;s rights index: {country.gender.wblIndex ? `${country.gender.wblIndex.toFixed(0)}/100` : 'not available'}</span>
            <span className={`rounded-full px-3 py-1.5 ${country.conflict.hasActiveConflict ? 'bg-twt-coral/20 text-twt-ink' : 'bg-twt-paper text-twt-ink/70'}`}>
              {country.conflict.hasActiveConflict ? 'Active conflict recorded' : 'No active conflict recorded'}
            </span>
          </div>
        </div>

        <div className="border-t border-twt-ink/10 pt-4">
          <Link
            href={`/country/${countrySlug(country.name)}/`}
            className="twt-button w-full"
          >
            Open {country.name} profile
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <p className="mt-3 text-xs leading-5 text-twt-ink/65">Coverage and reference years vary by measure. Check the map source note before reusing a figure.</p>
        </div>

        <div className="hidden border-t border-twt-ink/10 pt-4 md:block">
          <AdSidebar slotId={AD_SLOTS.countryDetail} size="square" />
        </div>
      </div>
    </div>
  )
}

interface StatItemProps {
  label: string
  value: string
}

function StatItem({ label, value }: StatItemProps) {
  return (
    <div>
      <dt className="text-xs font-semibold text-twt-ink/65">{label}</dt>
      <dd className="mt-1 text-sm font-bold text-twt-ink">{value}</dd>
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
    <div className="border-b border-twt-ink/10 pb-4 last:border-0 last:pb-0">
      <h4 className="text-sm font-bold text-twt-ink">{title}</h4>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-twt-blue hover:underline"
      >
        {source}
        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
      </a>
      <p className="mt-1 text-xs leading-5 text-twt-ink/65">{description}</p>
    </div>
  )
}

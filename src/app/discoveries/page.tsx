'use client'

import { Suspense, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowUpRight,
  Filter,
  RotateCcw,
  Search,
  Shuffle,
  SlidersHorizontal,
  Sparkles,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react'
import correlationsData from '../../../data/correlations.json'
import { VisualShare } from '@/components/share'
import { resolveShareProvenance } from '@/components/share/provenance'
import { absoluteSiteUrl } from '@/components/share/shareState'
import { useDialogFocus } from '@/components/share/useDialogFocus'
import { useEmbeddedAppMode } from '@/lib/useEmbeddedAppMode'
import {
  DEFAULT_DISCOVERY_STATE,
  discoveryStateHref,
  filterAndSortDiscoveries,
  findDiscoveryPair,
  normalizeDiscoveryState,
  parseDiscoveryState,
  serializeDiscoveryState,
  type DiscoveryState,
} from './discoveryState'

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

const CATEGORY_LABELS: Record<string, string> = {
  governance: 'Governance',
  economy: 'Economy',
  health: 'Health',
  sex: 'Relationships',
  demographics: 'Demographics',
  education: 'Education',
  lifestyle: 'Lifestyle',
  safety: 'Safety',
  transport: 'Transport',
  environment: 'Environment',
  religion: 'Religion',
}

const STRENGTH_LABELS: Record<Correlation['strength'], string> = {
  very_strong: 'Very strong',
  strong: 'Strong',
  moderate: 'Moderate',
}

function statesEqual(left: DiscoveryState, right: DiscoveryState): boolean {
  return serializeDiscoveryState(left) === serializeDiscoveryState(right)
}

function DiscoveriesLoading() {
  return (
    <div className="twt-shell min-h-screen bg-[#fff9e8] px-4 py-12 text-[#192947]">
      <div className="mx-auto max-w-6xl animate-pulse rounded-3xl bg-white/70 p-8 motion-reduce:animate-none">
        Loading discoveries...
      </div>
    </div>
  )
}

function DiscoveriesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const embeddedMode = useEmbeddedAppMode()
  const dialogTitleId = useId()
  const dialogDescriptionId = useId()
  const [showFilters, setShowFilters] = useState(false)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const firstUrlCheckRef = useRef(true)
  const stateRef = useRef<DiscoveryState>(DEFAULT_DISCOVERY_STATE)

  const correlations = correlationsData.correlations as Correlation[]
  const metadata = correlationsData.metadata
  const stats = correlationsData.stats

  const categories = useMemo(() => {
    const values = new Set<string>()
    correlations.forEach((correlation) => {
      values.add(correlation.categories[0])
      values.add(correlation.categories[1])
    })
    return Array.from(values).sort()
  }, [correlations])

  const options = useMemo(
    () => ({
      categories,
      pairs: correlations.map(
        (correlation) => [correlation.var1, correlation.var2] as const,
      ),
    }),
    [categories, correlations],
  )

  const [state, setState] = useState<DiscoveryState>(() =>
    parseDiscoveryState(searchParams, options),
  )

  useEffect(() => {
    const nextState = parseDiscoveryState(searchParams, options)
    stateRef.current = nextState
    setState((current) => (statesEqual(current, nextState) ? current : nextState))
    setShareDialogOpen(false)
  }, [options, searchParams])

  useEffect(() => {
    if (!firstUrlCheckRef.current) return
    firstUrlCheckRef.current = false
    const rawQuery = searchParams.toString()
    if (!rawQuery) return
    const canonical = serializeDiscoveryState(parseDiscoveryState(searchParams, options))
    if (rawQuery !== canonical) {
      router.replace(discoveryStateHref(parseDiscoveryState(searchParams, options)), {
        scroll: false,
      })
    }
  }, [options, router, searchParams])

  const commitState = useCallback(
    (patch: Partial<DiscoveryState>, history: 'push' | 'replace' = 'push') => {
      const nextState = normalizeDiscoveryState({ ...stateRef.current, ...patch }, options)
      if (statesEqual(stateRef.current, nextState)) return
      stateRef.current = nextState
      setState(nextState)
      const href = discoveryStateHref(nextState)
      if (history === 'replace') router.replace(href, { scroll: false })
      else router.push(href, { scroll: false })
    },
    [options, router],
  )

  const filteredCorrelations = useMemo(
    () => filterAndSortDiscoveries(correlations, state),
    [correlations, state],
  )

  const selectedCorrelation = useMemo(
    () => findDiscoveryPair(correlations, state.pair),
    [correlations, state.pair],
  )

  const closePair = useCallback(() => {
    commitState({ pair: null })
  }, [commitState])

  const dialogRef = useDialogFocus(Boolean(selectedCorrelation), closePair, {
    suspended: shareDialogOpen,
  })

  const openPair = (correlation: Correlation) => {
    commitState({ pair: { x: correlation.var1, y: correlation.var2 } })
  }

  const openRandomDiscovery = () => {
    const pool = filteredCorrelations.length > 0 ? filteredCorrelations : correlations
    const random = pool[Math.floor(Math.random() * pool.length)]
    if (random) openPair(random)
  }

  const clearFilters = () => {
    commitState({
      q: '',
      category: null,
      strength: DEFAULT_DISCOVERY_STATE.strength,
      direction: DEFAULT_DISCOVERY_STATE.direction,
      cross: false,
      sort: DEFAULT_DISCOVERY_STATE.sort,
    })
  }

  const activeFilterCount = [
    state.category,
    state.strength !== 'all',
    state.direction !== 'all',
    state.cross,
    state.sort !== 'interesting',
  ].filter(Boolean).length
  const hasActiveFilters = activeFilterCount > 0 || state.q.length > 0

  const selectedProvenance = useMemo(
    () =>
      selectedCorrelation
        ? resolveShareProvenance([selectedCorrelation.var1, selectedCorrelation.var2])
        : resolveShareProvenance([]),
    [selectedCorrelation],
  )
  const selectedUrl = absoluteSiteUrl(discoveryStateHref(state))

  return (
    <div className="twt-shell min-h-screen bg-[#fff9e8] text-[#192947]">
      <main
        className={`twt-container mx-auto max-w-6xl px-4 ${embeddedMode ? 'py-4' : 'py-8 md:py-12'}`}
      >
        <header className="mb-8 grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <p className="twt-kicker flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-[#294cc4]">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Data discoveries
            </p>
            <h1 className="twt-display mt-2 max-w-3xl text-4xl font-black leading-[0.98] tracking-tight md:text-6xl">
              Find the connections hiding in country data
            </h1>
            <p className="twt-prose mt-4 max-w-2xl text-base leading-7 text-[#192947]/72 md:text-lg">
              Explore {stats.total.toLocaleString()} measured associations from {metadata.totalPairsTested.toLocaleString()} tested pairs across {metadata.totalVariables} variables. Open any pair to inspect its sample and share an exact link.
            </p>
          </div>
          <button
            type="button"
            onClick={openRandomDiscovery}
            className="twt-button inline-flex items-center justify-center gap-2 justify-self-start rounded-full bg-[#294cc4] px-5 py-3 font-bold text-white hover:bg-[#1f3ca0] lg:justify-self-end"
          >
            <Shuffle className="h-4 w-4" aria-hidden="true" />
            Random discovery
          </button>
        </header>

        <section aria-label="Correlation overview" className="mb-7 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { label: 'Tested pairs', value: metadata.totalPairsTested.toLocaleString(), tone: 'bg-[#192947] text-white' },
            { label: 'Correlations', value: stats.total.toLocaleString(), tone: 'bg-[#294cc4] text-white' },
            { label: 'Cross category', value: stats.crossCategory.toLocaleString(), tone: 'bg-[#246e55] text-white' },
            { label: 'Very strong', value: stats.veryStrong.toLocaleString(), tone: 'bg-[#ffda62] text-[#192947]' },
          ].map((item) => (
            <div key={item.label} className={`rounded-2xl p-4 ${item.tone}`}>
              <p className="text-2xl font-black">{item.value}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] opacity-75">{item.label}</p>
            </div>
          ))}
        </section>

        <section className="twt-panel mb-6 rounded-[24px] border border-[#192947]/12 bg-white p-4 shadow-sm md:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <label className="relative flex-1">
              <span className="sr-only">Search discoveries</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#192947]/40" aria-hidden="true" />
              <input
                type="search"
                value={state.q}
                onChange={(event) => commitState({ q: event.target.value }, 'replace')}
                placeholder="Search measures or categories"
                className="w-full rounded-xl border border-[#192947]/20 bg-[#fff9e8] py-2.5 pl-10 pr-4 text-[#192947] outline-none focus-visible:ring-2 focus-visible:ring-[#294cc4]"
              />
            </label>
            <button
              type="button"
              aria-expanded={showFilters}
              aria-controls="discovery-filters"
              onClick={() => setShowFilters((open) => !open)}
              className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 font-bold ${
                activeFilterCount > 0
                  ? 'border-[#294cc4]/40 bg-[#294cc4]/8 text-[#294cc4]'
                  : 'border-[#192947]/20 bg-white text-[#192947]'
              }`}
            >
              <Filter className="h-4 w-4" aria-hidden="true" />
              Filters
              {activeFilterCount > 0 && (
                <span className="rounded-full bg-[#294cc4] px-2 py-0.5 text-xs text-white">{activeFilterCount}</span>
              )}
            </button>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-bold text-[#192947]/60 hover:bg-[#fff9e8] hover:text-[#192947]"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Clear
              </button>
            )}
          </div>

          {showFilters && (
            <div id="discovery-filters" className="mt-5 grid gap-4 border-t border-[#192947]/10 pt-5 sm:grid-cols-2 lg:grid-cols-4">
              <label className="text-sm font-bold">
                Category
                <select
                  value={state.category || ''}
                  onChange={(event) => commitState({ category: event.target.value || null })}
                  className="mt-2 w-full rounded-xl border border-[#192947]/20 bg-[#fff9e8] px-3 py-2.5 font-normal"
                >
                  <option value="">All categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>{CATEGORY_LABELS[category] || category}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-bold">
                Strength
                <select
                  value={state.strength}
                  onChange={(event) => commitState({ strength: event.target.value as DiscoveryState['strength'] })}
                  className="mt-2 w-full rounded-xl border border-[#192947]/20 bg-[#fff9e8] px-3 py-2.5 font-normal"
                >
                  <option value="all">All listed correlations</option>
                  <option value="strong">Strong and very strong</option>
                  <option value="very_strong">Very strong only</option>
                </select>
              </label>
              <label className="text-sm font-bold">
                Direction
                <select
                  value={state.direction}
                  onChange={(event) => commitState({ direction: event.target.value as DiscoveryState['direction'] })}
                  className="mt-2 w-full rounded-xl border border-[#192947]/20 bg-[#fff9e8] px-3 py-2.5 font-normal"
                >
                  <option value="all">Both directions</option>
                  <option value="positive">Positive only</option>
                  <option value="negative">Negative only</option>
                </select>
              </label>
              <label className="text-sm font-bold">
                Sort by
                <select
                  value={state.sort}
                  onChange={(event) => commitState({ sort: event.target.value as DiscoveryState['sort'] })}
                  className="mt-2 w-full rounded-xl border border-[#192947]/20 bg-[#fff9e8] px-3 py-2.5 font-normal"
                >
                  <option value="interesting">Most interesting</option>
                  <option value="strength">Strongest first</option>
                  <option value="sample">Most data points</option>
                </select>
              </label>
              <label className="flex items-center gap-2 text-sm font-bold sm:col-span-2 lg:col-span-4">
                <input
                  type="checkbox"
                  checked={state.cross}
                  onChange={(event) => commitState({ cross: event.target.checked })}
                  className="h-4 w-4 rounded border-[#192947]/30 text-[#294cc4] focus:ring-[#294cc4]"
                />
                Cross category pairs only
                <span className="font-normal text-[#192947]/55">Compare measures from different categories</span>
              </label>
            </div>
          )}
        </section>

        <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-[#192947]/65">
            {filteredCorrelations.length.toLocaleString()} of {stats.total.toLocaleString()} discoveries shown
          </p>
          <p className="flex items-center gap-1.5 text-xs text-[#192947]/50">
            <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
            Filters and the open pair stay in the page URL
          </p>
        </div>

        {filteredCorrelations.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-[#192947]/20 bg-white/65 p-10 text-center">
            <p className="text-xl font-black">No discoveries match these filters.</p>
            <p className="mt-2 text-[#192947]/65">Clear the filters or try a broader search.</p>
            <button
              type="button"
              onClick={clearFilters}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#294cc4] px-5 py-2.5 font-bold text-white"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Reset filters
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredCorrelations.map((correlation) => {
              const positive = correlation.direction === 'positive'
              return (
                <button
                  key={`${correlation.var1}-${correlation.var2}`}
                  type="button"
                  onClick={() => openPair(correlation)}
                  className="group rounded-[24px] border border-[#192947]/12 bg-white p-5 text-left shadow-sm transition-[border-color,transform] hover:-translate-y-0.5 hover:border-[#294cc4]/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294cc4] motion-reduce:transform-none motion-reduce:transition-none"
                >
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#fff9e8] px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-[#192947]/65">
                      {CATEGORY_LABELS[correlation.categories[0]] || correlation.categoryNames[0]}
                    </span>
                    <span className="rounded-full bg-[#fff9e8] px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-[#192947]/65">
                      {CATEGORY_LABELS[correlation.categories[1]] || correlation.categoryNames[1]}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <h2 className="text-lg font-black leading-snug">
                      {correlation.var1Name} and {correlation.var2Name}
                    </h2>
                    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-sm font-black ${positive ? 'bg-[#246e55]/10 text-[#246e55]' : 'bg-[#dc654e]/12 text-[#a63f2d]'}`}>
                      {positive ? <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" /> : <TrendingDown className="h-3.5 w-3.5" aria-hidden="true" />}
                      {correlation.coefficient.toFixed(2)}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3 text-xs font-bold text-[#192947]/55">
                    <span>{STRENGTH_LABELS[correlation.strength]} | {correlation.sampleSize} countries</span>
                    <span className="inline-flex items-center gap-1 text-[#294cc4]">
                      Inspect
                      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </main>

      {selectedCorrelation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[#192947]/70"
            aria-hidden="true"
            onClick={closePair}
          />
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={dialogTitleId}
            aria-describedby={dialogDescriptionId}
            aria-hidden={shareDialogOpen || undefined}
            tabIndex={-1}
            className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-[#192947]/15 bg-[#fff9e8] p-5 text-[#192947] shadow-2xl md:p-7"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#294cc4]">
                  Discovery detail
                </p>
                <h2 id={dialogTitleId} className="mt-2 text-2xl font-black leading-tight md:text-3xl">
                  {selectedCorrelation.var1Name} and {selectedCorrelation.var2Name}
                </h2>
              </div>
              <button
                type="button"
                onClick={closePair}
                aria-label="Close discovery"
                className="rounded-full p-2 text-[#192947]/60 hover:bg-[#192947]/10 hover:text-[#192947] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294cc4]"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div id={dialogDescriptionId} className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-[#294cc4] p-4 text-white sm:col-span-2">
                <p className="text-4xl font-black">r = {selectedCorrelation.coefficient.toFixed(2)}</p>
                <p className="mt-2 text-sm text-white/80">
                  {selectedCorrelation.direction === 'positive' ? 'Positive' : 'Negative'} {STRENGTH_LABELS[selectedCorrelation.strength].toLowerCase()} correlation in this dataset.
                </p>
              </div>
              <div className="rounded-2xl border border-[#192947]/12 bg-white p-4">
                <p className="text-3xl font-black">{selectedCorrelation.sampleSize}</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-[#192947]/55">Countries with both values</p>
              </div>
            </div>

            <div className="mt-5 space-y-3 text-sm leading-6 text-[#192947]/72">
              <p>
                The pair crosses {selectedCorrelation.crossCategory ? 'different' : 'the same'} categories: {CATEGORY_LABELS[selectedCorrelation.categories[0]] || selectedCorrelation.categoryNames[0]} and {CATEGORY_LABELS[selectedCorrelation.categories[1]] || selectedCorrelation.categoryNames[1]}.
              </p>
              <p className="rounded-xl border border-[#dc654e]/20 bg-[#dc654e]/8 p-3 text-[#7f3022]">
                This is a measured association, not evidence that one measure causes the other.
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <VisualShare
                title={`${selectedCorrelation.var1Name} and ${selectedCorrelation.var2Name}`}
                description={`${selectedCorrelation.direction === 'positive' ? 'Positive' : 'Negative'} correlation of ${selectedCorrelation.coefficient.toFixed(2)} across ${selectedCorrelation.sampleSize} countries in this dataset.`}
                url={selectedUrl}
                stat={`r = ${selectedCorrelation.coefficient.toFixed(2)}`}
                detail={`${selectedCorrelation.sampleSize} countries compared`}
                sourceName={selectedProvenance.sourceName}
                sourceVintage={selectedProvenance.sourceVintage}
                sourceUrl={selectedProvenance.sourceUrl}
                contentId="discovery_pair"
                placement="discoveries_detail"
                onOpenChange={setShareDialogOpen}
                className="w-full sm:w-auto"
              />
              <button
                type="button"
                onClick={closePair}
                className="inline-flex items-center justify-center rounded-full border border-[#192947]/20 bg-white px-5 py-2 font-bold hover:bg-[#ffda62]/30"
              >
                Keep browsing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function DiscoveriesPage() {
  return (
    <Suspense fallback={<DiscoveriesLoading />}>
      <DiscoveriesContent />
    </Suspense>
  )
}

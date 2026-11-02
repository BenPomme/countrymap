'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { ArrowLeft, BarChart3, Globe, TrendingDown, Trophy } from 'lucide-react'
import { countries } from '@/lib/data/loadCountries'
import { VARIABLES } from '@/lib/constants/variables'
import { findCountryBySlug } from '@/lib/seo/catalog'
import { getMetricProvenance } from '@/lib/seo/provenance'
import { variableSlug } from '@/lib/seo/slugs'
import { getNestedValue } from '@/lib/utils'
import type { Country } from '@/types/country'
import VisualShare from '@/components/share/VisualShare'
import { AdBanner, AdSidebar } from '@/components/ads'
import { AD_SLOTS } from '@/lib/constants/ads'
import ContextualOffers from '@/components/affiliate/ContextualOffers'

interface RankedStat {
  variableId: string
  name: string
  value: number
  rank: number
  total: number
  formattedValue: string
  higherIsBetter: boolean
  icon: string
  provenance: ReturnType<typeof getMetricProvenance>
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
  religion: '🙏',
}

// Get all countries with a stored value for a variable.
function getCountryRankings(variableId: string): { country: Country; value: number }[] {
  return countries
    .map(country => ({
      country,
      value: getNestedValue(country as unknown as Record<string, unknown>, variableId) as number
    }))
    .filter(item => item.value !== null && item.value !== undefined && !isNaN(item.value))
}

// Rank only against countries that have a stored value for this metric.
function getCountryRank(country: Country, variableId: string): { rank: number; total: number } | null {
  const rankings = getCountryRankings(variableId)
  if (rankings.length === 0) return null

  const variable = VARIABLES[variableId as keyof typeof VARIABLES]
  const higherIsBetter = variable?.higherIsBetter ?? true
  const sortedRankings = [...rankings].sort((a, b) =>
    higherIsBetter ? b.value - a.value : a.value - b.value
  )

  const index = sortedRankings.findIndex(item => item.country.iso3 === country.iso3)
  if (index === -1) return null

  return {
    rank: index + 1,
    total: sortedRankings.length,
  }
}

function getAllCountryStats(country: Country): RankedStat[] {
  const stats: RankedStat[] = []

  for (const [variableId, config] of Object.entries(VARIABLES)) {
    if (config.type !== 'numeric') continue

    const value = getNestedValue(country as unknown as Record<string, unknown>, variableId) as number
    if (value === null || value === undefined || isNaN(value)) continue

    const rankData = getCountryRank(country, variableId)
    if (!rankData) continue

    stats.push({
      variableId,
      name: config.name,
      value,
      rank: rankData.rank,
      total: rankData.total,
      formattedValue: config.format(value),
      higherIsBetter: config.higherIsBetter,
      icon: CATEGORY_ICONS[config.category] || '📊',
      provenance: getMetricProvenance(variableId),
    })
  }

  return stats
}

function getFlagEmoji(iso2: string): string {
  const codePoints = iso2
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0))
  return String.fromCodePoint(...codePoints)
}

function rankTone(stat: RankedStat): string {
  if (stat.rank <= 10) return 'bg-twt-butter text-twt-ink'
  if (stat.rank >= stat.total * 0.75) return 'bg-twt-coral/15 text-twt-coral'
  return 'bg-twt-ink/5 text-twt-ink'
}

function ProvenanceDetails({ provenance }: { provenance: RankedStat['provenance'] }) {
  return (
    <details className="mt-3 text-xs leading-5 text-twt-ink/70">
      <summary className="cursor-pointer font-bold text-twt-blue underline decoration-twt-blue/30 underline-offset-4">
        Source and notes
      </summary>
      <dl className="mt-2 grid gap-1 sm:grid-cols-2">
        <div>
          <dt className="font-bold text-twt-ink">Source</dt>
          <dd>
            {provenance.sourceName ? (
              provenance.sourceUrl ? (
                <a
                  href={provenance.sourceUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="underline decoration-twt-blue/30 underline-offset-2 hover:text-twt-blue"
                >
                  {provenance.sourceName}
                </a>
              ) : (
                provenance.sourceName
              )
            ) : (
              'Not stated'
            )}
          </dd>
        </div>
        <div>
          <dt className="font-bold text-twt-ink">Vintage</dt>
          <dd>{provenance.year ? provenance.year : 'Not stated'}</dd>
        </div>
        <div>
          <dt className="font-bold text-twt-ink">Coverage</dt>
          <dd>{provenance.coverage !== undefined ? `${provenance.coverage}%` : 'Not stated'}</dd>
        </div>
      </dl>
      {provenance.limitations.length > 0 && (
        <ul className="mt-2 list-disc space-y-1 pl-4">
          {provenance.limitations.map((limitation: string) => (
            <li key={limitation}>{limitation}</li>
          ))}
        </ul>
      )}
    </details>
  )
}

export default function CountryClient({ slug }: { slug: string }) {
  const shareRef = useRef<HTMLDivElement>(null)
  const country = findCountryBySlug(slug)
  const stats = country ? getAllCountryStats(country) : []
  const sortedStats = [...stats].sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name))
  const topStats = stats
    .filter(stat => stat.rank <= Math.ceil(stat.total * 0.15))
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 10)
  const bottomStats = stats
    .filter(stat => stat.rank >= Math.floor(stat.total * 0.85))
    .sort((a, b) => b.rank - a.rank)
    .slice(0, 10)

  if (!country) {
    return (
      <div className="twt-shell flex items-center justify-center px-4 py-16">
        <div className="twt-panel max-w-lg p-6 text-center sm:p-8">
          <div className="text-6xl" aria-hidden="true">🌍</div>
          <h1 className="twt-display mt-4 text-3xl">Country not found</h1>
          <p className="twt-prose mt-3">This country profile is not available. The map is still available.</p>
          <Link href="/#explore" className="twt-button mt-6">
            Back to the map
          </Link>
        </div>
      </div>
    )
  }

  const flag = getFlagEmoji(country.iso2)
  const quickFacts: { label: string; value: string }[] = []

  if (country.population !== null) {
    quickFacts.push({
      label: 'Population',
      value: `${(country.population / 1000000).toFixed(1)}M`,
    })
  }
  if (country.poverty.gdpPerCapita !== null) {
    quickFacts.push({
      label: 'GDP per capita',
      value: `$${(country.poverty.gdpPerCapita / 1000).toFixed(1)}k`,
    })
  }
  if (country.lifestyle.happinessIndex !== null) {
    quickFacts.push({
      label: 'Happiness',
      value: `${country.lifestyle.happinessIndex.toFixed(1)}/10`,
    })
  }
  if (country.democracy.score !== null) {
    quickFacts.push({
      label: 'Democracy',
      value: `${country.democracy.score}/100`,
    })
  }

  return (
    <div className="twt-shell pb-16">
      <main className="twt-container py-6 sm:py-10">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm font-bold text-twt-ink/65">
          <Link href="/#explore" className="inline-flex items-center gap-1.5 hover:text-twt-blue">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Explore the map
          </Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{country.name}</span>
        </nav>

        <AdBanner slotId={AD_SLOTS.countryPageBanner} className="mt-6" />

        <section ref={shareRef} className="twt-panel mt-6 overflow-hidden">
          <div className="grid gap-8 p-5 sm:p-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div>
              <p className="twt-kicker">Country profile</p>
              <div className="mt-3 flex items-start gap-4 sm:items-center sm:gap-6">
                <div className="text-5xl sm:text-7xl" aria-hidden="true">{flag}</div>
                <div>
                  <h1 className="twt-display text-4xl leading-none sm:text-6xl">{country.name}</h1>
                  <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-semibold text-twt-ink/65">
                    <span className="inline-flex items-center gap-1.5">
                      <Globe className="h-4 w-4" aria-hidden="true" />
                      {country.region}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <BarChart3 className="h-4 w-4" aria-hidden="true" />
                      {stats.length} metrics with values
                    </span>
                  </div>
                </div>
              </div>

              <p className="twt-prose mt-6">
                A data portrait of {country.name}, built from the metrics stored in The World Truth.
                Each placing compares only countries with a stored value for that metric.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link href="/truthle/" className="twt-button">
                  Play today&apos;s Truthle
                </Link>
                <VisualShare
                  targetRef={shareRef as React.RefObject<HTMLElement>}
                  title={`${country.name} Country Stats`}
                  description={`${flag} ${country.name} ranks #${topStats[0]?.rank || '?'} in ${topStats[0]?.name || 'the world'}. See all country rankings at The World Truth Map.`}
                  className="!rounded-full !border-2 !border-twt-ink !bg-twt-blue !px-4 !py-2 !font-extrabold !text-white hover:!bg-twt-ink"
                />
              </div>
            </div>

            <div className="rounded-2xl border-2 border-twt-ink bg-twt-butter/45 p-4 sm:p-5">
              <p className="twt-kicker !text-twt-ink">Quick figures</p>
              {quickFacts.length > 0 ? (
                <dl className="mt-4 grid grid-cols-2 gap-3">
                  {quickFacts.map(fact => (
                    <div key={fact.label} className="rounded-xl border border-twt-ink/15 bg-white/75 p-3">
                      <dt className="text-xs font-bold uppercase tracking-[0.08em] text-twt-ink/60">{fact.label}</dt>
                      <dd className="twt-display mt-1 text-xl">{fact.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="mt-3 text-sm leading-6 text-twt-ink/70">No quick figures are stored for this country.</p>
              )}
              <p className="mt-4 text-xs leading-5 text-twt-ink/65">
                Source, vintage and coverage for each metric are listed with the full table below.
              </p>
            </div>
          </div>
        </section>

        <div className="mt-6">
          <ContextualOffers slug={slug} category="travel" name={country.name} />
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <section className="twt-panel p-5 sm:p-6" aria-labelledby="strong-placings-heading">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-twt-ink bg-twt-butter">
                <Trophy className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="twt-kicker">High placings</p>
                <h2 id="strong-placings-heading" className="twt-display text-2xl">Where {country.name} ranks high</h2>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-twt-ink/65">
              These are the strongest placings among metrics with a stored value.
            </p>

            {topStats.length > 0 ? (
              <ol className="mt-5 space-y-3">
                {topStats.map(stat => (
                  <li key={stat.variableId} className="flex items-start gap-3 rounded-xl border border-twt-ink/10 bg-twt-paper/60 p-3">
                    <span className="flex min-w-12 items-center justify-center rounded-full bg-twt-butter px-2 py-1 text-sm font-extrabold">
                      #{stat.rank}
                    </span>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/map/${variableSlug(stat.name)}/`}
                        className="font-bold text-twt-ink underline decoration-twt-ink/20 underline-offset-4 hover:text-twt-blue"
                      >
                        <span aria-hidden="true">{stat.icon} </span>{stat.name}
                      </Link>
                      <p className="mt-1 text-sm text-twt-ink/65">
                        {stat.formattedValue} · ranked {stat.rank} of {stat.total} with a value
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-5 rounded-xl bg-twt-paper p-4 text-sm text-twt-ink/65">No high placings are available.</p>
            )}
          </section>

          <section className="twt-panel p-5 sm:p-6" aria-labelledby="low-placings-heading">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-twt-ink bg-twt-coral/15 text-twt-coral">
                <TrendingDown className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="twt-kicker">Low placings</p>
                <h2 id="low-placings-heading" className="twt-display text-2xl">Where {country.name} ranks low</h2>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-twt-ink/65">
              These are the lowest placings among metrics with a stored value.
            </p>

            {bottomStats.length > 0 ? (
              <ol className="mt-5 space-y-3">
                {bottomStats.map(stat => (
                  <li key={stat.variableId} className="flex items-start gap-3 rounded-xl border border-twt-ink/10 bg-twt-paper/60 p-3">
                    <span className="flex min-w-12 items-center justify-center rounded-full bg-twt-coral/15 px-2 py-1 text-sm font-extrabold text-twt-coral">
                      #{stat.rank}
                    </span>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/map/${variableSlug(stat.name)}/`}
                        className="font-bold text-twt-ink underline decoration-twt-ink/20 underline-offset-4 hover:text-twt-blue"
                      >
                        <span aria-hidden="true">{stat.icon} </span>{stat.name}
                      </Link>
                      <p className="mt-1 text-sm text-twt-ink/65">
                        {stat.formattedValue} · ranked {stat.rank} of {stat.total} with a value
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-5 rounded-xl bg-twt-paper p-4 text-sm text-twt-ink/65">No low placings are available.</p>
            )}
          </section>
        </div>

        <section className="mt-10" aria-labelledby="all-statistics-heading">
          <div className="max-w-3xl">
            <p className="twt-kicker">Stored data</p>
            <h2 id="all-statistics-heading" className="twt-display mt-2 text-3xl sm:text-4xl">All statistics</h2>
            <p className="twt-prose mt-3">
              Values are sorted by each metric&apos;s placing. A rank compares only countries with a stored value for that same metric.
              Open the source note to see what is known about source, vintage, coverage and limitations.
            </p>
          </div>

          {sortedStats.length > 0 ? (
            <div className="mt-6 grid gap-3">
              {sortedStats.map(stat => (
                <article key={stat.variableId} className="twt-panel p-4 sm:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <Link
                        href={`/map/${variableSlug(stat.name)}/`}
                        className="font-bold text-twt-ink underline decoration-twt-ink/20 underline-offset-4 hover:text-twt-blue"
                      >
                        <span aria-hidden="true">{stat.icon} </span>{stat.name}
                      </Link>
                      <p className="mt-1 text-sm text-twt-ink/60">Country value: {stat.formattedValue}</p>
                    </div>
                    <span className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-sm font-extrabold ${rankTone(stat)}`}>
                      #{stat.rank} of {stat.total}
                    </span>
                  </div>
                  <ProvenanceDetails provenance={stat.provenance} />
                </article>
              ))}
            </div>
          ) : (
            <div className="twt-panel mt-6 bg-twt-paper p-5">
              <h3 className="twt-display text-2xl">No stored statistics</h3>
              <p className="mt-2 text-sm leading-6 text-twt-ink/70">
                No numeric metric with a stored value is available for this country. No source, vintage or coverage is stated.
              </p>
            </div>
          )}
        </section>

        <div className="mt-8 flex justify-center">
          <AdSidebar slotId={AD_SLOTS.countryDetail} size="square" />
        </div>

        <section className="twt-panel mt-10 bg-twt-ink p-6 text-white sm:p-8">
          <p className="twt-kicker !text-twt-butter">Daily quiz</p>
          <h2 className="twt-display mt-2 text-3xl sm:text-4xl">How well do you know world facts?</h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-white/75">
            Test yourself with today&apos;s Truthle and earn game coins while you play.
          </p>
          <Link href="/truthle/" className="twt-button mt-5 !border-white">
            Play Truthle
          </Link>
        </section>
      </main>
    </div>
  )
}

import Link from 'next/link'
import type { ReactNode } from 'react'
import { rankOrderLabel, type ValueOrder } from '@/lib/seo/ranking'

export interface RankingRow {
  iso3: string
  countryName: string
  countryHref: string
  formatted: string
  rank: number
  rankMin: number
  rankMax: number
  rangeLabel: string
}

interface RankingTableProps {
  rows: RankingRow[]
  metricName: string
  categorical: boolean
  filteredCountryCount: number
  hasActiveFilters: boolean
  rankOrder?: ValueOrder
}

function tableHead(metricName: string, categorical: boolean): ReactNode {
  return (
    <thead>
      <tr className="border-b border-[#192947]/15 text-left text-[10px] font-black uppercase tracking-[0.12em] text-[#192947]/55">
        {!categorical && <th scope="col" className="px-3 py-2.5">Overall rank</th>}
        <th scope="col" className="px-3 py-2.5">Country</th>
        <th scope="col" className="px-3 py-2.5 text-right">{metricName}</th>
      </tr>
    </thead>
  )
}

function tableRows(rows: RankingRow[], categorical: boolean): ReactNode {
  return rows.map((row) => (
    <tr key={row.iso3} className="border-b border-[#192947]/10 last:border-0">
      {!categorical && (
        <td className="whitespace-nowrap px-3 py-2.5 text-xs font-bold tabular-nums text-[#192947]/50">
          {row.rangeLabel}
        </td>
      )}
      <td className="px-3 py-2.5 text-sm font-semibold">
        <Link
          href={row.countryHref}
          className="rounded-sm text-[#294cc4] underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294cc4]"
        >
          {row.countryName}
        </Link>
      </td>
      <td className="px-3 py-2.5 text-right text-sm font-bold tabular-nums text-[#192947]">
        {row.formatted}
      </td>
    </tr>
  ))
}

export default function RankingTable({
  rows,
  metricName,
  categorical,
  filteredCountryCount,
  hasActiveFilters,
  rankOrder,
}: RankingTableProps) {
  const initialRows = rows.slice(0, 10)
  const remainingRows = rows.slice(10)
  const missingMetricCount = filteredCountryCount - rows.length
  const dataNoun = categorical ? 'a reported category' : 'a reported value'
  const reportingNoun = categorical ? 'category' : 'value'

  return (
    <section
      aria-labelledby="ranking-heading"
      className="twt-panel rounded-[1.5rem] border-2 border-[#192947]/15 bg-white p-5 shadow-sm md:p-6"
    >
      <p className="twt-kicker text-[11px] font-black uppercase tracking-[0.18em] text-[#294cc4]">
        Reported {categorical ? 'categories' : 'values'}
      </p>
      <h2 id="ranking-heading" className="twt-display mt-1 text-3xl font-black leading-tight text-[#192947]">
        {metricName} table
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[#192947]/65">
        {categorical
          ? 'This metric is categorical, so the table is alphabetical rather than ranked. Explicit Unknown categories appear where reported.'
          : 'Ranks use every country with a reported finite value. Filtering the map does not change a country overall rank. Tied values share a rank range.'}{' '}
        {rows.length} of {filteredCountryCount} countries that match the current filters are listed.
        {missingMetricCount > 0
          ? ` ${missingMetricCount} additional filtered countries have no reported ${reportingNoun}.`
          : ''}
      </p>
      {!categorical && rankOrder && (
        <p className="mt-1 max-w-2xl text-xs font-semibold leading-5 text-[#192947]/55">
          {rankOrderLabel(rankOrder)}
        </p>
      )}

      {rows.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-[#192947]/20 bg-[#fff9e8] p-5">
          <p className="twt-display text-2xl font-black text-[#192947]">
            {filteredCountryCount === 0
              ? 'No countries match these filters.'
              : `No matching countries have ${dataNoun}.`}
          </p>
          <p className="mt-2 text-sm leading-6 text-[#192947]/65">
            {filteredCountryCount === 0
              ? 'Use the filter panel to widen the region, population or income range.'
              : `No reported ${reportingNoun} is available for the countries that match these filters, so the map has no filled areas for this metric.`}
          </p>
        </div>
      ) : (
        <div className="mt-5 overflow-x-auto rounded-xl border border-[#192947]/10">
          <table className="w-full border-collapse">
            <caption className="sr-only">
              {metricName} {categorical ? 'by country' : 'country rankings'}
            </caption>
            {tableHead(metricName, categorical)}
            <tbody>{tableRows(initialRows, categorical)}</tbody>
          </table>
        </div>
      )}

      {remainingRows.length > 0 && (
        <details className="group mt-3 rounded-xl border border-[#192947]/10 bg-[#fff9e8]">
          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-black text-[#294cc4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294cc4]">
            Show all {rows.length} matching countries
          </summary>
          <div className="max-h-[30rem] overflow-auto border-t border-[#192947]/10 bg-white">
            <table className="w-full border-collapse">
              <caption className="sr-only">
                Full {metricName} table for countries that match the current filters
              </caption>
              {tableHead(metricName, categorical)}
              <tbody>{tableRows(remainingRows, categorical)}</tbody>
            </table>
          </div>
        </details>
      )}

      {hasActiveFilters && rows.length > 0 && (
        <p className="mt-3 text-xs leading-5 text-[#192947]/55">
          The table shows matching countries only. Clear the filters to return to the full reporting set.
        </p>
      )}
    </section>
  )
}

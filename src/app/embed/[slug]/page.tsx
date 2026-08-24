import { notFound } from 'next/navigation'
import { VARIABLES } from '@/lib/constants/variables'
import {
  countries,
  getVariableBySlug,
  rankCountries,
  variableEntries,
} from '@/lib/seo/catalog'
import EmbedMap from './EmbedMap'

export function generateStaticParams() {
  return variableEntries.map((entry) => ({ slug: entry.slug }))
}

export default function EmbedPage({ params }: { params: { slug: string } }) {
  const entry = getVariableBySlug(params.slug)
  if (!entry) notFound()

  const config = VARIABLES[entry.id]
  const leader = rankCountries(entry.id)[0]
  const mapUrl = `https://theworldtruth.com/map/${entry.slug}/`

  return (
    <div className="h-[100dvh] w-full flex flex-col overflow-hidden bg-white">
      <div className="flex-1 min-h-0">
        <EmbedMap countries={countries} colorVariable={entry.id} />
      </div>
      <footer className="shrink-0 flex items-center justify-between gap-3 px-3 py-2 bg-white border-t border-gray-200 text-xs sm:text-sm">
        <p className="min-w-0 truncate text-gray-800">
          <span className="font-semibold">{config.name}</span>
          {leader && (
            <span className="text-gray-600">
              {' '}
              · #1 {leader.country.name} {leader.formatted}
            </span>
          )}
        </p>
        <a
          href={mapUrl}
          target="_top"
          className="shrink-0 font-semibold text-blue-700 hover:underline"
        >
          The World Truth Map
        </a>
      </footer>
    </div>
  )
}

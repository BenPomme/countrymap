'use client'

import dynamic from 'next/dynamic'
import type { Country, ColorVariable } from '@/types/country'

const WorldMap = dynamic(() => import('@/components/maps/WorldMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[280px] bg-slate-100 animate-pulse flex items-center justify-center">
      <span className="text-gray-400">Loading map...</span>
    </div>
  ),
})

export default function EmbedMap({
  countries,
  colorVariable,
}: {
  countries: Country[]
  colorVariable: ColorVariable
}) {
  return (
    <div className="w-full h-full bg-white overflow-hidden">
      <WorldMap
        countries={countries}
        filteredCountries={countries}
        colorVariable={colorVariable}
        className="min-h-0 h-full"
      />
    </div>
  )
}

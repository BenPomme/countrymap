'use client'

import dynamic from 'next/dynamic'
import type { Country, ColorVariable } from '@/types/country'

const WorldMap = dynamic(() => import('@/components/maps/WorldMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full min-h-[420px] bg-slate-100 animate-pulse rounded-2xl flex items-center justify-center">
      <span className="text-gray-400">Loading map...</span>
    </div>
  ),
})

export default function StatMap({
  countries,
  colorVariable,
}: {
  countries: Country[]
  colorVariable: ColorVariable
}) {
  return (
    <div className="w-full h-[520px] bg-white rounded-2xl overflow-hidden">
      <WorldMap
        countries={countries}
        filteredCountries={countries}
        colorVariable={colorVariable}
      />
    </div>
  )
}

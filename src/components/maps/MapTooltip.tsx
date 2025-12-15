'use client'

import type { Country, ColorVariable } from '@/types/country'
import { VARIABLES } from '@/lib/constants/variables'
import { getNestedValue, formatNumber, formatCurrency } from '@/lib/utils'

interface MapTooltipProps {
  country: Country
  position: { x: number; y: number }
  colorVariable: ColorVariable
}

export default function MapTooltip({
  country,
  position,
  colorVariable,
}: MapTooltipProps) {
  const variableConfig = VARIABLES[colorVariable]
  const value = getNestedValue(
    country as unknown as Record<string, unknown>,
    colorVariable
  )

  return (
    <div
      className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-3 pointer-events-none max-w-xs"
      style={{
        left: position.x + 15,
        top: position.y - 10,
      }}
    >
      <h3 className="font-semibold text-gray-900 mb-2">{country.name}</h3>

      <div className="space-y-1 text-sm">
        <div className="flex justify-between gap-4">
          <span className="text-gray-500">{variableConfig.name}:</span>
          <span className="font-medium">
            {variableConfig.format(value as number | string | null)}
          </span>
        </div>

        <div className="flex justify-between gap-4">
          <span className="text-gray-500">Region:</span>
          <span>{country.region}</span>
        </div>

        <div className="flex justify-between gap-4">
          <span className="text-gray-500">Religion:</span>
          <span>{country.religion.major}</span>
        </div>

        <div className="flex justify-between gap-4">
          <span className="text-gray-500">Democracy:</span>
          <span>{country.democracy.score}/100</span>
        </div>

        {country.poverty.gdpPerCapita && (
          <div className="flex justify-between gap-4">
            <span className="text-gray-500">GDP/capita:</span>
            <span>{formatCurrency(country.poverty.gdpPerCapita)}</span>
          </div>
        )}

        {country.conflict.hasActiveConflict && (
          <div className="text-red-600 font-medium mt-1">
            Active Conflict
          </div>
        )}
      </div>
    </div>
  )
}

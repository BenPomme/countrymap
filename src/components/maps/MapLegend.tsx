'use client'

import type { VariableConfig } from '@/types/country'
import { MAJOR_RELIGIONS } from '@/lib/constants/variables'

export const CATEGORY_COLORS: Record<string, string> = {
  'Christianity': '#3b82f6',
  'Islam': '#22c55e',
  'Hinduism': '#f97316',
  'Buddhism': '#eab308',
  'Judaism': '#8b5cf6',
  'Folk/Traditional': '#ec4899',
  'None/Unaffiliated': '#6b7280',
  'Other': '#94a3b8',
  'Unknown': '#d1d5db',
}

export const MISSING_VALUE_COLOR = '#d1d5db'
export const NUMERIC_COLOR_RANGE = ['#dbeafe', '#1d4ed8'] as const
export const NUMERIC_GRADIENT = `linear-gradient(to right, ${NUMERIC_COLOR_RANGE[0]}, ${NUMERIC_COLOR_RANGE[1]})`

interface MapLegendProps {
  colorVariable: string
  variableConfig: VariableConfig
  colorScale: unknown
}

export default function MapLegend({
  colorVariable,
  variableConfig,
}: MapLegendProps) {
  if (variableConfig.type === 'categorical') {
    const categories = variableConfig.categories?.length
      ? variableConfig.categories
      : [...MAJOR_RELIGIONS]

    return (
      <div
        role="group"
        aria-label={`${variableConfig.name} map legend`}
        className="absolute bottom-4 left-4 max-h-[calc(100%_-_2rem)] max-w-xs overflow-y-auto rounded-lg bg-white/95 p-3 shadow-md backdrop-blur-sm"
      >
        <h4 className="font-medium text-sm text-gray-700 mb-2">
          {variableConfig.name}
        </h4>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          {categories.map((category) => (
            <div key={category} className="flex items-center gap-2">
              <div
                aria-hidden="true"
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: CATEGORY_COLORS[category] ?? MISSING_VALUE_COLOR }}
              />
              <span className="text-xs text-gray-600">{category}</span>
            </div>
          ))}
          {!categories.includes('Unknown') && (
            <div className="flex items-center gap-2">
              <div
                aria-hidden="true"
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: MISSING_VALUE_COLOR }}
              />
              <span className="text-xs text-gray-600">Unknown</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Numeric scale legend
  const domain = variableConfig.domain || [0, 100]

  return (
    <div
      role="group"
      aria-label={`${variableConfig.name} map legend`}
      className="absolute bottom-4 left-4 rounded-lg bg-white/95 p-3 shadow-md backdrop-blur-sm"
    >
      <h4 className="font-medium text-sm text-gray-700 mb-2">
        {variableConfig.name}
      </h4>
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">
          {variableConfig.format(domain[0])}
        </span>
        <div
          aria-hidden="true"
          className="w-32 h-3 rounded"
          style={{ background: NUMERIC_GRADIENT }}
        />
        <span className="text-xs text-gray-500">
          {variableConfig.format(domain[1])}
        </span>
      </div>
      <p className="text-xs text-gray-600 mt-1">
        Higher values are darker blue. Colour shows the reported value only, not a judgment.
      </p>
    </div>
  )
}

'use client'

import type { VariableConfig } from '@/types/country'
import { MAJOR_RELIGIONS } from '@/lib/constants/variables'

const religionColors: Record<string, string> = {
  'Christianity': '#3b82f6',
  'Islam': '#22c55e',
  'Hinduism': '#f97316',
  'Buddhism': '#eab308',
  'Judaism': '#8b5cf6',
  'Folk/Traditional': '#ec4899',
  'None/Unaffiliated': '#6b7280',
  'Other': '#94a3b8',
}

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
    return (
      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-md p-3 max-w-xs">
        <h4 className="font-medium text-sm text-gray-700 mb-2">
          {variableConfig.name}
        </h4>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          {MAJOR_RELIGIONS.filter(r => r !== 'Other').map((religion) => (
            <div key={religion} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: religionColors[religion] }}
              />
              <span className="text-xs text-gray-600">{religion}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Numeric scale legend
  const domain = variableConfig.domain || [0, 100]
  const isHigherBetter = variableConfig.higherIsBetter

  return (
    <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-md p-3">
      <h4 className="font-medium text-sm text-gray-700 mb-2">
        {variableConfig.name}
      </h4>
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">
          {variableConfig.format(domain[0])}
        </span>
        <div
          className="w-32 h-3 rounded"
          style={{
            background: isHigherBetter
              ? 'linear-gradient(to right, #dc2626, #22c55e)'
              : 'linear-gradient(to right, #22c55e, #dc2626)',
          }}
        />
        <span className="text-xs text-gray-500">
          {variableConfig.format(domain[1])}
        </span>
      </div>
      <p className="text-xs text-gray-400 mt-1">
        {isHigherBetter ? 'Higher is better' : 'Lower is better'}
      </p>
    </div>
  )
}

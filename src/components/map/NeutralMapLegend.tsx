import type { ColorVariable } from '@/types/country'
import { MAJOR_RELIGIONS, VARIABLES } from '@/lib/constants/variables'

const CATEGORY_COLORS: Record<string, string> = {
  Christianity: '#3b82f6',
  Islam: '#22c55e',
  Hinduism: '#f97316',
  Buddhism: '#eab308',
  Judaism: '#8b5cf6',
  'Folk/Traditional': '#ec4899',
  'None/Unaffiliated': '#6b7280',
  Other: '#94a3b8',
  Unknown: '#d1d5db',
}

export default function NeutralMapLegend({
  colorVariable,
}: {
  colorVariable: ColorVariable
}) {
  const config = VARIABLES[colorVariable]

  if (config.type === 'categorical') {
    const categories = config.categories?.length
      ? config.categories
      : [...MAJOR_RELIGIONS]

    return (
      <div
        role="group"
        aria-label={`${config.name} map legend`}
        className="pointer-events-none absolute bottom-4 left-4 z-20 max-h-[calc(100%_-_2rem)] w-[min(20rem,calc(100%_-_2rem))] overflow-y-auto rounded-xl border border-[#192947]/15 bg-white/95 p-3 shadow-md backdrop-blur-sm"
      >
        <p className="text-xs font-black uppercase tracking-[0.14em] text-[#192947]">
          {config.name}
        </p>
        <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5">
          {categories.map((category) => (
            <li key={category} className="flex items-center gap-1.5 text-[11px] text-[#192947]/75">
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 shrink-0 rounded-sm"
                style={{ backgroundColor: CATEGORY_COLORS[category] || '#d1d5db' }}
              />
              <span>{category}</span>
            </li>
          ))}
          {!categories.includes('Unknown') && (
            <li className="flex items-center gap-1.5 text-[11px] text-[#192947]/75">
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 shrink-0 rounded-sm"
                style={{ backgroundColor: CATEGORY_COLORS.Unknown }}
              />
              <span>Unknown or no reported category</span>
            </li>
          )}
        </ul>
        <p className="mt-2 border-t border-[#192947]/10 pt-2 text-[10px] leading-4 text-[#192947]/55">
          Faded countries are outside the current filters. Colour shows category only and does not imply a judgment.
        </p>
      </div>
    )
  }

  const domain = config.domain || [0, 100]
  const gradient = config.higherIsBetter
    ? 'linear-gradient(to right, #dc2626, #22c55e)'
    : 'linear-gradient(to right, #22c55e, #dc2626)'

  return (
    <div
      role="group"
      aria-label={`${config.name} map legend`}
      className="pointer-events-none absolute bottom-4 left-4 z-20 w-[min(20rem,calc(100%_-_2rem))] rounded-xl border border-[#192947]/15 bg-white/95 p-3 shadow-md backdrop-blur-sm"
    >
      <p className="text-xs font-black uppercase tracking-[0.14em] text-[#192947]">
        {config.name}
      </p>
      <div
        aria-hidden="true"
        className="mt-2 h-2.5 w-full rounded-full"
        style={{ background: gradient }}
      />
      <div className="mt-1 flex items-center justify-between gap-3 text-[10px] font-semibold text-[#192947]/65">
        <span>{config.format(domain[0])}</span>
        <span>{config.format(domain[1])}</span>
      </div>
      <div className="mt-1 flex items-center justify-between gap-3 text-[10px] text-[#192947]/60">
        <span>Lower reported value</span>
        <span>Higher reported value</span>
      </div>
      <p className="mt-2 border-t border-[#192947]/10 pt-2 text-[10px] leading-4 text-[#192947]/55">
        Faded countries are outside the current filters. Grey areas within the filters have no reported value.
        Colour position shows the reported value only and does not imply a judgment.
      </p>
    </div>
  )
}

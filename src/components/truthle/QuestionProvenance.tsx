import Link from 'next/link'

export interface ProvenanceItem {
  label?: string
  sourceUrl?: string
  sourceName?: string
  year?: string
  coverage?: number
  limitations?: string[]
}

interface QuestionProvenanceProps {
  items?: ProvenanceItem[]
  mapHref?: string
}

function coverageLabel(coverage: number | undefined): string | null {
  if (typeof coverage !== 'number' || !Number.isFinite(coverage)) return null
  return `Coverage: ${coverage}%`
}

export default function QuestionProvenance({ items = [], mapHref }: QuestionProvenanceProps) {
  const available = items.filter((item) => item.sourceName || item.sourceUrl || item.year || item.limitations?.length)

  return (
    <aside className="mt-4 rounded-xl border border-[#d8d2c2] bg-[#fffdf5] p-4 text-left text-xs text-[#59647a]">
      <p className="font-bold uppercase tracking-wide text-[#192947]">Question provenance</p>
      {available.length === 0 ? (
        <p className="mt-2">Source, year and coverage details are not available for this question yet.</p>
      ) : (
        <div className="mt-2 space-y-3">
          {available.map((item, index) => (
            <div key={`${item.sourceName || item.sourceUrl || 'source'}-${index}`}>
              {item.label && <p className="font-semibold text-[#192947]">{item.label}</p>}
              <p className="mt-0.5">
                Source:{' '}
                {item.sourceUrl ? (
                  <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline text-[#294cc4]">
                    {item.sourceName || item.sourceUrl}
                  </a>
                ) : (
                  item.sourceName || 'Not recorded'
                )}
              </p>
              {(item.year || coverageLabel(item.coverage)) && (
                <p className="mt-0.5">
                  {[item.year ? `Year: ${item.year}` : '', coverageLabel(item.coverage) || ''].filter(Boolean).join(' | ')}
                </p>
              )}
              {item.limitations && item.limitations.length > 0 && (
                <ul className="mt-1 list-disc pl-4 space-y-0.5">
                  {item.limitations.map((limitation) => <li key={limitation}>{limitation}</li>)}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
      {mapHref && (
        <Link href={mapHref} className="mt-3 inline-block font-semibold text-[#294cc4] underline">
          See the map and full source notes
        </Link>
      )}
    </aside>
  )
}

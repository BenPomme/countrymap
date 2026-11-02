export interface ProvenancePanelProps {
  sourceName?: string
  sourceUrl?: string
  vintage?: string
  limitations: string[]
  categorical?: boolean
  coverageCount: number
  totalCount: number
}

export default function ProvenancePanel({
  sourceName,
  sourceUrl,
  vintage,
  limitations,
  categorical = false,
  coverageCount,
  totalCount,
}: ProvenancePanelProps) {
  const hasVerifiedSource = Boolean(sourceName || sourceUrl || vintage)
  const dataNoun = categorical ? 'a reported category' : 'a reported value'
  const coverageSentence =
    coverageCount === 0
      ? `No country in this ${totalCount}-country dataset has ${dataNoun} for this metric.`
      : `${coverageCount} of ${totalCount} countries in this dataset have ${dataNoun} for this metric.`

  return (
    <section
      aria-labelledby="provenance-heading"
      className={`twt-panel mt-6 rounded-[1.5rem] border-2 bg-white p-5 shadow-sm md:p-6 ${
        hasVerifiedSource
          ? 'border-[#192947]/15'
          : 'border-[#dc654e]/45'
      }`}
    >
      <div className="flex flex-col gap-3 border-b border-[#192947]/10 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="twt-kicker text-[11px] font-black uppercase tracking-[0.18em] text-[#294cc4]">
            Reference
          </p>
          <h2 id="provenance-heading" className="twt-display mt-1 text-2xl font-black text-[#192947]">
            Source, vintage and coverage
          </h2>
        </div>
        <p className="max-w-sm text-xs leading-5 text-[#192947]/60">
          Keep the source and date attached when reusing a figure. A reported {categorical ? 'category' : 'value'} is not a verification of every underlying record.
        </p>
      </div>

      <dl className="mt-4 grid gap-4 md:grid-cols-3">
        <div>
          <dt className="text-[10px] font-black uppercase tracking-[0.16em] text-[#192947]/55">
            Source
          </dt>
          <dd className="mt-1 text-sm font-bold leading-6 text-[#192947]">
            {sourceName && sourceUrl ? (
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-[#294cc4]/35 underline-offset-4 hover:decoration-[#294cc4]"
              >
                {sourceName}
              </a>
            ) : sourceName ? (
              sourceName
            ) : (
              <span className="text-[#dc654e]">Unknown</span>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] font-black uppercase tracking-[0.16em] text-[#192947]/55">
            Data vintage
          </dt>
          <dd className="mt-1 text-sm font-bold leading-6 text-[#192947]">
            {vintage || <span className="text-[#dc654e]">Unknown</span>}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] font-black uppercase tracking-[0.16em] text-[#192947]/55">
            Dataset coverage
          </dt>
          <dd className="mt-1 text-sm leading-6 text-[#192947]/75">
            {coverageSentence}
          </dd>
        </div>
      </dl>

      <div className="mt-5 rounded-2xl bg-[#fff9e8] p-4">
        <h3 className="text-xs font-black uppercase tracking-[0.16em] text-[#192947]/65">
          Limitations
        </h3>
        <ul className="mt-2 space-y-2 text-sm leading-6 text-[#192947]/75">
          {(limitations.length > 0
            ? limitations
            : ['Reference years, country definitions and source coverage may differ. Verify the figure before reuse.']
          ).map((limitation) => (
            <li key={limitation} className="flex gap-2">
              <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#dc654e]" />
              <span>{limitation}</span>
            </li>
          ))}
        </ul>
      </div>

      {!hasVerifiedSource && (
        <p className="mt-3 text-sm font-semibold leading-6 text-[#192947]">
          The source and vintage are unknown for this metric. Check a primary source before interpreting or republishing the figure.
        </p>
      )}
    </section>
  )
}

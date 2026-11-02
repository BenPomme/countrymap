import Link from 'next/link'
import { notFound } from 'next/navigation'
import { VARIABLES } from '@/lib/constants/variables'
import {
  countries,
  getVariableBySlug,
  rankCountries,
  ranksHighFirst,
  relatedVariableSlugs,
  variableEntries,
} from '@/lib/seo/catalog'
import EmbedSnippet from './EmbedSnippet'
import { AdBanner, AdSidebar } from '@/components/ads'
import { AD_SLOTS } from '@/lib/constants/ads'
import DealQuiz from '@/components/affiliate/DealQuiz'
import type { ColorVariable } from '@/types/country'
import { claimsForVariable } from '@/lib/seo/claims'
import { sourceNote } from '@/lib/seo/sourceNotes'
import { mapLongform } from '@/lib/seo/mapLongform'
import MapFeature from '@/components/map/MapFeature'
import { buildMainFact, buildRankingRows } from '@/components/map/mapFacts'

export function generateStaticParams() {
  return variableEntries.map((entry) => ({ slug: entry.slug }))
}

function sourceBlurb(variableId: ColorVariable): string {
  const config = VARIABLES[variableId]
  const desc = config.description || config.name
  const weak = /penis|breast|iq|porn|onlyfans|consanguinity|dating app/i.test(
    `${config.name} ${desc}`
  )
  if (weak) {
    return `${desc} Figures like this are estimated and coverage varies by country. Treat rankings as directional, not lab-grade.`
  }
  return desc
}

export default function StatPage({ params }: { params: { slug: string } }) {
  const entry = getVariableBySlug(params.slug)
  if (!entry) notFound()

  const config = VARIABLES[entry.id]
  const ranked = rankCountries(entry.id)
  const related = relatedVariableSlugs(entry.id, 5)
  const higher = ranksHighFirst(config)
  const lname = config.name.toLowerCase().replace(/mcdonald's/g, "McDonald's")
  const question = config.type === 'categorical'
    ? `Which category is most commonly reported for ${lname}?`
    : `Which country has the ${higher ? 'highest' : 'lowest'} ${lname}?`
  const mainFact = buildMainFact(config, ranked, higher, countries.length)
  const answer = mainFact.detail

  const note = sourceNote(entry.id)
  const lf = mapLongform(entry.slug)
  const dataNoun = config.type === 'categorical' ? 'a reported category' : 'a reported value'
  const baseFaqs = [
    {
      q: question,
      a: answer,
    },
    {
      q: `How is ${lname} measured?`,
      a: note ? `${sourceBlurb(entry.id)} Source: ${note.source}. Data year: ${note.vintage}.` : sourceBlurb(entry.id),
    },
    ...(note ? note.notes.map((n, i) => ({ q: i === 0 ? `Which places are included in the ${lname} ranking?` : `Why might this ranking differ from other sources?`, a: n })) : []),
    {
      q: `How many countries have data for ${lname}?`,
      a: `${ranked.length} of ${countries.length} countries on this map have ${dataNoun} for ${lname}.`,
    },
  ]
  const faqs = lf ? [...lf.faqs, baseFaqs[1]] : baseFaqs
  const claims = claimsForVariable(entry.id)
  const rankingRows = buildRankingRows(config, ranked)
  const canonicalPath = `/map/${entry.slug}/`

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: `${config.name} by country`,
    description: answer,
    url: `https://theworldtruth.com${canonicalPath}`,
    creator: { '@type': 'Organization', name: 'The World Truth' },
    variableMeasured: config.name,
  }

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  }

  return (
    <div className="min-h-screen bg-[#fff9e8] text-[#192947]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />

      <main className="twt-container mx-auto max-w-6xl px-4 pb-24 pt-8 md:pb-12 md:pt-10">
        <section aria-labelledby="stat-title" className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(20rem,0.75fr)] lg:items-end">
          <div>
            <p className="twt-kicker inline-flex rounded-full border border-[#294cc4]/20 bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-[#294cc4]">
              {config.category}
            </p>
            <h1 id="stat-title" className="twt-display mt-4 max-w-4xl text-4xl font-black leading-[1.02] tracking-[-0.03em] text-[#192947] md:text-6xl">
              {lf?.h1 ?? question}
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-[#192947]/70 md:text-lg md:leading-8">
              {lf?.intro ?? mainFact.detail}
            </p>
          </div>

          <aside
            aria-label="Main reported fact"
            className="rounded-[1.75rem] border-2 border-[#192947] bg-[#ffda62] p-5 shadow-[8px_8px_0_rgba(25,41,71,0.12)] md:p-6"
          >
            <p className="twt-kicker text-[10px] font-black uppercase tracking-[0.18em] text-[#192947]/60">
              Reported fact
            </p>
            <p className="mt-2 text-xs font-black uppercase tracking-[0.14em] text-[#192947]/65">
              {mainFact.label}
            </p>
            <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <p className="twt-display text-3xl font-black leading-none text-[#192947] md:text-4xl">
                {mainFact.lead}
              </p>
              <p className="text-xl font-black tabular-nums text-[#192947] md:text-2xl">
                {mainFact.value}
              </p>
            </div>
            <p className="mt-1 text-[11px] font-bold text-[#192947]/55">{mainFact.valueLabel}</p>
            <p className="mt-4 text-sm font-semibold leading-6 text-[#192947]/75">{mainFact.detail}</p>
            {mainFact.countryHref && (
              <Link
                href={mainFact.countryHref}
                className="mt-3 inline-flex min-h-9 items-center rounded-sm text-sm font-black text-[#294cc4] underline decoration-2 underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294cc4]"
              >
                View country profile
              </Link>
            )}
            <p className="mt-4 border-t border-[#192947]/20 pt-3 text-xs leading-5 text-[#192947]/65">
              {note ? (
                <>
                  Source:{' '}
                  <a
                    href={note.url}
                    target="_blank"
                    rel="nofollow noopener noreferrer"
                    className="font-bold underline decoration-[#192947]/30 underline-offset-2 hover:decoration-[#192947] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294cc4]"
                  >
                    {note.source}
                  </a>
                  . Data vintage: {note.vintage}.
                </>
              ) : (
                'Source and data vintage are not verified on this page.'
              )}
            </p>
          </aside>
        </section>

        <MapFeature
          key={entry.slug}
          countries={countries}
          colorVariable={entry.id}
          canonicalPath={canonicalPath}
          rankingRows={rankingRows}
          slug={entry.slug}
          category={config.category}
          name={config.name}
          sourceName={note?.source}
          sourceUrl={note?.url}
          vintage={note?.vintage}
          limitations={note?.notes || []}
        />

        <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-[#192947]/65">
          <span className="font-black uppercase tracking-[0.12em]">About the figure</span>
          <span>{sourceBlurb(entry.id)}</span>
        </div>

        {(entry.slug === 'gdp-per-capita' || entry.slug === 'gdp-per-capita-ppp') && (
          <p className="mt-3 text-sm">
            View:{' '}
            <Link href="/map/gdp-per-capita/" className={entry.slug === 'gdp-per-capita' ? 'font-semibold text-[#192947]' : 'font-semibold text-[#294cc4] underline underline-offset-4'}>Nominal (US$)</Link>{' '}
            <span aria-hidden="true">/</span>{' '}
            <Link href="/map/gdp-per-capita-ppp/" className={entry.slug === 'gdp-per-capita-ppp' ? 'font-semibold text-[#192947]' : 'font-semibold text-[#294cc4] underline underline-offset-4'}>PPP (Int$)</Link>
          </p>
        )}

        <section className="mt-8 rounded-[1.5rem] border-2 border-[#192947]/15 bg-white p-5 shadow-sm md:p-6">
          <h2 className="twt-display text-2xl font-black text-[#192947]">Play with these numbers</h2>
          <ul className="mt-3 grid gap-2 text-sm font-semibold sm:grid-cols-2">
            <li><Link href="/truthle/" className="inline-flex min-h-10 items-center rounded-lg text-[#246e55] underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294cc4]">Play today&apos;s Truthle daily world facts quiz</Link></li>
            <li><Link href="/true-false/" className="inline-flex min-h-10 items-center rounded-lg text-[#294cc4] underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294cc4]">Play True or False: World</Link></li>
            {claims[0] && <li className="sm:col-span-2"><Link href={`/true-false/claims/${claims[0].slug}/`} className="inline-flex min-h-10 items-center rounded-lg text-[#294cc4] underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294cc4]">Related claim: {claims[0].text}</Link></li>}
          </ul>
          <div className="mt-5">
            <DealQuiz slug={entry.slug} category={config.category} name={config.name} plain />
          </div>
        </section>

        <AdBanner slotId={AD_SLOTS.mapPageBanner} className="my-6" />

        <EmbedSnippet slug={entry.slug} />

        {lf && (
          <article className="twt-prose mt-10 rounded-[1.5rem] border-2 border-[#192947]/15 bg-white p-6 text-[#192947]/80 shadow-sm md:p-8">
            {lf.sections.map((sec) => (
              <section key={sec.h2} className="mb-7 last:mb-0">
                <h2 className="twt-display text-2xl font-black leading-tight text-[#192947] md:text-3xl">{sec.h2}</h2>
                {sec.paragraphs.map((para) => <p key={para} className="mt-3 leading-7">{para}</p>)}
                {sec.bullets && (
                  <ul className="mt-3 list-disc space-y-1 pl-5 leading-7">{sec.bullets.map((b) => <li key={b}>{b}</li>)}</ul>
                )}
              </section>
            ))}
            <p className="mt-6 border-t border-[#192947]/10 pt-4 text-sm leading-6">
              Explore more:{' '}
              {lf.links.map((l, i) => (
                <span key={l.href}>{i > 0 && ' / '}<Link href={l.href} className="font-bold text-[#294cc4] underline underline-offset-4">{l.label}</Link></span>
              ))}
            </p>
          </article>
        )}

        <div className="mt-6 flex justify-center">
          <AdSidebar slotId={AD_SLOTS.mapPageSquare} size="square" />
        </div>

        <section className="mt-10 rounded-[1.5rem] border-2 border-[#192947]/15 bg-white p-6 shadow-sm">
          <h2 className="twt-display text-2xl font-black text-[#192947]">FAQ</h2>
          <dl className="mt-4 space-y-6">
            {faqs.map((item) => (
              <div key={item.q}>
                <dt className="font-black text-[#192947]">{item.q}</dt>
                <dd className="mt-1 leading-7 text-[#192947]/70">{item.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        {claims.length > 0 && (
          <section className="mt-10 rounded-[1.5rem] border-2 border-[#294cc4]/15 bg-[#eef1f5] p-6">
            <h2 className="twt-display text-xl font-black text-[#192947]">True or False?</h2>
            <ul className="mt-3 space-y-2">
              {claims.map((claim) => (
                <li key={claim.slug}><Link href={`/true-false/claims/${claim.slug}/`} className="text-[#294cc4] underline underline-offset-4 hover:no-underline">{claim.text}</Link></li>
              ))}
            </ul>
            <Link href="/true-false/" className="mt-4 inline-flex min-h-10 items-center text-sm font-black text-[#294cc4] underline underline-offset-4">Play today&apos;s daily True or False</Link>
          </section>
        )}

        {related.length > 0 && (
          <section className="mt-10">
            <h2 className="twt-display text-2xl font-black text-[#192947]">Related statistics</h2>
            <ul className="mt-4 grid gap-3 md:grid-cols-2">
              {related.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/map/${item.slug}/`}
                    className="block rounded-xl border-2 border-[#192947]/10 bg-white px-4 py-3 font-semibold text-[#294cc4] hover:border-[#294cc4]/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294cc4]"
                  >
                    {item.name} by country
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 flex gap-2 border-t border-[#192947]/15 bg-white/95 px-3 py-2 text-sm backdrop-blur md:hidden">
        <a href="#deal-quiz" className="flex-1 rounded-lg bg-[#294cc4] py-2 text-center font-black text-white">Play the map quiz</a>
        <Link href="/truthle" className="flex-1 rounded-lg border border-[#192947]/25 py-2 text-center font-black text-[#192947]">Play Truthle</Link>
      </div>
    </div>
  )
}

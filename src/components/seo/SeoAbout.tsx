import Link from 'next/link'

export interface Faq { q: string; a: string }

export default function SeoAbout({
  h1, intro, steps, faqs, children,
}: { h1: string; intro: string; steps: string[]; faqs: Faq[]; children?: React.ReactNode }) {
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  }
  return (
    <section className="max-w-3xl mx-auto px-4 py-10 text-gray-800">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">{h1}</h1>
      <p className="mt-3">{intro}</p>
      <h2 className="mt-6 text-xl font-bold text-gray-900">How to play</h2>
      <ol className="mt-2 list-decimal pl-5 space-y-1">{steps.map((s) => <li key={s}>{s}</li>)}</ol>
      {children}
      <h2 className="mt-8 text-xl font-bold text-gray-900">FAQ</h2>
      <dl className="mt-2 space-y-4">
        {faqs.map((f) => (
          <div key={f.q}><dt className="font-semibold">{f.q}</dt><dd className="mt-1 text-gray-700">{f.a}</dd></div>
        ))}
      </dl>
      <p className="mt-8 text-sm">
        More daily games: <Link href="/truthle/" className="text-emerald-700 underline">Truthle</Link> ·{' '}
        <Link href="/true-false/" className="text-sky-700 underline">True or False: World</Link> ·{' '}
        <Link href="/true-false/claims/" className="text-sky-700 underline">All true/false claims</Link> ·{' '}
        <Link href="/truthle-vs-worldle/" className="text-gray-700 underline">Truthle vs Worldle &amp; other geo games</Link>
      </p>
    </section>
  )
}

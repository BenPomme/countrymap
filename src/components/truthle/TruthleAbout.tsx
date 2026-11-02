import Link from 'next/link'

const truthleFaqs = [
  {
    q: 'What is Truthle?',
    a: 'Truthle is a free daily multiple-choice quiz built from country and world statistics. Each available round has five questions, and everyone receives the same set for that UTC day.',
  },
  {
    q: 'Are there always five questions?',
    a: 'Every available Truthle round contains exactly five questions. If five suitable questions cannot be prepared with recorded source details, the page shows the round as unavailable instead of adding unsourced filler.',
  },
  {
    q: 'Where do the questions and source details come from?',
    a: 'Questions use the country datasets behind The World Truth Map. After you answer, Truthle shows the source, year, coverage and known limitations that are recorded for that question. If a detail is missing, it is not invented.',
  },
  {
    q: 'Is Truthle free, and what does an Extra Attempt cost?',
    a: 'Your first run each UTC day is free. After that run, an Extra Attempt may be offered as a one-time EUR0.99 purchase charged in EUR. It is not a subscription and adds one more run for that day without replacing your first result or streak. A valid single-use friend code can cover the Extra Attempt at checkout and expires at 23:59:59 UTC on the day it was created.',
  },
  {
    q: 'What happens if I already played today?',
    a: 'Your result and streak remain available. You can share without spoiling answers, return for the next UTC round, or use an Extra Attempt when one is offered.',
  },
]

export default function TruthleAbout() {
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: truthleFaqs.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  }

  return (
    <section className="bg-[#fff9e8] pb-12 pt-10 text-[#192947] sm:pb-16" aria-labelledby="truthle-guide-title">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <div className="twt-container">
        <div className="twt-panel overflow-hidden">
          <div className="grid lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]">
            <div className="p-6 sm:p-8 lg:p-10">
              <p className="twt-kicker">Daily game guide</p>
              <h2 id="truthle-guide-title" className="twt-display mt-2 max-w-2xl text-3xl font-black leading-tight sm:text-4xl">
                Five sourced questions, one daily round
              </h2>
              <p className="twt-prose mt-4">
                Truthle is a free daily multiple-choice game about countries and world statistics. Each available round contains five questions, all generated from the country data behind The World Truth Map.
              </p>

              <div className="mt-7 grid gap-6 sm:grid-cols-2">
                <div>
                  <h3 className="twt-display text-xl font-black">How a round works</h3>
                  <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-[#43516b]">
                    <li>Read a question and choose one of the four answers.</li>
                    <li>See whether you were right, along with the recorded figure and available source details.</li>
                    <li>Finish all five questions to record your score, correct count and streak.</li>
                  </ol>
                </div>
                <div>
                  <h3 className="twt-display text-xl font-black">What makes it different</h3>
                  <p className="mt-3 text-sm leading-6 text-[#43516b]">
                    You are not hunting for a country by its shape or place on a map. You are comparing the figures behind a question and checking the trail back to the data.
                  </p>
                </div>
              </div>
            </div>

            <aside className="border-t-2 border-[#192947] bg-[#ffda62] p-6 sm:p-8 lg:border-l-2 lg:border-t-0 lg:p-10" aria-labelledby="truthle-daily-title">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#192947]/70">One daily set</p>
              <h3 id="truthle-daily-title" className="twt-display mt-2 text-2xl font-black leading-tight">
                Five questions for the UTC day
              </h3>
              <p className="mt-3 text-sm leading-6 text-[#192947]/80">
                The round unlocks at 00:00 UTC and stays the same for everyone that day. If five suitable sourced questions cannot be prepared, Truthle says so and does not invent a set.
              </p>
              <p className="mt-3 text-sm leading-6 text-[#192947]/80">
                Your score, correct count and streak stay with your own progress.
              </p>
              <div className="mt-5 flex flex-col gap-3">
                <Link href="/" className="twt-button text-center">Browse the statistics</Link>
                <Link href="/true-false/" className="twt-button-secondary text-center">Try True or False</Link>
              </div>
            </aside>
          </div>

          <div className="border-t-2 border-[#192947] p-6 sm:p-8 lg:p-10">
            <p className="twt-kicker">Straight answers</p>
            <h2 className="twt-display mt-2 text-3xl font-black">Truthle FAQ</h2>
            <div className="mt-5 grid gap-x-10 gap-y-6 md:grid-cols-2">
              {truthleFaqs.map((item) => (
                <div key={item.q}>
                  <h3 className="text-base font-black text-[#192947]">{item.q}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#43516b]">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

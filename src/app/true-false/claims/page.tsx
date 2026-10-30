import Link from 'next/link'
import type { Metadata } from 'next'
import { getAllClaims } from '@/lib/seo/claims'

export const metadata: Metadata = {
  title: 'True or False: World — country fact claims, answered',
  description: 'Hundreds of true-or-false claims comparing countries on economy, health, crime and more, each answered with data. Play the daily game.',
  alternates: { canonical: 'https://theworldtruth.com/true-false/claims/' },
}

export default function ClaimsIndex() {
  const claims = getAllClaims()
  const groups = new Map<string, typeof claims>()
  for (const c of claims) groups.set(c.variableName, [...(groups.get(c.variableName) || []), c])
  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <Link href="/" className="text-sm text-gray-600">← The World Truth</Link>
      <h1 className="text-3xl font-extrabold mt-3">True or False: country claims</h1>
      <p className="mt-2 text-gray-600">{claims.length} claims, each answered with data.{' '}
        <Link href="/true-false/" className="text-sky-700 font-semibold underline">Play today&apos;s daily game →</Link></p>
      {Array.from(groups.entries()).map(([name, list]) => (
        <section key={name} className="mt-6">
          <h2 className="font-bold">{name}</h2>
          <ul className="list-disc pl-5 text-sm space-y-1 mt-1">
            {list.map((c) => <li key={c.slug}><Link href={`/true-false/claims/${c.slug}/`} className="text-sky-700 hover:underline">{c.text}</Link></li>)}
          </ul>
        </section>
      ))}
    </main>
  )
}

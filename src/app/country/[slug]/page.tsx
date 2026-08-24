import CountryClient from './CountryClient'
import { allCountrySlugs } from '@/lib/seo/catalog'

export function generateStaticParams() {
  return allCountrySlugs().map((slug) => ({ slug }))
}

export default function CountryPage({ params }: { params: { slug: string } }) {
  return <CountryClient slug={params.slug} />
}

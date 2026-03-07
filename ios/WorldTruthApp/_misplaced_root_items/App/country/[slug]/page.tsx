import CountryPage from '../../../src/app/country/[slug]/page'

export default function Page({ params }: { params: { slug: string } }) {
  return <CountryPage params={params} />
}

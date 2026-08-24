import type { Metadata } from 'next'
import { VARIABLES } from '@/lib/constants/variables'
import { getVariableBySlug, variableEntries } from '@/lib/seo/catalog'

export const dynamicParams = false

export function generateStaticParams() {
  return variableEntries.map((entry) => ({ slug: entry.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const entry = getVariableBySlug(params.slug)
  const name = entry ? VARIABLES[entry.id].name : 'Map'
  const mapUrl = entry
    ? `https://theworldtruth.com/map/${entry.slug}/`
    : 'https://theworldtruth.com/'

  return {
    title: `${name} map embed | The World Truth Map`,
    description: `Embeddable ${name} choropleth from The World Truth Map.`,
    robots: {
      index: false,
      follow: false,
      googleBot: {
        index: false,
        follow: false,
        noimageindex: true,
      },
    },
    alternates: { canonical: mapUrl },
  }
}

export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return children
}

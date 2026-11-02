import { sourceNote } from '@/lib/seo/sourceNotes'
import type { ColorVariable } from '@/types/country'
import { normalizeShareCopy } from './shareState'

export interface ShareProvenance {
  sourceName: string
  sourceVintage: string
  sourceUrl?: string
}

const FALLBACK_PROVENANCE: ShareProvenance = {
  sourceName: 'The World Truth country dataset',
  sourceVintage: 'Vintage not stated for this measure',
}

export function resolveShareProvenance(
  metricIds: readonly string[],
  fallback: ShareProvenance = FALLBACK_PROVENANCE,
): ShareProvenance {
  const notes = metricIds
    .map((metricId) => sourceNote(metricId as ColorVariable))
    .filter((note): note is NonNullable<typeof note> => Boolean(note))

  if (notes.length === 0) return fallback

  const sources = Array.from(new Set(notes.map((note) => note.source)))
  const vintages = Array.from(new Set(notes.map((note) => note.vintage)))

  return {
    sourceName: normalizeShareCopy(sources.join('; ')),
    sourceVintage: normalizeShareCopy(vintages.join('; ')),
    sourceUrl: notes.length === 1 ? notes[0].url : undefined,
  }
}

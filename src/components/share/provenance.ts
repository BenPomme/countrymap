import { sourceNote } from '@/lib/seo/sourceNotes'
import type { ColorVariable } from '@/types/country'
import { normalizeShareCopy } from './shareState'

export interface ShareProvenance {
  sourceName: string
  sourceVintage: string
  sourceUrl?: string
}

const FALLBACK_PROVENANCE: ShareProvenance = {
  sourceName: 'Unknown',
  sourceVintage: 'Unknown',
}

const UNKNOWN_MEASURE = 'Unknown for one or more measures'

export function resolveShareProvenance(
  metricIds: readonly string[],
  fallback: ShareProvenance = FALLBACK_PROVENANCE,
): ShareProvenance {
  if (metricIds.length === 0) return fallback

  const notes = metricIds.map((metricId) => sourceNote(metricId as ColorVariable))
  const availableNotes = notes.filter((note): note is NonNullable<typeof note> => Boolean(note))
  const hasUnknownMeasure = availableNotes.length !== notes.length

  if (availableNotes.length === 0) {
    return { ...fallback, sourceVintage: 'Unknown' }
  }

  const sources = Array.from(
    new Set(availableNotes.map((note) => normalizeShareCopy(note.source)).filter(Boolean)),
  )
  const vintages = Array.from(
    new Set(availableNotes.map((note) => normalizeShareCopy(note.vintage)).filter(Boolean)),
  )
  const unknownSuffix = hasUnknownMeasure ? `; ${UNKNOWN_MEASURE}` : ''

  return {
    sourceName: `${sources.join('; ') || fallback.sourceName}${unknownSuffix}`,
    sourceVintage: `${vintages.join('; ') || 'Unknown'}${unknownSuffix}`,
    sourceUrl: notes.length === 1 && availableNotes.length === 1 ? availableNotes[0].url : undefined,
  }
}

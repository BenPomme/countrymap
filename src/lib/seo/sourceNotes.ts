import type { ColorVariable } from '@/types/country'

/**
 * Source + vintage disclosures for map/claim pages.
 * Only state years we can stand behind; where the dataset vintage is not
 * verified against the latest release, say so explicitly.
 */
export interface SourceNote {
  source: string
  url: string
  /** Human label for the data year, e.g. "RSF index, vintage pre-2026 (unverified)" */
  vintage: string
  notes: string[]
}

export const SOURCE_NOTES: Partial<Record<ColorVariable, SourceNote>> = {
  'freedom.pressFreedom': {
    source: 'Reporters Without Borders (RSF) World Press Freedom Index',
    url: 'https://rsf.org/en/index',
    vintage: 'Pre-2026 RSF scores, rounded to whole points (not yet reconciled with the RSF 2026 index)',
    notes: [
      'Scores are 0–100, higher = more press freedom. RSF publishes a new index every May; our figures have not yet been updated to the 2026 edition, so individual scores and ranks may differ from rsf.org.',
      'Ties are shown in the order of our dataset; RSF ranks with decimal scores.',
    ],
  },
  'economy.mcdonaldsPerCapita': {
    source: "McDonald's corporate restaurant counts and country franchise reports, divided by UN population",
    url: 'https://corporate.mcdonalds.com/',
    vintage: 'Restaurant counts circa 2022–2023 (not reconciled with Visual Capitalist 2024 charts)',
    notes: [
      'Only sovereign countries in our 164-country dataset are ranked. Macau and Hong Kong (territories) are not included, and Andorra has no value in our dataset, so they do not appear in the table.',
      'Some 2024 charts (e.g. Visual Capitalist) rank Andorra or Macau at or near the top per capita because of very small populations. Those charts use a different country list, so their #1 differs from ours.',
    ],
  },
  'economy.billionairesPerCapita': {
    source: 'Forbes World’s Billionaires list, divided by population (Gapminder / UN)',
    url: 'https://www.forbes.com/billionaires/',
    vintage: 'Forbes list pre-2026 (not yet reconciled with the Forbes 2026 list)',
    notes: [
      'Hong Kong is not a separate entry: our map covers sovereign countries only, so Hong Kong-based billionaires are not ranked separately and Hong Kong does not appear in the table. Forbes lists Hong Kong separately from mainland China.',
      'Only countries with at least one Forbes billionaire have a value.',
    ],
  },
}

export function sourceNote(id: ColorVariable): SourceNote | undefined {
  return SOURCE_NOTES[id]
}

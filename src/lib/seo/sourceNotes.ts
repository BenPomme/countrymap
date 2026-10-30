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
    source: 'Reporters Without Borders (RSF) World Press Freedom Index 2026',
    url: 'https://rsf.org/en/index?year=2026',
    vintage: 'RSF 2026 index (global scores, two decimals)',
    notes: [
      'Scores are 0–100, higher = more press freedom. RSF ranks 180 countries and territories; our map covers 164 of them.',
      'Not shown because they are outside our 164-country set: Liechtenstein, Fiji, Seychelles, Cabo Verde, North Macedonia, Tonga, OECS, Samoa, Belize, Malta, Comoros, Northern Cyprus, Kosovo, Maldives, Hong Kong and Palestine.',
    ],
  },
  'lifestyle.happinessIndex': {
    source: 'World Happiness Report 2026 (Gallup World Poll life evaluations)',
    url: 'https://worldhappiness.report/ed/2026/',
    vintage: 'WHR 2026: 3-year average life evaluation, 2023–2025 (0–10)',
    notes: [
      'WHR 2026 ranks 147 countries; 140 are in our map set (Kosovo, Belize, Malta, North Macedonia, Hong Kong, Palestine and Comoros are outside it).',
      'Countries not ranked in WHR 2026 show no value.',
    ],
  },
  'poverty.gdpPerCapita': {
    source: 'IMF World Economic Outlook, October 2026 (DataMapper NGDPDPC)',
    url: 'https://www.imf.org/external/datamapper/NGDPDPC@WEO',
    vintage: 'IMF WEO October 2026, 2026 estimates, current US dollars (nominal)',
    notes: [
      'Nominal GDP per capita at market exchange rates, not PPP. For purchasing-power-adjusted figures see the GDP per Capita (PPP) map.',
      'Countries without a 2026 IMF estimate show no value.',
    ],
  },
  'poverty.gdpPerCapitaPPP': {
    source: 'IMF World Economic Outlook, October 2026 (DataMapper PPPPC)',
    url: 'https://www.imf.org/external/datamapper/PPPPC@WEO',
    vintage: 'IMF WEO October 2026, 2026 estimates, current international dollars (PPP)',
    notes: ['Countries without a 2026 IMF estimate show no value.'],
  },
  'economy.mcdonaldsPerCapita': {
    source: "McDonald's Corporation, Restaurants by Market 2025 (restaurant counts as of December 31, 2025), divided by our dataset population",
    url: 'https://corporate.mcdonalds.com/content/dam/sites/corp/nfl/pdf/Restaurants%20by%20Market%202025.pdf',
    vintage: "McDonald's restaurant counts as of December 31, 2025",
    notes: [
      'Only sovereign countries in our 164-country dataset are ranked. Territories listed separately by McDonald’s (Hong Kong, Macau, Puerto Rico, Guam, Réunion, Martinique, Guadeloupe, French Polynesia, New Caledonia, Curaçao, Aruba and others) are not shown.',
      'Malta, the Bahamas, Fiji, Samoa, Monaco, Liechtenstein and Andorra have McDonald’s restaurants but are not in our country dataset (Andorra has no population figure), so they do not appear in the table. Small states like these often top other per-capita charts.',
      'Countries with no McDonald’s in the 2025 market list show no value, including Russia and Belarus (exited 2022), Kazakhstan (2023), Bosnia and Herzegovina (2022), Sri Lanka (2024) and Iceland (2009).',
    ],
  },
  'economy.billionairesPerCapita': {
    source: 'Forbes World’s Billionaires 2026 (country of citizenship), divided by our dataset population',
    url: 'https://www.forbes.com/sites/samellefson/2026/03/11/the-countries-with-the-most-billionaires/',
    vintage: 'Forbes World’s Billionaires 2026 (net worths as of March 1, 2026; 3,428 billionaires)',
    notes: [
      'Hong Kong (71 billionaires) is not a separate entry: our map covers sovereign countries only. Forbes lists Hong Kong separately from mainland China, so they are not added to China.',
      'Monaco, Liechtenstein, Barbados, Belize and Guernsey have Forbes billionaires but are not in our country dataset, so they do not appear in the table.',
      'Only countries with at least one Forbes billionaire have a value.',
    ],
  },
}

export function sourceNote(id: ColorVariable): SourceNote | undefined {
  return SOURCE_NOTES[id]
}

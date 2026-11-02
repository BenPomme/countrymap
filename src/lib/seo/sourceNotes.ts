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
      'Scores are 0 to 100, higher = more press freedom. RSF ranks 180 countries and territories; our map covers 164 of them.',
      'The official 2026 CSV was checked on 2 November 2026. All 164 bundled scores match exactly.',
      'Not shown because they are outside our 164-country set: Liechtenstein, Fiji, Seychelles, Cabo Verde, North Macedonia, Tonga, OECS, Samoa, Belize, Malta, Comoros, Northern Cyprus, Kosovo, Maldives, Hong Kong and Palestine.',
    ],
  },
  'lifestyle.happinessIndex': {
    source: 'World Happiness Report 2026 (Gallup World Poll life evaluations)',
    url: 'https://worldhappiness.report/ed/2026/',
    vintage: 'WHR 2026: 3-year average life evaluation, 2023-2025 (0-10)',
    notes: [
      'WHR 2026 ranks 147 countries; 140 are in our map set (Kosovo, Belize, Malta, North Macedonia, Hong Kong, Palestine and Comoros are outside it).',
      'The official Figure 2.1 spreadsheet was checked on 2 November 2026. All 140 bundled scores match exactly.',
      'Countries not ranked in WHR 2026 show no value.',
    ],
  },
  'poverty.gdpPerCapita': {
    source: 'IMF World Economic Outlook, October 2026 (DataMapper NGDPDPC; edition not independently verified)',
    url: 'https://www.imf.org/external/datamapper/NGDPDPC@WEO',
    vintage: 'Bundled values are labelled IMF WEO October 2026, 2026 estimates; edition and values unverified',
    notes: [
      'Bundled definition: nominal GDP per capita at market exchange rates, in current US dollars, not PPP. For purchasing-power-adjusted figures see the GDP per Capita (PPP) map.',
      'The 2 November 2026 audit could not retrieve a checkable October 2026 table, so source parity and the estimate year remain unknown. This map remains browseable only.',
      'Countries without a bundled estimate show no value.',
    ],
  },
  'poverty.gdpPerCapitaPPP': {
    source: 'IMF World Economic Outlook, October 2026 (DataMapper PPPPC; edition not independently verified)',
    url: 'https://www.imf.org/external/datamapper/PPPPC@WEO',
    vintage: 'Bundled values are labelled IMF WEO October 2026, 2026 estimates; edition and values unverified',
    notes: [
      'Bundled definition: GDP per capita in current international dollars at purchasing power parity. It is not interchangeable with the nominal GDP-per-capita map.',
      'The 2 November 2026 audit could not retrieve a checkable October 2026 table, so source parity and the estimate year remain unknown. This map remains browseable only.',
      'Countries without a bundled estimate show no value.',
    ],
  },
  'economy.mcdonaldsPerCapita': {
    source: "McDonald's Corporation, Restaurants by Market 2025 (restaurant counts as of December 31, 2025), divided by a population denominator whose vintage is not established",
    url: 'https://corporate.mcdonalds.com/content/dam/sites/corp/nfl/pdf/Restaurants%20by%20Market%202025.pdf',
    vintage: "McDonald's restaurant counts as of December 31, 2025; population denominator vintage unknown",
    notes: [
      'Only sovereign countries in our 164-country dataset are ranked. Territories listed separately by McDonald’s (Hong Kong, Macau, Puerto Rico, Guam, Réunion, Martinique, Guadeloupe, French Polynesia, New Caledonia, Curaçao, Aruba and others) are not shown.',
      'Market counts consolidate territories unevenly. The United States count includes Cuba, Guam and Saipan.',
      'Four published counts were checked. The US, France and UK reconcile after rounding with the bundled populations. Australia’s 1,092 restaurants over 26,000,000 people implies 42.0 per million, while the bundle stores 41.4, so the denominator is not fully reconciled. The map remains browseable only.',
      'Malta, the Bahamas, Fiji, Samoa, Monaco, Liechtenstein and Andorra have McDonald’s restaurants but are not in our country dataset (Andorra has no population figure), so they do not appear in the table. Small states like these often top other per-capita charts.',
      'Countries with no McDonald’s in the 2025 market list show no value, including Russia and Belarus (exited 2022), Kazakhstan (2023), Bosnia and Herzegovina (2022), Sri Lanka (2024) and Iceland (2009).',
    ],
  },
  'economy.billionairesPerCapita': {
    source: 'Forbes World’s Billionaires 2026 (country of citizenship), divided by a population denominator whose vintage is not established',
    url: 'https://www.forbes.com/sites/samellefson/2026/03/11/the-countries-with-the-most-billionaires/',
    vintage: 'Forbes list dated March 11, 2026 (net worths as of March 1, 2026; 3,428 billionaires across 80 countries and territories)',
    notes: [
      'Score = (Forbes 2026 billionaire count ÷ bundled population) × 10,000,000. Singapore’s 100.0 is computed from the bundled count and population, not a separate colour-scale cap. The colour scale runs 0 to 100, so it sits at the top colour.',
      'Per million = divide the map value by 10 (Singapore: 10.0 per million).',
      'Five published counts for the US, China, India, Germany and Russia reconcile after rounding with the bundled populations. A full 70-country source match was not available, so this map remains browseable only.',
      'Hong Kong’s 71 Forbes billionaires are listed separately by Forbes and are not folded into China’s 539. Hong Kong is not one of the 164 countries on our map, so it has no value here.',
      'Monaco, Liechtenstein, Barbados, Belize and Guernsey have Forbes billionaires but are not in our country dataset, so they do not appear in the table.',
      'Only countries with at least one Forbes billionaire have a value.',
    ],
  },
}

export function sourceNote(id: ColorVariable): SourceNote | undefined {
  return SOURCE_NOTES[id]
}

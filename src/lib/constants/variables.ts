import type { VariableConfig, ColorVariable } from '@/types/country'

export const MAJOR_RELIGIONS = [
  'Christianity',
  'Islam',
  'Hinduism',
  'Buddhism',
  'Judaism',
  'Folk/Traditional',
  'Other',
  'None/Unaffiliated',
] as const

export const REGIONS = [
  'Africa',
  'Americas',
  'Asia',
  'Europe',
  'Oceania',
] as const

export const VARIABLES: Record<ColorVariable, VariableConfig> = {
  'democracy.score': {
    id: 'democracy.score',
    name: 'Democracy Score',
    description: 'Combined democracy index (0-100) based on V-Dem and Freedom House data',
    type: 'numeric',
    domain: [0, 100],
    colorScheme: 'interpolateBlues',
    format: (v) => v !== null ? `${Math.round(v as number)}` : 'N/A',
    higherIsBetter: true,
  },
  'poverty.gdpPerCapita': {
    id: 'poverty.gdpPerCapita',
    name: 'GDP per Capita',
    description: 'GDP per capita in USD (PPP)',
    type: 'numeric',
    domain: [0, 100000],
    colorScheme: 'interpolateGreens',
    format: (v) => v !== null ? `$${(v as number).toLocaleString()}` : 'N/A',
    higherIsBetter: true,
  },
  'poverty.hdi': {
    id: 'poverty.hdi',
    name: 'Human Development Index',
    description: 'UN Human Development Index (0-1)',
    type: 'numeric',
    domain: [0, 1],
    colorScheme: 'interpolatePurples',
    format: (v) => v !== null ? (v as number).toFixed(3) : 'N/A',
    higherIsBetter: true,
  },
  'gender.wblIndex': {
    id: 'gender.wblIndex',
    name: "Women's Legal Rights",
    description: 'World Bank Women, Business and the Law Index (0-100)',
    type: 'numeric',
    domain: [0, 100],
    colorScheme: 'interpolatePuRd',
    format: (v) => v !== null ? `${Math.round(v as number)}` : 'N/A',
    higherIsBetter: true,
  },
  'conflict.peaceIndex': {
    id: 'conflict.peaceIndex',
    name: 'Peace Index',
    description: 'Global Peace Index (1=most peaceful, 5=least peaceful)',
    type: 'numeric',
    domain: [1, 5],
    colorScheme: 'interpolateRdYlGn',
    format: (v) => v !== null ? (v as number).toFixed(2) : 'N/A',
    higherIsBetter: false,
  },
  'crime.safetyIndex': {
    id: 'crime.safetyIndex',
    name: 'Safety Index',
    description: 'Safety index (0-100, higher is safer)',
    type: 'numeric',
    domain: [0, 100],
    colorScheme: 'interpolateYlGn',
    format: (v) => v !== null ? `${Math.round(v as number)}` : 'N/A',
    higherIsBetter: true,
  },
  'religion.major': {
    id: 'religion.major',
    name: 'Major Religion',
    description: 'Predominant religion by population',
    type: 'categorical',
    categories: [...MAJOR_RELIGIONS],
    colorScheme: 'schemeSet2',
    format: (v) => v as string || 'Unknown',
    higherIsBetter: true,
  },
}

export const DEFAULT_VARIABLE: ColorVariable = 'democracy.score'

export const DATA_SOURCES = {
  cia_factbook: {
    name: 'CIA World Factbook',
    url: 'https://www.cia.gov/the-world-factbook/',
    description: 'Comprehensive country information including demographics and religion',
  },
  vdem: {
    name: 'V-Dem Institute',
    url: 'https://v-dem.net/',
    description: 'Varieties of Democracy dataset measuring democracy indicators',
  },
  freedom_house: {
    name: 'Freedom House',
    url: 'https://freedomhouse.org/',
    description: 'Annual survey of political rights and civil liberties',
  },
  world_bank: {
    name: 'World Bank',
    url: 'https://data.worldbank.org/',
    description: 'Development indicators including poverty and gender equality',
  },
  ucdp: {
    name: 'Uppsala Conflict Data Program',
    url: 'https://ucdp.uu.se/',
    description: 'Armed conflict data since 1946',
  },
  gpi: {
    name: 'Global Peace Index',
    url: 'https://www.visionofhumanity.org/',
    description: 'Annual measure of national peacefulness',
  },
}

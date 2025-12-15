export interface ReligionData {
  major: string
  breakdown: Record<string, number>
}

export interface DemocracyData {
  score: number // 0-100 scale
  freedomScore: number | null // Freedom House 0-100
  vdemScore: number | null // V-Dem 0-1
}

export interface CrimeData {
  homicideRate: number | null // per 100,000
  safetyIndex: number | null // 0-100
}

export interface PovertyData {
  povertyRate: number | null // % below $2.15/day
  gdpPerCapita: number | null // USD
  hdi: number | null // Human Development Index 0-1
}

export interface GenderData {
  wblIndex: number | null // Women Business Law 0-100
  giiScore: number | null // Gender Inequality Index 0-1
}

export interface ConflictData {
  hasActiveConflict: boolean
  peaceIndex: number | null // 1-5 scale (1 = most peaceful)
  conflictDeaths: number | null
}

export interface DataSource {
  source: string
  year: number
  url?: string
}

export interface Country {
  iso3: string
  iso2: string
  name: string
  region: string
  subregion: string
  population: number | null
  religion: ReligionData
  democracy: DemocracyData
  crime: CrimeData
  poverty: PovertyData
  gender: GenderData
  conflict: ConflictData
  sources: {
    religion?: DataSource
    democracy?: DataSource
    crime?: DataSource
    poverty?: DataSource
    gender?: DataSource
    conflict?: DataSource
  }
}

export interface CountryFilters {
  majorReligion?: string[]
  democracyMin?: number
  democracyMax?: number
  povertyMin?: number
  povertyMax?: number
  gdpMin?: number
  gdpMax?: number
  hasConflict?: boolean
  genderMin?: number
  genderMax?: number
  regions?: string[]
}

export type ColorVariable =
  | 'democracy.score'
  | 'poverty.gdpPerCapita'
  | 'poverty.hdi'
  | 'gender.wblIndex'
  | 'conflict.peaceIndex'
  | 'crime.safetyIndex'
  | 'religion.major'

export interface VariableConfig {
  id: ColorVariable
  name: string
  description: string
  type: 'numeric' | 'categorical'
  domain?: [number, number]
  categories?: string[]
  colorScheme: string
  format: (value: number | string | null) => string
  higherIsBetter: boolean
}

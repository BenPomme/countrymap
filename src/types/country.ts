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
  incarcerationRate: number | null // per 100,000
  policePerCapita: number | null // per 100,000
  gunOwnership: number | null // guns per 100 people
  roadDeaths: number | null // per 100,000
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

// NEW: Health & Body
export interface HealthData {
  lifeExpectancy: number | null // years
  maleHeight: number | null // cm
  femaleHeight: number | null // cm
  obesityRate: number | null // % of adults
  penisSize: number | null // cm (erect average)
  breastSize: string | null // cup size letter
  fertilityRate: number | null // children per woman
  infantMortality: number | null // per 1,000 live births
  cancerRate: number | null // per 100,000
  hivPrevalence: number | null // % of adults 15-49
  suicideRate: number | null // per 100,000
  alcoholConsumption: number | null // liters per capita per year
  smokingRate: number | null // % of adults
  drugUseRate: number | null // % tried illicit drugs
}

// NEW: Sex & Relationships
export interface SexData {
  sexualPartners: number | null // lifetime average
  ageFirstSex: number | null // average age
  divorceRate: number | null // per 1,000 people
  marriageAge: number | null // average age at first marriage
  singleParentRate: number | null // % of households
  contraceptionUse: number | null // % of women 15-49
  teenPregnancy: number | null // births per 1,000 women 15-19
  lgbtAcceptance: number | null // 0-100 index
}

// NEW: Demographics
export interface DemographicsData {
  ethnicDiversity: number | null // 0-1 fractionalization index
  immigrationRate: number | null // % foreign born
  emigrationRate: number | null // % emigrated
  medianAge: number | null // years
  urbanPopulation: number | null // % living in cities
  populationDensity: number | null // people per km²
}

// NEW: Intelligence & Education
export interface EducationData {
  avgIQ: number | null // national average IQ
  literacyRate: number | null // % of adults
  universityEnrollment: number | null // % gross enrollment
  pisaMath: number | null // PISA score
  pisaReading: number | null // PISA score
  pisaScience: number | null // PISA score
  nobelPrizesPerCapita: number | null // per 10 million
  patentsPerCapita: number | null // per million
  rdSpending: number | null // % of GDP
}

// NEW: Lifestyle & Happiness
export interface LifestyleData {
  happinessIndex: number | null // 0-10 scale
  workHoursWeek: number | null // average hours
  vacationDays: number | null // average paid days
  internetPenetration: number | null // % of population
  socialMediaUse: number | null // % of population
  coffeeConsumption: number | null // kg per capita per year
  meatConsumption: number | null // kg per capita per year
  vegetarianRate: number | null // % of population
}

// NEW: Freedom & Governance
export interface FreedomData {
  corruptionIndex: number | null // 0-100 (100 = least corrupt)
  pressFreedom: number | null // 0-100 (100 = most free)
  drugPolicyScore: number | null // 0-100 (100 = most liberal)
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
  // NEW categories
  health: HealthData
  sex: SexData
  demographics: DemographicsData
  education: EducationData
  lifestyle: LifestyleData
  freedom: FreedomData
  sources: {
    religion?: DataSource
    democracy?: DataSource
    crime?: DataSource
    poverty?: DataSource
    gender?: DataSource
    conflict?: DataSource
    health?: DataSource
    sex?: DataSource
    demographics?: DataSource
    education?: DataSource
    lifestyle?: DataSource
    freedom?: DataSource
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
  // NEW filters
  happinessMin?: number
  happinessMax?: number
  iqMin?: number
  iqMax?: number
}

export type ColorVariable =
  | 'democracy.score'
  | 'poverty.gdpPerCapita'
  | 'poverty.hdi'
  | 'gender.wblIndex'
  | 'conflict.peaceIndex'
  | 'crime.safetyIndex'
  | 'crime.homicideRate'
  | 'crime.gunOwnership'
  | 'religion.major'
  // Health
  | 'health.lifeExpectancy'
  | 'health.maleHeight'
  | 'health.obesityRate'
  | 'health.penisSize'
  | 'health.fertilityRate'
  | 'health.alcoholConsumption'
  | 'health.suicideRate'
  // Sex
  | 'sex.sexualPartners'
  | 'sex.divorceRate'
  | 'sex.lgbtAcceptance'
  // Demographics
  | 'demographics.ethnicDiversity'
  | 'demographics.medianAge'
  | 'demographics.urbanPopulation'
  // Education
  | 'education.avgIQ'
  | 'education.literacyRate'
  | 'education.pisaMath'
  // Lifestyle
  | 'lifestyle.happinessIndex'
  | 'lifestyle.workHoursWeek'
  | 'lifestyle.internetPenetration'
  | 'lifestyle.coffeeConsumption'
  // Freedom
  | 'freedom.corruptionIndex'
  | 'freedom.pressFreedom'

export interface VariableConfig {
  id: ColorVariable
  name: string
  description: string
  category: string
  type: 'numeric' | 'categorical'
  domain?: [number, number]
  categories?: string[]
  colorScheme: string
  format: (value: number | string | null) => string
  higherIsBetter: boolean
}

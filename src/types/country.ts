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

// Health & Body
export interface HealthData {
  lifeExpectancy: number | null // years
  maleHeight: number | null // cm
  femaleHeight: number | null // cm
  obesityRate: number | null // % of adults
  penisSize: number | null // cm (erect average)
  breastSize: number | null // cup size numeric (1=AA, 2=A, 3=B, 4=C, 5=D)
  fertilityRate: number | null // children per woman
  infantMortality: number | null // per 1,000 live births
  cancerRate: number | null // per 100,000
  hivPrevalence: number | null // % of adults 15-49
  suicideRate: number | null // per 100,000
  alcoholConsumption: number | null // liters per capita per year
  smokingRate: number | null // % of adults
  drugUseRate: number | null // % tried illicit drugs
  // NEW unusual metrics
  plasticSurgeryRate: number | null // procedures per 1,000 people
  sleepDuration: number | null // average hours per night
  mentalHealthRate: number | null // % with mental health conditions
  antidepressantUse: number | null // daily doses per 1,000 people
  diabetesRate: number | null // % of adults
  airPollution: number | null // PM2.5 μg/m³
}

// Sex & Relationships
export interface SexData {
  sexualPartners: number | null // lifetime average
  ageFirstSex: number | null // average age
  divorceRate: number | null // per 1,000 people
  marriageAge: number | null // average age at first marriage
  singleParentRate: number | null // % of households
  contraceptionUse: number | null // % of women 15-49
  teenPregnancy: number | null // births per 1,000 women 15-19
  lgbtAcceptance: number | null // 0-100 index
  // NEW unusual metrics
  datingAppUsage: number | null // % of adults using dating apps
  onlyfansCreators: number | null // creators per 100,000 people
  pornConsumption: number | null // average minutes per week
  prostitutionLegal: boolean | null // is prostitution legal
  polyamoryRate: number | null // % in open relationships
  topPornCategory: string | null // most popular porn category
  consanguinityRate: number | null // % of marriages between relatives (cousin marriage)
}

// Demographics
export interface DemographicsData {
  ethnicDiversity: number | null // 0-1 fractionalization index
  immigrationRate: number | null // % foreign born (legal immigrants)
  emigrationRate: number | null // % emigrated
  medianAge: number | null // years
  urbanPopulation: number | null // % living in cities
  populationDensity: number | null // people per km²
  // NEW unusual metrics
  twinBirthRate: number | null // per 1,000 births
  leftHandedRate: number | null // % of population
  redHairRate: number | null // % of population
  averageShoeSize: number | null // EU size
  illegalImmigrationRate: number | null // estimated % of population
  netMigrationRate: number | null // per 1,000 population per year
  refugeesHosted: number | null // per 1,000 population
}

// Intelligence & Education
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
  // NEW unusual metrics
  mathOlympiadMedals: number | null // total medals won
  chessGrandmasters: number | null // per 10 million people
  scientistsPerCapita: number | null // researchers per million
  englishProficiency: number | null // EF EPI score 0-100
}

// Lifestyle & Happiness
export interface LifestyleData {
  happinessIndex: number | null // 0-10 scale
  workHoursWeek: number | null // average hours
  vacationDays: number | null // average paid days
  internetPenetration: number | null // % of population
  socialMediaUse: number | null // % of population
  coffeeConsumption: number | null // kg per capita per year
  meatConsumption: number | null // kg per capita per year
  vegetarianRate: number | null // % of population
  // NEW unusual metrics
  screenTime: number | null // hours per day
  videoGamePlayers: number | null // % of population
  netflixSubscribers: number | null // per 1,000 people
  spotifyUsers: number | null // per 1,000 people
  fastFoodSpending: number | null // USD per capita per year
  tattooRate: number | null // % with at least one tattoo
  gymMembership: number | null // % of population
  yogaPractitioners: number | null // % of population
  pizzaConsumption: number | null // kg per capita per year
  chocolateConsumption: number | null // kg per capita per year
  teaConsumption: number | null // kg per capita per year
  beerConsumption: number | null // liters per capita per year
  wineConsumption: number | null // liters per capita per year
  metalBandsPerCapita: number | null // heavy metal bands per 100,000 people
}

// Freedom & Governance
export interface FreedomData {
  corruptionIndex: number | null // 0-100 (100 = least corrupt)
  pressFreedom: number | null // 0-100 (100 = most free)
  drugPolicyScore: number | null // 0-100 (100 = most liberal)
  // NEW unusual metrics
  cannabisLegal: boolean | null // is cannabis legal recreationally
  gamblingLegal: boolean | null // is gambling legal
  cryptoAdoption: number | null // % using cryptocurrency
}

// Economy & Wealth
export interface EconomyData {
  billionairesPerCapita: number | null // per 10 million people
  millionairesPerCapita: number | null // per 1,000 people
  bitcoinATMs: number | null // per million people
  startupUnicorns: number | null // total unicorn companies
  luxuryGoodsSpending: number | null // USD per capita
  gamblingSpending: number | null // USD per capita per year
  lotterySpending: number | null // USD per capita per year
  touristArrivals: number | null // per 1,000 residents
  mcdonaldsPerCapita: number | null // restaurants per million
  starbucksPerCapita: number | null // stores per million
  evAdoption: number | null // % of new car sales
  renewableEnergy: number | null // % of electricity from renewables
  // Government & Fiscal
  debtToGdp: number | null // government debt as % of GDP
  gdpGrowth: number | null // annual GDP growth rate %
  inflation: number | null // annual inflation rate %
  corporateTax: number | null // top corporate tax rate %
  incomeTax: number | null // top personal income tax rate %
  vatRate: number | null // VAT/sales tax rate %
  unemploymentRate: number | null // % of labor force
  youthUnemployment: number | null // % of youth labor force (15-24)
  // Trade & Investment
  fdiInflows: number | null // FDI as % of GDP
  tradeBalance: number | null // trade balance as % of GDP
  exportsGdp: number | null // exports as % of GDP
  importsGdp: number | null // imports as % of GDP
  currentAccount: number | null // current account balance as % of GDP
  // Monetary & Financial
  interestRate: number | null // central bank policy rate %
  forexReserves: number | null // foreign exchange reserves in billions USD
  stockMarketCap: number | null // stock market cap as % of GDP
  // Inequality & Welfare
  giniIndex: number | null // Gini coefficient 0-100
  povertyHeadcount: number | null // % below $2.15/day
  // Other
  economicFreedom: number | null // Heritage Foundation index 0-100
  bigMacIndex: number | null // Big Mac price in USD (for PPP comparison)
}

// Transport & Infrastructure
export interface TransportData {
  carOwnership: number | null // vehicles per 1,000 people
  bicycleUsage: number | null // % commuting by bike
  publicTransitUsage: number | null // % using public transit
  averageCommute: number | null // minutes one-way
  trafficIndex: number | null // congestion index 0-100
  flightsPerCapita: number | null // domestic + international per year
}

// Environment
export interface EnvironmentData {
  co2PerCapita: number | null // tonnes per year
  plasticWaste: number | null // kg per capita per year
  recyclingRate: number | null // % of waste recycled
  forestCoverage: number | null // % of land area
  waterStress: number | null // 0-5 scale
  ecoFootprint: number | null // global hectares per capita
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
  health: HealthData
  sex: SexData
  demographics: DemographicsData
  education: EducationData
  lifestyle: LifestyleData
  freedom: FreedomData
  economy: EconomyData
  transport: TransportData
  environment: EnvironmentData
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
    economy?: DataSource
    transport?: DataSource
    environment?: DataSource
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
  | 'health.breastSize'
  | 'health.fertilityRate'
  | 'health.alcoholConsumption'
  | 'health.suicideRate'
  | 'health.hivPrevalence'
  | 'health.plasticSurgeryRate'
  | 'health.sleepDuration'
  | 'health.diabetesRate'
  | 'health.airPollution'
  // Sex
  | 'sex.sexualPartners'
  | 'sex.ageFirstSex'
  | 'sex.divorceRate'
  | 'sex.lgbtAcceptance'
  | 'sex.datingAppUsage'
  | 'sex.onlyfansCreators'
  | 'sex.pornConsumption'
  | 'sex.consanguinityRate'
  // Demographics
  | 'demographics.ethnicDiversity'
  | 'demographics.medianAge'
  | 'demographics.urbanPopulation'
  | 'demographics.twinBirthRate'
  | 'demographics.immigrationRate'
  | 'demographics.illegalImmigrationRate'
  | 'demographics.netMigrationRate'
  | 'demographics.refugeesHosted'
  // Education
  | 'education.avgIQ'
  | 'education.literacyRate'
  | 'education.pisaMath'
  | 'education.nobelPrizesPerCapita'
  | 'education.chessGrandmasters'
  | 'education.englishProficiency'
  // Lifestyle
  | 'lifestyle.happinessIndex'
  | 'lifestyle.workHoursWeek'
  | 'lifestyle.internetPenetration'
  | 'lifestyle.coffeeConsumption'
  | 'lifestyle.screenTime'
  | 'lifestyle.videoGamePlayers'
  | 'lifestyle.tattooRate'
  | 'lifestyle.pizzaConsumption'
  | 'lifestyle.chocolateConsumption'
  | 'lifestyle.teaConsumption'
  | 'lifestyle.beerConsumption'
  | 'lifestyle.wineConsumption'
  | 'lifestyle.metalBandsPerCapita'
  // Freedom
  | 'freedom.corruptionIndex'
  | 'freedom.pressFreedom'
  | 'freedom.cryptoAdoption'
  // Economy
  | 'economy.billionairesPerCapita'
  | 'economy.millionairesPerCapita'
  | 'economy.startupUnicorns'
  | 'economy.touristArrivals'
  | 'economy.mcdonaldsPerCapita'
  | 'economy.starbucksPerCapita'
  | 'economy.evAdoption'
  | 'economy.renewableEnergy'
  | 'economy.debtToGdp'
  | 'economy.gdpGrowth'
  | 'economy.inflation'
  | 'economy.corporateTax'
  | 'economy.incomeTax'
  | 'economy.vatRate'
  | 'economy.unemploymentRate'
  | 'economy.youthUnemployment'
  | 'economy.fdiInflows'
  | 'economy.tradeBalance'
  | 'economy.exportsGdp'
  | 'economy.currentAccount'
  | 'economy.interestRate'
  | 'economy.giniIndex'
  | 'economy.economicFreedom'
  | 'economy.bigMacIndex'
  // Transport
  | 'transport.carOwnership'
  | 'transport.bicycleUsage'
  | 'transport.averageCommute'
  | 'transport.trafficIndex'
  // Environment
  | 'environment.co2PerCapita'
  | 'environment.recyclingRate'
  | 'environment.forestCoverage'

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

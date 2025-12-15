/**
 * Script to merge new data categories into countries.json
 * Run with: npx ts-node scripts/merge-new-data.ts
 */

import * as fs from 'fs'
import * as path from 'path'
import {
  HEALTH_DATA,
  SEX_DATA,
  DEMOGRAPHICS_DATA,
  EDUCATION_DATA,
  LIFESTYLE_DATA,
  FREEDOM_DATA,
  CRIME_EXTENDED,
} from './new-data'

const COUNTRIES_PATH = path.join(__dirname, '../data/countries.json')

interface OldCountry {
  iso3: string
  iso2: string
  name: string
  region: string
  subregion: string
  population: number | null
  religion: {
    major: string
    breakdown: Record<string, number>
  }
  democracy: {
    score: number
    freedomScore: number | null
    vdemScore: number | null
  }
  crime: {
    homicideRate: number | null
    safetyIndex: number | null
  }
  poverty: {
    povertyRate: number | null
    gdpPerCapita: number | null
    hdi: number | null
  }
  gender: {
    wblIndex: number | null
    giiScore: number | null
  }
  conflict: {
    hasActiveConflict: boolean
    peaceIndex: number | null
    conflictDeaths: number | null
  }
  sources: Record<string, { source: string; year: number }>
}

function mergeData() {
  // Read existing countries data
  const rawData = fs.readFileSync(COUNTRIES_PATH, 'utf-8')
  const countries: OldCountry[] = JSON.parse(rawData)

  console.log(`Processing ${countries.length} countries...`)

  // Merge new data into each country
  const updatedCountries = countries.map((country) => {
    const iso3 = country.iso3
    const healthData = HEALTH_DATA[iso3]
    const sexData = SEX_DATA[iso3]
    const demographicsData = DEMOGRAPHICS_DATA[iso3]
    const educationData = EDUCATION_DATA[iso3]
    const lifestyleData = LIFESTYLE_DATA[iso3]
    const freedomData = FREEDOM_DATA[iso3]
    const crimeExtended = CRIME_EXTENDED[iso3]

    // Build the new country object with all categories
    return {
      ...country,
      // Extend crime data with new fields
      crime: {
        ...country.crime,
        incarcerationRate: crimeExtended?.incarcerationRate ?? null,
        policePerCapita: null,
        gunOwnership: crimeExtended?.gunOwnership ?? null,
        roadDeaths: null,
      },
      // Add new categories with defaults
      health: {
        lifeExpectancy: healthData?.lifeExpectancy ?? null,
        maleHeight: healthData?.maleHeight ?? null,
        femaleHeight: healthData?.femaleHeight ?? null,
        obesityRate: healthData?.obesityRate ?? null,
        penisSize: healthData?.penisSize ?? null,
        breastSize: null,
        fertilityRate: healthData?.fertilityRate ?? null,
        infantMortality: null,
        cancerRate: null,
        hivPrevalence: null,
        suicideRate: healthData?.suicideRate ?? null,
        alcoholConsumption: healthData?.alcoholConsumption ?? null,
        smokingRate: null,
        drugUseRate: null,
      },
      sex: {
        sexualPartners: sexData?.sexualPartners ?? null,
        ageFirstSex: null,
        divorceRate: sexData?.divorceRate ?? null,
        marriageAge: null,
        singleParentRate: null,
        contraceptionUse: null,
        teenPregnancy: null,
        lgbtAcceptance: sexData?.lgbtAcceptance ?? null,
      },
      demographics: {
        ethnicDiversity: demographicsData?.ethnicDiversity ?? null,
        immigrationRate: null,
        emigrationRate: null,
        medianAge: demographicsData?.medianAge ?? null,
        urbanPopulation: demographicsData?.urbanPopulation ?? null,
        populationDensity: null,
      },
      education: {
        avgIQ: educationData?.avgIQ ?? null,
        literacyRate: educationData?.literacyRate ?? null,
        universityEnrollment: null,
        pisaMath: educationData?.pisaMath ?? null,
        pisaReading: null,
        pisaScience: null,
        nobelPrizesPerCapita: null,
        patentsPerCapita: null,
        rdSpending: null,
      },
      lifestyle: {
        happinessIndex: lifestyleData?.happinessIndex ?? null,
        workHoursWeek: lifestyleData?.workHoursWeek ?? null,
        vacationDays: null,
        internetPenetration: lifestyleData?.internetPenetration ?? null,
        socialMediaUse: null,
        coffeeConsumption: lifestyleData?.coffeeConsumption ?? null,
        meatConsumption: null,
        vegetarianRate: null,
      },
      freedom: {
        corruptionIndex: freedomData?.corruptionIndex ?? null,
        pressFreedom: freedomData?.pressFreedom ?? null,
        drugPolicyScore: null,
      },
      // Update sources
      sources: {
        ...country.sources,
        health: healthData
          ? { source: 'WHO / NCD-RisC / Various Studies', year: 2023 }
          : undefined,
        sex: sexData
          ? { source: 'Durex Survey / World Population Review', year: 2023 }
          : undefined,
        demographics: demographicsData
          ? { source: 'World Bank / UN', year: 2023 }
          : undefined,
        education: educationData
          ? { source: 'OECD PISA / World Population Review', year: 2023 }
          : undefined,
        lifestyle: lifestyleData
          ? { source: 'World Happiness Report / OECD / ICO', year: 2024 }
          : undefined,
        freedom: freedomData
          ? { source: 'Transparency International / RSF', year: 2024 }
          : undefined,
      },
    }
  })

  // Write updated data
  fs.writeFileSync(
    COUNTRIES_PATH,
    JSON.stringify(updatedCountries, null, 2),
    'utf-8'
  )

  // Count how many countries have new data
  let healthCount = 0
  let sexCount = 0
  let demoCount = 0
  let eduCount = 0
  let lifeCount = 0
  let freedomCount = 0

  updatedCountries.forEach((c) => {
    if (c.health?.lifeExpectancy !== null) healthCount++
    if (c.sex?.sexualPartners !== null) sexCount++
    if (c.demographics?.ethnicDiversity !== null) demoCount++
    if (c.education?.avgIQ !== null) eduCount++
    if (c.lifestyle?.happinessIndex !== null) lifeCount++
    if (c.freedom?.corruptionIndex !== null) freedomCount++
  })

  console.log('\nData merge complete!')
  console.log(`Countries with Health data: ${healthCount}`)
  console.log(`Countries with Sex/Relationships data: ${sexCount}`)
  console.log(`Countries with Demographics data: ${demoCount}`)
  console.log(`Countries with Education/IQ data: ${eduCount}`)
  console.log(`Countries with Lifestyle data: ${lifeCount}`)
  console.log(`Countries with Freedom/Governance data: ${freedomCount}`)
}

mergeData()

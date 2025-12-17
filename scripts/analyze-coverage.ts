import fs from 'fs'

// Read countries data
const countriesData = JSON.parse(fs.readFileSync('data/countries.json', 'utf8'))

// Define all variable paths to check
const variablePaths = [
  'democracy.score',
  'freedom.corruptionIndex',
  'freedom.pressFreedom',
  'freedom.cryptoAdoption',
  'poverty.gdpPerCapita',
  'poverty.hdi',
  'gender.wblIndex',
  'economy.billionairesPerCapita',
  'economy.millionairesPerCapita',
  'economy.startupUnicorns',
  'economy.touristArrivals',
  'economy.mcdonaldsPerCapita',
  'economy.starbucksPerCapita',
  'economy.evAdoption',
  'economy.renewableEnergy',
  'economy.debtToGdp',
  'economy.gdpGrowth',
  'economy.inflation',
  'economy.corporateTax',
  'economy.incomeTax',
  'economy.vatRate',
  'economy.unemploymentRate',
  'economy.youthUnemployment',
  'economy.fdiInflows',
  'economy.tradeBalance',
  'economy.exportsGdp',
  'economy.currentAccount',
  'economy.interestRate',
  'economy.giniIndex',
  'economy.economicFreedom',
  'economy.bigMacIndex',
  'health.lifeExpectancy',
  'health.maleHeight',
  'health.obesityRate',
  'health.penisSize',
  'health.breastSize',
  'health.fertilityRate',
  'health.alcoholConsumption',
  'health.suicideRate',
  'health.hivPrevalence',
  'health.plasticSurgeryRate',
  'health.sleepDuration',
  'health.diabetesRate',
  'health.airPollution',
  'sex.sexualPartners',
  'sex.ageFirstSex',
  'sex.divorceRate',
  'sex.lgbtAcceptance',
  'sex.datingAppUsage',
  'sex.onlyfansCreators',
  'sex.pornConsumption',
  'sex.consanguinityRate',
  'demographics.ethnicDiversity',
  'demographics.medianAge',
  'demographics.urbanPopulation',
  'demographics.twinBirthRate',
  'demographics.immigrationRate',
  'demographics.illegalImmigrationRate',
  'demographics.netMigrationRate',
  'demographics.refugeesHosted',
  'education.avgIQ',
  'education.literacyRate',
  'education.pisaMath',
  'education.nobelPrizesPerCapita',
  'education.chessGrandmasters',
  'education.englishProficiency',
  'lifestyle.happinessIndex',
  'lifestyle.workHoursWeek',
  'lifestyle.internetPenetration',
  'lifestyle.coffeeConsumption',
  'lifestyle.screenTime',
  'lifestyle.videoGamePlayers',
  'lifestyle.tattooRate',
  'lifestyle.pizzaConsumption',
  'lifestyle.chocolateConsumption',
  'lifestyle.teaConsumption',
  'lifestyle.beerConsumption',
  'lifestyle.wineConsumption',
  'lifestyle.metalBandsPerCapita',
  'crime.homicideRate',
  'crime.safetyIndex',
  'crime.gunOwnership',
  'conflict.peaceIndex',
  'transport.carOwnership',
  'transport.bicycleUsage',
  'transport.averageCommute',
  'transport.trafficIndex',
  'environment.co2PerCapita',
  'environment.recyclingRate',
  'environment.forestCoverage',
  'religion.major',
]

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}

const totalCountries = countriesData.length
console.log(`\nDATASET COVERAGE ANALYSIS`)
console.log(`Total countries: ${totalCountries}`)
console.log(`\nVariable                                      | Count | Coverage`)
console.log('-'.repeat(70))

interface Result {
  variable: string
  count: number
  coverage: number
  missing: string[]
}

const results: Result[] = []

variablePaths.forEach((path) => {
  let count = 0
  const missing: string[] = []

  countriesData.forEach((country: any) => {
    const value = getNestedValue(country, path)
    if (value !== null && value !== undefined) {
      count++
    } else {
      missing.push(country.name)
    }
  })

  const coverage = (count / totalCountries) * 100
  results.push({ variable: path, count, coverage, missing })
})

// Sort by coverage (lowest first)
results.sort((a, b) => a.coverage - b.coverage)

results.forEach(({ variable, count, coverage }) => {
  const bar = coverage >= 50 ? '[OK]' : coverage >= 25 ? '[--]' : '[!!]'
  console.log(`${bar} ${variable.padEnd(40)} | ${String(count).padStart(3)}  | ${coverage.toFixed(1).padStart(5)}%`)
})

// Print detailed summary
console.log('\n\nPRIORITY LIST (Variables with <50% coverage):')
console.log('='.repeat(80))

const lowCoverage = results.filter(r => r.coverage < 50)
lowCoverage.forEach((r, i) => {
  console.log(`\n${i + 1}. ${r.variable} (${r.coverage.toFixed(1)}% - ${r.count}/${totalCountries} countries)`)
  console.log(`   Missing (${r.missing.length}): ${r.missing.slice(0, 15).join(', ')}${r.missing.length > 15 ? '...' : ''}`)
})

// Summary stats
console.log('\n\nSUMMARY STATISTICS:')
console.log('-'.repeat(50))
const avgCoverage = results.reduce((sum, r) => sum + r.coverage, 0) / results.length
const fullyPopulated = results.filter(r => r.coverage >= 90).length
const wellPopulated = results.filter(r => r.coverage >= 50 && r.coverage < 90).length
const poorlyPopulated = results.filter(r => r.coverage >= 25 && r.coverage < 50).length
const barelyPopulated = results.filter(r => r.coverage < 25).length

console.log(`Average coverage: ${avgCoverage.toFixed(1)}%`)
console.log(`Fully populated (>=90%): ${fullyPopulated} variables`)
console.log(`Well populated (50-89%): ${wellPopulated} variables`)
console.log(`Poorly populated (25-49%): ${poorlyPopulated} variables`)
console.log(`Barely populated (<25%): ${barelyPopulated} variables`)

/**
 * Compute all pairwise correlations between numeric variables
 *
 * This script:
 * 1. Loads countries.json and all variable configurations
 * 2. Computes Pearson correlation for all variable pairs
 * 3. Filters to correlations with |r| >= 0.4 (moderate or stronger)
 * 4. Scores "interestingness" (cross-category pairs get bonus)
 * 5. Outputs to data/correlations.json
 *
 * Run with: npx tsx scripts/compute-correlations.ts
 */

import * as fs from 'fs'
import * as path from 'path'

// Load countries data
const countriesPath = path.join(__dirname, '../data/countries.json')
const countries: Record<string, unknown>[] = JSON.parse(fs.readFileSync(countriesPath, 'utf8'))

// Variable configurations (copied from constants to avoid import issues in script)
const NUMERIC_VARIABLES: { id: string; name: string; category: string; higherIsBetter: boolean }[] = [
  // Governance & Freedom
  { id: 'democracy.score', name: 'Democracy Score', category: 'governance', higherIsBetter: true },
  { id: 'freedom.corruptionIndex', name: 'Corruption Index', category: 'governance', higherIsBetter: true },
  { id: 'freedom.pressFreedom', name: 'Press Freedom', category: 'governance', higherIsBetter: true },
  { id: 'freedom.cryptoAdoption', name: 'Crypto Adoption', category: 'governance', higherIsBetter: true },

  // Economy & Wealth
  { id: 'poverty.gdpPerCapita', name: 'GDP per Capita', category: 'economy', higherIsBetter: true },
  { id: 'poverty.hdi', name: 'Human Development Index', category: 'economy', higherIsBetter: true },
  { id: 'gender.wblIndex', name: "Women's Legal Rights", category: 'economy', higherIsBetter: true },
  { id: 'economy.billionairesPerCapita', name: 'Billionaires per Capita', category: 'economy', higherIsBetter: true },
  { id: 'economy.millionairesPerCapita', name: 'Millionaires per Capita', category: 'economy', higherIsBetter: true },
  { id: 'economy.startupUnicorns', name: 'Startup Unicorns', category: 'economy', higherIsBetter: true },
  { id: 'economy.touristArrivals', name: 'Tourist Arrivals', category: 'economy', higherIsBetter: true },
  { id: 'economy.mcdonaldsPerCapita', name: "McDonald's per Capita", category: 'economy', higherIsBetter: true },
  { id: 'economy.starbucksPerCapita', name: 'Starbucks per Capita', category: 'economy', higherIsBetter: true },
  { id: 'economy.evAdoption', name: 'EV Adoption', category: 'economy', higherIsBetter: true },
  { id: 'economy.renewableEnergy', name: 'Renewable Energy', category: 'economy', higherIsBetter: true },
  { id: 'economy.debtToGdp', name: 'Government Debt to GDP', category: 'economy', higherIsBetter: false },
  { id: 'economy.gdpGrowth', name: 'GDP Growth Rate', category: 'economy', higherIsBetter: true },
  { id: 'economy.inflation', name: 'Inflation Rate', category: 'economy', higherIsBetter: false },
  { id: 'economy.corporateTax', name: 'Corporate Tax Rate', category: 'economy', higherIsBetter: false },
  { id: 'economy.incomeTax', name: 'Top Income Tax Rate', category: 'economy', higherIsBetter: false },
  { id: 'economy.vatRate', name: 'VAT/Sales Tax Rate', category: 'economy', higherIsBetter: false },
  { id: 'economy.unemploymentRate', name: 'Unemployment Rate', category: 'economy', higherIsBetter: false },
  { id: 'economy.youthUnemployment', name: 'Youth Unemployment', category: 'economy', higherIsBetter: false },
  { id: 'economy.fdiInflows', name: 'FDI Inflows (% GDP)', category: 'economy', higherIsBetter: true },
  { id: 'economy.tradeBalance', name: 'Trade Balance', category: 'economy', higherIsBetter: true },
  { id: 'economy.exportsGdp', name: 'Exports (% GDP)', category: 'economy', higherIsBetter: true },
  { id: 'economy.currentAccount', name: 'Current Account Balance', category: 'economy', higherIsBetter: true },
  { id: 'economy.interestRate', name: 'Central Bank Interest Rate', category: 'economy', higherIsBetter: false },
  { id: 'economy.giniIndex', name: 'Gini Index (Inequality)', category: 'economy', higherIsBetter: false },
  { id: 'economy.economicFreedom', name: 'Economic Freedom Index', category: 'economy', higherIsBetter: true },
  { id: 'economy.bigMacIndex', name: 'Big Mac Price (USD)', category: 'economy', higherIsBetter: false },

  // Health & Body
  { id: 'health.lifeExpectancy', name: 'Life Expectancy', category: 'health', higherIsBetter: true },
  { id: 'health.maleHeight', name: 'Average Male Height', category: 'health', higherIsBetter: true },
  { id: 'health.obesityRate', name: 'Obesity Rate', category: 'health', higherIsBetter: false },
  { id: 'health.penisSize', name: 'Average Penis Size', category: 'health', higherIsBetter: true },
  { id: 'health.breastSize', name: 'Average Breast Size', category: 'health', higherIsBetter: true },
  { id: 'health.fertilityRate', name: 'Fertility Rate', category: 'health', higherIsBetter: true },
  { id: 'health.alcoholConsumption', name: 'Alcohol Consumption', category: 'health', higherIsBetter: false },
  { id: 'health.suicideRate', name: 'Suicide Rate', category: 'health', higherIsBetter: false },
  { id: 'health.hivPrevalence', name: 'HIV Prevalence', category: 'health', higherIsBetter: false },
  { id: 'health.plasticSurgeryRate', name: 'Plastic Surgery Rate', category: 'health', higherIsBetter: true },
  { id: 'health.sleepDuration', name: 'Sleep Duration', category: 'health', higherIsBetter: true },
  { id: 'health.diabetesRate', name: 'Diabetes Rate', category: 'health', higherIsBetter: false },
  { id: 'health.airPollution', name: 'Air Pollution', category: 'health', higherIsBetter: false },

  // Sex & Relationships
  { id: 'sex.sexualPartners', name: 'Avg Sexual Partners', category: 'sex', higherIsBetter: true },
  { id: 'sex.ageFirstSex', name: 'Age of First Sex', category: 'sex', higherIsBetter: true },
  { id: 'sex.divorceRate', name: 'Divorce Rate', category: 'sex', higherIsBetter: false },
  { id: 'sex.lgbtAcceptance', name: 'LGBT+ Acceptance', category: 'sex', higherIsBetter: true },
  { id: 'sex.datingAppUsage', name: 'Dating App Usage', category: 'sex', higherIsBetter: true },
  { id: 'sex.onlyfansCreators', name: 'OnlyFans Creators', category: 'sex', higherIsBetter: true },
  { id: 'sex.pornConsumption', name: 'Porn Consumption', category: 'sex', higherIsBetter: true },
  { id: 'sex.consanguinityRate', name: 'Consanguinity Rate', category: 'sex', higherIsBetter: false },

  // Demographics
  { id: 'demographics.ethnicDiversity', name: 'Ethnic Diversity', category: 'demographics', higherIsBetter: true },
  { id: 'demographics.medianAge', name: 'Median Age', category: 'demographics', higherIsBetter: true },
  { id: 'demographics.urbanPopulation', name: 'Urban Population', category: 'demographics', higherIsBetter: true },
  { id: 'demographics.twinBirthRate', name: 'Twin Birth Rate', category: 'demographics', higherIsBetter: true },
  { id: 'demographics.immigrationRate', name: 'Immigration Rate', category: 'demographics', higherIsBetter: true },
  { id: 'demographics.illegalImmigrationRate', name: 'Illegal Immigration Rate', category: 'demographics', higherIsBetter: false },
  { id: 'demographics.netMigrationRate', name: 'Net Migration Rate', category: 'demographics', higherIsBetter: true },
  { id: 'demographics.refugeesHosted', name: 'Refugees Hosted', category: 'demographics', higherIsBetter: true },

  // Intelligence & Education
  { id: 'education.avgIQ', name: 'Average IQ', category: 'education', higherIsBetter: true },
  { id: 'education.literacyRate', name: 'Literacy Rate', category: 'education', higherIsBetter: true },
  { id: 'education.pisaMath', name: 'PISA Math Score', category: 'education', higherIsBetter: true },
  { id: 'education.nobelPrizesPerCapita', name: 'Nobel Prizes per Capita', category: 'education', higherIsBetter: true },
  { id: 'education.chessGrandmasters', name: 'Chess Grandmasters', category: 'education', higherIsBetter: true },
  { id: 'education.englishProficiency', name: 'English Proficiency', category: 'education', higherIsBetter: true },

  // Lifestyle & Consumption
  { id: 'lifestyle.happinessIndex', name: 'Happiness Index', category: 'lifestyle', higherIsBetter: true },
  { id: 'lifestyle.workHoursWeek', name: 'Work Hours/Week', category: 'lifestyle', higherIsBetter: false },
  { id: 'lifestyle.internetPenetration', name: 'Internet Users', category: 'lifestyle', higherIsBetter: true },
  { id: 'lifestyle.coffeeConsumption', name: 'Coffee Consumption', category: 'lifestyle', higherIsBetter: true },
  { id: 'lifestyle.screenTime', name: 'Screen Time', category: 'lifestyle', higherIsBetter: false },
  { id: 'lifestyle.videoGamePlayers', name: 'Video Game Players', category: 'lifestyle', higherIsBetter: true },
  { id: 'lifestyle.tattooRate', name: 'Tattoo Rate', category: 'lifestyle', higherIsBetter: true },
  { id: 'lifestyle.pizzaConsumption', name: 'Pizza Consumption', category: 'lifestyle', higherIsBetter: true },
  { id: 'lifestyle.chocolateConsumption', name: 'Chocolate Consumption', category: 'lifestyle', higherIsBetter: true },
  { id: 'lifestyle.teaConsumption', name: 'Tea Consumption', category: 'lifestyle', higherIsBetter: true },
  { id: 'lifestyle.beerConsumption', name: 'Beer Consumption', category: 'lifestyle', higherIsBetter: true },
  { id: 'lifestyle.wineConsumption', name: 'Wine Consumption', category: 'lifestyle', higherIsBetter: true },
  { id: 'lifestyle.metalBandsPerCapita', name: 'Metal Bands per Capita', category: 'lifestyle', higherIsBetter: true },
  { id: 'lifestyle.vegetarianRate', name: 'Vegetarian Rate', category: 'lifestyle', higherIsBetter: true },
  { id: 'lifestyle.leftHandedRate', name: 'Left-Handed Rate', category: 'lifestyle', higherIsBetter: true },

  // Safety & Crime
  { id: 'crime.homicideRate', name: 'Homicide Rate', category: 'safety', higherIsBetter: false },
  { id: 'crime.safetyIndex', name: 'Safety Index', category: 'safety', higherIsBetter: true },
  { id: 'crime.gunOwnership', name: 'Gun Ownership', category: 'safety', higherIsBetter: false },
  { id: 'conflict.peaceIndex', name: 'Peace Index', category: 'safety', higherIsBetter: false },

  // Transport & Mobility
  { id: 'transport.carOwnership', name: 'Car Ownership', category: 'transport', higherIsBetter: true },
  { id: 'transport.bicycleUsage', name: 'Bicycle Usage', category: 'transport', higherIsBetter: true },
  { id: 'transport.averageCommute', name: 'Average Commute', category: 'transport', higherIsBetter: false },
  { id: 'transport.trafficIndex', name: 'Traffic Index', category: 'transport', higherIsBetter: false },

  // Environment
  { id: 'environment.co2PerCapita', name: 'CO2 per Capita', category: 'environment', higherIsBetter: false },
  { id: 'environment.recyclingRate', name: 'Recycling Rate', category: 'environment', higherIsBetter: true },
  { id: 'environment.forestCoverage', name: 'Forest Coverage', category: 'environment', higherIsBetter: true },
]

// Helper to get nested value from object
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((current, key) => {
    return current && typeof current === 'object' ? (current as Record<string, unknown>)[key] : undefined
  }, obj as unknown)
}

// Calculate Pearson correlation coefficient
function calculateCorrelation(xValues: number[], yValues: number[]): number | null {
  const n = xValues.length
  if (n < 10) return null // Require minimum 10 data points

  const sumX = xValues.reduce((a, b) => a + b, 0)
  const sumY = yValues.reduce((a, b) => a + b, 0)
  const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0)
  const sumX2 = xValues.reduce((sum, x) => sum + x * x, 0)
  const sumY2 = yValues.reduce((sum, y) => sum + y * y, 0)

  const numerator = n * sumXY - sumX * sumY
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))

  if (denominator === 0) return null
  return numerator / denominator
}

// Get correlation strength category
function getStrength(r: number): 'weak' | 'moderate' | 'strong' | 'very_strong' {
  const absR = Math.abs(r)
  if (absR >= 0.8) return 'very_strong'
  if (absR >= 0.6) return 'strong'
  if (absR >= 0.4) return 'moderate'
  return 'weak'
}

// Category display names
const CATEGORY_NAMES: Record<string, string> = {
  governance: 'Governance',
  economy: 'Economy',
  health: 'Health',
  sex: 'Sex & Relationships',
  demographics: 'Demographics',
  education: 'Education',
  lifestyle: 'Lifestyle',
  safety: 'Safety',
  transport: 'Transport',
  environment: 'Environment',
}

interface CorrelationResult {
  var1: string
  var2: string
  var1Name: string
  var2Name: string
  coefficient: number
  strength: 'moderate' | 'strong' | 'very_strong'
  sampleSize: number
  categories: [string, string]
  categoryNames: [string, string]
  crossCategory: boolean
  interestingScore: number
  direction: 'positive' | 'negative'
}

// Main computation
function computeAllCorrelations(): CorrelationResult[] {
  const results: CorrelationResult[] = []
  const totalVars = NUMERIC_VARIABLES.length
  const totalPairs = (totalVars * (totalVars - 1)) / 2

  console.log(`Computing correlations for ${totalVars} variables (${totalPairs} pairs)...`)

  for (let i = 0; i < NUMERIC_VARIABLES.length; i++) {
    for (let j = i + 1; j < NUMERIC_VARIABLES.length; j++) {
      const var1 = NUMERIC_VARIABLES[i]
      const var2 = NUMERIC_VARIABLES[j]

      // Extract paired values (only where both have data)
      const pairedData: { x: number; y: number }[] = []

      for (const country of countries) {
        const val1 = getNestedValue(country, var1.id)
        const val2 = getNestedValue(country, var2.id)

        if (
          val1 !== null &&
          val1 !== undefined &&
          typeof val1 === 'number' &&
          !isNaN(val1) &&
          val2 !== null &&
          val2 !== undefined &&
          typeof val2 === 'number' &&
          !isNaN(val2)
        ) {
          pairedData.push({ x: val1, y: val2 })
        }
      }

      if (pairedData.length < 10) continue // Skip if not enough data

      const xValues = pairedData.map((d) => d.x)
      const yValues = pairedData.map((d) => d.y)

      const r = calculateCorrelation(xValues, yValues)
      if (r === null) continue

      const strength = getStrength(r)
      if (strength === 'weak') continue // Only keep moderate+

      const crossCategory = var1.category !== var2.category

      // Calculate interestingness score:
      // - Higher |r| = more interesting
      // - Cross-category = 1.5x bonus
      // - More sample size = slight bonus
      let interestingScore = Math.abs(r)
      if (crossCategory) interestingScore *= 1.5
      interestingScore += Math.min(pairedData.length / 200, 0.2) // Up to 0.2 bonus for sample size

      results.push({
        var1: var1.id,
        var2: var2.id,
        var1Name: var1.name,
        var2Name: var2.name,
        coefficient: Math.round(r * 1000) / 1000, // Round to 3 decimals
        strength: strength as 'moderate' | 'strong' | 'very_strong',
        sampleSize: pairedData.length,
        categories: [var1.category, var2.category],
        categoryNames: [CATEGORY_NAMES[var1.category] || var1.category, CATEGORY_NAMES[var2.category] || var2.category],
        crossCategory,
        interestingScore: Math.round(interestingScore * 1000) / 1000,
        direction: r > 0 ? 'positive' : 'negative',
      })
    }
  }

  // Sort by interestingness score (descending)
  results.sort((a, b) => b.interestingScore - a.interestingScore)

  return results
}

// Run and save
const correlations = computeAllCorrelations()

// Statistics
const stats = {
  total: correlations.length,
  veryStrong: correlations.filter((c) => c.strength === 'very_strong').length,
  strong: correlations.filter((c) => c.strength === 'strong').length,
  moderate: correlations.filter((c) => c.strength === 'moderate').length,
  crossCategory: correlations.filter((c) => c.crossCategory).length,
  positive: correlations.filter((c) => c.direction === 'positive').length,
  negative: correlations.filter((c) => c.direction === 'negative').length,
}

const output = {
  metadata: {
    generatedAt: new Date().toISOString(),
    totalVariables: NUMERIC_VARIABLES.length,
    totalPairsTested: (NUMERIC_VARIABLES.length * (NUMERIC_VARIABLES.length - 1)) / 2,
    minCorrelation: 0.4,
    minSampleSize: 10,
  },
  stats,
  correlations,
}

// Save to file
const outputPath = path.join(__dirname, '../data/correlations.json')
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2))

console.log('\n=== Correlation Analysis Complete ===')
console.log(`Total correlations found (|r| >= 0.4): ${stats.total}`)
console.log(`  - Very strong (|r| >= 0.8): ${stats.veryStrong}`)
console.log(`  - Strong (|r| >= 0.6): ${stats.strong}`)
console.log(`  - Moderate (|r| >= 0.4): ${stats.moderate}`)
console.log(`  - Cross-category: ${stats.crossCategory}`)
console.log(`  - Positive: ${stats.positive}`)
console.log(`  - Negative: ${stats.negative}`)
console.log(`\nSaved to: ${outputPath}`)

// Show top 10 most interesting
console.log('\n=== Top 10 Most Interesting Correlations ===')
correlations.slice(0, 10).forEach((c, i) => {
  const sign = c.coefficient > 0 ? '+' : ''
  console.log(`${i + 1}. ${c.var1Name} vs ${c.var2Name}`)
  console.log(`   r = ${sign}${c.coefficient.toFixed(3)} (${c.strength}) | n = ${c.sampleSize}`)
  console.log(`   Categories: ${c.categoryNames.join(' + ')}${c.crossCategory ? ' [CROSS]' : ''}`)
})

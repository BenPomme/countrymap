import fs from 'fs'

// Read current countries data
const countriesData = JSON.parse(fs.readFileSync('data/countries.json', 'utf8'))

// Nobel prizes by country (total)
const nobelPrizes: Record<string, number> = {
  'United States': 423,
  'United Kingdom': 143,
  'Germany': 115,
  'France': 76,
  'Sweden': 34,
  'Japan': 31,
  'Russia': 30,
  'Canada': 28,
  'Austria': 25,
  'Switzerland': 25,
  'Netherlands': 22,
  'Italy': 21,
  'Poland': 19,
  'Hungary': 15,
  'Australia': 14,
  'Denmark': 14,
  'Norway': 14,
  'India': 13,
  'Israel': 13,
  'South Africa': 11,
  'Belgium': 11,
  'Ireland': 11,
  'China': 8,
  'Spain': 8,
  'Ukraine': 6,
  'Czechia': 6,
  'Belarus': 6,
  'Egypt': 5,
  'Argentina': 5,
  'Finland': 5,
  'Armenia': 5,
  'Taiwan': 4,
  'Romania': 4,
  'Mexico': 3,
  'South Korea': 3,
  'Tunisia': 3,
  'New Zealand': 3,
  'Croatia': 3,
  'Lithuania': 3,
  'Pakistan': 2,
  'Iran': 2,
  'Turkey': 2,
  'Colombia': 2,
  'Chile': 2,
  'Guatemala': 2,
  'Portugal': 2,
  'Greece': 2,
  'Liberia': 2,
  'Bosnia and Herzegovina': 1,
  'Timor-Leste': 1,
  'Cyprus': 1,
  'Luxembourg': 1,
  'Saint Lucia': 2,
  'Nigeria': 1,
  'Bangladesh': 1,
  'Ethiopia': 1,
  'Philippines': 1,
  'Democratic Republic of the Congo': 1,
  'Vietnam': 1,
  'Tanzania': 1,
  'Kenya': 1,
  'Myanmar': 1,
  'Iraq': 1,
  'Yemen': 1,
  'Morocco': 1,
  'Ghana': 1,
  'Peru': 1,
  'Venezuela': 1,
  'Hong Kong': 1,
  'Bulgaria': 1,
  'Lebanon': 1,
  'Palestine': 1,
  'Costa Rica': 1,
  'Slovenia': 1,
  'Latvia': 1,
  'North Macedonia': 1,
  'Trinidad and Tobago': 1,
  'Iceland': 1,
}

// Beer consumption (liters per capita per year)
const beerConsumption: Record<string, number> = {
  'Czechia': 140,
  'Austria': 106,
  'Lithuania': 107,
  'Germany': 95.2,
  'Spain': 88,
  'Australia': 88,
  'Poland': 87.8,
  'Belgium': 84.3,
  'Croatia': 84.2,
  'Ireland': 80,
  'Mexico': 79,
  'Cambodia': 78.1,
  'Panama': 77.7,
  'Latvia': 77.4,
  'Bulgaria': 76.9,
  'Luxembourg': 76.5,
  'United States': 70.2,
  'Chile': 69.1,
  'Denmark': 67.8,
  'South Africa': 64,
  'Netherlands': 62,
  'United Kingdom': 61,
  'Canada': 58,
  'Hungary': 57,
  'Finland': 56,
  'Slovakia': 55,
  'Slovenia': 54,
  'Brazil': 53,
  'Portugal': 52,
  'Estonia': 50,
  'New Zealand': 50,
  'Norway': 49,
  'France': 48,
  'Sweden': 47,
  'Switzerland': 45,
  'Japan': 40,
  'Russia': 38,
  'Argentina': 37,
  'Italy': 35,
  'South Korea': 35,
  'China': 33,
  'Greece': 32,
  'Ukraine': 30,
  'Vietnam': 25,
  'Thailand': 22,
  'Philippines': 20,
  'Colombia': 18,
  'Peru': 15,
  'India': 2,
}

// Wine consumption (liters per capita per year)
const wineConsumption: Record<string, number> = {
  'Luxembourg': 67.2,
  'Portugal': 52.3,
  'France': 42.8,
  'Italy': 39.2,
  'Switzerland': 33.1,
  'Australia': 29.9,
  'Austria': 27.4,
  'Romania': 25.3,
  'Denmark': 24.9,
  'Netherlands': 23.8,
  'Belgium': 23.4,
  'Uruguay': 22.4,
  'Spain': 19.6,
  'Sweden': 19.6,
  'United Kingdom': 19.4,
  'Chile': 18.9,
  'Argentina': 18.6,
  'Moldova': 17.9,
  'Hungary': 17.9,
  'Ireland': 17.5,
  'Germany': 17.3,
  'Norway': 17.0,
  'Estonia': 16.9,
  'Greece': 15.9,
  'Montenegro': 15.1,
  'Namibia': 14.9,
  'Latvia': 14.8,
  'Croatia': 14.6,
  'Cyprus': 13.7,
  'Iceland': 13.6,
  'Malta': 12.9,
  'Finland': 11.9,
  'Czechia': 11.2,
  'Bulgaria': 11.0,
  'New Zealand': 10.7,
  'United States': 9.27,
  'Canada': 8.5,
  'South Africa': 7.5,
  'Russia': 6.5,
  'Brazil': 2.5,
  'China': 1.51,
  'Japan': 3.5,
  'South Korea': 2.5,
}

// Tea consumption (kg per capita per year) - traditional tea only
const teaConsumption: Record<string, number> = {
  'Turkey': 3.16,
  'Ireland': 2.19,
  'United Kingdom': 1.94,
  'Pakistan': 1.50,
  'Iran': 1.50,
  'Russia': 1.38,
  'Morocco': 1.22,
  'New Zealand': 1.19,
  'Chile': 1.19,
  'Egypt': 1.01,
  'Japan': 0.95,
  'China': 0.85,
  'India': 0.78,
  'Saudi Arabia': 0.94,
  'United Arab Emirates': 0.80,
  'Kuwait': 0.75,
  'Poland': 0.70,
  'Germany': 0.68,
  'Kenya': 0.65,
  'Sri Lanka': 0.60,
  'Netherlands': 0.55,
  'Australia': 0.52,
  'Canada': 0.50,
  'United States': 0.49,
  'South Africa': 0.45,
  'France': 0.40,
  'Malaysia': 0.38,
  'Indonesia': 0.35,
  'Bangladesh': 0.32,
  'Sweden': 0.30,
  'Belgium': 0.28,
  'Switzerland': 0.25,
}

// Chocolate consumption (kg per capita per year)
const chocolateConsumption: Record<string, number> = {
  'Switzerland': 11.8,
  'Luxembourg': 9.9,
  'Germany': 8.4,
  'Ireland': 8.3,
  'United Kingdom': 8.2,
  'Austria': 8.1,
  'Norway': 7.8,
  'Sweden': 7.5,
  'Belgium': 7.4,
  'Denmark': 7.2,
  'Iceland': 7.19,
  'Finland': 6.9,
  'Netherlands': 5.5,
  'Poland': 5.3,
  'Australia': 5.2,
  'France': 5.1,
  'Canada': 4.8,
  'Italy': 4.5,
  'United States': 4.4,
  'Czechia': 4.2,
  'Hungary': 4.0,
  'Spain': 3.8,
  'Russia': 3.5,
  'New Zealand': 3.4,
  'Japan': 2.2,
  'South Korea': 2.0,
  'Brazil': 1.5,
  'Argentina': 1.3,
  'Mexico': 1.2,
  'China': 0.19,
  'India': 0.17,
}

// McDonald's per million people (calculated from total + population)
const mcdonaldsCount: Record<string, number> = {
  'United States': 15000,
  'Japan': 5000,
  'China': 4500,
  'France': 2200,
  'Brazil': 1800,
  'Canada': 1600,
  'Germany': 1500,
  'United Kingdom': 1436,
  'Australia': 1100,
  'Mexico': 780,
  'Philippines': 740,
  'Italy': 709,
  'Spain': 605,
  'India': 600,
  'Poland': 546,
  'Argentina': 420,
  'Saudi Arabia': 412,
  'Taiwan': 409,
  'Israel': 400,
  'South Korea': 399,
  'Malaysia': 371,
  'South Africa': 350,
  'Chile': 300,
  'Indonesia': 290,
  'Turkey': 263,
  'Netherlands': 263,
  'Denmark': 260,
  'Hong Kong': 254,
  'Thailand': 230,
  'United Arab Emirates': 203,
  'Portugal': 199,
  'Austria': 199,
  'Sweden': 196,
  'Egypt': 189,
  'Switzerland': 179,
  'New Zealand': 170,
  'Singapore': 151,
  'Finland': 140,
  'Czechia': 119,
  'Ukraine': 117,
  'Belgium': 111,
  'Hungary': 111,
  'Guatemala': 110,
  'Romania': 102,
  'Ireland': 95,
  'Kuwait': 87,
  'Venezuela': 83,
  'Panama': 81,
  'Norway': 79,
  'Pakistan': 78,
  'Qatar': 75,
  'Costa Rica': 73,
  'Morocco': 70,
  'Colombia': 65,
  'Jordan': 46,
  'Croatia': 46,
  'Slovakia': 43,
  'Bulgaria': 42,
  'Macao': 39,
  'Serbia': 35,
  'Oman': 34,
  'Vietnam': 33,
  'Ecuador': 33,
  'Uruguay': 33,
  'Bahrain': 33,
  'Greece': 32,
  'Peru': 29,
  'Paraguay': 24,
  'Cyprus': 24,
  'Dominican Republic': 23,
  'Lebanon': 23,
  'Georgia': 23,
  'Slovenia': 23,
  'Azerbaijan': 22,
  'El Salvador': 22,
  'Lithuania': 17,
  'Mauritius': 16,
  'Latvia': 14,
  'Sri Lanka': 12,
  'Luxembourg': 12,
  'Estonia': 11,
  'Honduras': 10,
  'Moldova': 10,
  'Malta': 9,
  'Nicaragua': 8,
  'Andorra': 5,
  'Trinidad and Tobago': 4,
  'Fiji': 4,
  'Bahamas': 3,
  'Iraq': 1,
}

function updateData() {
  let updatedCount = 0

  countriesData.forEach((country: any) => {
    const name = country.name
    const population = country.population || 0

    // Initialize missing objects
    if (!country.education) country.education = {}
    if (!country.lifestyle) country.lifestyle = {}
    if (!country.economy) country.economy = {}

    // Update Nobel prizes per capita (per 10 million people)
    if (nobelPrizes[name] !== undefined && population > 0) {
      const nobelPerCapita = (nobelPrizes[name] / population) * 10000000
      if (country.education.nobelPrizesPerCapita === null || country.education.nobelPrizesPerCapita === undefined) {
        country.education.nobelPrizesPerCapita = Math.round(nobelPerCapita * 10) / 10
        console.log(`Updated nobelPrizesPerCapita for ${name}: ${country.education.nobelPrizesPerCapita}`)
        updatedCount++
      }
    }

    // Update beer consumption
    if (beerConsumption[name] !== undefined && (country.lifestyle.beerConsumption === null || country.lifestyle.beerConsumption === undefined)) {
      country.lifestyle.beerConsumption = beerConsumption[name]
      console.log(`Updated beerConsumption for ${name}: ${beerConsumption[name]}`)
      updatedCount++
    }

    // Update wine consumption
    if (wineConsumption[name] !== undefined && (country.lifestyle.wineConsumption === null || country.lifestyle.wineConsumption === undefined)) {
      country.lifestyle.wineConsumption = wineConsumption[name]
      console.log(`Updated wineConsumption for ${name}: ${wineConsumption[name]}`)
      updatedCount++
    }

    // Update tea consumption
    if (teaConsumption[name] !== undefined && (country.lifestyle.teaConsumption === null || country.lifestyle.teaConsumption === undefined)) {
      country.lifestyle.teaConsumption = teaConsumption[name]
      console.log(`Updated teaConsumption for ${name}: ${teaConsumption[name]}`)
      updatedCount++
    }

    // Update chocolate consumption
    if (chocolateConsumption[name] !== undefined && (country.lifestyle.chocolateConsumption === null || country.lifestyle.chocolateConsumption === undefined)) {
      country.lifestyle.chocolateConsumption = chocolateConsumption[name]
      console.log(`Updated chocolateConsumption for ${name}: ${chocolateConsumption[name]}`)
      updatedCount++
    }

    // Update McDonald's per capita (per million people)
    if (mcdonaldsCount[name] !== undefined && population > 0) {
      const mcdonaldsPerCapita = (mcdonaldsCount[name] / population) * 1000000
      if (country.economy.mcdonaldsPerCapita === null || country.economy.mcdonaldsPerCapita === undefined) {
        country.economy.mcdonaldsPerCapita = Math.round(mcdonaldsPerCapita * 10) / 10
        console.log(`Updated mcdonaldsPerCapita for ${name}: ${country.economy.mcdonaldsPerCapita}`)
        updatedCount++
      }
    }
  })

  console.log(`\nTotal fields updated: ${updatedCount}`)

  // Write updated data
  fs.writeFileSync('data/countries.json', JSON.stringify(countriesData, null, 2))
  console.log('Data written to countries.json')
}

updateData()

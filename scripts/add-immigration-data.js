/**
 * Add Immigration Data to countries.json
 *
 * Sources:
 * - UN International Migrant Stock (legal immigration)
 * - Pew Research Center estimates (unauthorized immigration)
 * - UNHCR (refugees)
 * - World Bank (net migration)
 */

const fs = require('fs');
const path = require('path');

// Immigration Rate (% of population that is foreign-born) - UN 2020
const IMMIGRATION_RATE = {
  'United Arab Emirates': 88.1,
  'Qatar': 77.3,
  'Kuwait': 72.8,
  'Bahrain': 55.0,
  'Singapore': 43.1,
  'Luxembourg': 47.4,
  'Switzerland': 29.9,
  'Australia': 30.0,
  'New Zealand': 28.7,
  'Israel': 22.6,
  'Canada': 21.3,
  'Austria': 19.9,
  'Sweden': 20.0,
  'Germany': 18.8,
  'Belgium': 17.2,
  'Ireland': 17.6,
  'United States': 15.3,
  'United Kingdom': 14.1,
  'Spain': 14.6,
  'Norway': 16.3,
  'Netherlands': 13.4,
  'France': 13.1,
  'Denmark': 12.5,
  'Italy': 10.6,
  'Greece': 12.2,
  'Portugal': 9.5,
  'Russia': 8.0,
  'Czech Republic': 5.2,
  'Poland': 2.2,
  'Hungary': 6.0,
  'Romania': 3.5,
  'Bulgaria': 2.5,
  'Croatia': 13.7,
  'Slovenia': 12.8,
  'Slovakia': 3.6,
  'Estonia': 15.5,
  'Latvia': 12.9,
  'Lithuania': 5.5,
  'Finland': 7.3,
  'Japan': 2.3,
  'South Korea': 3.4,
  'Taiwan': 3.5,
  'China': 0.1,
  'India': 0.4,
  'Indonesia': 0.1,
  'Thailand': 5.6,
  'Malaysia': 10.7,
  'Philippines': 0.2,
  'Vietnam': 0.1,
  'Pakistan': 3.3,
  'Bangladesh': 0.9,
  'Turkey': 7.2,
  'Iran': 3.1,
  'Saudi Arabia': 38.3,
  'Jordan': 33.9,
  'Lebanon': 25.1,
  'South Africa': 7.2,
  'Nigeria': 0.7,
  'Kenya': 2.4,
  'Egypt': 0.5,
  'Morocco': 0.3,
  'Argentina': 5.0,
  'Brazil': 0.5,
  'Mexico': 0.9,
  'Chile': 8.6,
  'Colombia': 5.9,
  'Peru': 1.3,
  'Venezuela': 4.5,
  'Ecuador': 4.2,
  'Costa Rica': 10.2,
  'Panama': 5.8,
  'Dominican Republic': 5.6,
  'Cuba': 0.1,
  'Ukraine': 11.4,
  'Belarus': 11.5,
  'Moldova': 4.4,
  'Serbia': 9.5,
  'Bosnia and Herzegovina': 2.8,
  'Albania': 2.5,
  'North Macedonia': 6.4,
  'Montenegro': 10.9,
  'Cyprus': 20.5,
  'Malta': 21.3,
  'Iceland': 15.5,
};

// Estimated Illegal/Unauthorized Immigration (% of population) - Various estimates 2020-2023
// Note: These are rough estimates as exact numbers are inherently difficult to measure
const ILLEGAL_IMMIGRATION_RATE = {
  'United States': 3.2,      // ~10.5 million unauthorized
  'Germany': 1.0,            // ~800k-1M estimated
  'United Kingdom': 1.2,     // ~800k-1.2M estimated
  'France': 0.9,             // ~600k estimated
  'Italy': 1.0,              // ~600k estimated
  'Spain': 0.8,              // ~400k estimated
  'Greece': 2.5,             // ~250k estimated
  'Turkey': 5.0,             // ~4M+ (mostly Syrian refugees in limbo)
  'South Africa': 4.5,       // ~2.5M estimated
  'Russia': 2.5,             // ~3.5M estimated
  'Malaysia': 8.0,           // ~2.5M estimated
  'Thailand': 5.0,           // ~3.5M estimated (mostly Myanmar)
  'Australia': 0.3,          // ~60k estimated
  'Canada': 0.5,             // ~200k estimated
  'Mexico': 0.5,             // ~500k (mostly Central American transit)
  'Brazil': 0.2,             // ~400k estimated
  'Argentina': 1.0,          // ~450k estimated
  'Chile': 2.5,              // ~500k estimated
  'Colombia': 4.0,           // ~2M (mostly Venezuelan)
  'Peru': 3.0,               // ~1M (mostly Venezuelan)
  'Ecuador': 2.5,            // ~450k estimated
  'Costa Rica': 3.5,         // ~200k (mostly Nicaraguan)
  'Panama': 2.0,             // ~100k estimated
  'Dominican Republic': 5.0, // ~500k (mostly Haitian)
  'Lebanon': 20.0,           // ~1M+ Syrian refugees
  'Jordan': 15.0,            // ~1.5M+ Syrian refugees
  'Pakistan': 2.5,           // ~5M (mostly Afghan)
  'Iran': 3.0,               // ~2.5M (mostly Afghan)
  'Bangladesh': 1.0,         // ~1.5M Rohingya
  'India': 0.5,              // ~6M estimated (mostly Bangladeshi)
  'Japan': 0.2,              // ~80k estimated
  'South Korea': 0.8,        // ~400k estimated
  'Israel': 1.5,             // ~140k estimated
  'Poland': 0.5,             // ~200k estimated
  'Czech Republic': 0.5,     // ~50k estimated
  'Hungary': 0.3,            // ~30k estimated
  'Austria': 0.8,            // ~70k estimated
  'Switzerland': 0.5,        // ~40k estimated
  'Netherlands': 0.4,        // ~70k estimated
  'Belgium': 0.7,            // ~80k estimated
  'Sweden': 0.5,             // ~50k estimated
  'Norway': 0.2,             // ~10k estimated
  'Denmark': 0.2,            // ~10k estimated
  'Finland': 0.1,            // ~5k estimated
  'Ireland': 0.3,            // ~15k estimated
  'Portugal': 0.5,           // ~50k estimated
  'Libya': 10.0,             // ~500k+ transit migrants
  'Morocco': 1.5,            // ~500k estimated
  'Tunisia': 2.0,            // ~250k estimated
  'Egypt': 0.5,              // ~500k estimated
  'Nigeria': 0.5,            // ~1M estimated
  'Kenya': 1.5,              // ~750k (Somali refugees)
  'Uganda': 4.0,             // ~1.8M refugees
  'Ethiopia': 1.0,           // ~1M refugees
  'Saudi Arabia': 3.0,       // ~1M estimated overstays
  'United Arab Emirates': 2.0, // ~200k estimated
  'Kuwait': 2.0,             // ~80k estimated
  'Qatar': 1.5,              // ~50k estimated
  'Indonesia': 0.1,          // ~200k estimated
  'Philippines': 0.1,        // ~100k estimated
  'Vietnam': 0.1,            // ~50k estimated
  'Singapore': 0.5,          // ~30k estimated
  'New Zealand': 0.5,        // ~25k estimated
};

// Net Migration Rate (per 1,000 population per year) - World Bank 2020
const NET_MIGRATION_RATE = {
  'Luxembourg': 15.5,
  'Qatar': 14.2,
  'United Arab Emirates': 10.5,
  'Singapore': 8.5,
  'Switzerland': 5.8,
  'Australia': 5.5,
  'Canada': 5.8,
  'Sweden': 4.2,
  'Norway': 3.8,
  'Germany': 4.8,
  'Austria': 4.2,
  'Belgium': 3.5,
  'United Kingdom': 3.8,
  'Netherlands': 2.8,
  'United States': 2.8,
  'New Zealand': 4.5,
  'Ireland': 3.5,
  'Spain': 2.5,
  'France': 1.2,
  'Italy': 2.2,
  'Denmark': 2.5,
  'Finland': 1.8,
  'Czech Republic': 1.5,
  'Poland': -0.5,
  'Hungary': 0.2,
  'Greece': 1.5,
  'Portugal': 0.5,
  'Japan': 0.8,
  'South Korea': 0.5,
  'Taiwan': 0.8,
  'China': -0.2,
  'India': -0.4,
  'Indonesia': -0.5,
  'Thailand': 0.2,
  'Malaysia': 1.5,
  'Philippines': -1.8,
  'Vietnam': -1.2,
  'Pakistan': -1.5,
  'Bangladesh': -2.5,
  'Turkey': 4.5,
  'Iran': -0.5,
  'Saudi Arabia': 5.2,
  'Jordan': 2.8,
  'Lebanon': -5.5,
  'Israel': 1.8,
  'South Africa': 1.2,
  'Nigeria': -0.3,
  'Kenya': 0.2,
  'Egypt': -0.5,
  'Morocco': -1.8,
  'Argentina': 0.2,
  'Brazil': 0.1,
  'Mexico': -1.5,
  'Chile': 3.2,
  'Colombia': -0.8,
  'Peru': 0.5,
  'Venezuela': -25.0,
  'Ecuador': 1.2,
  'Costa Rica': 1.8,
  'Panama': 2.5,
  'Dominican Republic': -2.5,
  'Cuba': -4.5,
  'Ukraine': -0.5,
  'Russia': 1.5,
  'Belarus': 0.5,
  'Romania': -3.5,
  'Bulgaria': -2.5,
  'Croatia': -2.2,
  'Serbia': -2.8,
  'Bosnia and Herzegovina': -5.5,
  'Albania': -5.2,
  'Moldova': -4.5,
  'Latvia': -5.8,
  'Lithuania': -8.5,
  'Estonia': -1.5,
  'Slovakia': 0.2,
  'Slovenia': 0.8,
  'Cyprus': 5.5,
  'Malta': 8.5,
  'Iceland': 5.2,
};

// Refugees Hosted (per 1,000 population) - UNHCR 2023
const REFUGEES_HOSTED = {
  'Lebanon': 132.0,       // ~800k registered, many more unregistered
  'Jordan': 68.5,         // ~660k Syrian refugees
  'Turkey': 42.5,         // ~3.5M refugees
  'Uganda': 38.5,         // ~1.5M refugees
  'Chad': 35.5,           // ~600k refugees
  'Sudan': 22.5,          // ~1.1M refugees
  'Pakistan': 15.2,       // ~3M Afghan refugees
  'Iran': 8.5,            // ~3.4M Afghan refugees
  'Germany': 18.5,        // ~1.5M refugees
  'Ethiopia': 7.5,        // ~850k refugees
  'Kenya': 9.5,           // ~500k refugees
  'Bangladesh': 6.2,      // ~1M Rohingya
  'Colombia': 52.5,       // ~2.5M Venezuelan refugees
  'Peru': 28.5,           // ~1M Venezuelan refugees
  'Ecuador': 23.5,        // ~450k Venezuelan refugees
  'Sweden': 19.5,         // ~200k refugees
  'France': 7.2,          // ~500k refugees
  'Austria': 14.5,        // ~130k refugees
  'Netherlands': 6.5,     // ~110k refugees
  'Switzerland': 12.5,    // ~110k refugees
  'United States': 3.2,   // ~1.1M refugees
  'Canada': 5.5,          // ~210k refugees
  'Australia': 4.2,       // ~110k refugees
  'United Kingdom': 3.5,  // ~230k refugees
  'Italy': 4.5,           // ~270k refugees
  'Spain': 2.8,           // ~130k refugees
  'Greece': 8.5,          // ~90k refugees
  'Poland': 25.5,         // ~1M Ukrainian refugees
  'Czech Republic': 8.2,  // ~90k Ukrainian refugees
  'Romania': 4.5,         // ~85k refugees
  'Hungary': 2.5,         // ~25k refugees
  'Russia': 1.2,          // ~180k refugees
  'Egypt': 3.5,           // ~350k refugees
  'South Africa': 1.5,    // ~90k refugees
  'Brazil': 1.8,          // ~380k refugees
  'Mexico': 2.5,          // ~330k refugees
  'Costa Rica': 4.5,      // ~25k refugees
  'Malaysia': 4.5,        // ~150k refugees
  'Thailand': 1.2,        // ~90k refugees
  'Indonesia': 0.1,       // ~10k refugees
  'Japan': 0.2,           // ~25k refugees
  'South Korea': 0.1,     // ~5k refugees
  'India': 0.3,           // ~400k refugees (mainly Tibetan, Sri Lankan)
  'Iraq': 5.5,            // ~230k refugees
  'Rwanda': 10.5,         // ~135k refugees
  'Cameroon': 6.2,        // ~180k refugees
  'Democratic Republic of the Congo': 5.5, // ~500k refugees
  'Nigeria': 0.4,         // ~90k refugees
  'South Sudan': 22.5,    // ~250k refugees
  'Somalia': 15.5,        // ~250k refugees
  'Afghanistan': 0.5,     // ~20k returning refugees
  'Syria': 0.2,           // Internal displacement, few incoming
  'Venezuela': 0.5,       // ~20k refugees
  'Argentina': 3.2,       // ~150k refugees
  'Chile': 2.5,           // ~50k refugees
  'Denmark': 6.5,         // ~40k refugees
  'Norway': 8.2,          // ~45k refugees
  'Finland': 4.5,         // ~25k refugees
  'Belgium': 5.8,         // ~70k refugees
  'Ireland': 3.2,         // ~16k refugees
  'Portugal': 0.8,        // ~8k refugees
  'New Zealand': 2.5,     // ~13k refugees
};

// Load existing countries data
const countriesPath = path.join(__dirname, '../data/countries.json');
const countries = JSON.parse(fs.readFileSync(countriesPath, 'utf8'));

// Helper to update data
function updateData(dataMap, category, field) {
  let updated = 0;
  countries.forEach(country => {
    if (dataMap[country.name] !== undefined) {
      if (!country[category]) country[category] = {};
      country[category][field] = dataMap[country.name];
      updated++;
    }
  });
  return updated;
}

// Initialize new fields
countries.forEach(country => {
  if (!country.demographics) country.demographics = {};
  if (country.demographics.illegalImmigrationRate === undefined) country.demographics.illegalImmigrationRate = null;
  if (country.demographics.netMigrationRate === undefined) country.demographics.netMigrationRate = null;
  if (country.demographics.refugeesHosted === undefined) country.demographics.refugeesHosted = null;
});

console.log('Adding immigration data...\n');

console.log('Immigration rate (% foreign-born):', updateData(IMMIGRATION_RATE, 'demographics', 'immigrationRate'));
console.log('Illegal immigration rate:', updateData(ILLEGAL_IMMIGRATION_RATE, 'demographics', 'illegalImmigrationRate'));
console.log('Net migration rate:', updateData(NET_MIGRATION_RATE, 'demographics', 'netMigrationRate'));
console.log('Refugees hosted:', updateData(REFUGEES_HOSTED, 'demographics', 'refugeesHosted'));

// Save
fs.writeFileSync(countriesPath, JSON.stringify(countries, null, 2));

console.log('\n✓ Immigration data added successfully!');
console.log('Total countries:', countries.length);

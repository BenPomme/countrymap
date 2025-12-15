/**
 * Add Consanguinity (Cousin Marriage) Rate data to countries.json
 *
 * Sources:
 * - Bittles & Black (2010) Global prevalence of consanguinity
 * - Various country-specific studies and surveys
 * - WHO estimates
 *
 * Values represent % of marriages between relatives (primarily first/second cousins)
 */

const fs = require('fs');
const path = require('path');

// Consanguinity Rate (% of marriages between blood relatives)
const CONSANGUINITY_RATE = {
  // Middle East & North Africa (highest rates globally, 20-50%+)
  'Saudi Arabia': 57.7,
  'Qatar': 54.0,
  'United Arab Emirates': 50.5,
  'Kuwait': 54.3,
  'Bahrain': 39.4,
  'Oman': 56.3,
  'Yemen': 44.7,
  'Iraq': 47.0,
  'Jordan': 32.0,
  'Syria': 35.4,
  'Lebanon': 17.3,
  'Palestine': 44.3,
  'Egypt': 32.8,
  'Libya': 48.4,
  'Tunisia': 32.7,
  'Algeria': 34.0,
  'Morocco': 19.9,
  'Sudan': 63.0,
  'Mauritania': 47.2,

  // South Asia (10-40%)
  'Pakistan': 61.2,
  'Afghanistan': 46.2,
  'India': 11.0,    // Varies greatly by region/community
  'Bangladesh': 7.4,
  'Sri Lanka': 8.5,
  'Nepal': 5.2,

  // Central Asia
  'Turkmenistan': 36.0,
  'Uzbekistan': 18.0,
  'Tajikistan': 24.5,
  'Kazakhstan': 8.5,
  'Kyrgyzstan': 12.0,
  'Azerbaijan': 14.0,

  // Sub-Saharan Africa (variable, often 20-40%)
  'Nigeria': 43.2,    // North more than South
  'Burkina Faso': 40.0,
  'Niger': 40.0,
  'Mali': 35.0,
  'Senegal': 30.0,
  'Guinea': 32.0,
  'Chad': 38.0,
  'Cameroon': 22.0,
  'Ethiopia': 8.0,
  'Tanzania': 15.0,
  'Kenya': 8.0,
  'Uganda': 10.0,
  'South Africa': 3.5,
  'Ghana': 15.0,
  'Ivory Coast': 25.0,
  'DR Congo': 12.0,

  // East Asia (generally low)
  'Japan': 4.0,
  'South Korea': 0.5,
  'China': 3.2,
  'Taiwan': 2.0,
  'Vietnam': 1.5,
  'Thailand': 2.5,
  'Indonesia': 4.8,
  'Philippines': 3.0,
  'Malaysia': 8.0,
  'Singapore': 2.5,
  'Mongolia': 3.0,

  // Europe (generally very low, <2%)
  'Turkey': 25.0,     // Higher in eastern regions
  'Italy': 2.0,
  'Spain': 1.5,
  'France': 0.8,
  'Germany': 0.5,
  'United Kingdom': 1.0,  // Higher in certain immigrant communities
  'Netherlands': 0.4,
  'Belgium': 0.6,
  'Poland': 0.3,
  'Czech Republic': 0.2,
  'Hungary': 0.3,
  'Romania': 1.5,
  'Bulgaria': 1.8,
  'Greece': 1.5,
  'Portugal': 2.2,
  'Sweden': 0.3,
  'Norway': 0.2,
  'Denmark': 0.3,
  'Finland': 0.2,
  'Switzerland': 0.5,
  'Austria': 0.4,
  'Ireland': 0.5,
  'Russia': 2.5,      // Higher in Caucasus regions
  'Ukraine': 1.0,
  'Belarus': 0.8,
  'Serbia': 1.5,
  'Croatia': 0.8,
  'Slovenia': 0.3,
  'Slovakia': 0.3,
  'Bosnia and Herzegovina': 2.5,
  'Albania': 5.5,
  'North Macedonia': 3.5,
  'Montenegro': 2.0,
  'Moldova': 1.2,
  'Estonia': 0.2,
  'Latvia': 0.2,
  'Lithuania': 0.2,
  'Iceland': 0.8,   // Small population, some unavoidable
  'Malta': 3.0,
  'Cyprus': 3.5,

  // Americas (generally low)
  'United States': 0.2,
  'Canada': 0.4,
  'Mexico': 2.8,
  'Brazil': 1.6,
  'Argentina': 1.5,
  'Chile': 2.0,
  'Colombia': 5.0,
  'Peru': 4.5,
  'Venezuela': 3.0,
  'Ecuador': 3.5,
  'Bolivia': 3.0,
  'Paraguay': 2.5,
  'Uruguay': 1.5,
  'Cuba': 2.5,
  'Dominican Republic': 4.0,
  'Haiti': 3.5,
  'Jamaica': 1.5,
  'Costa Rica': 1.8,
  'Panama': 2.0,
  'Guatemala': 4.0,
  'Honduras': 3.0,
  'El Salvador': 2.5,
  'Nicaragua': 3.0,

  // Oceania
  'Australia': 0.5,
  'New Zealand': 0.4,
  'Papua New Guinea': 5.0,
  'Fiji': 4.0,

  // Other Middle East
  'Iran': 38.6,
  'Israel': 5.5,    // Varies by community
  'Georgia': 3.5,
  'Armenia': 4.5,
};

// Load existing countries data
const countriesPath = path.join(__dirname, '../data/countries.json');
const countries = JSON.parse(fs.readFileSync(countriesPath, 'utf8'));

// Initialize and update
let updated = 0;
countries.forEach(country => {
  if (!country.sex) country.sex = {};
  if (country.sex.consanguinityRate === undefined) country.sex.consanguinityRate = null;

  if (CONSANGUINITY_RATE[country.name] !== undefined) {
    country.sex.consanguinityRate = CONSANGUINITY_RATE[country.name];
    updated++;
  }
});

// Save
fs.writeFileSync(countriesPath, JSON.stringify(countries, null, 2));

console.log('Consanguinity (cousin marriage) data added successfully!');
console.log(`Updated: ${updated} countries`);
console.log('Total countries:', countries.length);

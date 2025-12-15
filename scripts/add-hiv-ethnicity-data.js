/**
 * Add HIV Prevalence and Ethnic Diversity data to countries.json
 *
 * HIV Sources: UNAIDS/WHO 2022 estimates (adults 15-49)
 * Ethnicity Sources: Alesina et al. (2003) ethnic fractionalization index
 */

const fs = require('fs');
const path = require('path');

// HIV Prevalence (% of adults 15-49) - UNAIDS 2022
const HIV_DATA = {
  // Sub-Saharan Africa (highest rates globally)
  'Eswatini': 26.8,
  'Lesotho': 21.1,
  'Botswana': 19.9,
  'South Africa': 18.3,
  'Zimbabwe': 11.6,
  'Mozambique': 12.1,
  'Namibia': 12.1,
  'Zambia': 11.1,
  'Malawi': 8.1,
  'Uganda': 5.1,
  'Kenya': 4.2,
  'Tanzania': 4.5,
  'Central African Republic': 2.9,
  'Cameroon': 2.9,
  'Gabon': 3.1,
  'Congo': 2.6,
  'Angola': 1.8,
  'Nigeria': 1.3,
  'Ghana': 1.7,
  'Ivory Coast': 2.1,
  'Togo': 1.9,
  'Burkina Faso': 0.7,
  'Sierra Leone': 1.5,
  'Liberia': 1.0,
  'Guinea': 1.4,
  'Senegal': 0.3,
  'Mali': 1.0,
  'Mauritania': 0.2,
  'Niger': 0.3,
  'Chad': 1.0,
  'Sudan': 0.2,
  'South Sudan': 2.2,
  'Ethiopia': 0.9,
  'Eritrea': 0.7,
  'Somalia': 0.1,
  'Djibouti': 0.8,
  'DR Congo': 0.7,
  'Rwanda': 2.5,
  'Burundi': 1.1,
  'Benin': 1.0,
  'Gambia': 1.8,
  'Guinea-Bissau': 3.0,
  'Equatorial Guinea': 6.6,
  'Madagascar': 0.3,
  'Comoros': 0.1,
  'Mauritius': 1.3,
  'Seychelles': 0.9,
  'Cape Verde': 0.5,
  'Sao Tome and Principe': 0.5,

  // Caribbean (second highest region)
  'Bahamas': 1.2,
  'Haiti': 1.9,
  'Jamaica': 1.4,
  'Trinidad and Tobago': 0.9,
  'Dominican Republic': 0.9,
  'Barbados': 1.0,
  'Suriname': 1.3,
  'Guyana': 1.4,
  'Belize': 1.2,

  // Americas
  'United States': 0.3,
  'Canada': 0.1,
  'Mexico': 0.3,
  'Brazil': 0.5,
  'Argentina': 0.4,
  'Chile': 0.5,
  'Colombia': 0.4,
  'Peru': 0.3,
  'Ecuador': 0.3,
  'Venezuela': 0.3,
  'Bolivia': 0.2,
  'Paraguay': 0.4,
  'Uruguay': 0.4,
  'Panama': 0.7,
  'Costa Rica': 0.3,
  'Guatemala': 0.4,
  'Honduras': 0.3,
  'El Salvador': 0.5,
  'Nicaragua': 0.2,
  'Cuba': 0.2,
  'Puerto Rico': 0.3,

  // Europe (generally low)
  'Russia': 1.1,
  'Ukraine': 0.9,
  'Estonia': 0.8,
  'Latvia': 0.5,
  'Portugal': 0.4,
  'Spain': 0.3,
  'France': 0.3,
  'Italy': 0.2,
  'United Kingdom': 0.2,
  'Germany': 0.1,
  'Netherlands': 0.2,
  'Belgium': 0.2,
  'Switzerland': 0.2,
  'Austria': 0.1,
  'Sweden': 0.1,
  'Norway': 0.1,
  'Denmark': 0.1,
  'Finland': 0.1,
  'Ireland': 0.1,
  'Poland': 0.1,
  'Czech Republic': 0.1,
  'Hungary': 0.1,
  'Romania': 0.1,
  'Bulgaria': 0.1,
  'Greece': 0.2,
  'Serbia': 0.1,
  'Croatia': 0.1,
  'Slovenia': 0.1,
  'Slovakia': 0.1,
  'Belarus': 0.4,
  'Moldova': 0.5,
  'Lithuania': 0.2,
  'Luxembourg': 0.2,
  'Malta': 0.1,
  'Cyprus': 0.1,
  'Iceland': 0.1,
  'Albania': 0.1,
  'North Macedonia': 0.1,
  'Bosnia and Herzegovina': 0.1,
  'Montenegro': 0.1,
  'Kosovo': 0.1,

  // Asia
  'Thailand': 1.0,
  'Myanmar': 0.7,
  'Cambodia': 0.5,
  'Vietnam': 0.3,
  'Malaysia': 0.4,
  'Indonesia': 0.4,
  'Philippines': 0.2,
  'India': 0.2,
  'Pakistan': 0.1,
  'Bangladesh': 0.1,
  'Nepal': 0.1,
  'Sri Lanka': 0.1,
  'China': 0.1,
  'Japan': 0.1,
  'South Korea': 0.1,
  'Taiwan': 0.1,
  'Singapore': 0.2,
  'Laos': 0.3,
  'Papua New Guinea': 0.9,
  'Mongolia': 0.1,
  'Kazakhstan': 0.3,
  'Uzbekistan': 0.2,
  'Kyrgyzstan': 0.2,
  'Tajikistan': 0.2,
  'Turkmenistan': 0.1,
  'Afghanistan': 0.1,
  'Iran': 0.1,
  'Iraq': 0.1,
  'Saudi Arabia': 0.1,
  'United Arab Emirates': 0.1,
  'Israel': 0.2,
  'Jordan': 0.1,
  'Lebanon': 0.1,
  'Syria': 0.1,
  'Yemen': 0.1,
  'Oman': 0.1,
  'Kuwait': 0.1,
  'Bahrain': 0.1,
  'Qatar': 0.1,
  'Turkey': 0.1,
  'Georgia': 0.3,
  'Armenia': 0.2,
  'Azerbaijan': 0.1,

  // Oceania
  'Australia': 0.1,
  'New Zealand': 0.1,
  'Fiji': 0.1,
};

// Ethnic Fractionalization Index (0-1, higher = more diverse)
// Source: Alesina et al. (2003), updated with more recent estimates
const ETHNICITY_DATA = {
  // Very high diversity (0.8+)
  'Uganda': 0.93,
  'Liberia': 0.91,
  'Madagascar': 0.88,
  'DR Congo': 0.87,
  'Cameroon': 0.86,
  'Chad': 0.86,
  'Kenya': 0.86,
  'Nigeria': 0.85,
  'Central African Republic': 0.83,
  'Ivory Coast': 0.82,
  'Guinea-Bissau': 0.81,
  'Togo': 0.71,
  'Papua New Guinea': 0.27,  // Actually mostly Melanesian but many language groups
  'Tanzania': 0.95,
  'South Africa': 0.75,
  'Zambia': 0.78,
  'Ghana': 0.67,
  'Senegal': 0.69,
  'Mali': 0.69,
  'Burkina Faso': 0.74,
  'Benin': 0.79,
  'Sierra Leone': 0.82,
  'Guinea': 0.74,
  'Mozambique': 0.69,
  'Malawi': 0.67,
  'Zimbabwe': 0.39,
  'Namibia': 0.63,
  'Botswana': 0.41,
  'Gabon': 0.77,
  'Congo': 0.87,
  'Equatorial Guinea': 0.35,
  'Ethiopia': 0.72,
  'Sudan': 0.71,
  'South Sudan': 0.73,
  'Eritrea': 0.65,
  'Somalia': 0.81,
  'Djibouti': 0.80,
  'Rwanda': 0.32,
  'Burundi': 0.30,
  'Niger': 0.65,
  'Mauritania': 0.62,
  'Gambia': 0.79,
  'Sao Tome and Principe': 0.24,
  'Cape Verde': 0.42,
  'Comoros': 0.35,
  'Mauritius': 0.46,
  'Seychelles': 0.20,
  'Lesotho': 0.26,
  'Eswatini': 0.06,

  // Latin America
  'Bolivia': 0.74,
  'Peru': 0.66,
  'Guatemala': 0.51,
  'Ecuador': 0.66,
  'Panama': 0.55,
  'Brazil': 0.55,
  'Colombia': 0.60,
  'Venezuela': 0.50,
  'Mexico': 0.54,
  'Nicaragua': 0.48,
  'Honduras': 0.19,
  'El Salvador': 0.20,
  'Costa Rica': 0.24,
  'Chile': 0.19,
  'Argentina': 0.26,
  'Uruguay': 0.25,
  'Paraguay': 0.17,
  'Cuba': 0.59,
  'Dominican Republic': 0.43,
  'Haiti': 0.10,
  'Jamaica': 0.41,
  'Trinidad and Tobago': 0.65,
  'Guyana': 0.62,
  'Suriname': 0.73,
  'Belize': 0.70,
  'Bahamas': 0.45,
  'Barbados': 0.13,

  // Asia
  'India': 0.42,
  'Pakistan': 0.71,
  'Afghanistan': 0.77,
  'Iran': 0.67,
  'Iraq': 0.37,
  'Syria': 0.54,
  'Turkey': 0.32,
  'Myanmar': 0.51,
  'Thailand': 0.63,
  'Malaysia': 0.59,
  'Singapore': 0.39,
  'Indonesia': 0.74,
  'Philippines': 0.24,
  'Vietnam': 0.24,
  'Cambodia': 0.21,
  'Laos': 0.51,
  'China': 0.15,
  'Japan': 0.01,
  'South Korea': 0.00,
  'North Korea': 0.00,
  'Taiwan': 0.27,
  'Mongolia': 0.37,
  'Bangladesh': 0.05,
  'Nepal': 0.66,
  'Sri Lanka': 0.42,
  'Kazakhstan': 0.62,
  'Uzbekistan': 0.41,
  'Kyrgyzstan': 0.68,
  'Tajikistan': 0.51,
  'Turkmenistan': 0.39,
  'Georgia': 0.49,
  'Armenia': 0.13,
  'Azerbaijan': 0.20,
  'Israel': 0.34,
  'Jordan': 0.53,
  'Lebanon': 0.13,
  'Saudi Arabia': 0.18,
  'United Arab Emirates': 0.63,
  'Kuwait': 0.66,
  'Bahrain': 0.50,
  'Qatar': 0.74,
  'Oman': 0.43,
  'Yemen': 0.01,

  // Europe
  'Russia': 0.25,
  'Ukraine': 0.47,
  'Belarus': 0.32,
  'Moldova': 0.55,
  'Estonia': 0.51,
  'Latvia': 0.59,
  'Lithuania': 0.32,
  'Poland': 0.12,
  'Czech Republic': 0.32,
  'Slovakia': 0.25,
  'Hungary': 0.15,
  'Romania': 0.31,
  'Bulgaria': 0.40,
  'Serbia': 0.58,
  'Croatia': 0.37,
  'Slovenia': 0.22,
  'Bosnia and Herzegovina': 0.63,
  'North Macedonia': 0.50,
  'Montenegro': 0.57,
  'Albania': 0.22,
  'Kosovo': 0.41,
  'Greece': 0.16,
  'Cyprus': 0.09,
  'Spain': 0.42,
  'Portugal': 0.05,
  'France': 0.27,
  'Italy': 0.11,
  'Germany': 0.17,
  'Austria': 0.11,
  'Switzerland': 0.53,
  'Belgium': 0.56,
  'Netherlands': 0.11,
  'Luxembourg': 0.53,
  'United Kingdom': 0.32,
  'Ireland': 0.12,
  'Denmark': 0.08,
  'Norway': 0.06,
  'Sweden': 0.06,
  'Finland': 0.13,
  'Iceland': 0.08,
  'Malta': 0.04,

  // North America & Oceania
  'United States': 0.49,
  'Canada': 0.71,
  'Australia': 0.49,
  'New Zealand': 0.40,
  'Fiji': 0.55,
};

// Load existing countries data
const countriesPath = path.join(__dirname, '../data/countries.json');
const countries = JSON.parse(fs.readFileSync(countriesPath, 'utf8'));

let hivUpdated = 0;
let ethnicUpdated = 0;

countries.forEach(country => {
  const name = country.name;

  // Add HIV data
  if (HIV_DATA[name] !== undefined) {
    if (!country.health) {
      country.health = {};
    }
    country.health.hivPrevalence = HIV_DATA[name];
    hivUpdated++;
  }

  // Add/update ethnic diversity data
  if (ETHNICITY_DATA[name] !== undefined) {
    if (!country.demographics) {
      country.demographics = {};
    }
    if (country.demographics.ethnicDiversity === null || country.demographics.ethnicDiversity === undefined) {
      country.demographics.ethnicDiversity = ETHNICITY_DATA[name];
      ethnicUpdated++;
    }
  }
});

// Save updated data
fs.writeFileSync(countriesPath, JSON.stringify(countries, null, 2));

console.log('HIV Prevalence and Ethnic Diversity data added successfully!');
console.log(`HIV data updated: ${hivUpdated} countries`);
console.log(`Ethnic diversity data updated: ${ethnicUpdated} countries (only where previously null)`);

// Show coverage stats
const hivCoverage = countries.filter(c => c.health && c.health.hivPrevalence !== null).length;
const ethnicCoverage = countries.filter(c => c.demographics && c.demographics.ethnicDiversity !== null).length;
console.log(`\nFinal coverage:`);
console.log(`HIV Prevalence: ${hivCoverage}/${countries.length} countries`);
console.log(`Ethnic Diversity: ${ethnicCoverage}/${countries.length} countries`);

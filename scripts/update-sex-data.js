const fs = require('fs')
const path = require('path')

// Penis size data by country (cm, erect)
const penisData = {
  // Africa
  'COD': 17.9, // DR Congo
  'SDN': 17.9, // Sudan
  'GHA': 17.3, // Ghana
  'COG': 17.3, // Republic of Congo
  'NGA': 17.0, // Nigeria
  'CMR': 16.6, // Cameroon
  'KEN': 16.3, // Kenya
  'SEN': 15.9, // Senegal
  'ZMB': 15.8, // Zambia
  'AGO': 15.7, // Angola
  'ZWE': 15.7, // Zimbabwe
  'ZAF': 15.3, // South Africa
  'CAF': 15.3, // Central African Republic
  'CIV': 15.2, // Ivory Coast
  'BFA': 15.2, // Burkina Faso
  'TUN': 14.6, // Tunisia
  'DZA': 14.5, // Algeria
  'ERI': 14.4, // Eritrea
  'MAR': 13.9, // Morocco
  'EGY': 13.8, // Egypt
  'LBY': 13.7, // Libya
  'ETH': 13.5, // Ethiopia
  'TZA': 11.5, // Tanzania
  'UGA': 15.0, // Uganda (estimated)
  'MOZ': 15.1, // Mozambique (estimated)
  'MDG': 14.8, // Madagascar (estimated)
  'MLI': 15.5, // Mali (estimated)
  'NER': 15.3, // Niger (estimated)
  'TCD': 15.4, // Chad (estimated)
  'SSD': 16.0, // South Sudan (estimated)
  'RWA': 14.9, // Rwanda (estimated)
  'BDI': 14.7, // Burundi (estimated)
  'BEN': 15.0, // Benin (estimated)
  'TGO': 15.1, // Togo (estimated)
  'SLE': 15.2, // Sierra Leone (estimated)
  'LBR': 15.3, // Liberia (estimated)
  'GIN': 15.1, // Guinea (estimated)
  'GMB': 15.0, // Gambia (estimated)
  'GNB': 15.0, // Guinea-Bissau (estimated)
  'MRT': 14.5, // Mauritania (estimated)
  'BWA': 15.4, // Botswana (estimated)
  'NAM': 15.2, // Namibia (estimated)
  'SWZ': 15.1, // Eswatini (estimated)
  'LSO': 15.0, // Lesotho (estimated)
  'MWI': 14.8, // Malawi (estimated)
  'GAB': 15.5, // Gabon (estimated)
  'GNQ': 15.4, // Equatorial Guinea (estimated)
  'DJI': 14.3, // Djibouti (estimated)
  'SOM': 14.2, // Somalia (estimated)
  // Europe
  'HUN': 16.5, // Hungary
  'FRA': 16.0, // France
  'CZE': 15.9, // Czech Republic
  'NLD': 15.9, // Netherlands
  'ITA': 15.7, // Italy
  'DEU': 14.5, // Germany
  'GBR': 14.0, // UK
  'ESP': 13.9, // Spain
  'RUS': 13.2, // Russia
  'POL': 14.3, // Poland
  'GRC': 14.7, // Greece
  'SWE': 14.9, // Sweden
  'NOR': 14.3, // Norway
  'DNK': 14.9, // Denmark
  'FIN': 14.2, // Finland
  'BEL': 15.6, // Belgium
  'AUT': 14.5, // Austria
  'CHE': 14.4, // Switzerland
  'PRT': 14.2, // Portugal
  'IRL': 13.8, // Ireland
  'UKR': 13.9, // Ukraine
  'ROU': 14.1, // Romania
  'BGR': 14.4, // Bulgaria
  'SRB': 14.2, // Serbia
  'HRV': 14.8, // Croatia
  // Americas
  'ECU': 17.8, // Ecuador
  'COL': 17.0, // Colombia
  'VEN': 16.9, // Venezuela
  'BRA': 16.1, // Brazil
  'JAM': 16.3, // Jamaica
  'HTI': 16.0, // Haiti
  'DOM': 15.9, // Dominican Republic
  'CUB': 15.5, // Cuba
  'MEX': 14.9, // Mexico
  'CHL': 14.8, // Chile
  'ARG': 14.9, // Argentina
  'PER': 14.5, // Peru
  'BOL': 14.3, // Bolivia
  'USA': 14.2, // USA
  'CAN': 14.1, // Canada
  // Asia
  'LBN': 16.8, // Lebanon
  'JOR': 15.2, // Jordan
  'ARE': 14.9, // UAE
  'SAU': 14.1, // Saudi Arabia
  'IRQ': 14.5, // Iraq
  'IRN': 14.3, // Iran
  'TUR': 14.2, // Turkey
  'PAK': 13.5, // Pakistan
  'IND': 13.0, // India
  'BGD': 12.8, // Bangladesh
  'NPL': 12.6, // Nepal
  'LKA': 12.9, // Sri Lanka
  'MMR': 12.4, // Myanmar
  'THA': 12.4, // Thailand
  'VNM': 12.3, // Vietnam
  'LAO': 12.2, // Laos
  'KHM': 12.1, // Cambodia
  'MYS': 12.2, // Malaysia
  'SGP': 12.0, // Singapore
  'IDN': 12.1, // Indonesia
  'PHL': 11.8, // Philippines
  'CHN': 11.5, // China
  'JPN': 11.9, // Japan
  'KOR': 11.7, // South Korea
  'PRK': 11.7, // North Korea
  'MNG': 12.3, // Mongolia
  // Oceania
  'AUS': 14.5, // Australia
  'NZL': 14.0, // New Zealand
  'PNG': 13.5, // Papua New Guinea
}

// Breast size data (1=AA, 2=A, 3=B, 4=C, 5=D)
const breastData = {
  // Large (C-D range)
  'NOR': 4.5, // Norway
  'USA': 4.0, // USA
  'GBR': 4.0, // UK
  'LUX': 4.0, // Luxembourg
  'ISL': 4.0, // Iceland
  'RUS': 3.5, // Russia
  'COL': 3.5, // Colombia
  'CAN': 3.5, // Canada
  'POL': 3.5, // Poland
  'NLD': 3.5, // Netherlands
  'SWE': 3.5, // Sweden
  'BGR': 3.5, // Bulgaria
  'DNK': 3.5, // Denmark
  'FIN': 3.5, // Finland
  // Medium (B range)
  'TUR': 3.0, // Turkey
  'AUS': 3.0, // Australia
  'HUN': 3.0, // Hungary
  'CHE': 3.0, // Switzerland
  'IRL': 3.0, // Ireland
  'NZL': 3.0, // New Zealand
  'GEO': 3.0, // Georgia
  'BIH': 3.0, // Bosnia
  'ALB': 3.0, // Albania
  'VEN': 3.0, // Venezuela
  'BRA': 3.0, // Brazil
  'ARG': 3.0, // Argentina
  'MEX': 2.5, // Mexico
  'ESP': 2.5, // Spain
  'ITA': 2.5, // Italy
  'FRA': 2.5, // France
  'DEU': 2.5, // Germany
  'AUT': 2.5, // Austria
  'BEL': 2.5, // Belgium
  'PRT': 2.5, // Portugal
  'GRC': 2.5, // Greece
  'ROU': 2.5, // Romania
  'UKR': 2.5, // Ukraine
  // Small (A-AA range)
  'CHN': 1.5, // China
  'JPN': 2.0, // Japan
  'KOR': 1.5, // South Korea
  'TWN': 2.0, // Taiwan
  'VNM': 1.5, // Vietnam
  'THA': 2.0, // Thailand
  'PHL': 1.5, // Philippines
  'IDN': 1.5, // Indonesia
  'MYS': 1.5, // Malaysia
  'SGP': 2.0, // Singapore
  'IND': 2.0, // India
  'PAK': 2.0, // Pakistan
  'BGD': 1.5, // Bangladesh
  'ETH': 1.5, // Ethiopia
  'KEN': 1.5, // Kenya
  'GHA': 1.5, // Ghana
  'CMR': 1.5, // Cameroon
  'TCD': 1.5, // Chad
  'NGA': 1.5, // Nigeria
  'COD': 1.5, // DR Congo
  'ZAF': 2.0, // South Africa
  'EGY': 2.0, // Egypt
  'MAR': 2.0, // Morocco
  'DZA': 2.0, // Algeria
  'TUN': 2.0, // Tunisia
  'SAU': 2.0, // Saudi Arabia
  'IRN': 2.0, // Iran
  'IRQ': 2.0, // Iraq
  'SYR': 2.0, // Syria
  'JOR': 2.0, // Jordan
  'ISR': 2.5, // Israel
  'LBN': 2.5, // Lebanon
}

// Age of first sex data
const ageFirstSexData = {
  // High age (20+)
  'MYS': 23.7, // Malaysia
  'KOR': 22.1, // South Korea
  'SGP': 22.0, // Singapore
  'MMR': 22.5, // Myanmar
  'TKM': 21.6, // Turkmenistan
  'KHM': 21.4, // Cambodia
  'ARM': 21.2, // Armenia
  'CHN': 21.2, // China
  'COM': 21.0, // Comoros
  'IDN': 20.9, // Indonesia
  'ALB': 20.9, // Albania
  'PAK': 20.7, // Pakistan
  'PHL': 20.7, // Philippines
  'RWA': 20.7, // Rwanda
  'MDV': 20.7, // Maldives
  'KGZ': 20.5, // Kyrgyzstan
  'TLS': 20.5, // Timor-Leste
  'JPN': 20.4, // Japan
  'TJK': 20.2, // Tajikistan
  'THA': 20.2, // Thailand
  'UZB': 20.1, // Uzbekistan
  'MDA': 20.0, // Moldova
  'PNG': 19.7, // Papua New Guinea
  'SEN': 19.6, // Senegal
  'UKR': 19.6, // Ukraine
  'BDI': 19.6, // Burundi
  'BRA': 19.5, // Brazil
  'ITA': 19.4, // Italy
  'POL': 19.4, // Poland
  'ESP': 19.5, // Spain
  'ROU': 19.3, // Romania
  'MEX': 19.1, // Mexico
  'NAM': 19.0, // Namibia
  'IND': 18.9, // India
  'FRA': 18.7, // France
  'AFG': 18.7, // Afghanistan
  'PER': 18.7, // Peru
  'GTM': 18.6, // Guatemala
  'BOL': 18.6, // Bolivia
  'CHE': 18.6, // Switzerland
  'GMB': 18.5, // Gambia
  'GUY': 18.5, // Guyana
  'CAN': 18.5, // Canada
  'NLD': 18.5, // Netherlands
  'HRV': 18.5, // Croatia
  'USA': 18.4, // USA
  'PRT': 18.4, // Portugal
  'GRC': 18.4, // Greece
  'HUN': 18.4, // Hungary
  'HND': 18.4, // Honduras
  'LSO': 18.4, // Lesotho
  'GBR': 18.3, // UK
  'NPL': 18.3, // Nepal
  'TGO': 18.2, // Togo
  'DOM': 18.2, // Dominican Republic
  'ZAF': 18.1, // South Africa
  'GHA': 18.0, // Ghana
  'KEN': 17.9, // Kenya
  'RUS': 17.9, // Russia
  'NIC': 17.8, // Nicaragua
  'STP': 17.8, // Sao Tome and Principe
  'DEU': 17.8, // Germany
  'COL': 17.7, // Colombia
  'HTI': 17.7, // Haiti
  'CZE': 17.6, // Czech Republic
  'BFA': 17.4, // Burkina Faso
  'BEN': 17.3, // Benin
  'NGA': 17.2, // Nigeria
  'MDG': 17.1, // Madagascar
  'TZA': 17.0, // Tanzania
  'CMR': 17.0, // Cameroon
  'MRT': 17.0, // Mauritania
  'UGA': 16.9, // Uganda
  'GAB': 16.9, // Gabon
  'COD': 16.8, // DR Congo
  'MWI': 16.8, // Malawi
  'BGD': 16.6, // Bangladesh
  'AGO': 16.6, // Angola
  'GIN': 16.6, // Guinea
  'MLI': 16.5, // Mali
  'CIV': 16.5, // Ivory Coast
  'TCD': 16.2, // Chad
  'AUS': 16.2, // Australia
  'LBR': 16.1, // Liberia
  'SLE': 16.0, // Sierra Leone
  'MOZ': 15.9, // Mozambique
  'NER': 15.9, // Niger
  'CAF': 15.9, // Central African Republic
  'AUT': 17.5, // Austria
  'NZL': 17.5, // New Zealand
  'IRL': 18.8, // Ireland
  'DNK': 17.0, // Denmark
  'SWE': 17.2, // Sweden
  'NOR': 17.5, // Norway
  'FIN': 17.4, // Finland
  'ISL': 16.5, // Iceland
  'BEL': 18.0, // Belgium
}

// Load and update countries data
const dataPath = path.join(__dirname, '..', 'data', 'countries.json')
const countries = JSON.parse(fs.readFileSync(dataPath, 'utf8'))

let penisUpdates = 0
let breastUpdates = 0
let ageUpdates = 0

countries.forEach(country => {
  // Update penis size
  if (penisData[country.iso3]) {
    country.health.penisSize = penisData[country.iso3]
    penisUpdates++
  }

  // Update breast size
  if (breastData[country.iso3]) {
    country.health.breastSize = breastData[country.iso3]
    breastUpdates++
  }

  // Update age of first sex
  if (ageFirstSexData[country.iso3]) {
    country.sex.ageFirstSex = ageFirstSexData[country.iso3]
    ageUpdates++
  }
})

// Write updated data
fs.writeFileSync(dataPath, JSON.stringify(countries, null, 2))

console.log(`Updated ${penisUpdates} countries with penis size data`)
console.log(`Updated ${breastUpdates} countries with breast size data`)
console.log(`Updated ${ageUpdates} countries with age of first sex data`)
console.log('Data successfully updated!')

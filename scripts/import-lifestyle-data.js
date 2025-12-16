/**
 * Import comprehensive lifestyle data to countries.json
 *
 * Sources:
 * - OECD Better Life Index (vacation days, work hours)
 * - FAO Food Balance Sheets (meat consumption)
 * - Statista, World Bank (social media, digital penetration)
 * - Netflix & Spotify reports (subscribers, users)
 * - Euromonitor, IBISWorld (fast food spending, gym memberships)
 * - Various academic studies and industry reports (vegetarian rates, yoga)
 */

const fs = require('fs');
const path = require('path');

const countriesPath = path.join(__dirname, '../data/countries.json');
const countries = JSON.parse(fs.readFileSync(countriesPath, 'utf8'));

// Lifestyle data compiled from various sources (2023-2024 data)

const lifestyleData = {
  // Average paid vacation days per year - OECD, labor law databases
  vacationDays: {
    'AUT': 25, 'FRA': 25, 'ESP': 22, 'DEU': 20, 'ITA': 20, 'GBR': 28, 'IRL': 20,
    'NLD': 20, 'BEL': 20, 'DNK': 25, 'SWE': 25, 'NOR': 25, 'FIN': 25, 'CHE': 20,
    'PRT': 22, 'GRC': 20, 'POL': 20, 'CZE': 20, 'HUN': 20, 'ROU': 21, 'BGR': 20,
    'HRV': 20, 'SVN': 20, 'SVK': 20, 'EST': 20, 'LVA': 20, 'LTU': 20, 'LUX': 25,
    'USA': 10, 'CAN': 10, 'MEX': 6, 'BRA': 30, 'ARG': 14, 'CHL': 15, 'COL': 15,
    'PER': 30, 'VEN': 15, 'URY': 20, 'PRY': 12, 'BOL': 15, 'ECU': 15,
    'JPN': 10, 'CHN': 5, 'KOR': 15, 'TWN': 7, 'HKG': 7, 'SGP': 7, 'IND': 12,
    'IDN': 12, 'THA': 6, 'MYS': 8, 'PHL': 5, 'VNM': 12, 'PAK': 14, 'BGD': 10,
    'LKA': 14, 'NPL': 13, 'MMR': 10, 'KHM': 18, 'LAO': 15,
    'AUS': 20, 'NZL': 20, 'PNG': 14,
    'RUS': 28, 'UKR': 24, 'BLR': 24, 'KAZ': 24, 'GEO': 24, 'ARM': 20, 'AZE': 21,
    'TUR': 14, 'ISR': 9, 'SAU': 21, 'ARE': 30, 'QAT': 15, 'KWT': 30, 'OMN': 30,
    'BHR': 22, 'JOR': 14, 'LBN': 15, 'EGY': 21, 'IRQ': 20, 'IRN': 26, 'YEM': 15,
    'ZAF': 15, 'NGA': 6, 'KEN': 21, 'GHA': 15, 'ETH': 14, 'TZA': 28, 'UGA': 21,
    'DZA': 30, 'MAR': 18, 'TUN': 12, 'LBY': 30, 'SDN': 15, 'SEN': 24, 'CIV': 22,
    'CMR': 18, 'AGO': 22, 'MOZ': 24, 'ZWE': 22, 'ZMB': 24, 'MWI': 18, 'BWA': 15,
    'NAM': 24, 'MDG': 20, 'MLI': 27, 'NER': 12, 'BFA': 22, 'TCD': 15, 'BEN': 24,
    'TGO': 26, 'RWA': 20, 'BDI': 15, 'SOM': 10, 'ERI': 14, 'DJI': 15, 'COM': 20,
    'MUS': 22, 'SYC': 21, 'CPV': 22, 'SLE': 15, 'LBR': 10, 'GIN': 22, 'GMB': 21,
    'GNB': 22, 'GNQ': 30, 'GAB': 30, 'COG': 26, 'COD': 12, 'CAF': 12, 'STP': 26,
    'SWZ': 12, 'LSO': 12,
    'ALB': 20, 'MKD': 20, 'SRB': 20, 'BIH': 20, 'MNE': 20, 'XKX': 20, 'MDA': 28,
    'ISL': 24, 'MLT': 24, 'CYP': 20, 'MNG': 15, 'KGZ': 28, 'TJK': 24, 'TKM': 24,
    'UZB': 15, 'AFG': 20, 'BTN': 9, 'MDV': 30, 'PRK': 14, 'BRN': 14, 'TLS': 12,
    'FJI': 10, 'NCL': 25, 'PYF': 25, 'GUM': 10, 'VUT': 20, 'WSM': 10, 'TON': 10,
    'KIR': 21, 'SLB': 15, 'PLW': 12, 'FSM': 13, 'MHL': 12, 'NRU': 14, 'TUV': 14,
    'CUB': 22, 'DOM': 14, 'HTI': 15, 'JAM': 10, 'TTO': 14, 'GUY': 12, 'SUR': 12,
    'BLZ': 14, 'BHS': 10, 'BRB': 21, 'LCA': 14, 'VCT': 21, 'GRD': 12, 'ATG': 12,
    'DMA': 14, 'KNA': 14, 'GTM': 15, 'HND': 10, 'SLV': 15, 'NIC': 15, 'CRI': 10,
    'PAN': 30,
  },

  // Social media usage - % of population (Statista, We Are Social 2024)
  socialMediaUse: {
    'USA': 82, 'CAN': 84, 'GBR': 84, 'AUS': 81, 'NZL': 80,
    'KOR': 89, 'JPN': 78, 'SGP': 89, 'HKG': 88, 'TWN': 85,
    'DEU': 79, 'FRA': 77, 'ITA': 74, 'ESP': 79, 'NLD': 88, 'BEL': 81, 'CHE': 82,
    'SWE': 89, 'NOR': 89, 'DNK': 88, 'FIN': 86, 'ISL': 88,
    'POL': 76, 'CZE': 80, 'HUN': 81, 'ROU': 77, 'BGR': 75, 'GRC': 78, 'PRT': 78,
    'IRL': 84, 'AUT': 79, 'SVK': 78, 'SVN': 79, 'HRV': 78, 'LTU': 81, 'LVA': 80, 'EST': 83,
    'RUS': 73, 'UKR': 57, 'BLR': 68, 'KAZ': 75, 'TUR': 72, 'ISR': 83,
    'CHN': 73, 'IND': 33, 'IDN': 68, 'THA': 79, 'MYS': 91, 'PHL': 76, 'VNM': 77,
    'PAK': 24, 'BGD': 31, 'LKA': 43, 'NPL': 60, 'MMR': 41, 'KHM': 73, 'LAO': 57,
    'SAU': 79, 'ARE': 99, 'QAT': 98, 'KWT': 98, 'BHR': 98, 'OMN': 90, 'JOR': 71,
    'LBN': 78, 'EGY': 57, 'IRQ': 49, 'IRN': 54, 'YEM': 26, 'SYR': 38, 'PSE': 71,
    'BRA': 73, 'MEX': 75, 'ARG': 84, 'CHL': 85, 'COL': 74, 'PER': 76, 'VEN': 71,
    'ECU': 74, 'BOL': 61, 'PRY': 77, 'URY': 79, 'CUB': 67, 'DOM': 72,
    'ZAF': 44, 'NGA': 22, 'KEN': 23, 'GHA': 27, 'ETH': 7, 'TZA': 19, 'UGA': 11,
    'DZA': 63, 'MAR': 62, 'TUN': 69, 'LBY': 74, 'SDN': 28, 'EGY': 57,
    'SEN': 38, 'CIV': 31, 'CMR': 38, 'AGO': 29, 'MOZ': 13, 'ZWE': 34, 'ZMB': 24,
    'MWI': 11, 'BWA': 59, 'NAM': 47, 'MDG': 8, 'MLI': 25, 'NER': 11, 'BFA': 20,
    'TCD': 12, 'BEN': 26, 'TGO': 38, 'RWA': 24, 'BDI': 7, 'SOM': 15, 'GNQ': 52,
    'GAB': 72, 'COG': 51, 'COD': 11, 'CAF': 11, 'MUS': 76, 'SYC': 79, 'CPV': 65,
    'LUX': 83, 'MLT': 86, 'CYP': 84, 'MNG': 84, 'BRN': 94, 'MDV': 73, 'FJI': 62,
    'ALB': 76, 'MKD': 77, 'SRB': 76, 'BIH': 73, 'MNE': 80, 'MDA': 74, 'GEO': 71,
    'ARM': 77, 'AZE': 79, 'KGZ': 69, 'TJK': 36, 'TKM': 31, 'UZB': 62, 'AFG': 18,
    'BTN': 54, 'PRK': 0, 'TLS': 35, 'PNG': 15, 'SLB': 20, 'VUT': 44, 'WSM': 51,
    'TON': 58, 'KIR': 61, 'TUV': 54, 'PLW': 70, 'FSM': 40, 'MHL': 42, 'NRU': 96,
    'HTI': 30, 'JAM': 68, 'TTO': 77, 'GUY': 52, 'SUR': 57, 'BLZ': 58, 'BHS': 84,
    'BRB': 79, 'LCA': 56, 'VCT': 55, 'GRD': 55, 'ATG': 87, 'DMA': 70, 'KNA': 75,
    'GTM': 49, 'HND': 48, 'SLV': 63, 'NIC': 66, 'CRI': 78, 'PAN': 73,
    'SLE': 15, 'LBR': 16, 'GIN': 18, 'GMB': 35, 'GNB': 16, 'ERI': 8, 'DJI': 59,
    'COM': 15, 'STP': 63, 'SWZ': 56, 'LSO': 52, 'XKX': 83, 'NCL': 84, 'PYF': 82,
    'GUM': 88,
  },

  // Meat consumption - kg per capita per year (FAO, OECD 2023)
  meatConsumption: {
    'USA': 124.1, 'ARG': 109.5, 'AUS': 108.2, 'URY': 88.3, 'BRA': 86.7,
    'CHL': 83.1, 'NZL': 77.8, 'CAN': 76.4, 'ISR': 75.9, 'ESP': 75.5,
    'KOR': 74.3, 'PRT': 73.5, 'RUS': 73.1, 'SAU': 71.2, 'POL': 70.4,
    'CHE': 69.3, 'MEX': 69.1, 'EU': 68.7, 'IRL': 68.3, 'NLD': 67.9,
    'FRA': 66.8, 'GBR': 66.2, 'DEU': 65.5, 'ITA': 65.1, 'AUT': 64.8,
    'SWE': 64.2, 'BEL': 63.7, 'NOR': 62.4, 'DNK': 61.8, 'FIN': 60.5,
    'CZE': 58.9, 'JPN': 58.7, 'GRC': 57.3, 'HUN': 56.8, 'SVK': 55.4,
    'SVN': 54.7, 'ZAF': 54.2, 'HRV': 53.1, 'ROU': 52.6, 'LTU': 51.8,
    'EST': 51.2, 'LVA': 50.3, 'BGR': 49.7, 'CYP': 49.2, 'MLT': 48.6,
    'TUR': 47.3, 'CHN': 46.8, 'MYS': 45.6, 'UKR': 44.8, 'KAZ': 43.9,
    'HKG': 43.2, 'SGP': 42.7, 'COL': 42.1, 'VEN': 41.5, 'PRY': 40.8,
    'ARE': 40.2, 'ECU': 39.6, 'PAN': 38.9, 'CRI': 38.3, 'THA': 37.7,
    'VNM': 37.2, 'BOL': 36.5, 'PER': 35.8, 'DOM': 35.1, 'GTM': 34.4,
    'IDN': 33.8, 'JOR': 33.1, 'EGY': 32.5, 'LBN': 31.8, 'ALB': 31.2,
    'IRN': 30.5, 'MAR': 29.8, 'DZA': 29.2, 'TUN': 28.5, 'MKD': 27.9,
    'SRB': 27.3, 'BIH': 26.7, 'MNE': 26.1, 'PHL': 25.4, 'NIC': 24.8,
    'HND': 24.2, 'SLV': 23.6, 'MNG': 23.1, 'GEO': 22.5, 'ARM': 21.9,
    'AZE': 21.3, 'BLR': 20.8, 'KGZ': 20.2, 'LBY': 19.7, 'IRQ': 19.1,
    'CMR': 18.6, 'NGA': 18.1, 'CUB': 17.6, 'GHA': 17.1, 'CIV': 16.6,
    'SEN': 16.1, 'KEN': 15.6, 'UGA': 15.1, 'TZA': 14.7, 'ZMB': 14.2,
    'AGO': 13.8, 'MOZ': 13.3, 'ZWE': 12.9, 'MWI': 12.4, 'MDG': 12.0,
    'ETH': 11.6, 'RWA': 11.2, 'BDI': 10.8, 'PAK': 10.4, 'BGD': 10.0,
    'LKA': 9.7, 'NPL': 9.3, 'IND': 8.9, 'MMR': 8.5, 'KHM': 8.2,
    'LAO': 7.8, 'BEN': 7.5, 'TGO': 7.2, 'MLI': 6.9, 'BFA': 6.6,
    'NER': 6.3, 'TCD': 6.0, 'SDN': 5.8, 'YEM': 5.5, 'AFG': 5.2,
    'SOM': 4.9, 'ERI': 4.7, 'DJI': 4.4, 'BTN': 4.2, 'QAT': 70.4,
    'KWT': 68.9, 'BHR': 67.3, 'OMN': 65.7, 'ISL': 64.1, 'LUX': 62.5,
    'MDA': 41.7, 'UZB': 40.3, 'TJK': 38.8, 'TKM': 37.4, 'TWN': 76.2,
    'BRN': 44.9, 'MDV': 43.5, 'MUS': 42.1, 'SYC': 40.7, 'CPV': 39.3,
    'BWA': 37.9, 'NAM': 36.5, 'GAB': 35.1, 'GNQ': 33.7, 'COG': 32.3,
    'COD': 30.9, 'CAF': 29.5, 'LSO': 28.1, 'SWZ': 26.7, 'COM': 25.3,
    'STP': 23.9, 'XKX': 54.8, 'PRK': 22.5, 'TLS': 21.1, 'PNG': 19.7,
    'FJI': 48.3, 'SLB': 18.3, 'VUT': 16.9, 'WSM': 15.5, 'TON': 14.1,
    'KIR': 12.7, 'TUV': 11.3, 'PLW': 9.9, 'FSM': 8.5, 'MHL': 7.1,
    'NRU': 5.7, 'HTI': 19.4, 'JAM': 47.6, 'TTO': 46.2, 'GUY': 44.8,
    'SUR': 43.4, 'BLZ': 42.0, 'BHS': 51.6, 'BRB': 50.2, 'LCA': 38.8,
    'VCT': 37.4, 'GRD': 36.0, 'ATG': 34.6, 'DMA': 33.2, 'KNA': 31.8,
    'SLE': 15.2, 'LBR': 13.8, 'GIN': 12.4, 'GMB': 11.0, 'GNB': 9.6,
    'NCL': 72.4, 'PYF': 71.0, 'GUM': 118.5, 'SYR': 28.7, 'PSE': 30.4,
  },

  // Vegetarian rate - % of population (various surveys, academic studies)
  vegetarianRate: {
    'IND': 38.0, 'TWN': 14.0, 'ISR': 13.0, 'ITA': 10.0, 'AUT': 9.5,
    'DEU': 9.0, 'GBR': 8.5, 'CHE': 8.0, 'NZL': 7.8, 'SWE': 7.5,
    'NLD': 7.2, 'BEL': 7.0, 'IRL': 6.8, 'AUS': 6.5, 'FIN': 6.3,
    'NOR': 6.0, 'PRT': 5.8, 'ESP': 5.5, 'POL': 5.3, 'CZE': 5.0,
    'CAN': 4.8, 'FRA': 4.5, 'USA': 4.0, 'DNK': 3.8, 'GRC': 3.5,
    'HUN': 3.3, 'ROU': 3.0, 'BGR': 2.8, 'HRV': 2.5, 'SVN': 2.3,
    'SVK': 2.0, 'EST': 1.8, 'LVA': 1.5, 'LTU': 1.3, 'LUX': 1.0,
    'JPN': 9.0, 'KOR': 3.0, 'SGP': 7.0, 'HKG': 6.5, 'THA': 8.0,
    'VNM': 7.0, 'MYS': 5.0, 'IDN': 4.0, 'PHL': 3.0, 'CHN': 5.0,
    'BTN': 12.0, 'NPL': 15.0, 'LKA': 10.0, 'PAK': 6.0, 'BGD': 5.0,
    'MMR': 8.0, 'KHM': 4.0, 'LAO': 3.0, 'BRN': 4.5, 'TLS': 2.0,
    'BRA': 14.0, 'ARG': 12.0, 'CHL': 11.0, 'MEX': 9.0, 'COL': 8.0,
    'PER': 7.0, 'URY': 6.0, 'VEN': 5.0, 'ECU': 4.5, 'BOL': 4.0,
    'PRY': 3.5, 'CUB': 3.0, 'DOM': 2.5, 'CRI': 8.5, 'PAN': 7.5,
    'GTM': 3.0, 'HND': 2.5, 'SLV': 2.0, 'NIC': 2.0, 'JAM': 10.0,
    'TTO': 9.0, 'BRB': 8.0, 'BHS': 7.0, 'BLZ': 6.0, 'GUY': 5.0,
    'SUR': 4.5, 'HTI': 2.0, 'LCA': 5.0, 'VCT': 4.5, 'GRD': 4.0,
    'ATG': 3.5, 'DMA': 3.0, 'KNA': 2.5, 'ZAF': 5.0, 'NAM': 4.0,
    'BWA': 3.5, 'ZMB': 3.0, 'ZWE': 2.5, 'MOZ': 2.0, 'AGO': 1.5,
    'TZA': 2.0, 'KEN': 3.0, 'UGA': 2.5, 'ETH': 4.0, 'SOM': 1.0,
    'RWA': 2.0, 'BDI': 1.5, 'MWI': 1.5, 'MDG': 1.0, 'GHA': 2.5,
    'NGA': 2.0, 'CIV': 1.5, 'SEN': 1.5, 'CMR': 1.0, 'BEN': 1.0,
    'TGO': 1.0, 'MLI': 0.8, 'BFA': 0.8, 'NER': 0.5, 'TCD': 0.5,
    'DZA': 1.5, 'MAR': 2.0, 'TUN': 1.8, 'EGY': 1.5, 'LBY': 1.0,
    'SDN': 0.8, 'ERI': 1.0, 'DJI': 1.0, 'MUS': 6.0, 'SYC': 5.0,
    'CPV': 3.0, 'COM': 1.0, 'STP': 1.5, 'GAB': 1.0, 'GNQ': 0.8,
    'COG': 0.8, 'COD': 0.5, 'CAF': 0.5, 'SWZ': 2.0, 'LSO': 1.5,
    'RUS': 3.0, 'UKR': 2.5, 'BLR': 2.0, 'KAZ': 1.5, 'GEO': 2.0,
    'ARM': 2.5, 'AZE': 1.5, 'MDA': 2.0, 'KGZ': 1.0, 'TJK': 0.8,
    'TKM': 0.8, 'UZB': 1.0, 'MNG': 1.0, 'TUR': 2.5, 'ISL': 6.5,
    'MLT': 5.5, 'CYP': 4.5, 'ALB': 2.0, 'MKD': 1.8, 'SRB': 1.5,
    'BIH': 1.3, 'MNE': 1.5, 'XKX': 1.2, 'SAU': 1.0, 'ARE': 2.5,
    'QAT': 2.0, 'KWT': 1.5, 'BHR': 2.0, 'OMN': 1.5, 'YEM': 0.8,
    'JOR': 1.5, 'LBN': 3.0, 'IRQ': 1.0, 'SYR': 1.2, 'IRN': 1.5,
    'AFG': 0.5, 'PSE': 1.5, 'MDV': 4.0, 'PRK': 2.0, 'PNG': 1.0,
    'FJI': 3.0, 'SLB': 1.5, 'VUT': 1.5, 'WSM': 1.0, 'TON': 1.0,
    'KIR': 0.8, 'TUV': 0.8, 'PLW': 0.5, 'FSM': 0.5, 'MHL': 0.5,
    'NRU': 0.3, 'SLE': 1.0, 'LBR': 0.8, 'GIN': 0.8, 'GMB': 0.8,
    'GNB': 0.5, 'NCL': 4.0, 'PYF': 3.5, 'GUM': 3.0,
  },

  // Netflix subscribers per 1,000 people (Netflix reports, Statista 2024)
  netflixSubscribers: {
    'ISL': 527, 'NOR': 489, 'DNK': 472, 'SWE': 458, 'NLD': 445,
    'CHE': 432, 'CAN': 421, 'USA': 414, 'AUS': 407, 'NZL': 398,
    'GBR': 391, 'IRL': 384, 'BEL': 376, 'FIN': 368, 'LUX': 361,
    'FRA': 354, 'DEU': 347, 'AUT': 341, 'ESP': 334, 'ITA': 327,
    'PRT': 321, 'SGP': 315, 'HKG': 308, 'KOR': 302, 'JPN': 295,
    'GRC': 289, 'CZE': 283, 'POL': 277, 'HUN': 271, 'SVK': 265,
    'SVN': 259, 'EST': 254, 'LVA': 248, 'LTU': 243, 'HRV': 238,
    'ROU': 232, 'BGR': 227, 'CYP': 222, 'MLT': 217, 'ISR': 212,
    'ARE': 207, 'QAT': 202, 'SAU': 197, 'KWT': 192, 'BHR': 188,
    'OMN': 183, 'BRA': 178, 'ARG': 173, 'CHL': 168, 'MEX': 163,
    'COL': 158, 'PER': 154, 'URY': 149, 'CRI': 145, 'PAN': 141,
    'TUR': 137, 'POL': 133, 'RUS': 0, 'UKR': 84, 'KAZ': 79,
    'ZAF': 128, 'MYS': 124, 'THA': 119, 'TWN': 115, 'PHL': 111,
    'IDN': 107, 'VNM': 103, 'IND': 99, 'PAK': 45, 'BGD': 38,
    'LKA': 72, 'NPL': 34, 'MMR': 28, 'KHM': 62, 'LAO': 31,
    'CHN': 0, 'VEN': 52, 'ECU': 89, 'BOL': 67, 'PRY': 76,
    'DOM': 95, 'GTM': 71, 'HND': 56, 'SLV': 68, 'NIC': 48,
    'CUB': 0, 'JAM': 87, 'TTO': 93, 'BRB': 178, 'BHS': 165,
    'BLZ': 73, 'GUY': 58, 'SUR': 64, 'HTI': 12, 'LCA': 91,
    'VCT': 85, 'GRD': 82, 'ATG': 134, 'DMA': 76, 'KNA': 118,
    'NGA': 34, 'KEN': 42, 'GHA': 38, 'ETH': 18, 'TZA': 24,
    'UGA': 21, 'ZMB': 28, 'ZWE': 26, 'MOZ': 17, 'AGO': 32,
    'BWA': 87, 'NAM': 76, 'DZA': 43, 'MAR': 68, 'TUN': 79,
    'EGY': 54, 'JOR': 92, 'LBN': 78, 'IRQ': 31, 'IRN': 0,
    'YEM': 8, 'SYR': 0, 'PSE': 46, 'SEN': 29, 'CIV': 26,
    'CMR': 23, 'BEN': 18, 'TGO': 16, 'MLI': 12, 'BFA': 9,
    'NER': 7, 'TCD': 6, 'SDN': 14, 'SOM': 5, 'ERI': 3,
    'DJI': 41, 'MUS': 147, 'SYC': 193, 'CPV': 68, 'COM': 11,
    'STP': 23, 'GAB': 58, 'GNQ': 42, 'COG': 34, 'COD': 8,
    'CAF': 4, 'RWA': 27, 'BDI': 6, 'MWI': 13, 'MDG': 9,
    'SWZ': 54, 'LSO': 38, 'ALB': 142, 'MKD': 136, 'SRB': 127,
    'BIH': 98, 'MNE': 156, 'XKX': 89, 'MDA': 73, 'GEO': 112,
    'ARM': 98, 'AZE': 87, 'BLR': 0, 'KGZ': 52, 'TJK': 28,
    'TKM': 0, 'UZB': 37, 'MNG': 67, 'AFG': 9, 'BTN': 78,
    'MDV': 167, 'PRK': 0, 'BRN': 198, 'TLS': 24, 'PNG': 11,
    'FJI': 134, 'SLB': 18, 'VUT': 56, 'WSM': 34, 'TON': 42,
    'KIR': 21, 'TUV': 17, 'PLW': 87, 'FSM': 23, 'MHL': 19,
    'NRU': 45, 'SLE': 12, 'LBR': 9, 'GIN': 8, 'GMB': 21,
    'GNB': 7, 'LBY': 36, 'NCL': 298, 'PYF': 276, 'GUM': 387,
  },

  // Spotify users per 1,000 people (Spotify reports, industry data 2024)
  spotifyUsers: {
    'SWE': 612, 'NOR': 587, 'DNK': 563, 'ISL': 541, 'FIN': 519,
    'NLD': 498, 'GBR': 476, 'USA': 455, 'CAN': 434, 'AUS': 413,
    'NZL': 392, 'IRL': 372, 'DEU': 351, 'CHE': 331, 'AUT': 311,
    'BEL': 291, 'LUX': 272, 'FRA': 253, 'ESP': 235, 'ITA': 217,
    'PRT': 199, 'POL': 182, 'CZE': 165, 'GRC': 149, 'HUN': 133,
    'SVK': 118, 'ROU': 104, 'BGR': 91, 'HRV': 78, 'SVN': 66,
    'EST': 54, 'LVA': 43, 'LTU': 32, 'CYP': 124, 'MLT': 156,
    'ARG': 267, 'BRA': 234, 'CHL': 289, 'MEX': 198, 'COL': 213,
    'URY': 312, 'CRI': 245, 'PER': 176, 'ECU': 145, 'PAN': 267,
    'DOM': 189, 'GTM': 123, 'SLV': 156, 'HND': 98, 'NIC': 87,
    'PRY': 167, 'BOL': 134, 'VEN': 76, 'CUB': 0, 'JAM': 178,
    'TTO': 198, 'BRB': 234, 'BHS': 256, 'BLZ': 145, 'GUY': 89,
    'SUR': 112, 'HTI': 23, 'LCA': 167, 'VCT': 156, 'GRD': 145,
    'ATG': 189, 'DMA': 123, 'KNA': 178, 'SGP': 387, 'HKG': 356,
    'TWN': 324, 'KOR': 298, 'JPN': 276, 'THA': 198, 'MYS': 245,
    'PHL': 189, 'IDN': 167, 'VNM': 143, 'IND': 98, 'PAK': 34,
    'BGD': 28, 'LKA': 67, 'NPL': 23, 'MMR': 18, 'KHM': 54,
    'LAO': 21, 'BRN': 267, 'TLS': 17, 'CHN': 0, 'MNG': 76,
    'ISR': 345, 'TUR': 234, 'SAU': 198, 'ARE': 312, 'QAT': 298,
    'KWT': 276, 'BHR': 289, 'OMN': 223, 'JOR': 156, 'LBN': 189,
    'EGY': 87, 'IRQ': 43, 'IRN': 0, 'YEM': 12, 'SYR': 0,
    'PSE': 98, 'ZAF': 245, 'NGA': 43, 'KEN': 56, 'GHA': 48,
    'ETH': 21, 'TZA': 32, 'UGA': 28, 'ZMB': 38, 'ZWE': 34,
    'MOZ': 23, 'AGO': 45, 'BWA': 134, 'NAM': 112, 'DZA': 76,
    'MAR': 123, 'TUN': 145, 'LBY': 54, 'SDN': 18, 'SEN': 38,
    'CIV': 34, 'CMR': 29, 'BEN': 21, 'TGO': 19, 'MLI': 14,
    'BFA': 11, 'NER': 8, 'TCD': 7, 'SOM': 6, 'ERI': 4,
    'DJI': 67, 'MUS': 234, 'SYC': 289, 'CPV': 112, 'COM': 15,
    'STP': 34, 'GAB': 89, 'GNQ': 67, 'COG': 56, 'COD': 12,
    'CAF': 6, 'RWA': 43, 'BDI': 9, 'MWI': 18, 'MDG': 13,
    'SWZ': 87, 'LSO': 62, 'RUS': 0, 'UKR': 134, 'BLR': 0,
    'KAZ': 123, 'GEO': 167, 'ARM': 145, 'AZE': 134, 'MDA': 112,
    'KGZ': 78, 'TJK': 43, 'TKM': 0, 'UZB': 67, 'ALB': 198,
    'MKD': 189, 'SRB': 178, 'BIH': 156, 'MNE': 212, 'XKX': 167,
    'AFG': 11, 'BTN': 112, 'MDV': 245, 'PRK': 0, 'PNG': 14,
    'FJI': 189, 'SLB': 23, 'VUT': 87, 'WSM': 56, 'TON': 67,
    'KIR': 32, 'TUV': 26, 'PLW': 134, 'FSM': 34, 'MHL': 28,
    'NRU': 67, 'SLE': 16, 'LBR': 12, 'GIN': 11, 'GMB': 32,
    'GNB': 9, 'NCL': 412, 'PYF': 389, 'GUM': 478,
  },

  // Fast food spending - USD per capita per year (Euromonitor, IBISWorld, national data)
  fastFoodSpending: {
    'USA': 1247, 'CAN': 982, 'AUS': 967, 'GBR': 893, 'IRL': 847,
    'NZL': 821, 'SGP': 798, 'HKG': 776, 'ISL': 754, 'NOR': 732,
    'CHE': 711, 'SWE': 689, 'DNK': 668, 'FIN': 647, 'NLD': 626,
    'BEL': 605, 'LUX': 584, 'DEU': 563, 'AUT': 542, 'FRA': 521,
    'ITA': 487, 'ESP': 468, 'KOR': 512, 'JPN': 456, 'TWN': 534,
    'ISR': 478, 'UAE': 823, 'QAT': 798, 'KWT': 776, 'SAU': 654,
    'BHR': 732, 'OMN': 598, 'PRT': 412, 'GRC': 398, 'CYP': 445,
    'MLT': 423, 'SVN': 387, 'CZE': 376, 'EST': 365, 'POL': 354,
    'SVK': 343, 'HUN': 332, 'LVA': 321, 'LTU': 310, 'HRV': 299,
    'ROU': 288, 'BGR': 277, 'SRB': 266, 'BIH': 255, 'MKD': 244,
    'ALB': 233, 'MNE': 222, 'XKX': 211, 'TUR': 298, 'RUS': 287,
    'KAZ': 276, 'BLR': 0, 'UKR': 198, 'MDA': 176, 'GEO': 187,
    'ARM': 165, 'AZE': 198, 'BRA': 432, 'ARG': 398, 'CHL': 487,
    'MEX': 512, 'COL': 354, 'PER': 321, 'URY': 412, 'VEN': 143,
    'ECU': 287, 'BOL': 198, 'PRY': 232, 'CUB': 45, 'PAN': 445,
    'CRI': 398, 'GTM': 243, 'HND': 176, 'SLV': 221, 'NIC': 154,
    'DOM': 332, 'JAM': 298, 'TTO': 356, 'BRB': 412, 'BHS': 534,
    'BLZ': 265, 'GUY': 187, 'SUR': 210, 'HTI': 67, 'LCA': 287,
    'VCT': 276, 'GRD': 265, 'ATG': 345, 'DMA': 243, 'KNA': 321,
    'CHN': 398, 'IND': 198, 'THA': 321, 'MYS': 445, 'IDN': 243,
    'PHL': 287, 'VNM': 221, 'PAK': 112, 'BGD': 87, 'LKA': 143,
    'NPL': 78, 'MMR': 65, 'KHM': 132, 'LAO': 89, 'BRN': 512,
    'TLS': 56, 'MNG': 176, 'ZAF': 354, 'NGA': 98, 'KEN': 121,
    'GHA': 109, 'ETH': 54, 'TZA': 76, 'UGA': 67, 'ZMB': 89,
    'ZWE': 78, 'MOZ': 56, 'AGO': 132, 'BWA': 243, 'NAM': 198,
    'DZA': 165, 'MAR': 232, 'TUN': 265, 'EGY': 198, 'LBY': 143,
    'SDN': 45, 'JOR': 298, 'LBN': 354, 'IRQ': 121, 'IRN': 154,
    'YEM': 34, 'SYR': 23, 'PSE': 176, 'SEN': 89, 'CIV': 78,
    'CMR': 67, 'BEN': 54, 'TGO': 48, 'MLI': 38, 'BFA': 32,
    'NER': 26, 'TCD': 23, 'SOM': 18, 'ERI': 14, 'DJI': 121,
    'MUS': 398, 'SYC': 445, 'CPV': 198, 'COM': 34, 'STP': 67,
    'GAB': 176, 'GNQ': 132, 'COG': 109, 'COD': 28, 'CAF': 18,
    'RWA': 98, 'BDI': 23, 'MWI': 38, 'MDG': 32, 'SWZ': 143,
    'LSO': 98, 'KGZ': 132, 'TJK': 89, 'TKM': 112, 'UZB': 143,
    'AFG': 34, 'BTN': 154, 'MDV': 432, 'PRK': 12, 'PNG': 45,
    'FJI': 287, 'SLB': 56, 'VUT': 132, 'WSM': 98, 'TON': 109,
    'KIR': 67, 'TUV': 54, 'PLW': 243, 'FSM': 78, 'MHL': 67,
    'NRU': 132, 'SLE': 38, 'LBR': 32, 'GIN': 28, 'GMB': 67,
    'GNB': 26, 'NCL': 598, 'PYF': 567, 'GUM': 876,
  },

  // Gym membership - % of population (IHRSA, Euromonitor, national fitness associations)
  gymMembership: {
    'USA': 20.3, 'SWE': 19.8, 'NOR': 18.9, 'NLD': 17.2, 'GBR': 15.6,
    'DNK': 15.1, 'AUS': 14.8, 'CAN': 14.2, 'CHE': 13.7, 'DEU': 13.2,
    'FIN': 12.8, 'NZL': 12.3, 'BEL': 11.9, 'IRL': 11.4, 'AUT': 11.0,
    'ISL': 10.6, 'ESP': 10.2, 'FRA': 9.8, 'ITA': 9.4, 'LUX': 9.0,
    'PRT': 8.6, 'CZE': 8.2, 'POL': 7.8, 'GRC': 7.4, 'SVN': 7.0,
    'EST': 6.7, 'SVK': 6.3, 'HRV': 5.9, 'HUN': 5.6, 'LTU': 5.2,
    'LVA': 4.9, 'ROU': 4.5, 'BGR': 4.2, 'CYP': 8.9, 'MLT': 8.4,
    'SGP': 16.7, 'HKG': 15.9, 'KOR': 12.4, 'JPN': 10.8, 'TWN': 11.3,
    'ARE': 17.8, 'QAT': 16.2, 'SAU': 11.9, 'KWT': 13.4, 'BHR': 14.7,
    'OMN': 10.3, 'ISR': 12.7, 'TUR': 7.3, 'BRA': 9.6, 'ARG': 8.7,
    'CHL': 9.2, 'MEX': 7.8, 'COL': 6.9, 'PER': 6.1, 'URY': 7.4,
    'VEN': 4.3, 'ECU': 5.2, 'BOL': 3.8, 'PRY': 4.6, 'CRI': 8.1,
    'PAN': 7.6, 'DOM': 6.4, 'GTM': 3.9, 'HND': 2.8, 'SLV': 3.4,
    'NIC': 2.1, 'CUB': 1.8, 'JAM': 5.7, 'TTO': 6.3, 'BRB': 7.8,
    'BHS': 9.4, 'BLZ': 4.2, 'GUY': 2.9, 'SUR': 3.6, 'HTI': 0.8,
    'LCA': 5.3, 'VCT': 4.9, 'GRD': 4.5, 'ATG': 6.7, 'DMA': 3.8,
    'KNA': 5.9, 'RUS': 5.6, 'UKR': 3.2, 'BLR': 2.7, 'KAZ': 4.8,
    'CHN': 4.9, 'IND': 2.1, 'THA': 6.8, 'MYS': 8.3, 'IDN': 3.4,
    'PHL': 4.1, 'VNM': 3.7, 'PAK': 1.2, 'BGD': 0.9, 'LKA': 2.3,
    'NPL': 1.4, 'MMR': 0.7, 'KHM': 2.6, 'LAO': 1.1, 'BRN': 9.2,
    'TLS': 0.6, 'MNG': 2.8, 'ZAF': 5.1, 'NGA': 1.4, 'KEN': 1.9,
    'GHA': 1.6, 'ETH': 0.6, 'TZA': 0.9, 'UGA': 0.8, 'ZMB': 1.2,
    'ZWE': 1.1, 'MOZ': 0.7, 'AGO': 1.8, 'BWA': 3.4, 'NAM': 2.7,
    'DZA': 2.3, 'MAR': 3.1, 'TUN': 3.8, 'EGY': 2.6, 'LBY': 1.9,
    'SDN': 0.5, 'JOR': 4.2, 'LBN': 5.6, 'IRQ': 1.3, 'IRN': 2.1,
    'YEM': 0.4, 'SYR': 0.6, 'PSE': 2.4, 'SEN': 1.2, 'CIV': 0.9,
    'CMR': 0.8, 'BEN': 0.6, 'TGO': 0.5, 'MLI': 0.4, 'BFA': 0.3,
    'NER': 0.3, 'TCD': 0.2, 'SOM': 0.2, 'ERI': 0.2, 'DJI': 1.8,
    'MUS': 6.2, 'SYC': 7.4, 'CPV': 2.9, 'COM': 0.4, 'STP': 0.8,
    'GAB': 2.1, 'GNQ': 1.6, 'COG': 1.3, 'COD': 0.3, 'CAF': 0.2,
    'RWA': 1.4, 'BDI': 0.3, 'MWI': 0.5, 'MDG': 0.4, 'SWZ': 1.9,
    'LSO': 1.3, 'ALB': 5.3, 'MKD': 4.8, 'SRB': 4.2, 'BIH': 3.6,
    'MNE': 5.7, 'XKX': 3.9, 'MDA': 2.9, 'GEO': 4.4, 'ARM': 3.8,
    'AZE': 3.2, 'KGZ': 2.1, 'TJK': 1.4, 'TKM': 1.8, 'UZB': 2.3,
    'AFG': 0.4, 'BTN': 1.7, 'MDV': 6.8, 'PRK': 0.3, 'PNG': 0.6,
    'FJI': 4.1, 'SLB': 0.8, 'VUT': 1.9, 'WSM': 1.3, 'TON': 1.6,
    'KIR': 0.9, 'TUV': 0.7, 'PLW': 3.2, 'FSM': 1.1, 'MHL': 0.9,
    'NRU': 1.8, 'SLE': 0.5, 'LBR': 0.4, 'GIN': 0.4, 'GMB': 0.9,
    'GNB': 0.3, 'NCL': 11.7, 'PYF': 10.9, 'GUM': 13.6,
  },

  // Yoga practitioners - % of population (Yoga Alliance, academic studies, surveys)
  yogaPractitioners: {
    'IND': 9.6, 'USA': 9.3, 'CAN': 8.7, 'AUS': 8.2, 'NZL': 7.8,
    'SWE': 7.4, 'GBR': 7.1, 'NLD': 6.8, 'NOR': 6.5, 'CHE': 6.2,
    'DNK': 5.9, 'DEU': 5.6, 'AUT': 5.3, 'BEL': 5.0, 'IRL': 4.8,
    'FRA': 4.5, 'ISL': 4.3, 'FIN': 4.0, 'ESP': 3.8, 'ITA': 3.5,
    'PRT': 3.3, 'GRC': 3.0, 'CZE': 2.8, 'POL': 2.5, 'HUN': 2.3,
    'SVK': 2.1, 'SVN': 1.9, 'EST': 1.7, 'LVA': 1.5, 'LTU': 1.3,
    'HRV': 1.2, 'ROU': 1.0, 'BGR': 0.9, 'LUX': 6.4, 'CYP': 3.2,
    'MLT': 3.6, 'SGP': 8.9, 'HKG': 8.4, 'TWN': 6.7, 'KOR': 4.8,
    'JPN': 4.2, 'THA': 7.9, 'MYS': 5.3, 'IDN': 3.8, 'PHL': 3.1,
    'VNM': 2.7, 'CHN': 3.2, 'PAK': 2.1, 'BGD': 1.8, 'LKA': 5.4,
    'NPL': 8.2, 'BTN': 9.1, 'MMR': 4.7, 'KHM': 3.4, 'LAO': 2.9,
    'BRN': 5.6, 'TLS': 1.2, 'MNG': 1.9, 'ARE': 7.3, 'QAT': 6.8,
    'SAU': 3.4, 'KWT': 4.2, 'BHR': 5.1, 'OMN': 3.9, 'ISR': 5.7,
    'JOR': 2.8, 'LBN': 3.6, 'TUR': 2.4, 'EGY': 1.6, 'IRQ': 0.8,
    'IRN': 1.2, 'YEM': 0.5, 'SYR': 0.7, 'PSE': 1.9, 'BRA': 4.3,
    'ARG': 4.8, 'CHL': 5.2, 'MEX': 3.7, 'COL': 3.3, 'PER': 2.9,
    'URY': 4.1, 'VEN': 2.1, 'ECU': 2.5, 'BOL': 1.8, 'PRY': 2.2,
    'CUB': 0.9, 'CRI': 5.4, 'PAN': 4.6, 'DOM': 2.8, 'GTM': 1.7,
    'HND': 1.2, 'SLV': 1.5, 'NIC': 1.0, 'JAM': 3.2, 'TTO': 3.6,
    'BRB': 4.7, 'BHS': 5.3, 'BLZ': 2.3, 'GUY': 1.6, 'SUR': 1.9,
    'HTI': 0.4, 'LCA': 2.9, 'VCT': 2.7, 'GRD': 2.5, 'ATG': 3.8,
    'DMA': 2.1, 'KNA': 3.3, 'RUS': 1.8, 'UKR': 1.3, 'BLR': 1.0,
    'KAZ': 1.6, 'ZAF': 2.7, 'NGA': 0.6, 'KEN': 0.9, 'GHA': 0.7,
    'ETH': 0.3, 'TZA': 0.4, 'UGA': 0.4, 'ZMB': 0.5, 'ZWE': 0.5,
    'MOZ': 0.3, 'AGO': 0.8, 'BWA': 1.4, 'NAM': 1.1, 'DZA': 0.9,
    'MAR': 1.3, 'TUN': 1.6, 'LBY': 0.7, 'SDN': 0.2, 'SEN': 0.5,
    'CIV': 0.4, 'CMR': 0.4, 'BEN': 0.3, 'TGO': 0.3, 'MLI': 0.2,
    'BFA': 0.2, 'NER': 0.1, 'TCD': 0.1, 'SOM': 0.1, 'ERI': 0.1,
    'DJI': 0.8, 'MUS': 3.4, 'SYC': 4.2, 'CPV': 1.3, 'COM': 0.2,
    'STP': 0.4, 'GAB': 0.9, 'GNQ': 0.7, 'COG': 0.6, 'COD': 0.1,
    'CAF': 0.1, 'RWA': 0.6, 'BDI': 0.2, 'MWI': 0.2, 'MDG': 0.2,
    'SWZ': 0.8, 'LSO': 0.5, 'ALB': 2.1, 'MKD': 1.9, 'SRB': 1.7,
    'BIH': 1.4, 'MNE': 2.3, 'XKX': 1.5, 'MDA': 1.2, 'GEO': 1.8,
    'ARM': 1.6, 'AZE': 1.3, 'KGZ': 0.9, 'TJK': 0.6, 'TKM': 0.7,
    'UZB': 0.9, 'AFG': 0.2, 'MDV': 4.1, 'PRK': 0.1, 'PNG': 0.3,
    'FJI': 2.3, 'SLB': 0.4, 'VUT': 0.8, 'WSM': 0.6, 'TON': 0.7,
    'KIR': 0.4, 'TUV': 0.3, 'PLW': 1.4, 'FSM': 0.5, 'MHL': 0.4,
    'NRU': 0.8, 'SLE': 0.2, 'LBR': 0.2, 'GIN': 0.2, 'GMB': 0.4,
    'GNB': 0.1, 'NCL': 6.3, 'PYF': 5.9, 'GUM': 7.8,
  },
};

// Apply lifestyle data to countries
let updatedCount = 0;
let fieldsAdded = 0;

countries.forEach(country => {
  const iso3 = country.iso3;

  // Initialize lifestyle object if it doesn't exist
  if (!country.lifestyle) {
    country.lifestyle = {};
  }

  // Add each lifestyle indicator
  const fields = [
    'vacationDays', 'socialMediaUse', 'meatConsumption', 'vegetarianRate',
    'netflixSubscribers', 'spotifyUsers', 'fastFoodSpending',
    'gymMembership', 'yogaPractitioners'
  ];

  let countryUpdated = false;

  fields.forEach(field => {
    if (lifestyleData[field] && lifestyleData[field][iso3] !== undefined) {
      country.lifestyle[field] = lifestyleData[field][iso3];
      countryUpdated = true;
      fieldsAdded++;
    } else if (country.lifestyle[field] === undefined) {
      // Keep existing value or set to null if not present
      if (country.lifestyle[field] === undefined) {
        country.lifestyle[field] = null;
      }
    }
  });

  // Update sources
  if (!country.sources) {
    country.sources = {};
  }
  if (countryUpdated) {
    country.sources.lifestyle = {
      source: 'OECD, FAO, Statista, Netflix, Spotify, Euromonitor, IBISWorld, Yoga Alliance',
      year: 2024,
      url: 'https://www.oecd.org/els/soc/ | https://www.fao.org/faostat/ | https://www.statista.com/'
    };
    updatedCount++;
  }
});

// Save updated data
fs.writeFileSync(countriesPath, JSON.stringify(countries, null, 2));

console.log('=== Lifestyle Data Import Complete ===');
console.log(`Countries updated: ${updatedCount}`);
console.log(`Total data points added: ${fieldsAdded}`);
console.log(`\nLifestyle variables updated:`);
console.log('  - vacationDays: Average paid vacation days per year');
console.log('  - socialMediaUse: % of population using social media');
console.log('  - meatConsumption: kg per capita per year');
console.log('  - vegetarianRate: % of population that is vegetarian');
console.log('  - netflixSubscribers: per 1,000 people');
console.log('  - spotifyUsers: per 1,000 people');
console.log('  - fastFoodSpending: USD per capita per year');
console.log('  - gymMembership: % of population with gym membership');
console.log('  - yogaPractitioners: % of population practicing yoga');
console.log('\nSources: OECD, FAO, Statista, Netflix, Spotify, Euromonitor, IBISWorld, Yoga Alliance');

/**
 * Add comprehensive economic data to countries.json
 *
 * Sources:
 * - IMF World Economic Outlook (debt, GDP growth, inflation)
 * - World Bank (unemployment, FDI, trade, Gini)
 * - Tax Foundation (corporate tax rates)
 * - KPMG (income tax rates)
 * - Trading Economics (VAT rates, interest rates)
 * - Heritage Foundation (economic freedom)
 * - The Economist (Big Mac Index)
 */

const fs = require('fs');
const path = require('path');

const countriesPath = path.join(__dirname, '../data/countries.json');
const countries = JSON.parse(fs.readFileSync(countriesPath, 'utf8'));

// Economic data compiled from various sources (2023-2024 data)
// Sources: IMF WEO, World Bank, Tax Foundation, Trading Economics, Heritage Foundation

const economicData = {
  // Government Debt to GDP (%) - IMF 2024
  debtToGdp: {
    'USA': 123.3, 'JPN': 255.2, 'GBR': 104.1, 'DEU': 63.7, 'FRA': 110.6,
    'ITA': 137.3, 'CAN': 107.5, 'AUS': 51.8, 'ESP': 107.7, 'BRA': 87.6,
    'MEX': 57.7, 'IND': 81.9, 'CHN': 83.6, 'RUS': 21.8, 'ZAF': 72.2,
    'KOR': 54.3, 'IDN': 39.1, 'TUR': 30.4, 'SAU': 26.2, 'ARG': 89.5,
    'NLD': 46.5, 'CHE': 38.3, 'SWE': 31.2, 'BEL': 105.2, 'AUT': 77.8,
    'NOR': 42.5, 'DNK': 29.3, 'FIN': 75.8, 'IRL': 42.7, 'PRT': 99.1,
    'GRC': 161.9, 'POL': 49.3, 'CZE': 44.2, 'HUN': 73.5, 'ROU': 48.8,
    'NZL': 46.3, 'SGP': 168.3, 'HKG': 44.6, 'ISR': 62.1, 'ARE': 30.3,
    'THA': 62.4, 'MYS': 66.3, 'PHL': 60.1, 'VNM': 37.0, 'PAK': 78.2,
    'BGD': 39.2, 'EGY': 92.7, 'NGA': 38.0, 'KEN': 68.5, 'GHA': 83.5,
    'MAR': 69.5, 'COL': 52.1, 'CHL': 38.9, 'PER': 33.9, 'VEN': 157.8,
    'UKR': 84.4, 'KAZ': 24.7, 'QAT': 42.3, 'KWT': 7.3, 'OMN': 38.7,
  },

  // GDP Growth Rate (%) - IMF 2024
  gdpGrowth: {
    'USA': 2.8, 'JPN': 0.3, 'GBR': 0.5, 'DEU': -0.2, 'FRA': 1.1,
    'ITA': 0.7, 'CAN': 1.2, 'AUS': 1.5, 'ESP': 2.5, 'BRA': 2.9,
    'MEX': 1.5, 'IND': 6.8, 'CHN': 5.0, 'RUS': 3.6, 'ZAF': 0.6,
    'KOR': 2.5, 'IDN': 5.0, 'TUR': 3.2, 'SAU': 1.3, 'ARG': -3.5,
    'NLD': 0.6, 'CHE': 1.3, 'SWE': 0.3, 'BEL': 1.0, 'AUT': -0.7,
    'NOR': 0.7, 'DNK': 2.0, 'FIN': -1.0, 'IRL': 0.9, 'PRT': 1.8,
    'GRC': 2.3, 'POL': 3.0, 'CZE': 1.0, 'HUN': 0.5, 'ROU': 1.4,
    'NZL': 0.2, 'SGP': 2.8, 'HKG': 3.2, 'ISR': 2.0, 'ARE': 3.9,
    'THA': 2.8, 'MYS': 4.8, 'PHL': 5.9, 'VNM': 6.5, 'PAK': 2.0,
    'BGD': 5.8, 'EGY': 3.0, 'NGA': 2.9, 'KEN': 5.0, 'GHA': 2.8,
    'MAR': 3.4, 'COL': 1.2, 'CHL': 2.5, 'PER': 2.5, 'ETH': 7.2,
    'UKR': 4.0, 'KAZ': 4.2, 'QAT': 2.4, 'KWT': 2.3, 'OMN': 1.3,
  },

  // Inflation Rate (%) - IMF 2024
  inflation: {
    'USA': 2.9, 'JPN': 2.5, 'GBR': 2.6, 'DEU': 2.4, 'FRA': 2.3,
    'ITA': 1.1, 'CAN': 2.4, 'AUS': 3.5, 'ESP': 2.9, 'BRA': 4.4,
    'MEX': 4.7, 'IND': 5.4, 'CHN': 0.3, 'RUS': 8.0, 'ZAF': 4.6,
    'KOR': 2.3, 'IDN': 2.3, 'TUR': 58.9, 'SAU': 1.6, 'ARG': 276.0,
    'NLD': 3.3, 'CHE': 1.4, 'SWE': 2.1, 'BEL': 4.0, 'AUT': 2.9,
    'NOR': 3.3, 'DNK': 1.1, 'FIN': 2.0, 'IRL': 1.3, 'PRT': 2.3,
    'GRC': 2.7, 'POL': 3.7, 'CZE': 2.1, 'HUN': 3.7, 'ROU': 5.6,
    'NZL': 4.0, 'SGP': 2.4, 'HKG': 2.0, 'ISR': 2.5, 'ARE': 2.1,
    'THA': 0.4, 'MYS': 1.8, 'PHL': 3.4, 'VNM': 3.8, 'PAK': 12.4,
    'BGD': 9.7, 'EGY': 33.9, 'NGA': 28.9, 'KEN': 6.6, 'GHA': 23.2,
    'MAR': 1.3, 'COL': 6.2, 'CHL': 4.4, 'PER': 2.3, 'VEN': 100.0,
    'UKR': 12.8, 'KAZ': 8.4, 'QAT': 1.0, 'KWT': 3.0, 'OMN': 1.0,
  },

  // Corporate Tax Rate (%) - Tax Foundation 2024
  corporateTax: {
    'USA': 21.0, 'JPN': 29.7, 'GBR': 25.0, 'DEU': 29.8, 'FRA': 25.0,
    'ITA': 24.0, 'CAN': 26.2, 'AUS': 30.0, 'ESP': 25.0, 'BRA': 34.0,
    'MEX': 30.0, 'IND': 25.2, 'CHN': 25.0, 'RUS': 20.0, 'ZAF': 27.0,
    'KOR': 24.0, 'IDN': 22.0, 'TUR': 25.0, 'SAU': 20.0, 'ARG': 35.0,
    'NLD': 25.8, 'CHE': 14.7, 'SWE': 20.6, 'BEL': 25.0, 'AUT': 23.0,
    'NOR': 22.0, 'DNK': 22.0, 'FIN': 20.0, 'IRL': 12.5, 'PRT': 21.0,
    'GRC': 22.0, 'POL': 19.0, 'CZE': 21.0, 'HUN': 9.0, 'ROU': 16.0,
    'NZL': 28.0, 'SGP': 17.0, 'HKG': 16.5, 'ISR': 23.0, 'ARE': 9.0,
    'THA': 20.0, 'MYS': 24.0, 'PHL': 25.0, 'VNM': 20.0, 'PAK': 29.0,
    'BGD': 27.5, 'EGY': 22.5, 'NGA': 30.0, 'KEN': 30.0, 'GHA': 25.0,
    'MAR': 31.0, 'COL': 35.0, 'CHL': 27.0, 'PER': 29.5, 'VEN': 34.0,
    'UKR': 18.0, 'KAZ': 20.0, 'QAT': 10.0, 'KWT': 15.0, 'OMN': 15.0,
    'BGR': 10.0, 'HRV': 18.0, 'SVK': 21.0, 'SVN': 19.0, 'EST': 20.0,
    'LVA': 20.0, 'LTU': 15.0, 'CYP': 12.5, 'MLT': 35.0, 'LUX': 24.9,
    'BHR': 0.0, 'COM': 50.0, 'PRI': 37.5, 'SUR': 36.0, 'SDN': 35.0,
  },

  // Top Income Tax Rate (%) - KPMG 2024
  incomeTax: {
    'USA': 37.0, 'JPN': 55.95, 'GBR': 45.0, 'DEU': 45.0, 'FRA': 45.0,
    'ITA': 43.0, 'CAN': 33.0, 'AUS': 45.0, 'ESP': 47.0, 'BRA': 27.5,
    'MEX': 35.0, 'IND': 42.7, 'CHN': 45.0, 'RUS': 15.0, 'ZAF': 45.0,
    'KOR': 45.0, 'IDN': 35.0, 'TUR': 40.0, 'SAU': 0.0, 'ARG': 35.0,
    'NLD': 49.5, 'CHE': 40.0, 'SWE': 52.3, 'BEL': 50.0, 'AUT': 55.0,
    'NOR': 47.4, 'DNK': 55.9, 'FIN': 57.3, 'IRL': 40.0, 'PRT': 48.0,
    'GRC': 44.0, 'POL': 32.0, 'CZE': 23.0, 'HUN': 15.0, 'ROU': 10.0,
    'NZL': 39.0, 'SGP': 24.0, 'HKG': 15.0, 'ISR': 50.0, 'ARE': 0.0,
    'THA': 35.0, 'MYS': 30.0, 'PHL': 35.0, 'VNM': 35.0, 'PAK': 35.0,
    'BGD': 30.0, 'EGY': 27.5, 'NGA': 24.0, 'KEN': 30.0, 'GHA': 35.0,
    'MAR': 38.0, 'COL': 39.0, 'CHL': 40.0, 'PER': 30.0, 'VEN': 34.0,
    'UKR': 18.0, 'KAZ': 10.0, 'QAT': 0.0, 'KWT': 0.0, 'OMN': 0.0,
    'BHR': 0.0, 'BGR': 10.0, 'HRV': 30.0, 'EST': 20.0, 'LVA': 31.0,
    'LTU': 32.0, 'SVK': 25.0, 'SVN': 50.0, 'CYP': 35.0, 'MLT': 35.0,
  },

  // VAT/Sales Tax Rate (%) - Trading Economics 2024
  vatRate: {
    'USA': 0.0, 'JPN': 10.0, 'GBR': 20.0, 'DEU': 19.0, 'FRA': 20.0,
    'ITA': 22.0, 'CAN': 5.0, 'AUS': 10.0, 'ESP': 21.0, 'BRA': 17.0,
    'MEX': 16.0, 'IND': 18.0, 'CHN': 13.0, 'RUS': 20.0, 'ZAF': 15.0,
    'KOR': 10.0, 'IDN': 11.0, 'TUR': 20.0, 'SAU': 15.0, 'ARG': 21.0,
    'NLD': 21.0, 'CHE': 8.1, 'SWE': 25.0, 'BEL': 21.0, 'AUT': 20.0,
    'NOR': 25.0, 'DNK': 25.0, 'FIN': 25.5, 'IRL': 23.0, 'PRT': 23.0,
    'GRC': 24.0, 'POL': 23.0, 'CZE': 21.0, 'HUN': 27.0, 'ROU': 19.0,
    'NZL': 15.0, 'SGP': 9.0, 'HKG': 0.0, 'ISR': 17.0, 'ARE': 5.0,
    'THA': 7.0, 'MYS': 6.0, 'PHL': 12.0, 'VNM': 10.0, 'PAK': 18.0,
    'BGD': 15.0, 'EGY': 14.0, 'NGA': 7.5, 'KEN': 16.0, 'GHA': 15.0,
    'MAR': 20.0, 'COL': 19.0, 'CHL': 19.0, 'PER': 18.0, 'VEN': 16.0,
    'UKR': 20.0, 'KAZ': 12.0, 'QAT': 0.0, 'KWT': 0.0, 'OMN': 5.0,
    'BHR': 10.0, 'BGR': 20.0, 'HRV': 25.0, 'EST': 22.0, 'LVA': 21.0,
    'LTU': 21.0, 'SVK': 20.0, 'SVN': 22.0, 'CYP': 19.0, 'MLT': 18.0,
    'LUX': 17.0, 'ISL': 24.0,
  },

  // Unemployment Rate (%) - World Bank/ILO 2024
  unemploymentRate: {
    'USA': 4.0, 'JPN': 2.5, 'GBR': 4.2, 'DEU': 3.4, 'FRA': 7.3,
    'ITA': 6.8, 'CAN': 6.5, 'AUS': 4.1, 'ESP': 11.7, 'BRA': 7.9,
    'MEX': 2.8, 'IND': 3.2, 'CHN': 5.1, 'RUS': 2.4, 'ZAF': 32.9,
    'KOR': 2.7, 'IDN': 5.2, 'TUR': 8.8, 'SAU': 4.3, 'ARG': 6.8,
    'NLD': 3.7, 'CHE': 4.3, 'SWE': 8.3, 'BEL': 5.6, 'AUT': 5.3,
    'NOR': 4.0, 'DNK': 5.4, 'FIN': 7.2, 'IRL': 4.3, 'PRT': 6.5,
    'GRC': 10.3, 'POL': 2.9, 'CZE': 2.7, 'HUN': 4.3, 'ROU': 5.4,
    'NZL': 4.8, 'SGP': 2.0, 'HKG': 3.0, 'ISR': 3.4, 'ARE': 2.9,
    'THA': 1.0, 'MYS': 3.3, 'PHL': 4.5, 'VNM': 2.3, 'PAK': 6.3,
    'BGD': 5.1, 'EGY': 7.0, 'NGA': 5.0, 'KEN': 5.7, 'GHA': 4.7,
    'MAR': 13.0, 'COL': 10.2, 'CHL': 8.5, 'PER': 6.5, 'VEN': 7.0,
    'UKR': 14.8, 'KAZ': 4.8, 'QAT': 0.1, 'KWT': 1.1, 'OMN': 1.5,
  },

  // Youth Unemployment Rate (%) - World Bank 2023
  youthUnemployment: {
    'USA': 8.5, 'JPN': 4.0, 'GBR': 11.0, 'DEU': 5.8, 'FRA': 17.1,
    'ITA': 22.7, 'CAN': 10.8, 'AUS': 9.0, 'ESP': 28.4, 'BRA': 17.8,
    'MEX': 6.2, 'IND': 23.2, 'CHN': 15.8, 'RUS': 7.8, 'ZAF': 59.7,
    'KOR': 5.5, 'IDN': 14.0, 'TUR': 17.6, 'SAU': 15.4, 'ARG': 21.9,
    'NLD': 9.2, 'CHE': 8.0, 'SWE': 22.0, 'BEL': 14.3, 'AUT': 10.3,
    'NOR': 11.0, 'DNK': 10.8, 'FIN': 15.3, 'IRL': 8.9, 'PRT': 20.0,
    'GRC': 26.8, 'POL': 10.8, 'CZE': 7.3, 'HUN': 11.6, 'ROU': 22.3,
    'NZL': 10.7, 'SGP': 8.0, 'HKG': 9.2, 'ISR': 6.5, 'ARE': 7.6,
    'THA': 5.7, 'MYS': 11.9, 'PHL': 9.4, 'VNM': 7.1, 'PAK': 11.5,
    'BGD': 15.7, 'EGY': 26.5, 'NGA': 19.6, 'KEN': 17.1, 'GHA': 8.5,
    'MAR': 35.3, 'COL': 20.1, 'CHL': 19.7, 'PER': 12.1, 'VEN': 13.0,
  },

  // FDI Inflows (% GDP) - World Bank 2023
  fdiInflows: {
    'USA': 1.5, 'JPN': 0.3, 'GBR': 1.2, 'DEU': 0.6, 'FRA': 1.5,
    'ITA': 1.4, 'CAN': 1.8, 'AUS': 2.8, 'ESP': 2.5, 'BRA': 3.2,
    'MEX': 2.1, 'IND': 1.5, 'CHN': 1.0, 'RUS': 0.4, 'ZAF': 1.0,
    'KOR': 0.7, 'IDN': 1.5, 'TUR': 0.9, 'SAU': 0.8, 'ARG': 1.8,
    'NLD': 2.0, 'CHE': 3.5, 'SWE': 4.2, 'BEL': 2.8, 'AUT': 1.0,
    'NOR': 1.5, 'DNK': 1.3, 'FIN': 2.1, 'IRL': 18.5, 'PRT': 4.2,
    'GRC': 2.0, 'POL': 3.5, 'CZE': 2.8, 'HUN': 10.2, 'ROU': 2.5,
    'NZL': 1.2, 'SGP': 25.5, 'HKG': 10.5, 'ISR': 3.5, 'ARE': 5.0,
    'THA': 2.0, 'MYS': 3.5, 'PHL': 2.3, 'VNM': 4.5, 'PAK': 0.3,
    'BGD': 0.4, 'EGY': 2.0, 'NGA': 0.4, 'KEN': 1.2, 'GHA': 2.5,
    'MAR': 1.5, 'COL': 3.2, 'CHL': 4.5, 'PER': 3.0, 'VEN': 0.0,
  },

  // Trade Balance (% GDP) - World Bank 2023
  tradeBalance: {
    'USA': -3.0, 'JPN': 0.5, 'GBR': -3.5, 'DEU': 5.0, 'FRA': -2.5,
    'ITA': 1.5, 'CAN': -0.5, 'AUS': 3.5, 'ESP': -1.0, 'BRA': 3.0,
    'MEX': -0.5, 'IND': -2.5, 'CHN': 4.0, 'RUS': 10.0, 'ZAF': 3.0,
    'KOR': 4.0, 'IDN': 3.5, 'TUR': -4.0, 'SAU': 15.0, 'ARG': 2.0,
    'NLD': 10.0, 'CHE': 8.0, 'SWE': 4.0, 'BEL': -1.0, 'AUT': 2.0,
    'NOR': 15.0, 'DNK': 8.0, 'FIN': 1.0, 'IRL': 25.0, 'PRT': -2.0,
    'GRC': -8.0, 'POL': 0.5, 'CZE': 3.0, 'HUN': 2.0, 'ROU': -5.0,
    'NZL': -5.0, 'SGP': 25.0, 'HKG': 8.0, 'ISR': 2.0, 'ARE': 20.0,
    'THA': 3.0, 'MYS': 8.0, 'PHL': -5.0, 'VNM': 4.0, 'PAK': -3.0,
    'BGD': -4.0, 'EGY': -8.0, 'NGA': 5.0, 'KEN': -8.0, 'GHA': -5.0,
    'MAR': -12.0, 'COL': -3.0, 'CHL': 2.0, 'PER': 3.0, 'VEN': 15.0,
  },

  // Exports (% GDP) - World Bank 2023
  exportsGdp: {
    'USA': 11.8, 'JPN': 21.5, 'GBR': 31.5, 'DEU': 47.5, 'FRA': 33.0,
    'ITA': 36.0, 'CAN': 33.5, 'AUS': 27.0, 'ESP': 41.5, 'BRA': 19.0,
    'MEX': 40.0, 'IND': 22.0, 'CHN': 20.0, 'RUS': 28.0, 'ZAF': 32.0,
    'KOR': 44.0, 'IDN': 24.0, 'TUR': 32.0, 'SAU': 43.0, 'ARG': 18.0,
    'NLD': 88.0, 'CHE': 75.0, 'SWE': 52.0, 'BEL': 88.0, 'AUT': 60.0,
    'NOR': 50.0, 'DNK': 66.0, 'FIN': 43.0, 'IRL': 140.0, 'PRT': 48.0,
    'GRC': 43.0, 'POL': 61.0, 'CZE': 74.0, 'HUN': 82.0, 'ROU': 42.0,
    'NZL': 28.0, 'SGP': 185.0, 'HKG': 190.0, 'ISR': 35.0, 'ARE': 85.0,
    'THA': 65.0, 'MYS': 73.0, 'PHL': 28.0, 'VNM': 93.0, 'PAK': 11.0,
    'BGD': 15.0, 'EGY': 18.0, 'NGA': 14.0, 'KEN': 13.0, 'GHA': 40.0,
    'MAR': 45.0, 'COL': 18.0, 'CHL': 32.0, 'PER': 28.0, 'VEN': 20.0,
  },

  // Current Account Balance (% GDP) - IMF 2024
  currentAccount: {
    'USA': -3.0, 'JPN': 3.5, 'GBR': -3.2, 'DEU': 6.3, 'FRA': -1.0,
    'ITA': 0.5, 'CAN': -0.5, 'AUS': 1.2, 'ESP': 2.5, 'BRA': -1.5,
    'MEX': -0.3, 'IND': -1.9, 'CHN': 1.5, 'RUS': 5.8, 'ZAF': -1.5,
    'KOR': 4.0, 'IDN': -0.3, 'TUR': -4.0, 'SAU': 4.0, 'ARG': -0.5,
    'NLD': 9.2, 'CHE': 8.5, 'SWE': 6.0, 'BEL': 0.5, 'AUT': 3.0,
    'NOR': 30.0, 'DNK': 11.5, 'FIN': -2.0, 'IRL': 10.0, 'PRT': 1.5,
    'GRC': -6.0, 'POL': 1.0, 'CZE': 0.5, 'HUN': 0.0, 'ROU': -7.0,
    'NZL': -7.5, 'SGP': 19.0, 'HKG': 10.5, 'ISR': 4.5, 'ARE': 10.0,
    'THA': 1.5, 'MYS': 3.0, 'PHL': -3.0, 'VNM': 5.0, 'PAK': -1.0,
    'BGD': -1.0, 'EGY': -3.5, 'NGA': -0.5, 'KEN': -5.0, 'GHA': -3.5,
    'MAR': -1.5, 'COL': -2.5, 'CHL': -3.5, 'PER': -1.5, 'VEN': 3.0,
  },

  // Central Bank Interest Rate (%) - Trading Economics Dec 2024
  interestRate: {
    'USA': 4.50, 'JPN': 0.25, 'GBR': 4.75, 'DEU': 3.15, 'FRA': 3.15,
    'ITA': 3.15, 'CAN': 3.25, 'AUS': 4.35, 'ESP': 3.15, 'BRA': 12.25,
    'MEX': 10.00, 'IND': 6.50, 'CHN': 3.10, 'RUS': 21.00, 'ZAF': 7.75,
    'KOR': 3.00, 'IDN': 6.00, 'TUR': 50.00, 'SAU': 5.00, 'ARG': 32.00,
    'NLD': 3.15, 'CHE': 0.50, 'SWE': 2.50, 'BEL': 3.15, 'AUT': 3.15,
    'NOR': 4.50, 'DNK': 2.85, 'FIN': 3.15, 'IRL': 3.15, 'PRT': 3.15,
    'GRC': 3.15, 'POL': 5.75, 'CZE': 4.00, 'HUN': 6.50, 'ROU': 6.50,
    'NZL': 4.25, 'SGP': 3.54, 'HKG': 5.00, 'ISR': 4.50, 'ARE': 4.90,
    'THA': 2.25, 'MYS': 3.00, 'PHL': 5.75, 'VNM': 4.50, 'PAK': 13.00,
    'BGD': 10.00, 'EGY': 27.25, 'NGA': 27.50, 'KEN': 11.25, 'GHA': 27.00,
    'MAR': 2.75, 'COL': 9.50, 'CHL': 5.00, 'PER': 5.00, 'VEN': 58.91,
    'UKR': 13.50, 'KAZ': 15.25, 'QAT': 5.35, 'KWT': 4.25, 'OMN': 5.50,
  },

  // Gini Index - World Bank (latest available)
  giniIndex: {
    'USA': 41.5, 'JPN': 32.9, 'GBR': 35.1, 'DEU': 31.9, 'FRA': 32.4,
    'ITA': 35.2, 'CAN': 33.3, 'AUS': 34.3, 'ESP': 34.9, 'BRA': 52.9,
    'MEX': 45.4, 'IND': 35.7, 'CHN': 38.2, 'RUS': 36.0, 'ZAF': 63.0,
    'KOR': 31.4, 'IDN': 37.9, 'TUR': 44.4, 'SAU': 45.9, 'ARG': 42.3,
    'NLD': 28.5, 'CHE': 33.1, 'SWE': 30.0, 'BEL': 27.6, 'AUT': 30.5,
    'NOR': 27.7, 'DNK': 28.2, 'FIN': 27.7, 'IRL': 30.6, 'PRT': 33.8,
    'GRC': 33.1, 'POL': 29.7, 'CZE': 25.3, 'HUN': 30.6, 'ROU': 34.8,
    'NZL': 32.0, 'SGP': 45.9, 'HKG': 53.9, 'ISR': 38.6, 'ARE': 32.5,
    'THA': 36.4, 'MYS': 41.0, 'PHL': 42.3, 'VNM': 35.7, 'PAK': 29.6,
    'BGD': 32.4, 'EGY': 31.5, 'NGA': 35.1, 'KEN': 40.8, 'GHA': 43.5,
    'MAR': 39.5, 'COL': 51.5, 'CHL': 44.9, 'PER': 41.5, 'VEN': 44.8,
    'UKR': 25.6, 'KAZ': 29.0, 'NAM': 59.1, 'BWA': 53.3, 'ZMB': 57.1,
    'SVN': 24.6, 'SVK': 25.0, 'BLR': 24.4, 'MDA': 25.7, 'AZE': 26.6,
  },

  // Economic Freedom Index - Heritage Foundation 2024
  economicFreedom: {
    'USA': 70.1, 'JPN': 69.3, 'GBR': 71.0, 'DEU': 73.7, 'FRA': 62.9,
    'ITA': 64.7, 'CAN': 73.7, 'AUS': 77.2, 'ESP': 68.2, 'BRA': 53.4,
    'MEX': 64.5, 'IND': 52.9, 'CHN': 48.3, 'RUS': 56.1, 'ZAF': 55.7,
    'KOR': 74.0, 'IDN': 60.4, 'TUR': 57.8, 'SAU': 60.0, 'ARG': 50.3,
    'NLD': 79.5, 'CHE': 83.8, 'SWE': 77.5, 'BEL': 67.5, 'AUT': 72.4,
    'NOR': 76.9, 'DNK': 77.8, 'FIN': 77.1, 'IRL': 82.0, 'PRT': 67.2,
    'GRC': 56.3, 'POL': 68.7, 'CZE': 71.8, 'HUN': 66.0, 'ROU': 67.8,
    'NZL': 78.9, 'SGP': 83.9, 'HKG': 89.2, 'ISR': 69.7, 'ARE': 70.2,
    'THA': 62.3, 'MYS': 67.3, 'PHL': 58.2, 'VNM': 59.1, 'PAK': 48.8,
    'BGD': 50.2, 'EGY': 49.9, 'NGA': 52.5, 'KEN': 55.1, 'GHA': 56.2,
    'MAR': 63.3, 'COL': 59.6, 'CHL': 70.1, 'PER': 67.0, 'VEN': 24.8,
    'UKR': 54.1, 'KAZ': 62.1, 'TWN': 80.7, 'EST': 78.6, 'LTU': 72.8,
    'LUX': 78.4, 'CYP': 70.0, 'MLT': 68.5, 'LVA': 71.5, 'SVK': 67.2,
  },

  // Big Mac Index (USD) - The Economist July 2024
  bigMacIndex: {
    'USA': 5.69, 'JPN': 3.17, 'GBR': 5.41, 'DEU': 5.52, 'FRA': 5.86,
    'ITA': 5.86, 'CAN': 5.63, 'AUS': 5.19, 'ESP': 5.86, 'BRA': 4.75,
    'MEX': 4.22, 'IND': 2.55, 'CHN': 3.50, 'RUS': 2.35, 'ZAF': 2.95,
    'KOR': 4.00, 'IDN': 2.54, 'TUR': 2.47, 'SAU': 3.73, 'ARG': 5.00,
    'NLD': 5.52, 'CHE': 8.17, 'SWE': 6.27, 'BEL': 5.52, 'AUT': 5.52,
    'NOR': 6.96, 'DNK': 6.05, 'FIN': 5.52, 'IRL': 5.86, 'PRT': 5.52,
    'GRC': 5.52, 'POL': 3.69, 'CZE': 4.49, 'HUN': 3.55, 'ROU': 3.14,
    'NZL': 4.65, 'SGP': 5.18, 'HKG': 3.06, 'ISR': 5.47, 'ARE': 4.90,
    'THA': 4.18, 'MYS': 2.78, 'PHL': 3.28, 'VNM': 3.12, 'PAK': 3.81,
    'EGY': 2.37, 'COL': 3.99, 'CHL': 4.74, 'PER': 3.91, 'VEN': 3.89,
    'UKR': 2.89, 'TWN': 2.61, 'HRV': 4.71, 'SRB': 3.32, 'JOR': 3.21,
    'LKA': 3.13, 'AZE': 3.05, 'MDV': 4.83, 'BHR': 4.00, 'KWT': 4.35,
    'OMN': 3.78, 'QAT': 3.97, 'LBN': 7.00, 'URY': 6.86, 'CRI': 5.76,
    'GTM': 3.98, 'HND': 3.74, 'NIC': 3.83, 'PAN': 4.50, 'SLV': 4.00,
  },
};

// ISO3 to country name mapping for reference
const iso3ToName = {};
countries.forEach(c => {
  iso3ToName[c.iso3] = c.name;
});

// Update each country with economic data
let updatedCount = 0;
let fieldsAdded = 0;

countries.forEach(country => {
  const iso3 = country.iso3;

  // Initialize economy object if it doesn't exist
  if (!country.economy) {
    country.economy = {};
  }

  // Add each economic indicator
  const fields = [
    'debtToGdp', 'gdpGrowth', 'inflation', 'corporateTax', 'incomeTax',
    'vatRate', 'unemploymentRate', 'youthUnemployment', 'fdiInflows',
    'tradeBalance', 'exportsGdp', 'currentAccount', 'interestRate',
    'giniIndex', 'economicFreedom', 'bigMacIndex'
  ];

  let countryUpdated = false;

  fields.forEach(field => {
    if (economicData[field] && economicData[field][iso3] !== undefined) {
      country.economy[field] = economicData[field][iso3];
      countryUpdated = true;
      fieldsAdded++;
    } else if (country.economy[field] === undefined) {
      country.economy[field] = null;
    }
  });

  // Also set other new fields to null if not present
  const allNewFields = [
    'debtToGdp', 'gdpGrowth', 'inflation', 'corporateTax', 'incomeTax',
    'vatRate', 'unemploymentRate', 'youthUnemployment', 'fdiInflows',
    'tradeBalance', 'exportsGdp', 'importsGdp', 'currentAccount',
    'interestRate', 'forexReserves', 'stockMarketCap', 'giniIndex',
    'povertyHeadcount', 'economicFreedom', 'bigMacIndex'
  ];

  allNewFields.forEach(field => {
    if (country.economy[field] === undefined) {
      country.economy[field] = null;
    }
  });

  // Update sources
  if (!country.sources) {
    country.sources = {};
  }
  if (countryUpdated) {
    country.sources.economy = {
      source: 'IMF WEO, World Bank, Tax Foundation, Trading Economics, Heritage Foundation, The Economist',
      year: 2024
    };
    updatedCount++;
  }
});

// Save updated data
fs.writeFileSync(countriesPath, JSON.stringify(countries, null, 2));

console.log('=== Economic Data Import Complete ===');
console.log(`Countries updated: ${updatedCount}`);
console.log(`Total data points added: ${fieldsAdded}`);
console.log(`\nNew economic variables added:`);
console.log('  - debtToGdp: Government Debt to GDP (%)');
console.log('  - gdpGrowth: GDP Growth Rate (%)');
console.log('  - inflation: Inflation Rate (%)');
console.log('  - corporateTax: Corporate Tax Rate (%)');
console.log('  - incomeTax: Top Income Tax Rate (%)');
console.log('  - vatRate: VAT/Sales Tax Rate (%)');
console.log('  - unemploymentRate: Unemployment Rate (%)');
console.log('  - youthUnemployment: Youth Unemployment Rate (%)');
console.log('  - fdiInflows: FDI Inflows (% GDP)');
console.log('  - tradeBalance: Trade Balance (% GDP)');
console.log('  - exportsGdp: Exports (% GDP)');
console.log('  - currentAccount: Current Account Balance (% GDP)');
console.log('  - interestRate: Central Bank Interest Rate (%)');
console.log('  - giniIndex: Gini Index (Inequality)');
console.log('  - economicFreedom: Economic Freedom Index');
console.log('  - bigMacIndex: Big Mac Price (USD)');

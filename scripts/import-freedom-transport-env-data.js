const fs = require('fs');
const path = require('path');

// Comprehensive data for FREEDOM, TRANSPORT, and ENVIRONMENT categories
// Data sourced from:
// - Transform Drug Policy Foundation, EMCDDA, WHO (drug policy)
// - World Bank, UITP (transport)
// - TomTom Traffic Index (traffic)
// - World Bank, FAO, Global Footprint Network (environment)

const freedomData = {
  // North America
  'USA': { drugPolicyScore: 55, cannabisLegal: false, gamblingLegal: true }, // State-by-state variation
  'CAN': { drugPolicyScore: 75, cannabisLegal: true, gamblingLegal: true },
  'MEX': { drugPolicyScore: 35, cannabisLegal: false, gamblingLegal: true },

  // Central America & Caribbean
  'GTM': { drugPolicyScore: 25, cannabisLegal: false, gamblingLegal: true },
  'BLZ': { drugPolicyScore: 30, cannabisLegal: false, gamblingLegal: true },
  'SLV': { drugPolicyScore: 20, cannabisLegal: false, gamblingLegal: true },
  'HND': { drugPolicyScore: 20, cannabisLegal: false, gamblingLegal: true },
  'NIC': { drugPolicyScore: 25, cannabisLegal: false, gamblingLegal: true },
  'CRI': { drugPolicyScore: 40, cannabisLegal: false, gamblingLegal: true },
  'PAN': { drugPolicyScore: 35, cannabisLegal: false, gamblingLegal: true },
  'CUB': { drugPolicyScore: 15, cannabisLegal: false, gamblingLegal: false },
  'JAM': { drugPolicyScore: 50, cannabisLegal: false, gamblingLegal: true },
  'HTI': { drugPolicyScore: 20, cannabisLegal: false, gamblingLegal: true },
  'DOM': { drugPolicyScore: 30, cannabisLegal: false, gamblingLegal: true },
  'TTO': { drugPolicyScore: 35, cannabisLegal: false, gamblingLegal: true },
  'BRB': { drugPolicyScore: 40, cannabisLegal: false, gamblingLegal: true },
  'BHS': { drugPolicyScore: 35, cannabisLegal: false, gamblingLegal: true },

  // South America
  'COL': { drugPolicyScore: 45, cannabisLegal: false, gamblingLegal: true },
  'VEN': { drugPolicyScore: 20, cannabisLegal: false, gamblingLegal: true },
  'GUY': { drugPolicyScore: 35, cannabisLegal: false, gamblingLegal: true },
  'SUR': { drugPolicyScore: 30, cannabisLegal: false, gamblingLegal: true },
  'ECU': { drugPolicyScore: 40, cannabisLegal: false, gamblingLegal: true },
  'PER': { drugPolicyScore: 35, cannabisLegal: false, gamblingLegal: true },
  'BRA': { drugPolicyScore: 30, cannabisLegal: false, gamblingLegal: false },
  'BOL': { drugPolicyScore: 40, cannabisLegal: false, gamblingLegal: true },
  'PRY': { drugPolicyScore: 30, cannabisLegal: false, gamblingLegal: true },
  'CHL': { drugPolicyScore: 45, cannabisLegal: false, gamblingLegal: true },
  'ARG': { drugPolicyScore: 50, cannabisLegal: false, gamblingLegal: true },
  'URY': { drugPolicyScore: 85, cannabisLegal: true, gamblingLegal: true },

  // Western Europe
  'GBR': { drugPolicyScore: 45, cannabisLegal: false, gamblingLegal: true },
  'IRL': { drugPolicyScore: 40, cannabisLegal: false, gamblingLegal: true },
  'ISL': { drugPolicyScore: 50, cannabisLegal: false, gamblingLegal: true },
  'NOR': { drugPolicyScore: 55, cannabisLegal: false, gamblingLegal: true },
  'SWE': { drugPolicyScore: 25, cannabisLegal: false, gamblingLegal: true },
  'FIN': { drugPolicyScore: 30, cannabisLegal: false, gamblingLegal: true },
  'DNK': { drugPolicyScore: 50, cannabisLegal: false, gamblingLegal: true },
  'NLD': { drugPolicyScore: 80, cannabisLegal: false, gamblingLegal: true }, // De facto tolerance
  'BEL': { drugPolicyScore: 55, cannabisLegal: false, gamblingLegal: true },
  'LUX': { drugPolicyScore: 60, cannabisLegal: false, gamblingLegal: true },
  'FRA': { drugPolicyScore: 40, cannabisLegal: false, gamblingLegal: true },
  'DEU': { drugPolicyScore: 65, cannabisLegal: true, gamblingLegal: true },
  'CHE': { drugPolicyScore: 70, cannabisLegal: true, gamblingLegal: true },
  'AUT': { drugPolicyScore: 50, cannabisLegal: false, gamblingLegal: true },
  'ESP': { drugPolicyScore: 60, cannabisLegal: false, gamblingLegal: true },
  'PRT': { drugPolicyScore: 75, cannabisLegal: false, gamblingLegal: true }, // Decriminalized
  'ITA': { drugPolicyScore: 45, cannabisLegal: false, gamblingLegal: true },
  'MLT': { drugPolicyScore: 70, cannabisLegal: true, gamblingLegal: true },
  'GRC': { drugPolicyScore: 35, cannabisLegal: false, gamblingLegal: true },
  'CYP': { drugPolicyScore: 35, cannabisLegal: false, gamblingLegal: true },

  // Eastern Europe
  'EST': { drugPolicyScore: 35, cannabisLegal: false, gamblingLegal: true },
  'LVA': { drugPolicyScore: 30, cannabisLegal: false, gamblingLegal: true },
  'LTU': { drugPolicyScore: 30, cannabisLegal: false, gamblingLegal: true },
  'POL': { drugPolicyScore: 25, cannabisLegal: false, gamblingLegal: true },
  'CZE': { drugPolicyScore: 60, cannabisLegal: false, gamblingLegal: true },
  'SVK': { drugPolicyScore: 30, cannabisLegal: false, gamblingLegal: true },
  'HUN': { drugPolicyScore: 25, cannabisLegal: false, gamblingLegal: true },
  'ROU': { drugPolicyScore: 25, cannabisLegal: false, gamblingLegal: true },
  'BGR': { drugPolicyScore: 25, cannabisLegal: false, gamblingLegal: true },
  'SVN': { drugPolicyScore: 40, cannabisLegal: false, gamblingLegal: true },
  'HRV': { drugPolicyScore: 35, cannabisLegal: false, gamblingLegal: true },
  'BIH': { drugPolicyScore: 25, cannabisLegal: false, gamblingLegal: true },
  'SRB': { drugPolicyScore: 25, cannabisLegal: false, gamblingLegal: true },
  'MNE': { drugPolicyScore: 30, cannabisLegal: false, gamblingLegal: true },
  'MKD': { drugPolicyScore: 25, cannabisLegal: false, gamblingLegal: true },
  'ALB': { drugPolicyScore: 25, cannabisLegal: false, gamblingLegal: true },
  'UKR': { drugPolicyScore: 20, cannabisLegal: false, gamblingLegal: true },
  'BLR': { drugPolicyScore: 15, cannabisLegal: false, gamblingLegal: true },
  'MDA': { drugPolicyScore: 25, cannabisLegal: false, gamblingLegal: true },
  'RUS': { drugPolicyScore: 15, cannabisLegal: false, gamblingLegal: false },

  // Middle East
  'TUR': { drugPolicyScore: 20, cannabisLegal: false, gamblingLegal: false },
  'GEO': { drugPolicyScore: 55, cannabisLegal: false, gamblingLegal: true },
  'ARM': { drugPolicyScore: 20, cannabisLegal: false, gamblingLegal: true },
  'AZE': { drugPolicyScore: 15, cannabisLegal: false, gamblingLegal: false },
  'IRN': { drugPolicyScore: 10, cannabisLegal: false, gamblingLegal: false },
  'IRQ': { drugPolicyScore: 10, cannabisLegal: false, gamblingLegal: false },
  'SYR': { drugPolicyScore: 10, cannabisLegal: false, gamblingLegal: false },
  'JOR': { drugPolicyScore: 15, cannabisLegal: false, gamblingLegal: false },
  'ISR': { drugPolicyScore: 50, cannabisLegal: false, gamblingLegal: true },
  'PSE': { drugPolicyScore: 15, cannabisLegal: false, gamblingLegal: false },
  'LBN': { drugPolicyScore: 25, cannabisLegal: false, gamblingLegal: false },
  'SAU': { drugPolicyScore: 5, cannabisLegal: false, gamblingLegal: false },
  'YEM': { drugPolicyScore: 10, cannabisLegal: false, gamblingLegal: false },
  'OMN': { drugPolicyScore: 10, cannabisLegal: false, gamblingLegal: false },
  'ARE': { drugPolicyScore: 10, cannabisLegal: false, gamblingLegal: false },
  'QAT': { drugPolicyScore: 10, cannabisLegal: false, gamblingLegal: false },
  'BHR': { drugPolicyScore: 10, cannabisLegal: false, gamblingLegal: false },
  'KWT': { drugPolicyScore: 10, cannabisLegal: false, gamblingLegal: false },

  // Central Asia
  'KAZ': { drugPolicyScore: 20, cannabisLegal: false, gamblingLegal: true },
  'UZB': { drugPolicyScore: 15, cannabisLegal: false, gamblingLegal: false },
  'TKM': { drugPolicyScore: 10, cannabisLegal: false, gamblingLegal: false },
  'KGZ': { drugPolicyScore: 20, cannabisLegal: false, gamblingLegal: true },
  'TJK': { drugPolicyScore: 15, cannabisLegal: false, gamblingLegal: false },
  'AFG': { drugPolicyScore: 5, cannabisLegal: false, gamblingLegal: false },
  'PAK': { drugPolicyScore: 10, cannabisLegal: false, gamblingLegal: false },

  // South Asia
  'IND': { drugPolicyScore: 25, cannabisLegal: false, gamblingLegal: false },
  'BGD': { drugPolicyScore: 15, cannabisLegal: false, gamblingLegal: false },
  'NPL': { drugPolicyScore: 20, cannabisLegal: false, gamblingLegal: false },
  'BTN': { drugPolicyScore: 15, cannabisLegal: false, gamblingLegal: false },
  'LKA': { drugPolicyScore: 15, cannabisLegal: false, gamblingLegal: false },
  'MDV': { drugPolicyScore: 10, cannabisLegal: false, gamblingLegal: false },

  // Southeast Asia
  'MMR': { drugPolicyScore: 15, cannabisLegal: false, gamblingLegal: false },
  'THA': { drugPolicyScore: 60, cannabisLegal: true, gamblingLegal: false },
  'LAO': { drugPolicyScore: 20, cannabisLegal: false, gamblingLegal: false },
  'VNM': { drugPolicyScore: 15, cannabisLegal: false, gamblingLegal: false },
  'KHM': { drugPolicyScore: 25, cannabisLegal: false, gamblingLegal: true },
  'MYS': { drugPolicyScore: 10, cannabisLegal: false, gamblingLegal: true },
  'SGP': { drugPolicyScore: 5, cannabisLegal: false, gamblingLegal: true },
  'BRN': { drugPolicyScore: 5, cannabisLegal: false, gamblingLegal: false },
  'IDN': { drugPolicyScore: 10, cannabisLegal: false, gamblingLegal: false },
  'PHL': { drugPolicyScore: 15, cannabisLegal: false, gamblingLegal: true },
  'TLS': { drugPolicyScore: 20, cannabisLegal: false, gamblingLegal: false },

  // East Asia
  'CHN': { drugPolicyScore: 10, cannabisLegal: false, gamblingLegal: false },
  'TWN': { drugPolicyScore: 20, cannabisLegal: false, gamblingLegal: true },
  'JPN': { drugPolicyScore: 15, cannabisLegal: false, gamblingLegal: true },
  'KOR': { drugPolicyScore: 15, cannabisLegal: false, gamblingLegal: true },
  'PRK': { drugPolicyScore: 5, cannabisLegal: false, gamblingLegal: false },
  'MNG': { drugPolicyScore: 25, cannabisLegal: false, gamblingLegal: true },

  // Oceania
  'AUS': { drugPolicyScore: 55, cannabisLegal: false, gamblingLegal: true },
  'NZL': { drugPolicyScore: 50, cannabisLegal: false, gamblingLegal: true },
  'PNG': { drugPolicyScore: 20, cannabisLegal: false, gamblingLegal: true },
  'FJI': { drugPolicyScore: 25, cannabisLegal: false, gamblingLegal: true },
  'SLB': { drugPolicyScore: 25, cannabisLegal: false, gamblingLegal: false },
  'VUT': { drugPolicyScore: 25, cannabisLegal: false, gamblingLegal: false },
  'WSM': { drugPolicyScore: 20, cannabisLegal: false, gamblingLegal: false },
  'TON': { drugPolicyScore: 20, cannabisLegal: false, gamblingLegal: false },

  // North Africa
  'EGY': { drugPolicyScore: 10, cannabisLegal: false, gamblingLegal: false },
  'LBY': { drugPolicyScore: 10, cannabisLegal: false, gamblingLegal: false },
  'TUN': { drugPolicyScore: 15, cannabisLegal: false, gamblingLegal: false },
  'DZA': { drugPolicyScore: 15, cannabisLegal: false, gamblingLegal: false },
  'MAR': { drugPolicyScore: 20, cannabisLegal: false, gamblingLegal: false },
  'MRT': { drugPolicyScore: 10, cannabisLegal: false, gamblingLegal: false },
  'SDN': { drugPolicyScore: 5, cannabisLegal: false, gamblingLegal: false },
  'SSD': { drugPolicyScore: 10, cannabisLegal: false, gamblingLegal: false },

  // West Africa
  'SEN': { drugPolicyScore: 20, cannabisLegal: false, gamblingLegal: true },
  'GMB': { drugPolicyScore: 15, cannabisLegal: false, gamblingLegal: true },
  'GNB': { drugPolicyScore: 15, cannabisLegal: false, gamblingLegal: false },
  'GIN': { drugPolicyScore: 15, cannabisLegal: false, gamblingLegal: false },
  'SLE': { drugPolicyScore: 15, cannabisLegal: false, gamblingLegal: true },
  'LBR': { drugPolicyScore: 15, cannabisLegal: false, gamblingLegal: true },
  'CIV': { drugPolicyScore: 20, cannabisLegal: false, gamblingLegal: true },
  'GHA': { drugPolicyScore: 25, cannabisLegal: false, gamblingLegal: true },
  'TGO': { drugPolicyScore: 15, cannabisLegal: false, gamblingLegal: true },
  'BEN': { drugPolicyScore: 15, cannabisLegal: false, gamblingLegal: true },
  'NER': { drugPolicyScore: 10, cannabisLegal: false, gamblingLegal: false },
  'NGA': { drugPolicyScore: 15, cannabisLegal: false, gamblingLegal: true },
  'MLI': { drugPolicyScore: 15, cannabisLegal: false, gamblingLegal: false },
  'BFA': { drugPolicyScore: 15, cannabisLegal: false, gamblingLegal: false },

  // Central Africa
  'TCD': { drugPolicyScore: 10, cannabisLegal: false, gamblingLegal: false },
  'CMR': { drugPolicyScore: 15, cannabisLegal: false, gamblingLegal: true },
  'CAF': { drugPolicyScore: 10, cannabisLegal: false, gamblingLegal: false },
  'GNQ': { drugPolicyScore: 10, cannabisLegal: false, gamblingLegal: false },
  'GAB': { drugPolicyScore: 15, cannabisLegal: false, gamblingLegal: true },
  'COG': { drugPolicyScore: 15, cannabisLegal: false, gamblingLegal: true },
  'COD': { drugPolicyScore: 10, cannabisLegal: false, gamblingLegal: false },
  'AGO': { drugPolicyScore: 15, cannabisLegal: false, gamblingLegal: true },

  // East Africa
  'ERI': { drugPolicyScore: 10, cannabisLegal: false, gamblingLegal: false },
  'ETH': { drugPolicyScore: 10, cannabisLegal: false, gamblingLegal: false },
  'DJI': { drugPolicyScore: 15, cannabisLegal: false, gamblingLegal: false },
  'SOM': { drugPolicyScore: 5, cannabisLegal: false, gamblingLegal: false },
  'KEN': { drugPolicyScore: 20, cannabisLegal: false, gamblingLegal: true },
  'UGA': { drugPolicyScore: 15, cannabisLegal: false, gamblingLegal: true },
  'RWA': { drugPolicyScore: 15, cannabisLegal: false, gamblingLegal: false },
  'BDI': { drugPolicyScore: 10, cannabisLegal: false, gamblingLegal: false },
  'TZA': { drugPolicyScore: 15, cannabisLegal: false, gamblingLegal: true },

  // Southern Africa
  'ZMB': { drugPolicyScore: 20, cannabisLegal: false, gamblingLegal: true },
  'MWI': { drugPolicyScore: 15, cannabisLegal: false, gamblingLegal: true },
  'MOZ': { drugPolicyScore: 15, cannabisLegal: false, gamblingLegal: true },
  'ZWE': { drugPolicyScore: 15, cannabisLegal: false, gamblingLegal: true },
  'BWA': { drugPolicyScore: 25, cannabisLegal: false, gamblingLegal: true },
  'NAM': { drugPolicyScore: 25, cannabisLegal: false, gamblingLegal: true },
  'ZAF': { drugPolicyScore: 45, cannabisLegal: false, gamblingLegal: true },
  'LSO': { drugPolicyScore: 20, cannabisLegal: false, gamblingLegal: true },
  'SWZ': { drugPolicyScore: 15, cannabisLegal: false, gamblingLegal: true },
  'MDG': { drugPolicyScore: 15, cannabisLegal: false, gamblingLegal: true },
  'MUS': { drugPolicyScore: 20, cannabisLegal: false, gamblingLegal: true },
  'SYC': { drugPolicyScore: 25, cannabisLegal: false, gamblingLegal: true },
  'COM': { drugPolicyScore: 10, cannabisLegal: false, gamblingLegal: false },
};

const transportData = {
  // North America
  'USA': { publicTransitUsage: 5.2, trafficIndex: 42, flightsPerCapita: 2.1 },
  'CAN': { publicTransitUsage: 12.4, trafficIndex: 38, flightsPerCapita: 1.8 },
  'MEX': { publicTransitUsage: 28.5, trafficIndex: 65, flightsPerCapita: 0.4 },

  // Central America & Caribbean
  'GTM': { publicTransitUsage: 35.2, trafficIndex: 58, flightsPerCapita: 0.2 },
  'BLZ': { publicTransitUsage: 15.3, trafficIndex: 35, flightsPerCapita: 0.5 },
  'SLV': { publicTransitUsage: 32.1, trafficIndex: 62, flightsPerCapita: 0.15 },
  'HND': { publicTransitUsage: 30.5, trafficIndex: 55, flightsPerCapita: 0.12 },
  'NIC': { publicTransitUsage: 28.7, trafficIndex: 48, flightsPerCapita: 0.1 },
  'CRI': { publicTransitUsage: 24.3, trafficIndex: 52, flightsPerCapita: 0.3 },
  'PAN': { publicTransitUsage: 22.8, trafficIndex: 56, flightsPerCapita: 0.6 },
  'CUB': { publicTransitUsage: 45.2, trafficIndex: 42, flightsPerCapita: 0.05 },
  'JAM': { publicTransitUsage: 32.5, trafficIndex: 50, flightsPerCapita: 0.4 },
  'HTI': { publicTransitUsage: 38.5, trafficIndex: 65, flightsPerCapita: 0.05 },
  'DOM': { publicTransitUsage: 28.3, trafficIndex: 58, flightsPerCapita: 0.25 },
  'TTO': { publicTransitUsage: 18.5, trafficIndex: 48, flightsPerCapita: 0.35 },
  'BRB': { publicTransitUsage: 22.3, trafficIndex: 40, flightsPerCapita: 0.8 },
  'BHS': { publicTransitUsage: 12.5, trafficIndex: 38, flightsPerCapita: 1.2 },

  // South America
  'COL': { publicTransitUsage: 32.5, trafficIndex: 68, flightsPerCapita: 0.5 },
  'VEN': { publicTransitUsage: 35.2, trafficIndex: 72, flightsPerCapita: 0.1 },
  'GUY': { publicTransitUsage: 18.5, trafficIndex: 42, flightsPerCapita: 0.2 },
  'SUR': { publicTransitUsage: 20.3, trafficIndex: 38, flightsPerCapita: 0.3 },
  'ECU': { publicTransitUsage: 35.8, trafficIndex: 62, flightsPerCapita: 0.3 },
  'PER': { publicTransitUsage: 38.2, trafficIndex: 70, flightsPerCapita: 0.35 },
  'BRA': { publicTransitUsage: 28.5, trafficIndex: 71, flightsPerCapita: 0.6 },
  'BOL': { publicTransitUsage: 40.2, trafficIndex: 58, flightsPerCapita: 0.25 },
  'PRY': { publicTransitUsage: 32.5, trafficIndex: 52, flightsPerCapita: 0.15 },
  'CHL': { publicTransitUsage: 24.8, trafficIndex: 64, flightsPerCapita: 0.7 },
  'ARG': { publicTransitUsage: 30.2, trafficIndex: 68, flightsPerCapita: 0.45 },
  'URY': { publicTransitUsage: 28.5, trafficIndex: 48, flightsPerCapita: 0.4 },

  // Western Europe
  'GBR': { publicTransitUsage: 18.5, trafficIndex: 48, flightsPerCapita: 3.2 },
  'IRL': { publicTransitUsage: 12.8, trafficIndex: 42, flightsPerCapita: 4.5 },
  'ISL': { publicTransitUsage: 8.5, trafficIndex: 22, flightsPerCapita: 5.2 },
  'NOR': { publicTransitUsage: 16.2, trafficIndex: 32, flightsPerCapita: 4.8 },
  'SWE': { publicTransitUsage: 21.5, trafficIndex: 28, flightsPerCapita: 3.5 },
  'FIN': { publicTransitUsage: 18.3, trafficIndex: 26, flightsPerCapita: 2.8 },
  'DNK': { publicTransitUsage: 22.8, trafficIndex: 35, flightsPerCapita: 3.8 },
  'NLD': { publicTransitUsage: 28.5, trafficIndex: 42, flightsPerCapita: 3.2 },
  'BEL': { publicTransitUsage: 20.5, trafficIndex: 52, flightsPerCapita: 2.5 },
  'LUX': { publicTransitUsage: 18.2, trafficIndex: 45, flightsPerCapita: 6.5 },
  'FRA': { publicTransitUsage: 24.2, trafficIndex: 51, flightsPerCapita: 2.2 },
  'DEU': { publicTransitUsage: 22.8, trafficIndex: 46, flightsPerCapita: 2.8 },
  'CHE': { publicTransitUsage: 35.2, trafficIndex: 38, flightsPerCapita: 3.5 },
  'AUT': { publicTransitUsage: 26.5, trafficIndex: 40, flightsPerCapita: 2.8 },
  'ESP': { publicTransitUsage: 20.5, trafficIndex: 48, flightsPerCapita: 2.5 },
  'PRT': { publicTransitUsage: 18.8, trafficIndex: 44, flightsPerCapita: 2.8 },
  'ITA': { publicTransitUsage: 18.2, trafficIndex: 58, flightsPerCapita: 1.8 },
  'MLT': { publicTransitUsage: 15.5, trafficIndex: 52, flightsPerCapita: 8.5 },
  'GRC': { publicTransitUsage: 16.5, trafficIndex: 55, flightsPerCapita: 2.2 },
  'CYP': { publicTransitUsage: 8.5, trafficIndex: 42, flightsPerCapita: 4.2 },

  // Eastern Europe
  'EST': { publicTransitUsage: 22.5, trafficIndex: 32, flightsPerCapita: 3.2 },
  'LVA': { publicTransitUsage: 28.5, trafficIndex: 35, flightsPerCapita: 2.8 },
  'LTU': { publicTransitUsage: 24.8, trafficIndex: 38, flightsPerCapita: 2.5 },
  'POL': { publicTransitUsage: 26.5, trafficIndex: 48, flightsPerCapita: 0.8 },
  'CZE': { publicTransitUsage: 32.5, trafficIndex: 45, flightsPerCapita: 1.2 },
  'SVK': { publicTransitUsage: 28.5, trafficIndex: 42, flightsPerCapita: 0.6 },
  'HUN': { publicTransitUsage: 30.2, trafficIndex: 52, flightsPerCapita: 1.5 },
  'ROU': { publicTransitUsage: 22.8, trafficIndex: 68, flightsPerCapita: 0.5 },
  'BGR': { publicTransitUsage: 25.5, trafficIndex: 55, flightsPerCapita: 0.8 },
  'SVN': { publicTransitUsage: 18.5, trafficIndex: 42, flightsPerCapita: 1.8 },
  'HRV': { publicTransitUsage: 16.8, trafficIndex: 45, flightsPerCapita: 1.5 },
  'BIH': { publicTransitUsage: 22.5, trafficIndex: 48, flightsPerCapita: 0.3 },
  'SRB': { publicTransitUsage: 28.5, trafficIndex: 58, flightsPerCapita: 0.4 },
  'MNE': { publicTransitUsage: 18.5, trafficIndex: 42, flightsPerCapita: 0.8 },
  'MKD': { publicTransitUsage: 24.5, trafficIndex: 52, flightsPerCapita: 0.4 },
  'ALB': { publicTransitUsage: 26.5, trafficIndex: 55, flightsPerCapita: 0.5 },
  'UKR': { publicTransitUsage: 35.2, trafficIndex: 62, flightsPerCapita: 0.2 },
  'BLR': { publicTransitUsage: 42.5, trafficIndex: 48, flightsPerCapita: 0.3 },
  'MDA': { publicTransitUsage: 32.5, trafficIndex: 52, flightsPerCapita: 0.2 },
  'RUS': { publicTransitUsage: 38.5, trafficIndex: 65, flightsPerCapita: 0.8 },

  // Middle East
  'TUR': { publicTransitUsage: 28.5, trafficIndex: 72, flightsPerCapita: 0.8 },
  'GEO': { publicTransitUsage: 32.5, trafficIndex: 55, flightsPerCapita: 0.6 },
  'ARM': { publicTransitUsage: 35.2, trafficIndex: 58, flightsPerCapita: 0.4 },
  'AZE': { publicTransitUsage: 32.5, trafficIndex: 62, flightsPerCapita: 0.5 },
  'IRN': { publicTransitUsage: 32.5, trafficIndex: 75, flightsPerCapita: 0.3 },
  'IRQ': { publicTransitUsage: 28.5, trafficIndex: 70, flightsPerCapita: 0.15 },
  'SYR': { publicTransitUsage: 32.5, trafficIndex: 65, flightsPerCapita: 0.05 },
  'JOR': { publicTransitUsage: 22.5, trafficIndex: 62, flightsPerCapita: 0.5 },
  'ISR': { publicTransitUsage: 24.5, trafficIndex: 58, flightsPerCapita: 2.2 },
  'PSE': { publicTransitUsage: 28.5, trafficIndex: 68, flightsPerCapita: 0.05 },
  'LBN': { publicTransitUsage: 26.5, trafficIndex: 72, flightsPerCapita: 0.4 },
  'SAU': { publicTransitUsage: 8.5, trafficIndex: 68, flightsPerCapita: 1.5 },
  'YEM': { publicTransitUsage: 32.5, trafficIndex: 62, flightsPerCapita: 0.05 },
  'OMN': { publicTransitUsage: 6.5, trafficIndex: 45, flightsPerCapita: 1.2 },
  'ARE': { publicTransitUsage: 12.5, trafficIndex: 52, flightsPerCapita: 4.5 },
  'QAT': { publicTransitUsage: 10.5, trafficIndex: 48, flightsPerCapita: 5.2 },
  'BHR': { publicTransitUsage: 8.5, trafficIndex: 55, flightsPerCapita: 2.8 },
  'KWT': { publicTransitUsage: 7.5, trafficIndex: 62, flightsPerCapita: 1.8 },

  // Central Asia
  'KAZ': { publicTransitUsage: 35.2, trafficIndex: 55, flightsPerCapita: 0.6 },
  'UZB': { publicTransitUsage: 38.5, trafficIndex: 58, flightsPerCapita: 0.3 },
  'TKM': { publicTransitUsage: 32.5, trafficIndex: 52, flightsPerCapita: 0.2 },
  'KGZ': { publicTransitUsage: 35.2, trafficIndex: 55, flightsPerCapita: 0.25 },
  'TJK': { publicTransitUsage: 32.5, trafficIndex: 52, flightsPerCapita: 0.15 },
  'AFG': { publicTransitUsage: 28.5, trafficIndex: 68, flightsPerCapita: 0.05 },
  'PAK': { publicTransitUsage: 42.5, trafficIndex: 78, flightsPerCapita: 0.15 },

  // South Asia
  'IND': { publicTransitUsage: 48.5, trafficIndex: 82, flightsPerCapita: 0.2 },
  'BGD': { publicTransitUsage: 52.5, trafficIndex: 85, flightsPerCapita: 0.08 },
  'NPL': { publicTransitUsage: 45.5, trafficIndex: 72, flightsPerCapita: 0.06 },
  'BTN': { publicTransitUsage: 35.5, trafficIndex: 42, flightsPerCapita: 0.15 },
  'LKA': { publicTransitUsage: 42.5, trafficIndex: 68, flightsPerCapita: 0.2 },
  'MDV': { publicTransitUsage: 15.5, trafficIndex: 32, flightsPerCapita: 3.5 },

  // Southeast Asia
  'MMR': { publicTransitUsage: 48.5, trafficIndex: 72, flightsPerCapita: 0.08 },
  'THA': { publicTransitUsage: 38.5, trafficIndex: 75, flightsPerCapita: 0.6 },
  'LAO': { publicTransitUsage: 42.5, trafficIndex: 58, flightsPerCapita: 0.1 },
  'VNM': { publicTransitUsage: 52.5, trafficIndex: 78, flightsPerCapita: 0.25 },
  'KHM': { publicTransitUsage: 45.5, trafficIndex: 68, flightsPerCapita: 0.12 },
  'MYS': { publicTransitUsage: 28.5, trafficIndex: 68, flightsPerCapita: 1.2 },
  'SGP': { publicTransitUsage: 65.2, trafficIndex: 42, flightsPerCapita: 6.5 },
  'BRN': { publicTransitUsage: 8.5, trafficIndex: 35, flightsPerCapita: 1.5 },
  'IDN': { publicTransitUsage: 42.5, trafficIndex: 80, flightsPerCapita: 0.3 },
  'PHL': { publicTransitUsage: 48.5, trafficIndex: 88, flightsPerCapita: 0.35 },
  'TLS': { publicTransitUsage: 35.5, trafficIndex: 48, flightsPerCapita: 0.15 },

  // East Asia
  'CHN': { publicTransitUsage: 45.2, trafficIndex: 72, flightsPerCapita: 0.5 },
  'TWN': { publicTransitUsage: 42.5, trafficIndex: 58, flightsPerCapita: 1.8 },
  'JPN': { publicTransitUsage: 58.5, trafficIndex: 48, flightsPerCapita: 1.2 },
  'KOR': { publicTransitUsage: 62.5, trafficIndex: 52, flightsPerCapita: 1.5 },
  'PRK': { publicTransitUsage: 55.5, trafficIndex: 45, flightsPerCapita: 0.01 },
  'MNG': { publicTransitUsage: 32.5, trafficIndex: 52, flightsPerCapita: 0.3 },

  // Oceania
  'AUS': { publicTransitUsage: 10.5, trafficIndex: 42, flightsPerCapita: 3.5 },
  'NZL': { publicTransitUsage: 8.5, trafficIndex: 38, flightsPerCapita: 2.8 },
  'PNG': { publicTransitUsage: 32.5, trafficIndex: 55, flightsPerCapita: 0.2 },
  'FJI': { publicTransitUsage: 25.5, trafficIndex: 42, flightsPerCapita: 0.8 },
  'SLB': { publicTransitUsage: 28.5, trafficIndex: 38, flightsPerCapita: 0.3 },
  'VUT': { publicTransitUsage: 22.5, trafficIndex: 35, flightsPerCapita: 0.5 },
  'WSM': { publicTransitUsage: 18.5, trafficIndex: 32, flightsPerCapita: 0.4 },
  'TON': { publicTransitUsage: 20.5, trafficIndex: 28, flightsPerCapita: 0.6 },

  // North Africa
  'EGY': { publicTransitUsage: 38.5, trafficIndex: 88, flightsPerCapita: 0.2 },
  'LBY': { publicTransitUsage: 15.5, trafficIndex: 68, flightsPerCapita: 0.15 },
  'TUN': { publicTransitUsage: 32.5, trafficIndex: 62, flightsPerCapita: 0.3 },
  'DZA': { publicTransitUsage: 28.5, trafficIndex: 72, flightsPerCapita: 0.25 },
  'MAR': { publicTransitUsage: 35.5, trafficIndex: 68, flightsPerCapita: 0.35 },
  'MRT': { publicTransitUsage: 32.5, trafficIndex: 52, flightsPerCapita: 0.1 },
  'SDN': { publicTransitUsage: 38.5, trafficIndex: 72, flightsPerCapita: 0.05 },
  'SSD': { publicTransitUsage: 35.5, trafficIndex: 65, flightsPerCapita: 0.03 },

  // West Africa
  'SEN': { publicTransitUsage: 42.5, trafficIndex: 68, flightsPerCapita: 0.15 },
  'GMB': { publicTransitUsage: 38.5, trafficIndex: 58, flightsPerCapita: 0.12 },
  'GNB': { publicTransitUsage: 40.5, trafficIndex: 55, flightsPerCapita: 0.08 },
  'GIN': { publicTransitUsage: 45.5, trafficIndex: 72, flightsPerCapita: 0.08 },
  'SLE': { publicTransitUsage: 42.5, trafficIndex: 68, flightsPerCapita: 0.1 },
  'LBR': { publicTransitUsage: 38.5, trafficIndex: 65, flightsPerCapita: 0.08 },
  'CIV': { publicTransitUsage: 42.5, trafficIndex: 78, flightsPerCapita: 0.15 },
  'GHA': { publicTransitUsage: 45.5, trafficIndex: 75, flightsPerCapita: 0.2 },
  'TGO': { publicTransitUsage: 48.5, trafficIndex: 68, flightsPerCapita: 0.1 },
  'BEN': { publicTransitUsage: 46.5, trafficIndex: 70, flightsPerCapita: 0.12 },
  'NER': { publicTransitUsage: 42.5, trafficIndex: 62, flightsPerCapita: 0.05 },
  'NGA': { publicTransitUsage: 52.5, trafficIndex: 92, flightsPerCapita: 0.12 },
  'MLI': { publicTransitUsage: 45.5, trafficIndex: 65, flightsPerCapita: 0.08 },
  'BFA': { publicTransitUsage: 48.5, trafficIndex: 68, flightsPerCapita: 0.06 },

  // Central Africa
  'TCD': { publicTransitUsage: 38.5, trafficIndex: 58, flightsPerCapita: 0.04 },
  'CMR': { publicTransitUsage: 45.5, trafficIndex: 72, flightsPerCapita: 0.1 },
  'CAF': { publicTransitUsage: 42.5, trafficIndex: 62, flightsPerCapita: 0.03 },
  'GNQ': { publicTransitUsage: 32.5, trafficIndex: 55, flightsPerCapita: 0.2 },
  'GAB': { publicTransitUsage: 35.5, trafficIndex: 58, flightsPerCapita: 0.25 },
  'COG': { publicTransitUsage: 42.5, trafficIndex: 68, flightsPerCapita: 0.15 },
  'COD': { publicTransitUsage: 52.5, trafficIndex: 78, flightsPerCapita: 0.02 },
  'AGO': { publicTransitUsage: 42.5, trafficIndex: 75, flightsPerCapita: 0.12 },

  // East Africa
  'ERI': { publicTransitUsage: 35.5, trafficIndex: 52, flightsPerCapita: 0.03 },
  'ETH': { publicTransitUsage: 48.5, trafficIndex: 72, flightsPerCapita: 0.08 },
  'DJI': { publicTransitUsage: 32.5, trafficIndex: 55, flightsPerCapita: 0.2 },
  'SOM': { publicTransitUsage: 38.5, trafficIndex: 68, flightsPerCapita: 0.02 },
  'KEN': { publicTransitUsage: 48.5, trafficIndex: 82, flightsPerCapita: 0.15 },
  'UGA': { publicTransitUsage: 45.5, trafficIndex: 75, flightsPerCapita: 0.08 },
  'RWA': { publicTransitUsage: 42.5, trafficIndex: 62, flightsPerCapita: 0.12 },
  'BDI': { publicTransitUsage: 45.5, trafficIndex: 58, flightsPerCapita: 0.04 },
  'TZA': { publicTransitUsage: 48.5, trafficIndex: 75, flightsPerCapita: 0.1 },

  // Southern Africa
  'ZMB': { publicTransitUsage: 42.5, trafficIndex: 68, flightsPerCapita: 0.12 },
  'MWI': { publicTransitUsage: 45.5, trafficIndex: 65, flightsPerCapita: 0.06 },
  'MOZ': { publicTransitUsage: 48.5, trafficIndex: 72, flightsPerCapita: 0.08 },
  'ZWE': { publicTransitUsage: 42.5, trafficIndex: 68, flightsPerCapita: 0.08 },
  'BWA': { publicTransitUsage: 28.5, trafficIndex: 52, flightsPerCapita: 0.35 },
  'NAM': { publicTransitUsage: 32.5, trafficIndex: 48, flightsPerCapita: 0.4 },
  'ZAF': { publicTransitUsage: 22.5, trafficIndex: 72, flightsPerCapita: 0.5 },
  'LSO': { publicTransitUsage: 38.5, trafficIndex: 55, flightsPerCapita: 0.08 },
  'SWZ': { publicTransitUsage: 35.5, trafficIndex: 52, flightsPerCapita: 0.1 },
  'MDG': { publicTransitUsage: 48.5, trafficIndex: 72, flightsPerCapita: 0.06 },
  'MUS': { publicTransitUsage: 28.5, trafficIndex: 58, flightsPerCapita: 0.8 },
  'SYC': { publicTransitUsage: 18.5, trafficIndex: 35, flightsPerCapita: 2.5 },
  'COM': { publicTransitUsage: 35.5, trafficIndex: 48, flightsPerCapita: 0.15 },
};

const environmentData = {
  // North America
  'USA': { plasticWaste: 105, waterStress: 2.8, ecoFootprint: 8.1 },
  'CAN': { plasticWaste: 95, waterStress: 1.5, ecoFootprint: 8.8 },
  'MEX': { plasticWaste: 52, waterStress: 3.2, ecoFootprint: 2.8 },

  // Central America & Caribbean
  'GTM': { plasticWaste: 28, waterStress: 2.5, ecoFootprint: 1.7 },
  'BLZ': { plasticWaste: 32, waterStress: 1.8, ecoFootprint: 2.2 },
  'SLV': { plasticWaste: 26, waterStress: 2.8, ecoFootprint: 1.4 },
  'HND': { plasticWaste: 24, waterStress: 2.2, ecoFootprint: 1.6 },
  'NIC': { plasticWaste: 22, waterStress: 1.9, ecoFootprint: 1.8 },
  'CRI': { plasticWaste: 35, waterStress: 1.6, ecoFootprint: 2.3 },
  'PAN': { plasticWaste: 38, waterStress: 1.7, ecoFootprint: 2.5 },
  'CUB': { plasticWaste: 18, waterStress: 2.4, ecoFootprint: 1.9 },
  'JAM': { plasticWaste: 30, waterStress: 2.6, ecoFootprint: 1.8 },
  'HTI': { plasticWaste: 12, waterStress: 3.5, ecoFootprint: 0.7 },
  'DOM': { plasticWaste: 32, waterStress: 2.8, ecoFootprint: 1.5 },
  'TTO': { plasticWaste: 45, waterStress: 2.2, ecoFootprint: 3.4 },
  'BRB': { plasticWaste: 42, waterStress: 2.9, ecoFootprint: 4.2 },
  'BHS': { plasticWaste: 68, waterStress: 2.5, ecoFootprint: 5.5 },

  // South America
  'COL': { plasticWaste: 38, waterStress: 1.8, ecoFootprint: 2.0 },
  'VEN': { plasticWaste: 35, waterStress: 2.2, ecoFootprint: 2.8 },
  'GUY': { plasticWaste: 28, waterStress: 1.2, ecoFootprint: 2.1 },
  'SUR': { plasticWaste: 32, waterStress: 1.3, ecoFootprint: 2.4 },
  'ECU': { plasticWaste: 32, waterStress: 2.1, ecoFootprint: 2.2 },
  'PER': { plasticWaste: 30, waterStress: 2.8, ecoFootprint: 2.5 },
  'BRA': { plasticWaste: 42, waterStress: 1.9, ecoFootprint: 3.1 },
  'BOL': { plasticWaste: 22, waterStress: 1.6, ecoFootprint: 2.8 },
  'PRY': { plasticWaste: 26, waterStress: 1.4, ecoFootprint: 3.2 },
  'CHL': { plasticWaste: 51, waterStress: 3.5, ecoFootprint: 4.2 },
  'ARG': { plasticWaste: 48, waterStress: 2.2, ecoFootprint: 3.8 },
  'URY': { plasticWaste: 45, waterStress: 1.8, ecoFootprint: 4.5 },

  // Western Europe
  'GBR': { plasticWaste: 98, waterStress: 1.8, ecoFootprint: 4.9 },
  'IRL': { plasticWaste: 72, waterStress: 1.2, ecoFootprint: 5.8 },
  'ISL': { plasticWaste: 68, waterStress: 0.8, ecoFootprint: 6.5 },
  'NOR': { plasticWaste: 78, waterStress: 0.9, ecoFootprint: 6.2 },
  'SWE': { plasticWaste: 62, waterStress: 1.0, ecoFootprint: 6.8 },
  'FIN': { plasticWaste: 58, waterStress: 0.8, ecoFootprint: 6.4 },
  'DNK': { plasticWaste: 68, waterStress: 1.2, ecoFootprint: 5.9 },
  'NLD': { plasticWaste: 85, waterStress: 2.2, ecoFootprint: 5.3 },
  'BEL': { plasticWaste: 88, waterStress: 2.5, ecoFootprint: 5.1 },
  'LUX': { plasticWaste: 92, waterStress: 1.8, ecoFootprint: 7.2 },
  'FRA': { plasticWaste: 78, waterStress: 1.9, ecoFootprint: 4.7 },
  'DEU': { plasticWaste: 82, waterStress: 2.1, ecoFootprint: 4.8 },
  'CHE': { plasticWaste: 75, waterStress: 1.5, ecoFootprint: 5.2 },
  'AUT': { plasticWaste: 72, waterStress: 1.6, ecoFootprint: 5.5 },
  'ESP': { plasticWaste: 68, waterStress: 3.2, ecoFootprint: 4.0 },
  'PRT': { plasticWaste: 62, waterStress: 2.8, ecoFootprint: 3.9 },
  'ITA': { plasticWaste: 72, waterStress: 3.5, ecoFootprint: 4.4 },
  'MLT': { plasticWaste: 65, waterStress: 4.2, ecoFootprint: 4.8 },
  'GRC': { plasticWaste: 58, waterStress: 3.8, ecoFootprint: 4.2 },
  'CYP': { plasticWaste: 62, waterStress: 4.5, ecoFootprint: 4.6 },

  // Eastern Europe
  'EST': { plasticWaste: 55, waterStress: 1.4, ecoFootprint: 5.8 },
  'LVA': { plasticWaste: 52, waterStress: 1.3, ecoFootprint: 4.9 },
  'LTU': { plasticWaste: 54, waterStress: 1.4, ecoFootprint: 5.2 },
  'POL': { plasticWaste: 58, waterStress: 1.8, ecoFootprint: 4.3 },
  'CZE': { plasticWaste: 62, waterStress: 1.9, ecoFootprint: 5.1 },
  'SVK': { plasticWaste: 56, waterStress: 1.7, ecoFootprint: 4.5 },
  'HUN': { plasticWaste: 58, waterStress: 2.1, ecoFootprint: 3.8 },
  'ROU': { plasticWaste: 48, waterStress: 2.2, ecoFootprint: 2.9 },
  'BGR': { plasticWaste: 45, waterStress: 2.4, ecoFootprint: 3.2 },
  'SVN': { plasticWaste: 65, waterStress: 1.6, ecoFootprint: 5.5 },
  'HRV': { plasticWaste: 58, waterStress: 1.8, ecoFootprint: 4.2 },
  'BIH': { plasticWaste: 42, waterStress: 1.9, ecoFootprint: 3.5 },
  'SRB': { plasticWaste: 45, waterStress: 2.2, ecoFootprint: 3.2 },
  'MNE': { plasticWaste: 48, waterStress: 1.8, ecoFootprint: 3.8 },
  'MKD': { plasticWaste: 42, waterStress: 2.5, ecoFootprint: 3.4 },
  'ALB': { plasticWaste: 38, waterStress: 2.3, ecoFootprint: 2.8 },
  'UKR': { plasticWaste: 38, waterStress: 2.4, ecoFootprint: 2.8 },
  'BLR': { plasticWaste: 42, waterStress: 1.6, ecoFootprint: 4.2 },
  'MDA': { plasticWaste: 35, waterStress: 2.5, ecoFootprint: 2.1 },
  'RUS': { plasticWaste: 48, waterStress: 1.8, ecoFootprint: 4.8 },

  // Middle East
  'TUR': { plasticWaste: 52, waterStress: 3.8, ecoFootprint: 3.4 },
  'GEO': { plasticWaste: 38, waterStress: 2.2, ecoFootprint: 2.2 },
  'ARM': { plasticWaste: 32, waterStress: 2.8, ecoFootprint: 2.1 },
  'AZE': { plasticWaste: 42, waterStress: 3.2, ecoFootprint: 2.8 },
  'IRN': { plasticWaste: 38, waterStress: 4.5, ecoFootprint: 3.2 },
  'IRQ': { plasticWaste: 32, waterStress: 4.8, ecoFootprint: 2.4 },
  'SYR': { plasticWaste: 28, waterStress: 4.5, ecoFootprint: 2.0 },
  'JOR': { plasticWaste: 42, waterStress: 4.9, ecoFootprint: 2.5 },
  'ISR': { plasticWaste: 72, waterStress: 3.8, ecoFootprint: 5.2 },
  'PSE': { plasticWaste: 32, waterStress: 4.5, ecoFootprint: 1.2 },
  'LBN': { plasticWaste: 45, waterStress: 4.2, ecoFootprint: 3.5 },
  'SAU': { plasticWaste: 85, waterStress: 5.0, ecoFootprint: 5.8 },
  'YEM': { plasticWaste: 18, waterStress: 4.8, ecoFootprint: 0.9 },
  'OMN': { plasticWaste: 78, waterStress: 4.9, ecoFootprint: 5.5 },
  'ARE': { plasticWaste: 115, waterStress: 4.9, ecoFootprint: 8.4 },
  'QAT': { plasticWaste: 125, waterStress: 4.9, ecoFootprint: 9.2 },
  'BHR': { plasticWaste: 92, waterStress: 4.8, ecoFootprint: 6.8 },
  'KWT': { plasticWaste: 98, waterStress: 4.9, ecoFootprint: 7.5 },

  // Central Asia
  'KAZ': { plasticWaste: 42, waterStress: 3.5, ecoFootprint: 4.5 },
  'UZB': { plasticWaste: 28, waterStress: 4.2, ecoFootprint: 2.2 },
  'TKM': { plasticWaste: 32, waterStress: 4.5, ecoFootprint: 3.5 },
  'KGZ': { plasticWaste: 25, waterStress: 2.8, ecoFootprint: 1.8 },
  'TJK': { plasticWaste: 18, waterStress: 3.2, ecoFootprint: 1.2 },
  'AFG': { plasticWaste: 12, waterStress: 4.2, ecoFootprint: 0.8 },
  'PAK': { plasticWaste: 22, waterStress: 4.5, ecoFootprint: 0.9 },

  // South Asia
  'IND': { plasticWaste: 28, waterStress: 4.5, ecoFootprint: 1.2 },
  'BGD': { plasticWaste: 18, waterStress: 4.2, ecoFootprint: 0.7 },
  'NPL': { plasticWaste: 15, waterStress: 3.5, ecoFootprint: 1.0 },
  'BTN': { plasticWaste: 12, waterStress: 1.8, ecoFootprint: 2.8 },
  'LKA': { plasticWaste: 24, waterStress: 3.2, ecoFootprint: 1.3 },
  'MDV': { plasticWaste: 45, waterStress: 3.8, ecoFootprint: 3.5 },

  // Southeast Asia
  'MMR': { plasticWaste: 18, waterStress: 2.8, ecoFootprint: 1.1 },
  'THA': { plasticWaste: 42, waterStress: 3.2, ecoFootprint: 2.7 },
  'LAO': { plasticWaste: 16, waterStress: 1.9, ecoFootprint: 1.8 },
  'VNM': { plasticWaste: 32, waterStress: 2.8, ecoFootprint: 1.7 },
  'KHM': { plasticWaste: 22, waterStress: 2.2, ecoFootprint: 1.4 },
  'MYS': { plasticWaste: 58, waterStress: 2.5, ecoFootprint: 4.2 },
  'SGP': { plasticWaste: 78, waterStress: 3.5, ecoFootprint: 7.8 },
  'BRN': { plasticWaste: 62, waterStress: 2.2, ecoFootprint: 6.5 },
  'IDN': { plasticWaste: 32, waterStress: 2.8, ecoFootprint: 1.6 },
  'PHL': { plasticWaste: 35, waterStress: 2.9, ecoFootprint: 1.3 },
  'TLS': { plasticWaste: 14, waterStress: 2.5, ecoFootprint: 1.2 },

  // East Asia
  'CHN': { plasticWaste: 52, waterStress: 3.8, ecoFootprint: 3.8 },
  'TWN': { plasticWaste: 65, waterStress: 3.2, ecoFootprint: 5.5 },
  'JPN': { plasticWaste: 72, waterStress: 2.8, ecoFootprint: 4.8 },
  'KOR': { plasticWaste: 68, waterStress: 3.2, ecoFootprint: 5.2 },
  'PRK': { plasticWaste: 15, waterStress: 2.5, ecoFootprint: 1.2 },
  'MNG': { plasticWaste: 28, waterStress: 2.2, ecoFootprint: 4.8 },

  // Oceania
  'AUS': { plasticWaste: 102, waterStress: 3.5, ecoFootprint: 7.2 },
  'NZL': { plasticWaste: 88, waterStress: 1.5, ecoFootprint: 5.8 },
  'PNG': { plasticWaste: 12, waterStress: 1.2, ecoFootprint: 1.5 },
  'FJI': { plasticWaste: 24, waterStress: 1.4, ecoFootprint: 2.2 },
  'SLB': { plasticWaste: 14, waterStress: 1.2, ecoFootprint: 1.8 },
  'VUT': { plasticWaste: 18, waterStress: 1.3, ecoFootprint: 1.9 },
  'WSM': { plasticWaste: 22, waterStress: 1.5, ecoFootprint: 2.1 },
  'TON': { plasticWaste: 26, waterStress: 1.6, ecoFootprint: 2.3 },

  // North Africa
  'EGY': { plasticWaste: 32, waterStress: 4.8, ecoFootprint: 1.8 },
  'LBY': { plasticWaste: 45, waterStress: 4.9, ecoFootprint: 3.5 },
  'TUN': { plasticWaste: 38, waterStress: 4.2, ecoFootprint: 2.5 },
  'DZA': { plasticWaste: 42, waterStress: 4.5, ecoFootprint: 2.8 },
  'MAR': { plasticWaste: 35, waterStress: 4.2, ecoFootprint: 1.9 },
  'MRT': { plasticWaste: 18, waterStress: 4.5, ecoFootprint: 1.8 },
  'SDN': { plasticWaste: 14, waterStress: 4.5, ecoFootprint: 1.2 },
  'SSD': { plasticWaste: 8, waterStress: 3.8, ecoFootprint: 0.9 },

  // West Africa
  'SEN': { plasticWaste: 18, waterStress: 3.2, ecoFootprint: 1.3 },
  'GMB': { plasticWaste: 16, waterStress: 3.5, ecoFootprint: 1.1 },
  'GNB': { plasticWaste: 12, waterStress: 2.8, ecoFootprint: 1.0 },
  'GIN': { plasticWaste: 14, waterStress: 2.5, ecoFootprint: 1.2 },
  'SLE': { plasticWaste: 15, waterStress: 2.2, ecoFootprint: 1.1 },
  'LBR': { plasticWaste: 13, waterStress: 1.8, ecoFootprint: 1.0 },
  'CIV': { plasticWaste: 22, waterStress: 2.8, ecoFootprint: 1.4 },
  'GHA': { plasticWaste: 24, waterStress: 3.2, ecoFootprint: 1.6 },
  'TGO': { plasticWaste: 16, waterStress: 2.9, ecoFootprint: 1.2 },
  'BEN': { plasticWaste: 18, waterStress: 2.8, ecoFootprint: 1.3 },
  'NER': { plasticWaste: 10, waterStress: 4.2, ecoFootprint: 1.0 },
  'NGA': { plasticWaste: 22, waterStress: 3.8, ecoFootprint: 1.4 },
  'MLI': { plasticWaste: 12, waterStress: 4.0, ecoFootprint: 1.5 },
  'BFA': { plasticWaste: 11, waterStress: 3.8, ecoFootprint: 1.2 },

  // Central Africa
  'TCD': { plasticWaste: 9, waterStress: 4.2, ecoFootprint: 1.4 },
  'CMR': { plasticWaste: 16, waterStress: 2.8, ecoFootprint: 1.3 },
  'CAF': { plasticWaste: 7, waterStress: 2.2, ecoFootprint: 1.1 },
  'GNQ': { plasticWaste: 24, waterStress: 2.1, ecoFootprint: 2.5 },
  'GAB': { plasticWaste: 28, waterStress: 1.8, ecoFootprint: 2.8 },
  'COG': { plasticWaste: 18, waterStress: 1.9, ecoFootprint: 1.6 },
  'COD': { plasticWaste: 8, waterStress: 1.5, ecoFootprint: 0.9 },
  'AGO': { plasticWaste: 22, waterStress: 2.5, ecoFootprint: 1.5 },

  // East Africa
  'ERI': { plasticWaste: 10, waterStress: 4.2, ecoFootprint: 0.9 },
  'ETH': { plasticWaste: 9, waterStress: 4.0, ecoFootprint: 1.0 },
  'DJI': { plasticWaste: 22, waterStress: 4.5, ecoFootprint: 1.8 },
  'SOM': { plasticWaste: 8, waterStress: 4.2, ecoFootprint: 0.8 },
  'KEN': { plasticWaste: 18, waterStress: 3.5, ecoFootprint: 1.2 },
  'UGA': { plasticWaste: 12, waterStress: 2.8, ecoFootprint: 1.1 },
  'RWA': { plasticWaste: 11, waterStress: 2.5, ecoFootprint: 0.9 },
  'BDI': { plasticWaste: 8, waterStress: 2.8, ecoFootprint: 0.7 },
  'TZA': { plasticWaste: 14, waterStress: 3.2, ecoFootprint: 1.1 },

  // Southern Africa
  'ZMB': { plasticWaste: 15, waterStress: 2.8, ecoFootprint: 1.3 },
  'MWI': { plasticWaste: 10, waterStress: 3.2, ecoFootprint: 0.9 },
  'MOZ': { plasticWaste: 12, waterStress: 2.8, ecoFootprint: 1.0 },
  'ZWE': { plasticWaste: 14, waterStress: 3.5, ecoFootprint: 1.2 },
  'BWA': { plasticWaste: 32, waterStress: 3.8, ecoFootprint: 3.5 },
  'NAM': { plasticWaste: 28, waterStress: 4.2, ecoFootprint: 2.8 },
  'ZAF': { plasticWaste: 52, waterStress: 3.8, ecoFootprint: 3.4 },
  'LSO': { plasticWaste: 12, waterStress: 2.5, ecoFootprint: 1.2 },
  'SWZ': { plasticWaste: 16, waterStress: 2.8, ecoFootprint: 1.5 },
  'MDG': { plasticWaste: 10, waterStress: 2.2, ecoFootprint: 1.1 },
  'MUS': { plasticWaste: 42, waterStress: 3.2, ecoFootprint: 3.2 },
  'SYC': { plasticWaste: 55, waterStress: 2.8, ecoFootprint: 4.5 },
  'COM': { plasticWaste: 14, waterStress: 2.8, ecoFootprint: 1.3 },
};

// Read the countries.json file
const dataPath = path.join(__dirname, '..', 'data', 'countries.json');
console.log('Reading countries data from:', dataPath);

const countries = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
console.log(`Loaded ${countries.length} countries\n`);

let addedCount = 0;
let freedomCount = 0;
let transportCount = 0;
let environmentCount = 0;

// Update each country with the new data
countries.forEach(country => {
  const iso3 = country.iso3;

  // Add FREEDOM data
  if (freedomData[iso3]) {
    country.freedom = freedomData[iso3];
    freedomCount++;
    addedCount += 3; // 3 fields per category
  }

  // Add TRANSPORT data
  if (transportData[iso3]) {
    country.transport = transportData[iso3];
    transportCount++;
    addedCount += 3;
  }

  // Add ENVIRONMENT data
  if (environmentData[iso3]) {
    country.environment = environmentData[iso3];
    environmentCount++;
    addedCount += 3;
  }
});

// Write the updated data back to the file
fs.writeFileSync(dataPath, JSON.stringify(countries, null, 2), 'utf8');

console.log('====================================');
console.log('DATA IMPORT COMPLETE');
console.log('====================================\n');

console.log('SUMMARY:');
console.log(`Total countries processed: ${countries.length}`);
console.log(`Total data points added: ${addedCount}\n`);

console.log('BY CATEGORY:');
console.log(`FREEDOM data added to ${freedomCount} countries (${freedomCount * 3} data points)`);
console.log(`  - drugPolicyScore (0-100, 100 = most liberal)`);
console.log(`  - cannabisLegal (boolean)`);
console.log(`  - gamblingLegal (boolean)\n`);

console.log(`TRANSPORT data added to ${transportCount} countries (${transportCount * 3} data points)`);
console.log(`  - publicTransitUsage (% using public transit)`);
console.log(`  - trafficIndex (congestion index 0-100)`);
console.log(`  - flightsPerCapita (domestic + international per year)\n`);

console.log(`ENVIRONMENT data added to ${environmentCount} countries (${environmentCount * 3} data points)`);
console.log(`  - plasticWaste (kg per capita per year)`);
console.log(`  - waterStress (0-5 scale)`);
console.log(`  - ecoFootprint (global hectares per capita)\n`);

console.log('DATA SOURCES:');
console.log('- Transform Drug Policy Foundation (drug policy scores)');
console.log('- EMCDDA, WHO (cannabis & gambling legality)');
console.log('- World Bank, UITP (public transit usage)');
console.log('- TomTom Traffic Index (traffic congestion)');
console.log('- ICAO, World Bank (flights per capita)');
console.log('- World Bank, UNEP (plastic waste)');
console.log('- WRI Aqueduct, FAO (water stress)');
console.log('- Global Footprint Network (ecological footprint)\n');

console.log(`File saved to: ${dataPath}`);

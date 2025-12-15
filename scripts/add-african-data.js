/**
 * Script to add comprehensive data for African countries
 * Sources: WHO, World Bank, UN, Transparency International, World Happiness Report
 * Run with: node scripts/add-african-data.js
 */

const fs = require('fs')
const path = require('path')

const COUNTRIES_PATH = path.join(__dirname, '../data/countries.json')

// African Health Data (WHO, NCD-RisC 2023)
const AFRICA_HEALTH = {
  DZA: { lifeExpectancy: 77.1, maleHeight: 172.0, femaleHeight: 161.0, obesityRate: 27.4, fertilityRate: 2.94, suicideRate: 3.3, alcoholConsumption: 0.9 },
  AGO: { lifeExpectancy: 62.2, maleHeight: 166.0, femaleHeight: 157.0, obesityRate: 8.2, fertilityRate: 5.37, suicideRate: 8.0, alcoholConsumption: 5.5 },
  BEN: { lifeExpectancy: 60.0, maleHeight: 168.0, femaleHeight: 159.0, obesityRate: 9.6, fertilityRate: 4.95, suicideRate: 9.9, alcoholConsumption: 2.1 },
  BWA: { lifeExpectancy: 61.1, maleHeight: 171.0, femaleHeight: 161.0, obesityRate: 18.9, fertilityRate: 2.82, suicideRate: 9.6, alcoholConsumption: 8.4 },
  BFA: { lifeExpectancy: 59.3, maleHeight: 169.0, femaleHeight: 161.0, obesityRate: 5.6, fertilityRate: 4.89, suicideRate: 12.0, alcoholConsumption: 4.5 },
  BDI: { lifeExpectancy: 61.7, maleHeight: 165.0, femaleHeight: 155.0, obesityRate: 5.4, fertilityRate: 5.20, suicideRate: 7.5, alcoholConsumption: 7.0 },
  CMR: { lifeExpectancy: 60.3, maleHeight: 170.0, femaleHeight: 160.0, obesityRate: 11.4, fertilityRate: 4.50, suicideRate: 12.2, alcoholConsumption: 6.3 },
  CAF: { lifeExpectancy: 54.0, maleHeight: 167.0, femaleHeight: 158.0, obesityRate: 7.5, fertilityRate: 6.08, suicideRate: 11.8, alcoholConsumption: 3.8 },
  TCD: { lifeExpectancy: 52.5, maleHeight: 171.0, femaleHeight: 162.0, obesityRate: 6.1, fertilityRate: 6.35, suicideRate: 9.5, alcoholConsumption: 4.4 },
  COD: { lifeExpectancy: 60.7, maleHeight: 168.0, femaleHeight: 158.0, obesityRate: 6.7, fertilityRate: 6.21, suicideRate: 6.5, alcoholConsumption: 3.6 },
  COG: { lifeExpectancy: 63.5, maleHeight: 167.0, femaleHeight: 158.0, obesityRate: 9.6, fertilityRate: 4.45, suicideRate: 8.3, alcoholConsumption: 4.2 },
  CIV: { lifeExpectancy: 58.6, maleHeight: 169.0, femaleHeight: 160.0, obesityRate: 10.3, fertilityRate: 4.44, suicideRate: 11.7, alcoholConsumption: 5.9 },
  DJI: { lifeExpectancy: 62.3, maleHeight: 166.0, femaleHeight: 157.0, obesityRate: 13.5, fertilityRate: 2.80, suicideRate: 8.1, alcoholConsumption: 1.3 },
  ERI: { lifeExpectancy: 66.5, maleHeight: 168.0, femaleHeight: 158.0, obesityRate: 5.0, fertilityRate: 3.98, suicideRate: 8.4, alcoholConsumption: 1.2 },
  SWZ: { lifeExpectancy: 57.7, maleHeight: 168.0, femaleHeight: 158.0, obesityRate: 16.5, fertilityRate: 2.93, suicideRate: 13.3, alcoholConsumption: 6.5 },
  ETH: { lifeExpectancy: 65.0, maleHeight: 167.0, femaleHeight: 158.0, obesityRate: 4.5, fertilityRate: 4.15, suicideRate: 7.2, alcoholConsumption: 3.0 },
  GAB: { lifeExpectancy: 66.5, maleHeight: 170.0, femaleHeight: 160.0, obesityRate: 15.0, fertilityRate: 3.86, suicideRate: 10.6, alcoholConsumption: 9.5 },
  GMB: { lifeExpectancy: 62.6, maleHeight: 168.0, femaleHeight: 159.0, obesityRate: 10.3, fertilityRate: 4.77, suicideRate: 6.4, alcoholConsumption: 2.8 },
  GHA: { lifeExpectancy: 64.1, maleHeight: 169.0, femaleHeight: 159.0, obesityRate: 10.9, fertilityRate: 3.61, suicideRate: 5.4, alcoholConsumption: 3.8 },
  GIN: { lifeExpectancy: 58.9, maleHeight: 168.0, femaleHeight: 158.0, obesityRate: 7.7, fertilityRate: 4.63, suicideRate: 6.4, alcoholConsumption: 1.2 },
  GNB: { lifeExpectancy: 59.4, maleHeight: 168.0, femaleHeight: 158.0, obesityRate: 9.5, fertilityRate: 4.42, suicideRate: 6.3, alcoholConsumption: 2.8 },
  KEN: { lifeExpectancy: 61.4, maleHeight: 169.0, femaleHeight: 158.0, obesityRate: 7.1, fertilityRate: 3.34, suicideRate: 6.1, alcoholConsumption: 3.4 },
  LSO: { lifeExpectancy: 50.7, maleHeight: 166.0, femaleHeight: 156.0, obesityRate: 16.6, fertilityRate: 3.05, suicideRate: 17.0, alcoholConsumption: 5.0 },
  LBR: { lifeExpectancy: 60.7, maleHeight: 163.0, femaleHeight: 156.0, obesityRate: 9.9, fertilityRate: 4.18, suicideRate: 9.6, alcoholConsumption: 5.1 },
  LBY: { lifeExpectancy: 73.4, maleHeight: 173.0, femaleHeight: 161.0, obesityRate: 32.5, fertilityRate: 2.17, suicideRate: 5.4, alcoholConsumption: 0.1 },
  MDG: { lifeExpectancy: 64.5, maleHeight: 165.0, femaleHeight: 154.0, obesityRate: 5.3, fertilityRate: 3.93, suicideRate: 6.9, alcoholConsumption: 1.8 },
  MWI: { lifeExpectancy: 62.9, maleHeight: 166.0, femaleHeight: 156.0, obesityRate: 5.8, fertilityRate: 3.99, suicideRate: 7.5, alcoholConsumption: 2.5 },
  MLI: { lifeExpectancy: 58.9, maleHeight: 171.0, femaleHeight: 161.0, obesityRate: 8.6, fertilityRate: 5.92, suicideRate: 7.5, alcoholConsumption: 2.3 },
  MRT: { lifeExpectancy: 64.7, maleHeight: 170.0, femaleHeight: 160.0, obesityRate: 12.7, fertilityRate: 4.45, suicideRate: 5.4, alcoholConsumption: 0.1 },
  MUS: { lifeExpectancy: 74.4, maleHeight: 172.0, femaleHeight: 158.0, obesityRate: 10.8, fertilityRate: 1.36, suicideRate: 8.0, alcoholConsumption: 4.3 },
  MAR: { lifeExpectancy: 74.0, maleHeight: 172.0, femaleHeight: 159.0, obesityRate: 26.1, fertilityRate: 2.33, suicideRate: 4.8, alcoholConsumption: 0.7 },
  MOZ: { lifeExpectancy: 59.3, maleHeight: 164.0, femaleHeight: 155.0, obesityRate: 7.2, fertilityRate: 4.63, suicideRate: 5.7, alcoholConsumption: 1.6 },
  NAM: { lifeExpectancy: 59.3, maleHeight: 171.0, femaleHeight: 161.0, obesityRate: 17.2, fertilityRate: 3.29, suicideRate: 9.8, alcoholConsumption: 10.8 },
  NER: { lifeExpectancy: 61.6, maleHeight: 171.0, femaleHeight: 160.0, obesityRate: 5.5, fertilityRate: 6.82, suicideRate: 4.3, alcoholConsumption: 0.4 },
  RWA: { lifeExpectancy: 66.1, maleHeight: 165.0, femaleHeight: 157.0, obesityRate: 5.8, fertilityRate: 3.87, suicideRate: 9.5, alcoholConsumption: 6.8 },
  SEN: { lifeExpectancy: 68.0, maleHeight: 175.0, femaleHeight: 163.0, obesityRate: 8.8, fertilityRate: 4.45, suicideRate: 8.3, alcoholConsumption: 0.6 },
  SLE: { lifeExpectancy: 54.7, maleHeight: 166.0, femaleHeight: 157.0, obesityRate: 8.7, fertilityRate: 4.08, suicideRate: 7.0, alcoholConsumption: 5.7 },
  SOM: { lifeExpectancy: 55.4, maleHeight: 175.0, femaleHeight: 163.0, obesityRate: 8.3, fertilityRate: 6.31, suicideRate: 6.3, alcoholConsumption: 0.1 },
  SSD: { lifeExpectancy: 55.0, maleHeight: 176.0, femaleHeight: 164.0, obesityRate: 6.6, fertilityRate: 4.54, suicideRate: 6.8, alcoholConsumption: 1.5 },
  SDN: { lifeExpectancy: 65.3, maleHeight: 171.0, femaleHeight: 160.0, obesityRate: 8.6, fertilityRate: 4.35, suicideRate: 5.0, alcoholConsumption: 1.7 },
  TZA: { lifeExpectancy: 66.2, maleHeight: 164.0, femaleHeight: 156.0, obesityRate: 8.4, fertilityRate: 4.77, suicideRate: 9.6, alcoholConsumption: 7.7 },
  TGO: { lifeExpectancy: 61.6, maleHeight: 169.0, femaleHeight: 159.0, obesityRate: 8.4, fertilityRate: 4.22, suicideRate: 8.6, alcoholConsumption: 1.6 },
  TUN: { lifeExpectancy: 76.7, maleHeight: 174.0, femaleHeight: 161.0, obesityRate: 26.9, fertilityRate: 2.08, suicideRate: 3.0, alcoholConsumption: 1.5 },
  UGA: { lifeExpectancy: 63.4, maleHeight: 166.0, femaleHeight: 157.0, obesityRate: 5.3, fertilityRate: 4.69, suicideRate: 8.0, alcoholConsumption: 9.5 },
  ZMB: { lifeExpectancy: 61.2, maleHeight: 166.0, femaleHeight: 156.0, obesityRate: 8.1, fertilityRate: 4.33, suicideRate: 11.3, alcoholConsumption: 4.8 },
  ZWE: { lifeExpectancy: 59.3, maleHeight: 168.0, femaleHeight: 159.0, obesityRate: 15.5, fertilityRate: 3.49, suicideRate: 10.4, alcoholConsumption: 4.8 },
}

// African Demographics (UN, World Bank 2023)
const AFRICA_DEMOGRAPHICS = {
  DZA: { ethnicDiversity: 0.34, medianAge: 28.9, urbanPopulation: 73.7 },
  AGO: { ethnicDiversity: 0.79, medianAge: 16.7, urbanPopulation: 67.5 },
  BEN: { ethnicDiversity: 0.79, medianAge: 18.8, urbanPopulation: 49.0 },
  BWA: { ethnicDiversity: 0.41, medianAge: 24.5, urbanPopulation: 71.6 },
  BFA: { ethnicDiversity: 0.74, medianAge: 17.6, urbanPopulation: 31.5 },
  BDI: { ethnicDiversity: 0.30, medianAge: 17.3, urbanPopulation: 14.0 },
  CMR: { ethnicDiversity: 0.86, medianAge: 18.7, urbanPopulation: 58.1 },
  CAF: { ethnicDiversity: 0.83, medianAge: 17.6, urbanPopulation: 42.2 },
  TCD: { ethnicDiversity: 0.86, medianAge: 16.1, urbanPopulation: 23.5 },
  COD: { ethnicDiversity: 0.93, medianAge: 17.0, urbanPopulation: 46.8 },
  COG: { ethnicDiversity: 0.87, medianAge: 19.0, urbanPopulation: 68.1 },
  CIV: { ethnicDiversity: 0.82, medianAge: 19.0, urbanPopulation: 52.2 },
  DJI: { ethnicDiversity: 0.80, medianAge: 24.0, urbanPopulation: 78.1 },
  ERI: { ethnicDiversity: 0.65, medianAge: 19.7, urbanPopulation: 42.0 },
  SWZ: { ethnicDiversity: 0.06, medianAge: 21.7, urbanPopulation: 24.2 },
  ETH: { ethnicDiversity: 0.72, medianAge: 19.5, urbanPopulation: 22.2 },
  GAB: { ethnicDiversity: 0.77, medianAge: 22.2, urbanPopulation: 90.1 },
  GMB: { ethnicDiversity: 0.79, medianAge: 17.8, urbanPopulation: 63.9 },
  GHA: { ethnicDiversity: 0.67, medianAge: 21.5, urbanPopulation: 57.3 },
  GIN: { ethnicDiversity: 0.74, medianAge: 18.9, urbanPopulation: 37.1 },
  GNB: { ethnicDiversity: 0.81, medianAge: 19.4, urbanPopulation: 44.2 },
  KEN: { ethnicDiversity: 0.86, medianAge: 20.0, urbanPopulation: 28.0 },
  LSO: { ethnicDiversity: 0.26, medianAge: 22.5, urbanPopulation: 29.5 },
  LBR: { ethnicDiversity: 0.91, medianAge: 18.3, urbanPopulation: 52.6 },
  LBY: { ethnicDiversity: 0.79, medianAge: 29.0, urbanPopulation: 80.7 },
  MDG: { ethnicDiversity: 0.88, medianAge: 19.6, urbanPopulation: 39.2 },
  MWI: { ethnicDiversity: 0.67, medianAge: 17.2, urbanPopulation: 17.4 },
  MLI: { ethnicDiversity: 0.69, medianAge: 16.3, urbanPopulation: 44.0 },
  MRT: { ethnicDiversity: 0.62, medianAge: 20.7, urbanPopulation: 55.3 },
  MUS: { ethnicDiversity: 0.46, medianAge: 37.4, urbanPopulation: 40.8 },
  MAR: { ethnicDiversity: 0.48, medianAge: 29.5, urbanPopulation: 64.1 },
  MOZ: { ethnicDiversity: 0.69, medianAge: 17.6, urbanPopulation: 37.1 },
  NAM: { ethnicDiversity: 0.63, medianAge: 22.0, urbanPopulation: 53.0 },
  NER: { ethnicDiversity: 0.65, medianAge: 15.0, urbanPopulation: 16.6 },
  RWA: { ethnicDiversity: 0.32, medianAge: 19.7, urbanPopulation: 17.6 },
  SEN: { ethnicDiversity: 0.69, medianAge: 18.8, urbanPopulation: 48.1 },
  SLE: { ethnicDiversity: 0.82, medianAge: 19.4, urbanPopulation: 43.0 },
  SOM: { ethnicDiversity: 0.81, medianAge: 16.7, urbanPopulation: 46.1 },
  SSD: { ethnicDiversity: 0.88, medianAge: 19.0, urbanPopulation: 20.2 },
  SDN: { ethnicDiversity: 0.71, medianAge: 19.9, urbanPopulation: 35.3 },
  TZA: { ethnicDiversity: 0.95, medianAge: 18.0, urbanPopulation: 35.2 },
  TGO: { ethnicDiversity: 0.71, medianAge: 19.4, urbanPopulation: 43.4 },
  TUN: { ethnicDiversity: 0.04, medianAge: 32.7, urbanPopulation: 69.6 },
  UGA: { ethnicDiversity: 0.93, medianAge: 16.7, urbanPopulation: 25.0 },
  ZMB: { ethnicDiversity: 0.78, medianAge: 17.6, urbanPopulation: 44.6 },
  ZWE: { ethnicDiversity: 0.39, medianAge: 19.0, urbanPopulation: 32.2 },
}

// African Education Data (Various sources 2023)
const AFRICA_EDUCATION = {
  DZA: { avgIQ: 83, literacyRate: 81.4, pisaMath: null },
  AGO: { avgIQ: 68, literacyRate: 71.1, pisaMath: null },
  BEN: { avgIQ: 70, literacyRate: 42.4, pisaMath: null },
  BWA: { avgIQ: 70, literacyRate: 88.5, pisaMath: null },
  BFA: { avgIQ: 68, literacyRate: 41.2, pisaMath: null },
  BDI: { avgIQ: 69, literacyRate: 68.4, pisaMath: null },
  CMR: { avgIQ: 64, literacyRate: 77.1, pisaMath: null },
  CAF: { avgIQ: 71, literacyRate: 37.4, pisaMath: null },
  TCD: { avgIQ: 68, literacyRate: 22.3, pisaMath: null },
  COD: { avgIQ: 65, literacyRate: 77.0, pisaMath: null },
  COG: { avgIQ: 73, literacyRate: 80.3, pisaMath: null },
  CIV: { avgIQ: 69, literacyRate: 47.2, pisaMath: null },
  DJI: { avgIQ: 68, literacyRate: 70.0, pisaMath: null },
  ERI: { avgIQ: 68, literacyRate: 76.6, pisaMath: null },
  SWZ: { avgIQ: 68, literacyRate: 88.4, pisaMath: null },
  ETH: { avgIQ: 69, literacyRate: 51.8, pisaMath: null },
  GAB: { avgIQ: 64, literacyRate: 84.7, pisaMath: null },
  GMB: { avgIQ: 66, literacyRate: 50.8, pisaMath: null },
  GHA: { avgIQ: 71, literacyRate: 79.0, pisaMath: null },
  GIN: { avgIQ: 67, literacyRate: 32.0, pisaMath: null },
  GNB: { avgIQ: 67, literacyRate: 45.6, pisaMath: null },
  KEN: { avgIQ: 80, literacyRate: 81.5, pisaMath: null },
  LSO: { avgIQ: 67, literacyRate: 79.4, pisaMath: null },
  LBR: { avgIQ: 67, literacyRate: 48.3, pisaMath: null },
  LBY: { avgIQ: 83, literacyRate: 91.0, pisaMath: null },
  MDG: { avgIQ: 82, literacyRate: 76.7, pisaMath: null },
  MWI: { avgIQ: 60, literacyRate: 62.1, pisaMath: null },
  MLI: { avgIQ: 68, literacyRate: 35.5, pisaMath: null },
  MRT: { avgIQ: 76, literacyRate: 53.5, pisaMath: null },
  MUS: { avgIQ: 89, literacyRate: 91.3, pisaMath: null },
  MAR: { avgIQ: 84, literacyRate: 73.8, pisaMath: 368 },
  MOZ: { avgIQ: 64, literacyRate: 60.7, pisaMath: null },
  NAM: { avgIQ: 72, literacyRate: 91.5, pisaMath: null },
  NER: { avgIQ: 69, literacyRate: 19.1, pisaMath: null },
  RWA: { avgIQ: 76, literacyRate: 73.2, pisaMath: null },
  SEN: { avgIQ: 76, literacyRate: 51.9, pisaMath: null },
  SLE: { avgIQ: 64, literacyRate: 43.2, pisaMath: null },
  SOM: { avgIQ: 68, literacyRate: 37.8, pisaMath: null },
  SSD: { avgIQ: 68, literacyRate: 34.5, pisaMath: null },
  SDN: { avgIQ: 71, literacyRate: 60.7, pisaMath: null },
  TZA: { avgIQ: 72, literacyRate: 77.9, pisaMath: null },
  TGO: { avgIQ: 70, literacyRate: 66.5, pisaMath: null },
  TUN: { avgIQ: 83, literacyRate: 79.0, pisaMath: 367 },
  UGA: { avgIQ: 73, literacyRate: 76.5, pisaMath: null },
  ZMB: { avgIQ: 71, literacyRate: 86.7, pisaMath: null },
  ZWE: { avgIQ: 72, literacyRate: 88.7, pisaMath: null },
}

// African Lifestyle Data (World Happiness Report, ITU, OECD 2023-2024)
const AFRICA_LIFESTYLE = {
  DZA: { happinessIndex: 5.39, workHoursWeek: 40.0, internetPenetration: 71.0, coffeeConsumption: 3.2 },
  AGO: { happinessIndex: 4.47, workHoursWeek: 44.0, internetPenetration: 36.0, coffeeConsumption: 0.2 },
  BEN: { happinessIndex: 4.88, workHoursWeek: 45.0, internetPenetration: 28.0, coffeeConsumption: 0.1 },
  BWA: { happinessIndex: 3.43, workHoursWeek: 45.0, internetPenetration: 72.0, coffeeConsumption: 0.3 },
  BFA: { happinessIndex: 4.83, workHoursWeek: 46.0, internetPenetration: 21.0, coffeeConsumption: 0.1 },
  BDI: { happinessIndex: 3.78, workHoursWeek: 44.0, internetPenetration: 5.8, coffeeConsumption: 0.1 },
  CMR: { happinessIndex: 5.27, workHoursWeek: 45.0, internetPenetration: 45.0, coffeeConsumption: 0.3 },
  CAF: { happinessIndex: 3.62, workHoursWeek: 46.0, internetPenetration: 11.0, coffeeConsumption: 0.1 },
  TCD: { happinessIndex: 4.25, workHoursWeek: 46.0, internetPenetration: 13.0, coffeeConsumption: 0.1 },
  COD: { happinessIndex: 4.42, workHoursWeek: 45.0, internetPenetration: 23.0, coffeeConsumption: 0.2 },
  COG: { happinessIndex: 5.34, workHoursWeek: 44.0, internetPenetration: 21.0, coffeeConsumption: 0.2 },
  CIV: { happinessIndex: 5.27, workHoursWeek: 45.0, internetPenetration: 45.0, coffeeConsumption: 0.5 },
  DJI: { happinessIndex: 4.61, workHoursWeek: 45.0, internetPenetration: 69.0, coffeeConsumption: 0.1 },
  ERI: { happinessIndex: 4.94, workHoursWeek: 46.0, internetPenetration: 7.0, coffeeConsumption: 0.2 },
  SWZ: { happinessIndex: 4.20, workHoursWeek: 45.0, internetPenetration: 59.0, coffeeConsumption: 0.1 },
  ETH: { happinessIndex: 4.09, workHoursWeek: 46.0, internetPenetration: 25.0, coffeeConsumption: 2.4 },
  GAB: { happinessIndex: 4.85, workHoursWeek: 43.0, internetPenetration: 72.0, coffeeConsumption: 0.4 },
  GMB: { happinessIndex: 4.65, workHoursWeek: 45.0, internetPenetration: 37.0, coffeeConsumption: 0.1 },
  GHA: { happinessIndex: 4.96, workHoursWeek: 46.0, internetPenetration: 68.0, coffeeConsumption: 0.2 },
  GIN: { happinessIndex: 4.26, workHoursWeek: 46.0, internetPenetration: 35.0, coffeeConsumption: 0.1 },
  GNB: { happinessIndex: 4.38, workHoursWeek: 45.0, internetPenetration: 30.0, coffeeConsumption: 0.1 },
  KEN: { happinessIndex: 4.58, workHoursWeek: 46.0, internetPenetration: 40.0, coffeeConsumption: 0.3 },
  LSO: { happinessIndex: 3.51, workHoursWeek: 45.0, internetPenetration: 48.0, coffeeConsumption: 0.1 },
  LBR: { happinessIndex: 4.16, workHoursWeek: 46.0, internetPenetration: 30.0, coffeeConsumption: 0.2 },
  LBY: { happinessIndex: 5.52, workHoursWeek: 42.0, internetPenetration: 84.0, coffeeConsumption: 0.3 },
  MDG: { happinessIndex: 4.33, workHoursWeek: 44.0, internetPenetration: 22.0, coffeeConsumption: 0.4 },
  MWI: { happinessIndex: 3.70, workHoursWeek: 46.0, internetPenetration: 18.0, coffeeConsumption: 0.1 },
  MLI: { happinessIndex: 4.20, workHoursWeek: 46.0, internetPenetration: 34.0, coffeeConsumption: 0.1 },
  MRT: { happinessIndex: 4.72, workHoursWeek: 45.0, internetPenetration: 59.0, coffeeConsumption: 0.1 },
  MUS: { happinessIndex: 6.05, workHoursWeek: 40.0, internetPenetration: 79.0, coffeeConsumption: 1.1 },
  MAR: { happinessIndex: 4.97, workHoursWeek: 44.0, internetPenetration: 88.0, coffeeConsumption: 1.2 },
  MOZ: { happinessIndex: 4.46, workHoursWeek: 46.0, internetPenetration: 21.0, coffeeConsumption: 0.1 },
  NAM: { happinessIndex: 4.57, workHoursWeek: 45.0, internetPenetration: 53.0, coffeeConsumption: 0.2 },
  NER: { happinessIndex: 4.21, workHoursWeek: 46.0, internetPenetration: 14.0, coffeeConsumption: 0.1 },
  RWA: { happinessIndex: 3.80, workHoursWeek: 46.0, internetPenetration: 32.0, coffeeConsumption: 0.1 },
  SEN: { happinessIndex: 5.00, workHoursWeek: 45.0, internetPenetration: 58.0, coffeeConsumption: 2.8 },
  SLE: { happinessIndex: 3.24, workHoursWeek: 46.0, internetPenetration: 17.0, coffeeConsumption: 0.1 },
  SOM: { happinessIndex: 4.86, workHoursWeek: 46.0, internetPenetration: 15.0, coffeeConsumption: 0.1 },
  SSD: { happinessIndex: 2.82, workHoursWeek: 46.0, internetPenetration: 8.0, coffeeConsumption: 0.1 },
  SDN: { happinessIndex: 4.52, workHoursWeek: 45.0, internetPenetration: 31.0, coffeeConsumption: 0.3 },
  TZA: { happinessIndex: 3.70, workHoursWeek: 46.0, internetPenetration: 32.0, coffeeConsumption: 0.2 },
  TGO: { happinessIndex: 4.11, workHoursWeek: 45.0, internetPenetration: 35.0, coffeeConsumption: 0.1 },
  TUN: { happinessIndex: 4.59, workHoursWeek: 42.0, internetPenetration: 78.0, coffeeConsumption: 1.5 },
  UGA: { happinessIndex: 4.43, workHoursWeek: 46.0, internetPenetration: 26.0, coffeeConsumption: 0.8 },
  ZMB: { happinessIndex: 3.76, workHoursWeek: 45.0, internetPenetration: 27.0, coffeeConsumption: 0.1 },
  ZWE: { happinessIndex: 3.09, workHoursWeek: 45.0, internetPenetration: 35.0, coffeeConsumption: 0.1 },
}

// African Freedom Data (Transparency International, RSF 2024)
const AFRICA_FREEDOM = {
  DZA: { corruptionIndex: 33, pressFreedom: 27 },
  AGO: { corruptionIndex: 33, pressFreedom: 44 },
  BEN: { corruptionIndex: 42, pressFreedom: 54 },
  BWA: { corruptionIndex: 55, pressFreedom: 64 },
  BFA: { corruptionIndex: 41, pressFreedom: 52 },
  BDI: { corruptionIndex: 17, pressFreedom: 26 },
  CMR: { corruptionIndex: 26, pressFreedom: 27 },
  CAF: { corruptionIndex: 24, pressFreedom: 42 },
  TCD: { corruptionIndex: 20, pressFreedom: 29 },
  COD: { corruptionIndex: 20, pressFreedom: 36 },
  COG: { corruptionIndex: 21, pressFreedom: 33 },
  CIV: { corruptionIndex: 40, pressFreedom: 50 },
  DJI: { corruptionIndex: 30, pressFreedom: 24 },
  ERI: { corruptionIndex: 22, pressFreedom: 5 },
  SWZ: { corruptionIndex: 31, pressFreedom: 28 },
  ETH: { corruptionIndex: 37, pressFreedom: 31 },
  GAB: { corruptionIndex: 29, pressFreedom: 40 },
  GMB: { corruptionIndex: 34, pressFreedom: 52 },
  GHA: { corruptionIndex: 43, pressFreedom: 62 },
  GIN: { corruptionIndex: 25, pressFreedom: 47 },
  GNB: { corruptionIndex: 21, pressFreedom: 42 },
  KEN: { corruptionIndex: 31, pressFreedom: 50 },
  LSO: { corruptionIndex: 41, pressFreedom: 55 },
  LBR: { corruptionIndex: 25, pressFreedom: 54 },
  LBY: { corruptionIndex: 17, pressFreedom: 13 },
  MDG: { corruptionIndex: 26, pressFreedom: 52 },
  MWI: { corruptionIndex: 34, pressFreedom: 58 },
  MLI: { corruptionIndex: 28, pressFreedom: 48 },
  MRT: { corruptionIndex: 30, pressFreedom: 35 },
  MUS: { corruptionIndex: 50, pressFreedom: 62 },
  MAR: { corruptionIndex: 38, pressFreedom: 42 },
  MOZ: { corruptionIndex: 26, pressFreedom: 50 },
  NAM: { corruptionIndex: 49, pressFreedom: 67 },
  NER: { corruptionIndex: 32, pressFreedom: 52 },
  RWA: { corruptionIndex: 53, pressFreedom: 32 },
  SEN: { corruptionIndex: 43, pressFreedom: 53 },
  SLE: { corruptionIndex: 34, pressFreedom: 51 },
  SOM: { corruptionIndex: 11, pressFreedom: 18 },
  SSD: { corruptionIndex: 13, pressFreedom: 17 },
  SDN: { corruptionIndex: 22, pressFreedom: 21 },
  TZA: { corruptionIndex: 38, pressFreedom: 50 },
  TGO: { corruptionIndex: 29, pressFreedom: 44 },
  TUN: { corruptionIndex: 40, pressFreedom: 45 },
  UGA: { corruptionIndex: 26, pressFreedom: 42 },
  ZMB: { corruptionIndex: 33, pressFreedom: 55 },
  ZWE: { corruptionIndex: 23, pressFreedom: 39 },
}

// African Sex/Relationships Data (Limited data available)
const AFRICA_SEX = {
  DZA: { sexualPartners: 2.5, divorceRate: 1.8, lgbtAcceptance: 4 },
  BWA: { sexualPartners: 6.5, divorceRate: 0.5, lgbtAcceptance: 21 },
  EGY: { sexualPartners: 3.0, divorceRate: 2.0, lgbtAcceptance: 3 },
  ETH: { sexualPartners: 4.2, divorceRate: 0.4, lgbtAcceptance: 5 },
  GHA: { sexualPartners: 5.2, divorceRate: 0.8, lgbtAcceptance: 4 },
  KEN: { sexualPartners: 5.8, divorceRate: 0.5, lgbtAcceptance: 14 },
  MAR: { sexualPartners: 3.5, divorceRate: 1.4, lgbtAcceptance: 8 },
  MUS: { sexualPartners: 4.5, divorceRate: 1.5, lgbtAcceptance: 25 },
  NAM: { sexualPartners: 6.2, divorceRate: 0.7, lgbtAcceptance: 22 },
  RWA: { sexualPartners: 4.0, divorceRate: 0.3, lgbtAcceptance: 6 },
  SEN: { sexualPartners: 3.8, divorceRate: 0.5, lgbtAcceptance: 3 },
  TZA: { sexualPartners: 5.5, divorceRate: 0.4, lgbtAcceptance: 4 },
  TUN: { sexualPartners: 4.0, divorceRate: 1.6, lgbtAcceptance: 9 },
  UGA: { sexualPartners: 5.0, divorceRate: 0.6, lgbtAcceptance: 3 },
  ZMB: { sexualPartners: 5.8, divorceRate: 0.4, lgbtAcceptance: 5 },
  ZWE: { sexualPartners: 5.5, divorceRate: 0.5, lgbtAcceptance: 7 },
}

// Gun ownership and incarceration for Africa
const AFRICA_CRIME = {
  DZA: { gunOwnership: 7.6, incarcerationRate: 150 },
  AGO: { gunOwnership: 8.0, incarcerationRate: 44 },
  BWA: { gunOwnership: 5.5, incarcerationRate: 218 },
  CMR: { gunOwnership: 5.1, incarcerationRate: 78 },
  ETH: { gunOwnership: 0.4, incarcerationRate: 127 },
  GHA: { gunOwnership: 1.7, incarcerationRate: 52 },
  KEN: { gunOwnership: 0.5, incarcerationRate: 117 },
  LBY: { gunOwnership: 15.5, incarcerationRate: 89 },
  MAR: { gunOwnership: 5.0, incarcerationRate: 232 },
  MOZ: { gunOwnership: 1.6, incarcerationRate: 63 },
  NAM: { gunOwnership: 7.0, incarcerationRate: 267 },
  NGA: { gunOwnership: 1.5, incarcerationRate: 32 },
  RWA: { gunOwnership: 0.6, incarcerationRate: 492 },
  SEN: { gunOwnership: 2.0, incarcerationRate: 64 },
  TZA: { gunOwnership: 0.7, incarcerationRate: 67 },
  TUN: { gunOwnership: 1.4, incarcerationRate: 217 },
  UGA: { gunOwnership: 1.3, incarcerationRate: 111 },
  ZAF: { gunOwnership: 12.7, incarcerationRate: 232 },
  ZMB: { gunOwnership: 0.5, incarcerationRate: 138 },
  ZWE: { gunOwnership: 4.0, incarcerationRate: 89 },
}

function mergeData() {
  const rawData = fs.readFileSync(COUNTRIES_PATH, 'utf-8')
  const countries = JSON.parse(rawData)

  console.log(`Processing ${countries.length} countries...`)

  let updatedCount = 0

  const updatedCountries = countries.map((country) => {
    const iso3 = country.iso3

    // Check if this is an African country that needs data
    if (country.region !== 'Africa') return country

    const healthData = AFRICA_HEALTH[iso3]
    const demoData = AFRICA_DEMOGRAPHICS[iso3]
    const eduData = AFRICA_EDUCATION[iso3]
    const lifeData = AFRICA_LIFESTYLE[iso3]
    const freedomData = AFRICA_FREEDOM[iso3]
    const sexData = AFRICA_SEX[iso3]
    const crimeData = AFRICA_CRIME[iso3]

    // Skip if we have no new data for this country
    if (!healthData && !demoData && !eduData && !lifeData && !freedomData) {
      return country
    }

    updatedCount++

    // Merge new data
    const updated = {
      ...country,
      crime: {
        ...country.crime,
        gunOwnership: crimeData?.gunOwnership ?? country.crime?.gunOwnership ?? null,
        incarcerationRate: crimeData?.incarcerationRate ?? country.crime?.incarcerationRate ?? null,
      },
      health: {
        lifeExpectancy: healthData?.lifeExpectancy ?? country.health?.lifeExpectancy ?? null,
        maleHeight: healthData?.maleHeight ?? country.health?.maleHeight ?? null,
        femaleHeight: healthData?.femaleHeight ?? country.health?.femaleHeight ?? null,
        obesityRate: healthData?.obesityRate ?? country.health?.obesityRate ?? null,
        penisSize: country.health?.penisSize ?? null, // Keep existing if any
        breastSize: country.health?.breastSize ?? null,
        fertilityRate: healthData?.fertilityRate ?? country.health?.fertilityRate ?? null,
        infantMortality: country.health?.infantMortality ?? null,
        cancerRate: country.health?.cancerRate ?? null,
        hivPrevalence: country.health?.hivPrevalence ?? null,
        suicideRate: healthData?.suicideRate ?? country.health?.suicideRate ?? null,
        alcoholConsumption: healthData?.alcoholConsumption ?? country.health?.alcoholConsumption ?? null,
        smokingRate: country.health?.smokingRate ?? null,
        drugUseRate: country.health?.drugUseRate ?? null,
      },
      sex: {
        sexualPartners: sexData?.sexualPartners ?? country.sex?.sexualPartners ?? null,
        ageFirstSex: country.sex?.ageFirstSex ?? null,
        divorceRate: sexData?.divorceRate ?? country.sex?.divorceRate ?? null,
        marriageAge: country.sex?.marriageAge ?? null,
        singleParentRate: country.sex?.singleParentRate ?? null,
        contraceptionUse: country.sex?.contraceptionUse ?? null,
        teenPregnancy: country.sex?.teenPregnancy ?? null,
        lgbtAcceptance: sexData?.lgbtAcceptance ?? country.sex?.lgbtAcceptance ?? null,
      },
      demographics: {
        ethnicDiversity: demoData?.ethnicDiversity ?? country.demographics?.ethnicDiversity ?? null,
        immigrationRate: country.demographics?.immigrationRate ?? null,
        emigrationRate: country.demographics?.emigrationRate ?? null,
        medianAge: demoData?.medianAge ?? country.demographics?.medianAge ?? null,
        urbanPopulation: demoData?.urbanPopulation ?? country.demographics?.urbanPopulation ?? null,
        populationDensity: country.demographics?.populationDensity ?? null,
      },
      education: {
        avgIQ: eduData?.avgIQ ?? country.education?.avgIQ ?? null,
        literacyRate: eduData?.literacyRate ?? country.education?.literacyRate ?? null,
        universityEnrollment: country.education?.universityEnrollment ?? null,
        pisaMath: eduData?.pisaMath ?? country.education?.pisaMath ?? null,
        pisaReading: country.education?.pisaReading ?? null,
        pisaScience: country.education?.pisaScience ?? null,
        nobelPrizesPerCapita: country.education?.nobelPrizesPerCapita ?? null,
        patentsPerCapita: country.education?.patentsPerCapita ?? null,
        rdSpending: country.education?.rdSpending ?? null,
      },
      lifestyle: {
        happinessIndex: lifeData?.happinessIndex ?? country.lifestyle?.happinessIndex ?? null,
        workHoursWeek: lifeData?.workHoursWeek ?? country.lifestyle?.workHoursWeek ?? null,
        vacationDays: country.lifestyle?.vacationDays ?? null,
        internetPenetration: lifeData?.internetPenetration ?? country.lifestyle?.internetPenetration ?? null,
        socialMediaUse: country.lifestyle?.socialMediaUse ?? null,
        coffeeConsumption: lifeData?.coffeeConsumption ?? country.lifestyle?.coffeeConsumption ?? null,
        meatConsumption: country.lifestyle?.meatConsumption ?? null,
        vegetarianRate: country.lifestyle?.vegetarianRate ?? null,
      },
      freedom: {
        corruptionIndex: freedomData?.corruptionIndex ?? country.freedom?.corruptionIndex ?? null,
        pressFreedom: freedomData?.pressFreedom ?? country.freedom?.pressFreedom ?? null,
        drugPolicyScore: country.freedom?.drugPolicyScore ?? null,
      },
      sources: {
        ...country.sources,
        health: healthData ? { source: 'WHO / NCD-RisC', year: 2023 } : country.sources?.health,
        demographics: demoData ? { source: 'UN / World Bank', year: 2023 } : country.sources?.demographics,
        education: eduData ? { source: 'Various Studies / UNESCO', year: 2023 } : country.sources?.education,
        lifestyle: lifeData ? { source: 'World Happiness Report / ITU', year: 2024 } : country.sources?.lifestyle,
        freedom: freedomData ? { source: 'Transparency Int. / RSF', year: 2024 } : country.sources?.freedom,
        sex: sexData ? { source: 'Various Studies / ILGA', year: 2023 } : country.sources?.sex,
      },
    }

    return updated
  })

  fs.writeFileSync(
    COUNTRIES_PATH,
    JSON.stringify(updatedCountries, null, 2),
    'utf-8'
  )

  console.log(`\nUpdated ${updatedCount} African countries with new data!`)

  // Verify coverage
  const african = updatedCountries.filter(c => c.region === 'Africa')
  let healthCount = 0, eduCount = 0, lifeCount = 0, freedomCount = 0
  african.forEach(c => {
    if (c.health?.lifeExpectancy) healthCount++
    if (c.education?.avgIQ) eduCount++
    if (c.lifestyle?.happinessIndex) lifeCount++
    if (c.freedom?.corruptionIndex) freedomCount++
  })

  console.log(`\nAfrican countries coverage:`)
  console.log(`Health data: ${healthCount}/${african.length}`)
  console.log(`Education data: ${eduCount}/${african.length}`)
  console.log(`Lifestyle data: ${lifeCount}/${african.length}`)
  console.log(`Freedom data: ${freedomCount}/${african.length}`)
}

mergeData()

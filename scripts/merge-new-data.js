/**
 * Script to merge new data categories into countries.json
 * Run with: node scripts/merge-new-data.js
 */

const fs = require('fs')
const path = require('path')

const COUNTRIES_PATH = path.join(__dirname, '../data/countries.json')

// Health Data (sourced from WHO, NCD-RisC, various studies)
const HEALTH_DATA = {
  AFG: { lifeExpectancy: 62.0, maleHeight: 168.2, femaleHeight: 155.3, obesityRate: 5.5, penisSize: 13.5, fertilityRate: 4.18, suicideRate: 4.1, alcoholConsumption: 0.1 },
  ARG: { lifeExpectancy: 76.7, maleHeight: 174.5, femaleHeight: 161.0, obesityRate: 28.3, penisSize: 14.9, fertilityRate: 1.89, suicideRate: 9.1, alcoholConsumption: 7.6 },
  AUS: { lifeExpectancy: 83.4, maleHeight: 179.2, femaleHeight: 165.9, obesityRate: 31.3, penisSize: 13.3, fertilityRate: 1.66, suicideRate: 11.3, alcoholConsumption: 9.5 },
  AUT: { lifeExpectancy: 81.5, maleHeight: 178.2, femaleHeight: 165.7, obesityRate: 20.1, penisSize: 14.5, fertilityRate: 1.46, suicideRate: 11.4, alcoholConsumption: 11.6 },
  BEL: { lifeExpectancy: 81.9, maleHeight: 178.7, femaleHeight: 165.5, obesityRate: 22.1, penisSize: 15.9, fertilityRate: 1.57, suicideRate: 15.9, alcoholConsumption: 10.8 },
  BRA: { lifeExpectancy: 75.9, maleHeight: 173.6, femaleHeight: 161.0, obesityRate: 22.1, penisSize: 14.5, fertilityRate: 1.64, suicideRate: 6.4, alcoholConsumption: 7.4 },
  CAN: { lifeExpectancy: 82.4, maleHeight: 178.1, femaleHeight: 165.0, obesityRate: 29.4, penisSize: 13.9, fertilityRate: 1.40, suicideRate: 10.3, alcoholConsumption: 8.2 },
  CHN: { lifeExpectancy: 78.2, maleHeight: 169.7, femaleHeight: 158.6, obesityRate: 6.2, penisSize: 13.1, fertilityRate: 1.16, suicideRate: 6.7, alcoholConsumption: 7.2 },
  COL: { lifeExpectancy: 77.3, maleHeight: 172.1, femaleHeight: 158.7, obesityRate: 22.3, penisSize: 14.8, fertilityRate: 1.72, suicideRate: 5.8, alcoholConsumption: 4.2 },
  DEU: { lifeExpectancy: 81.3, maleHeight: 179.9, femaleHeight: 166.2, obesityRate: 22.3, penisSize: 14.5, fertilityRate: 1.53, suicideRate: 9.8, alcoholConsumption: 12.8 },
  EGY: { lifeExpectancy: 70.2, maleHeight: 170.3, femaleHeight: 158.8, obesityRate: 32.0, penisSize: 14.2, fertilityRate: 2.80, suicideRate: 3.4, alcoholConsumption: 0.4 },
  ESP: { lifeExpectancy: 83.6, maleHeight: 176.6, femaleHeight: 163.4, obesityRate: 23.8, penisSize: 13.9, fertilityRate: 1.19, suicideRate: 7.7, alcoholConsumption: 10.0 },
  FRA: { lifeExpectancy: 82.5, maleHeight: 177.5, femaleHeight: 164.7, obesityRate: 21.6, penisSize: 16.0, fertilityRate: 1.79, suicideRate: 12.1, alcoholConsumption: 11.4 },
  GBR: { lifeExpectancy: 81.2, maleHeight: 177.5, femaleHeight: 164.4, obesityRate: 27.8, penisSize: 13.9, fertilityRate: 1.56, suicideRate: 7.9, alcoholConsumption: 11.4 },
  IND: { lifeExpectancy: 70.4, maleHeight: 165.0, femaleHeight: 152.6, obesityRate: 3.9, penisSize: 13.0, fertilityRate: 2.01, suicideRate: 12.9, alcoholConsumption: 4.3 },
  IDN: { lifeExpectancy: 71.9, maleHeight: 165.7, femaleHeight: 153.2, obesityRate: 6.9, penisSize: 12.0, fertilityRate: 2.18, suicideRate: 2.6, alcoholConsumption: 0.8 },
  IRN: { lifeExpectancy: 76.7, maleHeight: 173.8, femaleHeight: 160.0, obesityRate: 25.8, penisSize: 14.3, fertilityRate: 1.71, suicideRate: 4.1, alcoholConsumption: 0.3 },
  ITA: { lifeExpectancy: 83.5, maleHeight: 176.5, femaleHeight: 163.2, obesityRate: 19.9, penisSize: 15.7, fertilityRate: 1.24, suicideRate: 5.5, alcoholConsumption: 7.6 },
  JPN: { lifeExpectancy: 84.6, maleHeight: 171.2, femaleHeight: 158.6, obesityRate: 4.3, penisSize: 13.6, fertilityRate: 1.20, suicideRate: 14.6, alcoholConsumption: 7.1 },
  KOR: { lifeExpectancy: 83.5, maleHeight: 175.5, femaleHeight: 162.6, obesityRate: 4.7, penisSize: 13.4, fertilityRate: 0.78, suicideRate: 21.2, alcoholConsumption: 8.7 },
  MEX: { lifeExpectancy: 75.1, maleHeight: 169.0, femaleHeight: 156.9, obesityRate: 28.9, penisSize: 14.9, fertilityRate: 1.82, suicideRate: 5.3, alcoholConsumption: 4.4 },
  NGA: { lifeExpectancy: 52.7, maleHeight: 163.8, femaleHeight: 157.3, obesityRate: 8.9, penisSize: 15.4, fertilityRate: 5.14, suicideRate: 5.7, alcoholConsumption: 10.1 },
  NLD: { lifeExpectancy: 81.7, maleHeight: 182.5, femaleHeight: 168.7, obesityRate: 20.4, penisSize: 15.9, fertilityRate: 1.55, suicideRate: 10.3, alcoholConsumption: 8.3 },
  NOR: { lifeExpectancy: 83.2, maleHeight: 179.7, femaleHeight: 166.0, obesityRate: 23.1, penisSize: 14.3, fertilityRate: 1.41, suicideRate: 10.2, alcoholConsumption: 6.1 },
  PAK: { lifeExpectancy: 66.5, maleHeight: 168.6, femaleHeight: 154.8, obesityRate: 8.6, penisSize: 13.5, fertilityRate: 3.41, suicideRate: 2.9, alcoholConsumption: 0.1 },
  PHL: { lifeExpectancy: 71.2, maleHeight: 163.5, femaleHeight: 151.8, obesityRate: 6.4, penisSize: 10.9, fertilityRate: 2.78, suicideRate: 3.2, alcoholConsumption: 5.4 },
  POL: { lifeExpectancy: 77.8, maleHeight: 178.7, femaleHeight: 165.1, obesityRate: 23.1, penisSize: 14.3, fertilityRate: 1.38, suicideRate: 11.6, alcoholConsumption: 11.6 },
  RUS: { lifeExpectancy: 70.1, maleHeight: 176.7, femaleHeight: 164.1, obesityRate: 23.1, penisSize: 13.2, fertilityRate: 1.50, suicideRate: 21.6, alcoholConsumption: 11.1 },
  SAU: { lifeExpectancy: 75.1, maleHeight: 168.9, femaleHeight: 156.3, obesityRate: 35.4, penisSize: 12.4, fertilityRate: 2.22, suicideRate: 3.4, alcoholConsumption: 0.2 },
  SGP: { lifeExpectancy: 83.9, maleHeight: 171.0, femaleHeight: 160.0, obesityRate: 6.1, penisSize: 11.5, fertilityRate: 1.12, suicideRate: 8.2, alcoholConsumption: 2.0 },
  SWE: { lifeExpectancy: 83.0, maleHeight: 180.0, femaleHeight: 166.0, obesityRate: 20.6, penisSize: 14.9, fertilityRate: 1.66, suicideRate: 12.4, alcoholConsumption: 7.1 },
  THA: { lifeExpectancy: 78.7, maleHeight: 169.4, femaleHeight: 158.3, obesityRate: 10.0, penisSize: 10.2, fertilityRate: 1.33, suicideRate: 7.4, alcoholConsumption: 8.3 },
  TUR: { lifeExpectancy: 78.0, maleHeight: 173.6, femaleHeight: 161.4, obesityRate: 32.1, penisSize: 14.0, fertilityRate: 1.76, suicideRate: 2.4, alcoholConsumption: 2.0 },
  UKR: { lifeExpectancy: 69.6, maleHeight: 176.5, femaleHeight: 164.8, obesityRate: 24.1, penisSize: 13.9, fertilityRate: 1.22, suicideRate: 18.5, alcoholConsumption: 8.6 },
  USA: { lifeExpectancy: 76.4, maleHeight: 177.1, femaleHeight: 163.3, obesityRate: 36.2, penisSize: 12.9, fertilityRate: 1.64, suicideRate: 14.5, alcoholConsumption: 9.8 },
  VNM: { lifeExpectancy: 75.4, maleHeight: 164.4, femaleHeight: 153.6, obesityRate: 2.1, penisSize: 11.5, fertilityRate: 1.94, suicideRate: 7.0, alcoholConsumption: 8.9 },
  ZAF: { lifeExpectancy: 64.9, maleHeight: 169.0, femaleHeight: 158.0, obesityRate: 28.3, penisSize: 15.3, fertilityRate: 2.33, suicideRate: 11.6, alcoholConsumption: 9.3 },
  CHE: { lifeExpectancy: 83.8, maleHeight: 178.4, femaleHeight: 164.5, obesityRate: 19.5, penisSize: 14.4, fertilityRate: 1.46, suicideRate: 11.2, alcoholConsumption: 9.5 },
  DNK: { lifeExpectancy: 81.3, maleHeight: 181.4, femaleHeight: 167.2, obesityRate: 19.7, penisSize: 15.0, fertilityRate: 1.72, suicideRate: 9.2, alcoholConsumption: 9.4 },
  FIN: { lifeExpectancy: 82.0, maleHeight: 179.6, femaleHeight: 165.9, obesityRate: 22.2, penisSize: 14.2, fertilityRate: 1.37, suicideRate: 13.4, alcoholConsumption: 8.4 },
  ISL: { lifeExpectancy: 83.1, maleHeight: 180.5, femaleHeight: 167.6, obesityRate: 21.9, penisSize: 16.5, fertilityRate: 1.72, suicideRate: 11.5, alcoholConsumption: 6.8 },
  ISR: { lifeExpectancy: 82.8, maleHeight: 175.6, femaleHeight: 162.5, obesityRate: 26.1, penisSize: 14.4, fertilityRate: 2.90, suicideRate: 5.2, alcoholConsumption: 3.0 },
}

// Sex & Relationships Data
const SEX_DATA = {
  AUS: { sexualPartners: 13.3, divorceRate: 2.0, lgbtAcceptance: 79 },
  AUT: { sexualPartners: 9.8, divorceRate: 1.8, lgbtAcceptance: 69 },
  BRA: { sexualPartners: 12.5, divorceRate: 1.4, lgbtAcceptance: 67 },
  CAN: { sexualPartners: 10.7, divorceRate: 1.8, lgbtAcceptance: 80 },
  CHN: { sexualPartners: 3.1, divorceRate: 3.4, lgbtAcceptance: 29 },
  DEU: { sexualPartners: 11.5, divorceRate: 1.8, lgbtAcceptance: 82 },
  ESP: { sexualPartners: 10.4, divorceRate: 2.0, lgbtAcceptance: 88 },
  FRA: { sexualPartners: 11.1, divorceRate: 1.9, lgbtAcceptance: 77 },
  GBR: { sexualPartners: 9.8, divorceRate: 1.8, lgbtAcceptance: 76 },
  IND: { sexualPartners: 3.0, divorceRate: 0.1, lgbtAcceptance: 37 },
  IDN: { sexualPartners: 5.1, divorceRate: 1.6, lgbtAcceptance: 9 },
  IRN: { sexualPartners: 4.5, divorceRate: 1.5, lgbtAcceptance: 5 },
  ITA: { sexualPartners: 11.8, divorceRate: 1.4, lgbtAcceptance: 75 },
  JPN: { sexualPartners: 5.4, divorceRate: 1.7, lgbtAcceptance: 54 },
  KOR: { sexualPartners: 7.5, divorceRate: 2.1, lgbtAcceptance: 44 },
  MEX: { sexualPartners: 8.9, divorceRate: 1.1, lgbtAcceptance: 64 },
  NGA: { sexualPartners: 4.2, divorceRate: 0.7, lgbtAcceptance: 7 },
  NLD: { sexualPartners: 12.7, divorceRate: 1.9, lgbtAcceptance: 92 },
  NOR: { sexualPartners: 12.1, divorceRate: 1.6, lgbtAcceptance: 90 },
  PAK: { sexualPartners: 2.8, divorceRate: 0.3, lgbtAcceptance: 4 },
  POL: { sexualPartners: 8.2, divorceRate: 1.7, lgbtAcceptance: 42 },
  RUS: { sexualPartners: 9.1, divorceRate: 3.9, lgbtAcceptance: 14 },
  SAU: { sexualPartners: 3.5, divorceRate: 1.9, lgbtAcceptance: 2 },
  SWE: { sexualPartners: 11.8, divorceRate: 2.5, lgbtAcceptance: 94 },
  TUR: { sexualPartners: 6.2, divorceRate: 1.7, lgbtAcceptance: 25 },
  USA: { sexualPartners: 10.7, divorceRate: 2.3, lgbtAcceptance: 72 },
  ZAF: { sexualPartners: 8.5, divorceRate: 0.6, lgbtAcceptance: 54 },
  CHE: { sexualPartners: 11.1, divorceRate: 1.7, lgbtAcceptance: 82 },
  DNK: { sexualPartners: 12.5, divorceRate: 2.6, lgbtAcceptance: 92 },
  FIN: { sexualPartners: 12.4, divorceRate: 2.4, lgbtAcceptance: 87 },
  ISL: { sexualPartners: 13.0, divorceRate: 1.7, lgbtAcceptance: 93 },
  ISR: { sexualPartners: 7.6, divorceRate: 1.8, lgbtAcceptance: 65 },
}

// Demographics Data
const DEMOGRAPHICS_DATA = {
  AFG: { ethnicDiversity: 0.77, medianAge: 18.4, urbanPopulation: 26.3 },
  ARG: { ethnicDiversity: 0.26, medianAge: 31.8, urbanPopulation: 92.1 },
  AUS: { ethnicDiversity: 0.49, medianAge: 37.9, urbanPopulation: 86.2 },
  BRA: { ethnicDiversity: 0.54, medianAge: 33.8, urbanPopulation: 87.1 },
  CAN: { ethnicDiversity: 0.71, medianAge: 41.1, urbanPopulation: 81.6 },
  CHN: { ethnicDiversity: 0.15, medianAge: 38.4, urbanPopulation: 63.6 },
  DEU: { ethnicDiversity: 0.17, medianAge: 45.7, urbanPopulation: 77.5 },
  EGY: { ethnicDiversity: 0.18, medianAge: 24.1, urbanPopulation: 42.8 },
  ETH: { ethnicDiversity: 0.72, medianAge: 19.5, urbanPopulation: 22.2 },
  FRA: { ethnicDiversity: 0.27, medianAge: 42.3, urbanPopulation: 81.2 },
  GBR: { ethnicDiversity: 0.32, medianAge: 40.5, urbanPopulation: 83.9 },
  IND: { ethnicDiversity: 0.42, medianAge: 28.4, urbanPopulation: 35.4 },
  IDN: { ethnicDiversity: 0.74, medianAge: 30.2, urbanPopulation: 57.3 },
  IRN: { ethnicDiversity: 0.67, medianAge: 32.0, urbanPopulation: 76.0 },
  ITA: { ethnicDiversity: 0.11, medianAge: 47.3, urbanPopulation: 71.0 },
  JPN: { ethnicDiversity: 0.01, medianAge: 48.4, urbanPopulation: 91.8 },
  KEN: { ethnicDiversity: 0.86, medianAge: 20.0, urbanPopulation: 28.0 },
  KOR: { ethnicDiversity: 0.00, medianAge: 43.7, urbanPopulation: 81.4 },
  MEX: { ethnicDiversity: 0.54, medianAge: 29.3, urbanPopulation: 80.7 },
  NGA: { ethnicDiversity: 0.85, medianAge: 18.1, urbanPopulation: 52.0 },
  NLD: { ethnicDiversity: 0.11, medianAge: 42.8, urbanPopulation: 92.2 },
  PAK: { ethnicDiversity: 0.71, medianAge: 22.8, urbanPopulation: 37.2 },
  POL: { ethnicDiversity: 0.12, medianAge: 41.7, urbanPopulation: 60.0 },
  RUS: { ethnicDiversity: 0.25, medianAge: 39.6, urbanPopulation: 74.8 },
  SAU: { ethnicDiversity: 0.18, medianAge: 31.8, urbanPopulation: 84.3 },
  TUR: { ethnicDiversity: 0.32, medianAge: 32.2, urbanPopulation: 76.1 },
  USA: { ethnicDiversity: 0.49, medianAge: 38.1, urbanPopulation: 82.7 },
  ZAF: { ethnicDiversity: 0.75, medianAge: 27.6, urbanPopulation: 67.4 },
  CHE: { ethnicDiversity: 0.53, medianAge: 42.7, urbanPopulation: 73.9 },
  DNK: { ethnicDiversity: 0.10, medianAge: 42.3, urbanPopulation: 88.1 },
  FIN: { ethnicDiversity: 0.13, medianAge: 42.8, urbanPopulation: 85.5 },
  ISL: { ethnicDiversity: 0.08, medianAge: 37.5, urbanPopulation: 93.9 },
  ISR: { ethnicDiversity: 0.34, medianAge: 30.4, urbanPopulation: 92.6 },
  ESP: { ethnicDiversity: 0.42, medianAge: 44.9, urbanPopulation: 80.8 },
  NOR: { ethnicDiversity: 0.06, medianAge: 39.5, urbanPopulation: 83.0 },
  SWE: { ethnicDiversity: 0.06, medianAge: 41.1, urbanPopulation: 88.0 },
}

// Education & IQ Data
const EDUCATION_DATA = {
  AFG: { avgIQ: 84, literacyRate: 43.0, pisaMath: null },
  ARG: { avgIQ: 93, literacyRate: 99.0, pisaMath: 379 },
  AUS: { avgIQ: 100, literacyRate: 99.0, pisaMath: 487 },
  AUT: { avgIQ: 100, literacyRate: 99.0, pisaMath: 499 },
  BEL: { avgIQ: 101, literacyRate: 99.0, pisaMath: 489 },
  BRA: { avgIQ: 87, literacyRate: 93.2, pisaMath: 379 },
  CAN: { avgIQ: 101, literacyRate: 99.0, pisaMath: 497 },
  CHN: { avgIQ: 104, literacyRate: 96.8, pisaMath: 591 },
  COL: { avgIQ: 89, literacyRate: 95.6, pisaMath: 383 },
  DEU: { avgIQ: 102, literacyRate: 99.0, pisaMath: 500 },
  EGY: { avgIQ: 81, literacyRate: 71.2, pisaMath: null },
  ESP: { avgIQ: 98, literacyRate: 98.4, pisaMath: 473 },
  EST: { avgIQ: 101, literacyRate: 99.8, pisaMath: 523 },
  ETH: { avgIQ: 69, literacyRate: 51.8, pisaMath: null },
  FIN: { avgIQ: 101, literacyRate: 99.0, pisaMath: 507 },
  FRA: { avgIQ: 98, literacyRate: 99.0, pisaMath: 474 },
  GBR: { avgIQ: 100, literacyRate: 99.0, pisaMath: 489 },
  IND: { avgIQ: 82, literacyRate: 74.4, pisaMath: null },
  IDN: { avgIQ: 87, literacyRate: 96.0, pisaMath: 379 },
  IRN: { avgIQ: 84, literacyRate: 85.5, pisaMath: null },
  ITA: { avgIQ: 102, literacyRate: 99.2, pisaMath: 471 },
  JPN: { avgIQ: 105, literacyRate: 99.0, pisaMath: 527 },
  KOR: { avgIQ: 106, literacyRate: 99.0, pisaMath: 526 },
  MEX: { avgIQ: 88, literacyRate: 95.4, pisaMath: 409 },
  NGA: { avgIQ: 84, literacyRate: 62.0, pisaMath: null },
  NLD: { avgIQ: 100, literacyRate: 99.0, pisaMath: 493 },
  NOR: { avgIQ: 100, literacyRate: 99.0, pisaMath: 501 },
  PAK: { avgIQ: 84, literacyRate: 59.1, pisaMath: null },
  PHL: { avgIQ: 86, literacyRate: 98.2, pisaMath: 353 },
  POL: { avgIQ: 99, literacyRate: 99.8, pisaMath: 516 },
  RUS: { avgIQ: 97, literacyRate: 99.7, pisaMath: 488 },
  SAU: { avgIQ: 84, literacyRate: 97.6, pisaMath: 373 },
  SGP: { avgIQ: 108, literacyRate: 97.5, pisaMath: 569 },
  SWE: { avgIQ: 99, literacyRate: 99.0, pisaMath: 478 },
  TUR: { avgIQ: 90, literacyRate: 96.7, pisaMath: 454 },
  USA: { avgIQ: 98, literacyRate: 99.0, pisaMath: 478 },
  VNM: { avgIQ: 94, literacyRate: 95.8, pisaMath: 496 },
  ZAF: { avgIQ: 77, literacyRate: 95.0, pisaMath: null },
  CHE: { avgIQ: 101, literacyRate: 99.0, pisaMath: 508 },
  DNK: { avgIQ: 98, literacyRate: 99.0, pisaMath: 494 },
  ISL: { avgIQ: 101, literacyRate: 99.0, pisaMath: 488 },
  ISR: { avgIQ: 95, literacyRate: 97.8, pisaMath: 458 },
}

// Lifestyle & Happiness Data
const LIFESTYLE_DATA = {
  ARG: { happinessIndex: 6.02, workHoursWeek: 37.0, internetPenetration: 87.2, coffeeConsumption: 1.0 },
  AUS: { happinessIndex: 7.06, workHoursWeek: 38.0, internetPenetration: 96.2, coffeeConsumption: 3.0 },
  AUT: { happinessIndex: 7.21, workHoursWeek: 36.5, internetPenetration: 93.0, coffeeConsumption: 5.5 },
  BEL: { happinessIndex: 6.81, workHoursWeek: 37.5, internetPenetration: 94.0, coffeeConsumption: 6.8 },
  BRA: { happinessIndex: 6.33, workHoursWeek: 41.0, internetPenetration: 81.3, coffeeConsumption: 6.0 },
  CAN: { happinessIndex: 6.96, workHoursWeek: 37.0, internetPenetration: 97.0, coffeeConsumption: 6.5 },
  CHE: { happinessIndex: 7.24, workHoursWeek: 34.5, internetPenetration: 96.0, coffeeConsumption: 7.9 },
  CHN: { happinessIndex: 5.59, workHoursWeek: 46.0, internetPenetration: 73.0, coffeeConsumption: 0.1 },
  COL: { happinessIndex: 5.63, workHoursWeek: 44.0, internetPenetration: 73.0, coffeeConsumption: 2.0 },
  DEU: { happinessIndex: 6.72, workHoursWeek: 34.2, internetPenetration: 93.0, coffeeConsumption: 6.5 },
  DNK: { happinessIndex: 7.58, workHoursWeek: 33.0, internetPenetration: 98.0, coffeeConsumption: 8.7 },
  ESP: { happinessIndex: 6.32, workHoursWeek: 37.8, internetPenetration: 93.2, coffeeConsumption: 4.5 },
  FIN: { happinessIndex: 7.74, workHoursWeek: 36.5, internetPenetration: 97.0, coffeeConsumption: 12.0 },
  FRA: { happinessIndex: 6.66, workHoursWeek: 36.3, internetPenetration: 92.0, coffeeConsumption: 5.4 },
  GBR: { happinessIndex: 6.80, workHoursWeek: 36.6, internetPenetration: 97.0, coffeeConsumption: 2.8 },
  IND: { happinessIndex: 3.78, workHoursWeek: 47.0, internetPenetration: 50.0, coffeeConsumption: 0.1 },
  IDN: { happinessIndex: 5.24, workHoursWeek: 43.0, internetPenetration: 77.0, coffeeConsumption: 1.3 },
  IRN: { happinessIndex: 4.69, workHoursWeek: 44.0, internetPenetration: 84.0, coffeeConsumption: 0.2 },
  ISL: { happinessIndex: 7.53, workHoursWeek: 36.0, internetPenetration: 99.0, coffeeConsumption: 9.0 },
  ISR: { happinessIndex: 7.47, workHoursWeek: 40.0, internetPenetration: 90.0, coffeeConsumption: 4.0 },
  ITA: { happinessIndex: 6.32, workHoursWeek: 37.0, internetPenetration: 85.0, coffeeConsumption: 5.9 },
  JPN: { happinessIndex: 6.13, workHoursWeek: 38.0, internetPenetration: 93.0, coffeeConsumption: 3.3 },
  KOR: { happinessIndex: 5.95, workHoursWeek: 40.0, internetPenetration: 98.0, coffeeConsumption: 2.7 },
  MEX: { happinessIndex: 6.32, workHoursWeek: 45.0, internetPenetration: 76.0, coffeeConsumption: 1.2 },
  NGA: { happinessIndex: 4.55, workHoursWeek: 52.0, internetPenetration: 55.4, coffeeConsumption: 0.1 },
  NLD: { happinessIndex: 7.46, workHoursWeek: 30.3, internetPenetration: 98.0, coffeeConsumption: 8.4 },
  NOR: { happinessIndex: 7.38, workHoursWeek: 33.8, internetPenetration: 98.0, coffeeConsumption: 9.9 },
  PAK: { happinessIndex: 4.66, workHoursWeek: 45.0, internetPenetration: 36.0, coffeeConsumption: 0.1 },
  POL: { happinessIndex: 6.26, workHoursWeek: 40.4, internetPenetration: 90.0, coffeeConsumption: 3.0 },
  RUS: { happinessIndex: 5.66, workHoursWeek: 40.0, internetPenetration: 85.0, coffeeConsumption: 0.7 },
  SAU: { happinessIndex: 6.52, workHoursWeek: 42.0, internetPenetration: 99.0, coffeeConsumption: 0.3 },
  SGP: { happinessIndex: 6.52, workHoursWeek: 42.0, internetPenetration: 96.0, coffeeConsumption: 1.0 },
  SWE: { happinessIndex: 7.36, workHoursWeek: 31.0, internetPenetration: 98.0, coffeeConsumption: 8.2 },
  TUR: { happinessIndex: 4.95, workHoursWeek: 46.4, internetPenetration: 83.0, coffeeConsumption: 0.8 },
  USA: { happinessIndex: 6.89, workHoursWeek: 38.7, internetPenetration: 92.0, coffeeConsumption: 4.2 },
  ZAF: { happinessIndex: 4.87, workHoursWeek: 43.0, internetPenetration: 72.0, coffeeConsumption: 0.6 },
}

// Freedom & Governance Data
const FREEDOM_DATA = {
  AFG: { corruptionIndex: 16, pressFreedom: 31 },
  ARG: { corruptionIndex: 38, pressFreedom: 69 },
  AUS: { corruptionIndex: 75, pressFreedom: 75 },
  AUT: { corruptionIndex: 71, pressFreedom: 82 },
  BEL: { corruptionIndex: 73, pressFreedom: 85 },
  BRA: { corruptionIndex: 38, pressFreedom: 51 },
  CAN: { corruptionIndex: 74, pressFreedom: 85 },
  CHE: { corruptionIndex: 82, pressFreedom: 89 },
  CHN: { corruptionIndex: 45, pressFreedom: 10 },
  COL: { corruptionIndex: 39, pressFreedom: 51 },
  DEU: { corruptionIndex: 78, pressFreedom: 83 },
  DNK: { corruptionIndex: 90, pressFreedom: 90 },
  EGY: { corruptionIndex: 30, pressFreedom: 21 },
  ESP: { corruptionIndex: 60, pressFreedom: 74 },
  FIN: { corruptionIndex: 87, pressFreedom: 88 },
  FRA: { corruptionIndex: 71, pressFreedom: 78 },
  GBR: { corruptionIndex: 73, pressFreedom: 71 },
  IND: { corruptionIndex: 40, pressFreedom: 36 },
  IDN: { corruptionIndex: 34, pressFreedom: 49 },
  IRN: { corruptionIndex: 25, pressFreedom: 12 },
  ITA: { corruptionIndex: 56, pressFreedom: 68 },
  JPN: { corruptionIndex: 73, pressFreedom: 68 },
  KOR: { corruptionIndex: 63, pressFreedom: 67 },
  MEX: { corruptionIndex: 31, pressFreedom: 33 },
  NGA: { corruptionIndex: 25, pressFreedom: 42 },
  NLD: { corruptionIndex: 79, pressFreedom: 89 },
  NOR: { corruptionIndex: 84, pressFreedom: 95 },
  PAK: { corruptionIndex: 27, pressFreedom: 37 },
  POL: { corruptionIndex: 54, pressFreedom: 57 },
  RUS: { corruptionIndex: 28, pressFreedom: 13 },
  SAU: { corruptionIndex: 53, pressFreedom: 11 },
  SGP: { corruptionIndex: 83, pressFreedom: 53 },
  SWE: { corruptionIndex: 83, pressFreedom: 88 },
  TUR: { corruptionIndex: 36, pressFreedom: 22 },
  UKR: { corruptionIndex: 33, pressFreedom: 61 },
  USA: { corruptionIndex: 69, pressFreedom: 67 },
  ZAF: { corruptionIndex: 43, pressFreedom: 62 },
  ISL: { corruptionIndex: 74, pressFreedom: 93 },
  ISR: { corruptionIndex: 62, pressFreedom: 68 },
}

// Extended Crime Data
const CRIME_EXTENDED = {
  AFG: { gunOwnership: 12.5, incarcerationRate: 70 },
  ARG: { gunOwnership: 8.9, incarcerationRate: 213 },
  AUS: { gunOwnership: 14.5, incarcerationRate: 160 },
  BRA: { gunOwnership: 8.3, incarcerationRate: 381 },
  CAN: { gunOwnership: 34.7, incarcerationRate: 104 },
  CHE: { gunOwnership: 27.6, incarcerationRate: 74 },
  CHN: { gunOwnership: 3.6, incarcerationRate: 119 },
  DEU: { gunOwnership: 19.6, incarcerationRate: 69 },
  FIN: { gunOwnership: 32.4, incarcerationRate: 50 },
  FRA: { gunOwnership: 19.6, incarcerationRate: 93 },
  GBR: { gunOwnership: 4.6, incarcerationRate: 129 },
  IND: { gunOwnership: 5.3, incarcerationRate: 35 },
  IRN: { gunOwnership: 7.3, incarcerationRate: 284 },
  ISR: { gunOwnership: 7.3, incarcerationRate: 234 },
  ITA: { gunOwnership: 14.4, incarcerationRate: 89 },
  JPN: { gunOwnership: 0.3, incarcerationRate: 37 },
  MEX: { gunOwnership: 12.9, incarcerationRate: 164 },
  NOR: { gunOwnership: 28.8, incarcerationRate: 54 },
  PAK: { gunOwnership: 22.3, incarcerationRate: 34 },
  RUS: { gunOwnership: 12.3, incarcerationRate: 326 },
  SAU: { gunOwnership: 10.7, incarcerationRate: 197 },
  SWE: { gunOwnership: 23.1, incarcerationRate: 63 },
  TUR: { gunOwnership: 12.5, incarcerationRate: 344 },
  USA: { gunOwnership: 120.5, incarcerationRate: 531 },
  YEM: { gunOwnership: 52.8, incarcerationRate: 48 },
  ZAF: { gunOwnership: 12.7, incarcerationRate: 232 },
  DNK: { gunOwnership: 9.9, incarcerationRate: 67 },
  ISL: { gunOwnership: 31.7, incarcerationRate: 33 },
  NLD: { gunOwnership: 2.6, incarcerationRate: 59 },
  ESP: { gunOwnership: 10.4, incarcerationRate: 118 },
  POL: { gunOwnership: 2.5, incarcerationRate: 186 },
}

function mergeData() {
  // Read existing countries data
  const rawData = fs.readFileSync(COUNTRIES_PATH, 'utf-8')
  const countries = JSON.parse(rawData)

  console.log(`Processing ${countries.length} countries...`)

  // Merge new data into each country
  const updatedCountries = countries.map((country) => {
    const iso3 = country.iso3
    const healthData = HEALTH_DATA[iso3]
    const sexData = SEX_DATA[iso3]
    const demographicsData = DEMOGRAPHICS_DATA[iso3]
    const educationData = EDUCATION_DATA[iso3]
    const lifestyleData = LIFESTYLE_DATA[iso3]
    const freedomData = FREEDOM_DATA[iso3]
    const crimeExtended = CRIME_EXTENDED[iso3]

    // Build the new country object with all categories
    return {
      ...country,
      // Extend crime data with new fields
      crime: {
        ...country.crime,
        incarcerationRate: crimeExtended?.incarcerationRate ?? null,
        policePerCapita: null,
        gunOwnership: crimeExtended?.gunOwnership ?? null,
        roadDeaths: null,
      },
      // Add new categories with defaults
      health: {
        lifeExpectancy: healthData?.lifeExpectancy ?? null,
        maleHeight: healthData?.maleHeight ?? null,
        femaleHeight: healthData?.femaleHeight ?? null,
        obesityRate: healthData?.obesityRate ?? null,
        penisSize: healthData?.penisSize ?? null,
        breastSize: null,
        fertilityRate: healthData?.fertilityRate ?? null,
        infantMortality: null,
        cancerRate: null,
        hivPrevalence: null,
        suicideRate: healthData?.suicideRate ?? null,
        alcoholConsumption: healthData?.alcoholConsumption ?? null,
        smokingRate: null,
        drugUseRate: null,
      },
      sex: {
        sexualPartners: sexData?.sexualPartners ?? null,
        ageFirstSex: null,
        divorceRate: sexData?.divorceRate ?? null,
        marriageAge: null,
        singleParentRate: null,
        contraceptionUse: null,
        teenPregnancy: null,
        lgbtAcceptance: sexData?.lgbtAcceptance ?? null,
      },
      demographics: {
        ethnicDiversity: demographicsData?.ethnicDiversity ?? null,
        immigrationRate: null,
        emigrationRate: null,
        medianAge: demographicsData?.medianAge ?? null,
        urbanPopulation: demographicsData?.urbanPopulation ?? null,
        populationDensity: null,
      },
      education: {
        avgIQ: educationData?.avgIQ ?? null,
        literacyRate: educationData?.literacyRate ?? null,
        universityEnrollment: null,
        pisaMath: educationData?.pisaMath ?? null,
        pisaReading: null,
        pisaScience: null,
        nobelPrizesPerCapita: null,
        patentsPerCapita: null,
        rdSpending: null,
      },
      lifestyle: {
        happinessIndex: lifestyleData?.happinessIndex ?? null,
        workHoursWeek: lifestyleData?.workHoursWeek ?? null,
        vacationDays: null,
        internetPenetration: lifestyleData?.internetPenetration ?? null,
        socialMediaUse: null,
        coffeeConsumption: lifestyleData?.coffeeConsumption ?? null,
        meatConsumption: null,
        vegetarianRate: null,
      },
      freedom: {
        corruptionIndex: freedomData?.corruptionIndex ?? null,
        pressFreedom: freedomData?.pressFreedom ?? null,
        drugPolicyScore: null,
      },
      // Update sources
      sources: {
        ...country.sources,
        health: healthData
          ? { source: 'WHO / NCD-RisC / Various Studies', year: 2023 }
          : undefined,
        sex: sexData
          ? { source: 'Durex Survey / World Population Review', year: 2023 }
          : undefined,
        demographics: demographicsData
          ? { source: 'World Bank / UN', year: 2023 }
          : undefined,
        education: educationData
          ? { source: 'OECD PISA / World Population Review', year: 2023 }
          : undefined,
        lifestyle: lifestyleData
          ? { source: 'World Happiness Report / OECD / ICO', year: 2024 }
          : undefined,
        freedom: freedomData
          ? { source: 'Transparency International / RSF', year: 2024 }
          : undefined,
      },
    }
  })

  // Write updated data
  fs.writeFileSync(
    COUNTRIES_PATH,
    JSON.stringify(updatedCountries, null, 2),
    'utf-8'
  )

  // Count how many countries have new data
  let healthCount = 0
  let sexCount = 0
  let demoCount = 0
  let eduCount = 0
  let lifeCount = 0
  let freedomCount = 0

  updatedCountries.forEach((c) => {
    if (c.health?.lifeExpectancy !== null) healthCount++
    if (c.sex?.sexualPartners !== null) sexCount++
    if (c.demographics?.ethnicDiversity !== null) demoCount++
    if (c.education?.avgIQ !== null) eduCount++
    if (c.lifestyle?.happinessIndex !== null) lifeCount++
    if (c.freedom?.corruptionIndex !== null) freedomCount++
  })

  console.log('\nData merge complete!')
  console.log(`Countries with Health data: ${healthCount}`)
  console.log(`Countries with Sex/Relationships data: ${sexCount}`)
  console.log(`Countries with Demographics data: ${demoCount}`)
  console.log(`Countries with Education/IQ data: ${eduCount}`)
  console.log(`Countries with Lifestyle data: ${lifeCount}`)
  console.log(`Countries with Freedom/Governance data: ${freedomCount}`)
}

mergeData()

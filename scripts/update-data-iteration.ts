/**
 * Data Update Script - Iteration 2
 *
 * This script updates countries.json with:
 * 1. LGBT acceptance scores (Williams Institute GAI)
 * 2. Divorce rates (World Population Review)
 * 3. Tea consumption (FAO/World Population Review)
 * 4. Vegetarian rates (World Population Review)
 * 5. Left-handedness rates (Various studies)
 * 6. Metal bands per capita (Encyclopaedia Metallum)
 */

import * as fs from 'fs';
import * as path from 'path';

interface Country {
  name: string;
  iso3: string;
  [key: string]: unknown;
}

// Helper to normalize country names for matching
function normalizeName(name: string): string {
  return name.toLowerCase()
    .replace(/['']/g, "'")
    .replace(/&/g, 'and')
    .replace(/\s+/g, ' ')
    .trim();
}

// LGBT Acceptance (Williams Institute GAI, scale 0-10)
const lgbtAcceptanceData: Record<string, number> = {
  'Iceland': 97.8, 'Netherlands': 94.6, 'Norway': 93.8, 'Sweden': 91.8, 'Canada': 90.2,
  'Spain': 87.7, 'Denmark': 86.9, 'Ireland': 84.1, 'United Kingdom': 83.4, 'New Zealand': 82.3,
  'Belgium': 81.5, 'Australia': 80.2, 'France': 79.5, 'Germany': 78.2, 'Finland': 77.8,
  'Switzerland': 76.5, 'Austria': 74.2, 'Luxembourg': 73.8, 'Portugal': 72.5, 'Malta': 71.2,
  'United States': 69.8, 'Italy': 65.4, 'Argentina': 64.2, 'Uruguay': 63.8, 'Chile': 61.5,
  'Brazil': 58.2, 'Israel': 57.5, 'Mexico': 55.8, 'Costa Rica': 54.2, 'Czech Republic': 52.8,
  'Slovenia': 51.5, 'Colombia': 48.2, 'Ecuador': 46.5, 'Peru': 44.2, 'Japan': 42.8,
  'Taiwan': 55.2, 'South Korea': 38.5, 'Thailand': 52.5, 'Philippines': 48.5, 'India': 32.5,
  'Poland': 41.2, 'Hungary': 38.5, 'Croatia': 44.2, 'Greece': 52.8, 'Cyprus': 48.2,
  'Turkey': 28.5, 'Russia': 24.5, 'Ukraine': 32.8, 'China': 28.2, 'Vietnam': 38.2,
  'Indonesia': 18.5, 'Malaysia': 22.5, 'Singapore': 45.2, 'South Africa': 42.5, 'Kenya': 18.2,
  'Nigeria': 8.5, 'Ghana': 12.5, 'Uganda': 8.2, 'Egypt': 12.5, 'Morocco': 15.2,
  'Saudi Arabia': 5.2, 'Iran': 4.8, 'Iraq': 5.5, 'Pakistan': 6.2, 'Bangladesh': 8.5,
  'Afghanistan': 3.5, 'Azerbaijan': 14.2, 'Tajikistan': 15.6, 'Zimbabwe': 15.7,
  'Somalia': 4.2, 'Ethiopia': 16.3, 'Malawi': 17.5, 'Mauritania': 5.2, 'Senegal': 8.5,
  'Jordan': 18.7, 'Moldova': 28.5, 'Zambia': 12.5, 'Nepal': 38.2, 'Sri Lanka': 22.5,
  'Cambodia': 35.2, 'Myanmar': 18.2, 'Laos': 32.5, 'Bolivia': 38.5, 'Paraguay': 32.5,
  'Venezuela': 42.5, 'Panama': 45.2, 'Dominican Republic': 38.5, 'Jamaica': 15.2,
  'Trinidad and Tobago': 28.5, 'Cuba': 52.5, 'Puerto Rico': 62.5, 'Honduras': 22.5,
  'Guatemala': 25.2, 'El Salvador': 28.5, 'Nicaragua': 32.5, 'Belize': 28.5,
  'Romania': 28.5, 'Bulgaria': 32.5, 'Serbia': 35.2, 'Bosnia and Herzegovina': 32.5,
  'North Macedonia': 28.5, 'Albania': 32.5, 'Montenegro': 38.5, 'Kosovo': 25.2,
  'Estonia': 55.2, 'Latvia': 42.5, 'Lithuania': 38.5, 'Belarus': 22.5, 'Georgia': 28.5,
  'Armenia': 18.5, 'Kazakhstan': 22.5, 'Uzbekistan': 12.5, 'Kyrgyzstan': 15.2,
  'Turkmenistan': 8.5, 'Mongolia': 32.5, 'Tunisia': 18.5, 'Algeria': 8.5, 'Libya': 5.2,
  'Sudan': 4.5, 'Yemen': 3.8, 'Oman': 12.5, 'Kuwait': 15.2, 'Bahrain': 18.5,
  'Qatar': 15.8, 'United Arab Emirates': 22.5, 'Lebanon': 32.5, 'Syria': 8.5,
};

// Divorce rates (per 1,000 population)
const divorceRateData: Record<string, number> = {
  'Maldives': 5.52, 'Liechtenstein': 4.9, 'Belarus': 3.7, 'Georgia': 3.7, 'Latvia': 2.8,
  'Andorra': 2.7, 'Costa Rica': 2.6, 'Lithuania': 2.5, 'Dominican Republic': 2.4,
  'Denmark': 2.2, 'Finland': 2.1, 'Albania': 2.1, 'Luxembourg': 2.1, 'Turkey': 2.0,
  'Kazakhstan': 2.0, 'Sweden': 2.0, 'Estonia': 1.9, 'South Korea': 1.8, 'Czechia': 1.8,
  'Kyrgyzstan': 1.8, 'Hungary': 1.7, 'Norway': 1.6, 'Kuwait': 1.6, 'Brunei': 1.6,
  'Germany': 1.5, 'Poland': 1.5, 'Serbia': 1.5, 'New Zealand': 1.5, 'Uzbekistan': 1.4,
  'Netherlands': 1.4, 'Bulgaria': 1.4, 'Mongolia': 1.4, 'Montenegro': 1.3, 'Croatia': 1.1,
  'Slovenia': 1.0, 'North Macedonia': 1.0, 'Austria': 1.6, 'Belgium': 1.8, 'France': 1.9,
  'Spain': 1.6, 'Portugal': 1.8, 'Italy': 1.4, 'Greece': 1.2, 'Switzerland': 1.7,
  'United Kingdom': 1.7, 'Ireland': 0.6, 'Iceland': 1.9, 'United States': 2.4,
  'Canada': 1.8, 'Australia': 1.9, 'Japan': 1.5, 'China': 3.2, 'Russia': 3.9,
  'Ukraine': 2.9, 'Moldova': 3.8, 'Romania': 1.2, 'Czech Republic': 1.8,
  'Slovakia': 1.5, 'Brazil': 1.4, 'Argentina': 1.2, 'Mexico': 1.1, 'Colombia': 0.9,
  'Chile': 1.5, 'Peru': 0.2, 'Venezuela': 0.7, 'Uruguay': 0.7, 'Egypt': 2.0,
  'South Africa': 0.6, 'Thailand': 1.4, 'Vietnam': 0.2, 'Philippines': 0.0,
  'Malaysia': 1.6, 'Indonesia': 1.2, 'Singapore': 1.6, 'Taiwan': 2.0, 'India': 0.3,
  'Pakistan': 0.5, 'Bangladesh': 0.9, 'Sri Lanka': 0.15, 'Nepal': 0.8, 'Israel': 1.8,
  'Saudi Arabia': 2.1, 'United Arab Emirates': 1.9, 'Qatar': 0.8, 'Iran': 1.9,
  'Iraq': 1.8, 'Jordan': 2.1, 'Lebanon': 1.2, 'Morocco': 1.0, 'Tunisia': 1.5,
  'Algeria': 1.5, 'Nigeria': 0.2, 'Kenya': 0.3, 'Ghana': 0.2, 'Ethiopia': 0.4,
  'Tanzania': 0.3, 'Uganda': 0.2, 'Rwanda': 0.3, 'Zimbabwe': 0.4,
  'Malta': 0.5, 'Guatemala': 0.6, 'Puerto Rico': 2.2, 'Panama': 1.0,
  'Honduras': 0.6, 'El Salvador': 0.8, 'Jamaica': 0.4, 'Trinidad and Tobago': 0.9,
  'Cuba': 2.9, 'Azerbaijan': 1.5, 'Armenia': 1.0, 'Tajikistan': 0.8,
};

// Tea consumption (kg per capita per year)
const teaConsumptionData: Record<string, number> = {
  'Turkey': 3.16, 'Ireland': 2.19, 'United Kingdom': 1.94, 'Iran': 1.50, 'Pakistan': 1.00,
  'Russia': 1.21, 'Morocco': 1.22, 'Egypt': 0.94, 'New Zealand': 0.78, 'Poland': 0.96,
  'Japan': 0.97, 'Saudi Arabia': 0.94, 'South Africa': 0.51, 'Netherlands': 0.46,
  'Australia': 0.52, 'Chile': 0.55, 'Germany': 0.48, 'Hong Kong': 1.29, 'China': 1.62,
  'India': 0.72, 'Kenya': 0.43, 'Taiwan': 1.05, 'Kazakhstan': 1.01, 'Qatar': 0.82,
  'Kuwait': 1.60, 'United Arab Emirates': 0.78, 'Sri Lanka': 1.21, 'Argentina': 0.28,
  'Tunisia': 0.48, 'Syria': 0.79, 'Iraq': 1.25, 'Bahrain': 0.92, 'Oman': 0.85,
  'Libya': 1.02, 'Myanmar': 0.79, 'Afghanistan': 0.85, 'Bangladesh': 0.48, 'Nepal': 0.62,
  'Uzbekistan': 0.75, 'Kyrgyzstan': 0.88, 'Tajikistan': 0.72, 'Azerbaijan': 0.95,
  'Vietnam': 0.52, 'Thailand': 0.45, 'Indonesia': 0.32, 'Malaysia': 0.58, 'Singapore': 0.48,
  'Philippines': 0.22, 'Cambodia': 0.18, 'Laos': 0.25, 'Mongolia': 0.75, 'South Korea': 0.32,
  'France': 0.23, 'Belgium': 0.18, 'Spain': 0.12, 'Italy': 0.08, 'Portugal': 0.15,
  'Greece': 0.18, 'Sweden': 0.25, 'Norway': 0.22, 'Denmark': 0.35, 'Finland': 0.28,
  'Czech Republic': 0.35, 'Hungary': 0.28, 'Slovakia': 0.25, 'Romania': 0.22,
  'Bulgaria': 0.18, 'Serbia': 0.15, 'Croatia': 0.12, 'Slovenia': 0.18,
  'United States': 0.38, 'Canada': 0.52, 'Mexico': 0.08, 'Brazil': 0.12,
  'Colombia': 0.05, 'Peru': 0.15, 'Venezuela': 0.05, 'Ecuador': 0.08,
  'Switzerland': 0.32, 'Luxembourg': 0.28, 'Iceland': 0.35, 'Malta': 0.45,
  'Ukraine': 0.55, 'Belarus': 0.48, 'Moldova': 0.35, 'Georgia': 0.58,
  'Armenia': 0.42, 'Jordan': 0.85, 'Lebanon': 0.52, 'Israel': 0.48,
  'Nigeria': 0.05, 'Ghana': 0.08, 'Ethiopia': 0.12, 'Tanzania': 0.15,
  'Uganda': 0.08, 'Rwanda': 0.12, 'Zimbabwe': 0.15, 'Zambia': 0.08,
};

// Vegetarian rate (% of population)
const vegetarianRateData: Record<string, number> = {
  'India': 29.5, 'Mexico': 19.0, 'Brazil': 14.0, 'Taiwan': 13.5, 'Israel': 13.0,
  'Australia': 12.1, 'Argentina': 12.0, 'Sweden': 12.0, 'Finland': 12.0, 'Austria': 11.0,
  'Vietnam': 10.0, 'Germany': 10.0, 'Denmark': 10.0, 'New Zealand': 10.0, 'Jamaica': 10.0,
  'Japan': 9.0, 'Norway': 9.0, 'Poland': 8.4, 'Thailand': 8.0, 'United Kingdom': 8.0,
  'Canada': 7.6, 'Italy': 7.4, 'Belgium': 7.0, 'Singapore': 7.0, 'Ireland': 6.4,
  'China': 6.0, 'Chile': 6.0, 'Lithuania': 6.0, 'Estonia': 6.0, 'France': 5.2,
  'Ukraine': 5.2, 'Philippines': 5.0, 'Netherlands': 5.0, 'Hungary': 5.0, 'Switzerland': 5.0,
  'Latvia': 5.0, 'United States': 4.2, 'Colombia': 4.0, 'Greece': 4.0, 'South Korea': 3.0,
  'Slovenia': 1.5, 'Spain': 1.4, 'Portugal': 1.2, 'Russia': 1.0,
  'Indonesia': 4.5, 'Malaysia': 3.5, 'South Africa': 2.5, 'Nigeria': 1.5, 'Egypt': 2.0,
  'Turkey': 3.5, 'Pakistan': 4.0, 'Bangladesh': 3.5, 'Sri Lanka': 8.0, 'Nepal': 15.0,
  'Czech Republic': 5.0, 'Slovakia': 4.0, 'Romania': 2.5, 'Bulgaria': 3.0, 'Serbia': 2.5,
  'Croatia': 3.0, 'Bosnia and Herzegovina': 2.0, 'Albania': 1.5, 'North Macedonia': 2.0,
  'Montenegro': 2.5, 'Kosovo': 2.0, 'Moldova': 1.5, 'Belarus': 1.5, 'Georgia': 2.5,
  'Armenia': 2.0, 'Azerbaijan': 1.5, 'Kazakhstan': 1.0, 'Uzbekistan': 1.0, 'Peru': 3.5,
  'Ecuador': 3.0, 'Bolivia': 3.0, 'Paraguay': 2.5, 'Uruguay': 4.0, 'Venezuela': 2.5,
  'Costa Rica': 5.0, 'Panama': 3.5, 'Dominican Republic': 2.5, 'Cuba': 3.0,
  'Puerto Rico': 4.0, 'Honduras': 2.0, 'Guatemala': 2.5, 'El Salvador': 2.5,
  'Nicaragua': 2.0, 'Morocco': 1.5, 'Tunisia': 2.0, 'Algeria': 1.5, 'Kenya': 3.0,
  'Ethiopia': 12.0, 'Tanzania': 2.5, 'Uganda': 2.0, 'Rwanda': 2.5, 'Ghana': 2.0,
  'Iran': 2.0, 'Iraq': 1.0, 'Saudi Arabia': 1.0, 'Jordan': 1.5, 'Lebanon': 3.5,
  'United Arab Emirates': 3.0, 'Qatar': 2.5, 'Kuwait': 2.0, 'Bahrain': 2.5, 'Oman': 1.5,
  'Iceland': 6.0, 'Luxembourg': 5.5, 'Malta': 4.0, 'Cyprus': 3.5, 'Liechtenstein': 6.0,
};

// Left-handedness rate (% of population)
const leftHandedRateData: Record<string, number> = {
  'Netherlands': 13.23, 'United States': 13.1, 'Belgium': 13.1, 'Canada': 12.8,
  'United Kingdom': 12.24, 'Ireland': 11.65, 'Switzerland': 11.61, 'France': 11.15,
  'Denmark': 11.0, 'Italy': 10.51, 'Sweden': 10.42, 'Norway': 10.19, 'Germany': 9.83,
  'Spain': 9.63, 'Australia': 10.5, 'New Zealand': 10.2, 'Austria': 9.5, 'Finland': 9.8,
  'Portugal': 9.2, 'Greece': 8.8, 'Poland': 8.5, 'Czech Republic': 8.2, 'Hungary': 8.0,
  'Slovenia': 7.8, 'Slovakia': 7.5, 'Croatia': 7.2, 'Romania': 6.8, 'Bulgaria': 6.5,
  'Serbia': 6.2, 'Russia': 6.0, 'Ukraine': 6.2, 'Belarus': 5.8, 'Lithuania': 7.5,
  'Latvia': 7.2, 'Estonia': 7.8, 'Iceland': 10.5, 'Luxembourg': 10.2, 'Malta': 9.0,
  'Cyprus': 8.5, 'Israel': 9.2, 'Japan': 4.7, 'China': 3.5, 'South Korea': 5.2,
  'Taiwan': 5.8, 'Hong Kong': 5.5, 'Singapore': 6.2, 'Thailand': 4.5, 'Vietnam': 4.0,
  'Indonesia': 3.8, 'Malaysia': 4.2, 'Philippines': 4.8, 'India': 4.0, 'Pakistan': 3.5,
  'Bangladesh': 3.2, 'Sri Lanka': 4.5, 'Nepal': 4.2, 'Myanmar': 3.8, 'Cambodia': 3.5,
  'Laos': 3.8, 'Mongolia': 5.5, 'Kazakhstan': 5.2, 'Uzbekistan': 4.8, 'Kyrgyzstan': 4.5,
  'Tajikistan': 4.2, 'Turkmenistan': 4.0, 'Azerbaijan': 4.5, 'Georgia': 5.2, 'Armenia': 5.0,
  'Turkey': 5.8, 'Iran': 4.5, 'Iraq': 4.0, 'Saudi Arabia': 3.5, 'United Arab Emirates': 5.0,
  'Qatar': 5.2, 'Kuwait': 5.0, 'Bahrain': 5.2, 'Oman': 4.5, 'Yemen': 3.5, 'Jordan': 4.2,
  'Lebanon': 5.5, 'Syria': 4.0, 'Egypt': 3.5, 'Libya': 3.8, 'Tunisia': 4.0, 'Algeria': 3.5,
  'Morocco': 4.0, 'Sudan': 3.2, 'Ethiopia': 3.5, 'Kenya': 3.8, 'Nigeria': 3.5,
  'Ghana': 3.8, 'South Africa': 5.5, 'Tanzania': 3.5, 'Uganda': 3.2, 'Rwanda': 3.5,
  'Zimbabwe': 3.8, 'Zambia': 3.5, 'Botswana': 4.0, 'Namibia': 4.2, 'Angola': 3.5,
  'Mozambique': 3.2, 'Madagascar': 3.5, 'Senegal': 3.0, 'Mali': 2.8, 'Cameroon': 3.2,
  'Brazil': 8.5, 'Argentina': 9.0, 'Mexico': 7.5, 'Colombia': 7.2, 'Chile': 8.0,
  'Peru': 6.5, 'Venezuela': 6.8, 'Ecuador': 6.2, 'Bolivia': 5.8, 'Paraguay': 5.5,
  'Uruguay': 8.2, 'Costa Rica': 7.5, 'Panama': 7.0, 'Cuba': 6.5, 'Dominican Republic': 6.2,
  'Jamaica': 6.8, 'Trinidad and Tobago': 7.0, 'Honduras': 5.5, 'Guatemala': 5.2,
  'El Salvador': 5.5, 'Nicaragua': 5.0, 'Puerto Rico': 8.5, 'Afghanistan': 3.0,
  'Somalia': 2.5, 'Eritrea': 2.8, 'Djibouti': 3.0, 'Mauritania': 2.8,
};

// Metal bands per 100,000 people (Encyclopaedia Metallum)
const metalBandsData: Record<string, number> = {
  'Finland': 84.5, 'Iceland': 52.11, 'Sweden': 51.94, 'Liechtenstein': 41.83, 'Norway': 38.74,
  'Faroe Islands': 28.54, 'Greece': 22.7, 'Denmark': 20.52, 'Estonia': 18.88, 'Malta': 18.57,
  'Austria': 16.33, 'Chile': 16.10, 'Netherlands': 15.94, 'Czechia': 15.91, 'Slovenia': 15.38,
  'Germany': 15.25, 'Luxembourg': 14.87, 'Portugal': 14.76, 'Switzerland': 14.46, 'Canada': 14.1,
  'Croatia': 14.0, 'Hungary': 13.48, 'Belgium': 13.15, 'Australia': 12.95, 'Italy': 12.8,
  'Slovakia': 12.69, 'United States': 10.79, 'Poland': 10.66, 'Ireland': 10.3, 'New Zealand': 10.13,
  'Spain': 9.95, 'United Kingdom': 9.88, 'France': 9.14, 'Latvia': 7.65, 'Lithuania': 7.55,
  'Serbia': 7.42, 'Cyprus': 7.16, 'Bulgaria': 7.02, 'Argentina': 6.85, 'Costa Rica': 6.75,
  'Uruguay': 6.74, 'Brunei': 6.12, 'North Macedonia': 5.96, 'Singapore': 5.72, 'Puerto Rico': 5.64,
  'Belarus': 5.24, 'Bosnia and Herzegovina': 4.78, 'Colombia': 4.16, 'Russia': 3.68, 'Brazil': 3.5,
  'Israel': 3.47, 'Paraguay': 3.26, 'Bolivia': 3.01, 'Ukraine': 3.0, 'Mexico': 2.98,
  'El Salvador': 2.73, 'Romania': 2.58, 'Montenegro': 2.58, 'Japan': 2.21, 'Panama': 2.17,
  'Malaysia': 2.15, 'Peru': 2.04, 'Moldova': 1.9, 'Venezuela': 1.85, 'Maldives': 1.84,
  'Georgia': 1.15, 'Cuba': 1.03, 'Bahrain': 1.03, 'Armenia': 1.01, 'Guatemala': 0.95,
  'Lebanon': 0.9, 'Indonesia': 0.83, 'Nicaragua': 0.81, 'Honduras': 0.77, 'Turkey': 0.75,
  'Ecuador': 0.64, 'Hong Kong': 0.59, 'Albania': 0.5, 'Dominican Republic': 0.47,
  'South Africa': 0.47, 'Taiwan': 0.42, 'Thailand': 0.35, 'Kazakhstan': 0.34, 'Jordan': 0.34,
  'United Arab Emirates': 0.34, 'Philippines': 0.33, 'Tunisia': 0.28, 'South Korea': 0.28,
  'Sri Lanka': 0.23, 'Syria': 0.21, 'Kyrgyzstan': 0.16, 'Iran': 0.16, 'Azerbaijan': 0.15,
  'Nepal': 0.13, 'Morocco': 0.09, 'Madagascar': 0.07, 'Algeria': 0.07, 'Vietnam': 0.05,
  'Bangladesh': 0.05, 'Egypt': 0.05, 'Saudi Arabia': 0.05, 'Uzbekistan': 0.04, 'Iraq': 0.03,
  'China': 0.03, 'Pakistan': 0.03, 'India': 0.02,
  // Countries with effectively 0 metal bands
  'Afghanistan': 0, 'Yemen': 0, 'Sudan': 0, 'Libya': 0, 'Somalia': 0, 'Eritrea': 0,
  'North Korea': 0, 'Turkmenistan': 0, 'Tajikistan': 0,
};

// Beer consumption (liters per capita per year)
const beerConsumptionData: Record<string, number> = {
  'Czech Republic': 184, 'Austria': 106, 'Germany': 100, 'Poland': 98, 'Ireland': 93,
  'Romania': 90, 'Spain': 86, 'Croatia': 82, 'Estonia': 82, 'Slovenia': 78,
  'Lithuania': 75, 'Belgium': 74, 'Latvia': 72, 'Finland': 70, 'United Kingdom': 67,
  'Hungary': 65, 'Slovakia': 65, 'Australia': 63, 'Netherlands': 62, 'Bulgaria': 62,
  'Portugal': 60, 'Denmark': 59, 'New Zealand': 58, 'United States': 72, 'Canada': 58,
  'Russia': 55, 'Ukraine': 50, 'Brazil': 55, 'Argentina': 45, 'Mexico': 68,
  'Venezuela': 85, 'South Africa': 52, 'Japan': 35, 'South Korea': 40, 'China': 32,
  'Vietnam': 45, 'Thailand': 28, 'Philippines': 22, 'Singapore': 25, 'Taiwan': 28,
  'Sweden': 52, 'Norway': 52, 'Switzerland': 55, 'France': 32, 'Italy': 32,
  'Greece': 40, 'Cyprus': 55, 'Iceland': 62, 'Luxembourg': 95, 'Malta': 48,
  'Serbia': 58, 'Bosnia and Herzegovina': 45, 'North Macedonia': 40, 'Montenegro': 45,
  'Albania': 25, 'Moldova': 35, 'Belarus': 42, 'Georgia': 18, 'Armenia': 15,
  'Azerbaijan': 5, 'Kazakhstan': 35, 'Uzbekistan': 8, 'Panama': 65, 'Costa Rica': 52,
  'Dominican Republic': 55, 'Colombia': 45, 'Chile': 38, 'Peru': 42, 'Ecuador': 35,
  'Paraguay': 50, 'Uruguay': 32, 'Bolivia': 28, 'Honduras': 30, 'Guatemala': 22,
  'El Salvador': 28, 'Nicaragua': 25, 'Jamaica': 35, 'Trinidad and Tobago': 42,
  'Cuba': 18, 'Nigeria': 12, 'Cameroon': 35, 'Kenya': 15, 'South Sudan': 8,
  'Ethiopia': 10, 'Tanzania': 12, 'Uganda': 18, 'Rwanda': 22, 'Ghana': 8,
  'Botswana': 48, 'Namibia': 108, 'Zimbabwe': 28, 'Zambia': 18, 'Angola': 25,
  'Mozambique': 12, 'India': 2, 'Pakistan': 0.1, 'Bangladesh': 0.1, 'Nepal': 5,
  'Sri Lanka': 8, 'Myanmar': 5, 'Cambodia': 8, 'Laos': 35, 'Mongolia': 22,
  'Israel': 18, 'Lebanon': 12, 'Jordan': 2, 'Egypt': 1, 'Morocco': 2,
  'Tunisia': 15, 'Turkey': 12, 'Iran': 0.5, 'Iraq': 1, 'Saudi Arabia': 0,
  'United Arab Emirates': 12, 'Qatar': 5, 'Kuwait': 0, 'Bahrain': 8, 'Oman': 2,
};

// Wine consumption (liters per capita per year)
const wineConsumptionData: Record<string, number> = {
  'Portugal': 52, 'France': 47, 'Italy': 44, 'Switzerland': 35, 'Slovenia': 34,
  'Croatia': 32, 'Austria': 30, 'Germany': 28, 'Belgium': 26, 'Denmark': 32,
  'Sweden': 28, 'Netherlands': 22, 'United Kingdom': 22, 'Czech Republic': 18,
  'Hungary': 28, 'Greece': 22, 'Spain': 22, 'Romania': 18, 'Bulgaria': 12,
  'Slovakia': 12, 'Ireland': 15, 'Norway': 15, 'Finland': 12, 'Lithuania': 8,
  'Latvia': 6, 'Estonia': 10, 'Poland': 5, 'Russia': 6, 'Ukraine': 3,
  'Belarus': 2, 'Moldova': 22, 'Georgia': 15, 'Armenia': 3, 'Azerbaijan': 1,
  'United States': 12, 'Canada': 12, 'Australia': 25, 'New Zealand': 22,
  'Argentina': 22, 'Chile': 16, 'Uruguay': 22, 'Brazil': 2, 'Peru': 1,
  'Colombia': 0.5, 'Mexico': 1, 'South Africa': 8, 'Japan': 3, 'South Korea': 1,
  'China': 1.5, 'Taiwan': 1, 'Singapore': 2, 'Thailand': 0.5, 'Philippines': 0.2,
  'Vietnam': 0.3, 'Indonesia': 0.1, 'Malaysia': 0.5, 'India': 0.1,
  'Israel': 5, 'Lebanon': 4, 'Turkey': 1, 'Cyprus': 12, 'Malta': 18,
  'Luxembourg': 48, 'Iceland': 15, 'Serbia': 12, 'Bosnia and Herzegovina': 5,
  'North Macedonia': 8, 'Montenegro': 15, 'Albania': 5, 'Kosovo': 3,
  'Kazakhstan': 1, 'Uzbekistan': 0.5, 'Kyrgyzstan': 1, 'Panama': 1,
  'Costa Rica': 1.5, 'Dominican Republic': 0.5, 'Cuba': 0.5, 'Jamaica': 0.3,
};

async function updateCountriesData() {
  // Read current data
  const dataPath = path.join(__dirname, '../data/countries.json');
  const rawData = fs.readFileSync(dataPath, 'utf-8');
  const countries: Country[] = JSON.parse(rawData);

  let lgbtUpdates = 0;
  let divorceUpdates = 0;
  let teaUpdates = 0;
  let vegetarianUpdates = 0;
  let leftHandedUpdates = 0;
  let metalUpdates = 0;
  let beerUpdates = 0;
  let wineUpdates = 0;

  for (const country of countries) {
    const name = country.name;
    const normalizedName = normalizeName(name);

    // Match country name with various alternatives
    const findMatch = (data: Record<string, number>): number | null => {
      // Direct match
      if (data[name] !== undefined) return data[name];

      // Try common alternatives
      const alternatives: Record<string, string[]> = {
        'United States': ['USA', 'United States of America', 'US'],
        'United Kingdom': ['UK', 'Great Britain', 'Britain'],
        'South Korea': ['Korea, South', 'Republic of Korea', 'Korea'],
        'North Korea': ['Korea, North', 'DPRK'],
        'Russia': ['Russian Federation'],
        'Czech Republic': ['Czechia'],
        'Ivory Coast': ["Côte d'Ivoire", 'Cote d\'Ivoire'],
        'DR Congo': ['Democratic Republic of the Congo', 'DRC', 'Congo, Democratic Republic'],
        'Congo': ['Republic of the Congo', 'Congo, Republic'],
        'Syria': ['Syrian Arab Republic'],
        'Iran': ['Iran, Islamic Republic of'],
        'Venezuela': ['Venezuela, Bolivarian Republic of'],
        'Bolivia': ['Bolivia, Plurinational State of'],
        'Vietnam': ['Viet Nam'],
        'Laos': ["Lao People's Democratic Republic"],
        'Tanzania': ['United Republic of Tanzania'],
        'Taiwan': ['Taiwan, Province of China', 'Chinese Taipei'],
        'Moldova': ['Republic of Moldova'],
        'Macedonia': ['North Macedonia', 'Republic of North Macedonia'],
        'Eswatini': ['Swaziland'],
        'Myanmar': ['Burma'],
      };

      // Check if current country has alternatives
      for (const [standard, alts] of Object.entries(alternatives)) {
        if (name === standard || alts.includes(name)) {
          if (data[standard] !== undefined) return data[standard];
          for (const alt of alts) {
            if (data[alt] !== undefined) return data[alt];
          }
        }
      }

      // Also check reverse - if data has alternative name
      for (const [standard, alts] of Object.entries(alternatives)) {
        if (normalizedName === normalizeName(standard) || alts.some(alt => normalizeName(alt) === normalizedName)) {
          if (data[standard] !== undefined) return data[standard];
        }
      }

      return null;
    };

    // Update LGBT acceptance
    const lgbtScore = findMatch(lgbtAcceptanceData);
    if (lgbtScore !== null && ((country as any).sex?.lgbtAcceptance === null || (country as any).sex?.lgbtAcceptance === undefined)) {
      if ((country as any).sex) {
        (country as any).sex.lgbtAcceptance = lgbtScore;
        lgbtUpdates++;
      }
    }

    // Update divorce rate
    const divorceRate = findMatch(divorceRateData);
    if (divorceRate !== null && ((country as any).sex?.divorceRate === null || (country as any).sex?.divorceRate === undefined)) {
      if ((country as any).sex) {
        (country as any).sex.divorceRate = divorceRate;
        divorceUpdates++;
      }
    }

    // Update tea consumption
    const teaConsumption = findMatch(teaConsumptionData);
    if (teaConsumption !== null && ((country as any).lifestyle?.teaConsumption === null || (country as any).lifestyle?.teaConsumption === undefined)) {
      if ((country as any).lifestyle) {
        (country as any).lifestyle.teaConsumption = teaConsumption;
        teaUpdates++;
      }
    }

    // Update vegetarian rate
    const vegetarianRate = findMatch(vegetarianRateData);
    if (vegetarianRate !== null && ((country as any).lifestyle?.vegetarianRate === null || (country as any).lifestyle?.vegetarianRate === undefined || (country as any).lifestyle?.vegetarianRate < 1)) {
      if ((country as any).lifestyle) {
        (country as any).lifestyle.vegetarianRate = vegetarianRate;
        vegetarianUpdates++;
      }
    }

    // Update left-handed rate
    const leftHandedRate = findMatch(leftHandedRateData);
    if (leftHandedRate !== null && ((country as any).demographics?.leftHandedRate === null || (country as any).demographics?.leftHandedRate === undefined)) {
      if ((country as any).demographics) {
        (country as any).demographics.leftHandedRate = leftHandedRate;
        leftHandedUpdates++;
      }
    }

    // Add metal bands per capita (new field)
    const metalBands = findMatch(metalBandsData);
    if ((country as any).lifestyle) {
      if ((country as any).lifestyle.metalBandsPerCapita === undefined) {
        (country as any).lifestyle.metalBandsPerCapita = metalBands;
        if (metalBands !== null) metalUpdates++;
      } else if ((country as any).lifestyle.metalBandsPerCapita === null && metalBands !== null) {
        (country as any).lifestyle.metalBandsPerCapita = metalBands;
        metalUpdates++;
      }
    }

    // Update beer consumption
    const beerConsumption = findMatch(beerConsumptionData);
    if (beerConsumption !== null && ((country as any).lifestyle?.beerConsumption === null || (country as any).lifestyle?.beerConsumption === undefined)) {
      if ((country as any).lifestyle) {
        (country as any).lifestyle.beerConsumption = beerConsumption;
        beerUpdates++;
      }
    }

    // Update wine consumption
    const wineConsumption = findMatch(wineConsumptionData);
    if (wineConsumption !== null && ((country as any).lifestyle?.wineConsumption === null || (country as any).lifestyle?.wineConsumption === undefined)) {
      if ((country as any).lifestyle) {
        (country as any).lifestyle.wineConsumption = wineConsumption;
        wineUpdates++;
      }
    }
  }

  // Write updated data
  fs.writeFileSync(dataPath, JSON.stringify(countries, null, 2));

  console.log('\n=== DATA UPDATE COMPLETE ===\n');
  console.log(`LGBT Acceptance: ${lgbtUpdates} countries updated`);
  console.log(`Divorce Rate: ${divorceUpdates} countries updated`);
  console.log(`Tea Consumption: ${teaUpdates} countries updated`);
  console.log(`Vegetarian Rate: ${vegetarianUpdates} countries updated`);
  console.log(`Left-handedness: ${leftHandedUpdates} countries updated`);
  console.log(`Metal Bands: ${metalUpdates} countries updated`);
  console.log(`Beer Consumption: ${beerUpdates} countries updated`);
  console.log(`Wine Consumption: ${wineUpdates} countries updated`);
  console.log(`\nTotal updates: ${lgbtUpdates + divorceUpdates + teaUpdates + vegetarianUpdates + leftHandedUpdates + metalUpdates + beerUpdates + wineUpdates}`);
}

updateCountriesData().catch(console.error);

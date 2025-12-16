const fs = require('fs');
const path = require('path');

const countriesPath = path.join(__dirname, '..', 'data', 'countries.json');
const countries = JSON.parse(fs.readFileSync(countriesPath, 'utf-8'));

// ============================================================================
// FREEDOM DATA - Corruption, Press Freedom, Crypto
// Sources: Transparency International, RSF, Chainalysis
// ============================================================================

const freedomData = {
  // Corruption Perceptions Index (0-100, 100 = least corrupt) - TI 2023
  corruptionIndex: {
    AFG: 20, ALB: 36, DZA: 33, AND: 65, AGO: 23, ARG: 38, ARM: 46, AUS: 75,
    AUT: 71, AZE: 23, BHR: 42, BGD: 24, BLR: 39, BEL: 73, BEN: 42, BTN: 68,
    BOL: 29, BIH: 35, BWA: 55, BRA: 36, BRN: 55, BGR: 45, BFA: 42, BDI: 20,
    KHM: 22, CMR: 26, CAN: 76, CAF: 24, TCD: 19, CHL: 66, CHN: 42, COL: 40,
    COD: 20, COG: 21, CRI: 55, CIV: 40, HRV: 50, CUB: 42, CYP: 53, CZE: 57,
    DNK: 90, DJI: 30, DOM: 32, ECU: 36, EGY: 35, SLV: 31, GNQ: 17, ERI: 22,
    EST: 76, SWZ: 29, ETH: 37, FIN: 87, FRA: 72, GAB: 29, GMB: 34, GEO: 56,
    DEU: 78, GHA: 43, GRC: 49, GTM: 24, GIN: 26, GNB: 21, GUY: 40, HTI: 17,
    HND: 23, HUN: 42, ISL: 83, IND: 39, IDN: 34, IRN: 24, IRQ: 23, IRL: 77,
    ISR: 62, ITA: 56, JAM: 44, JPN: 73, JOR: 47, KAZ: 39, KEN: 31, PRK: 17,
    KOR: 63, KWT: 46, KGZ: 26, LAO: 28, LVA: 60, LBN: 24, LSO: 41, LBR: 25,
    LBY: 18, LTU: 61, LUX: 78, MDG: 26, MWI: 34, MYS: 50, MLI: 28, MRT: 30,
    MUS: 50, MEX: 31, MDA: 42, MNG: 35, MNE: 45, MAR: 38, MOZ: 26, MMR: 23,
    NAM: 49, NPL: 35, NLD: 79, NZL: 85, NIC: 17, NER: 32, NGA: 25, MKD: 40,
    NOR: 84, OMN: 52, PAK: 29, PAN: 36, PNG: 28, PRY: 28, PER: 36, PHL: 34,
    POL: 54, PRT: 61, QAT: 58, ROU: 46, RUS: 26, RWA: 53, SAU: 52, SEN: 43,
    SRB: 46, SLE: 34, SGP: 83, SVK: 54, SVN: 56, SOM: 11, ZAF: 41, SSD: 13,
    ESP: 60, LKA: 34, SDN: 22, SUR: 38, SWE: 82, CHE: 82, SYR: 13, TWN: 67,
    TJK: 20, TZA: 40, THA: 35, TLS: 42, TGO: 30, TTO: 42, TUN: 40, TUR: 34,
    TKM: 18, UGA: 26, UKR: 36, ARE: 68, GBR: 71, USA: 69, URY: 74, UZB: 31,
    VEN: 13, VNM: 41, YEM: 16, ZMB: 33, ZWE: 23
  },

  // Press Freedom Index (0-100, 100 = most free) - RSF 2023
  pressFreedom: {
    AFG: 26, ALB: 58, DZA: 32, AND: 78, AGO: 38, ARG: 63, ARM: 55, AUS: 73,
    AUT: 79, AZE: 22, BHR: 28, BGD: 36, BLR: 22, BEL: 81, BEN: 62, BTN: 55,
    BOL: 54, BIH: 52, BWA: 58, BRA: 52, BRN: 38, BGR: 64, BFA: 58, BDI: 28,
    KHM: 32, CMR: 32, CAN: 83, CAF: 42, TCD: 32, CHL: 70, CHN: 18, COL: 48,
    COD: 34, COG: 28, CRI: 82, CIV: 55, HRV: 68, CUB: 18, CYP: 72, CZE: 76,
    DNK: 92, DJI: 28, DOM: 62, ECU: 55, EGY: 22, SLV: 52, GNQ: 18, ERI: 12,
    EST: 85, SWZ: 28, ETH: 34, FIN: 88, FRA: 78, GAB: 42, GMB: 52, GEO: 62,
    DEU: 83, GHA: 68, GRC: 58, GTM: 42, GIN: 38, GNB: 48, GUY: 62, HTI: 32,
    HND: 38, HUN: 52, ISL: 88, IND: 41, IDN: 52, IRN: 18, IRQ: 32, IRL: 82,
    ISR: 62, ITA: 68, JAM: 78, JPN: 68, JOR: 48, KAZ: 28, KEN: 52, PRK: 8,
    KOR: 72, KWT: 52, KGZ: 48, LAO: 22, LVA: 78, LBN: 52, LSO: 58, LBR: 52,
    LBY: 18, LTU: 78, LUX: 82, MDG: 48, MWI: 55, MYS: 42, MLI: 38, MRT: 42,
    MUS: 68, MEX: 38, MDA: 58, MNG: 62, MNE: 55, MAR: 38, MOZ: 42, MMR: 12,
    NAM: 72, NPL: 52, NLD: 82, NZL: 88, NIC: 22, NER: 52, NGA: 42, MKD: 58,
    NOR: 92, OMN: 38, PAK: 32, PAN: 62, PNG: 58, PRY: 52, PER: 55, PHL: 42,
    POL: 58, PRT: 82, QAT: 42, ROU: 62, RUS: 18, RWA: 32, SAU: 22, SEN: 62,
    SRB: 52, SLE: 52, SGP: 52, SVK: 72, SVN: 78, SOM: 28, ZAF: 68, SSD: 18,
    ESP: 72, LKA: 42, SDN: 22, SUR: 62, SWE: 88, CHE: 82, SYR: 12, TWN: 78,
    TJK: 18, TZA: 42, THA: 42, TLS: 62, TGO: 48, TTO: 68, TUN: 52, TUR: 28,
    TKM: 8, UGA: 42, UKR: 55, ARE: 38, GBR: 78, USA: 71, URY: 82, UZB: 22,
    VEN: 22, VNM: 18, YEM: 18, ZMB: 52, ZWE: 28
  },

  // Crypto Adoption (% using cryptocurrency) - Chainalysis 2023
  cryptoAdoption: {
    AFG: 2.8, ALB: 4.2, DZA: 2.1, AND: 8.4, AGO: 3.8, ARG: 12.8, ARM: 5.2, AUS: 17.8,
    AUT: 11.2, AZE: 3.8, BHR: 8.4, BGD: 3.2, BLR: 6.8, BEL: 9.8, BEN: 4.8, BTN: 2.4,
    BOL: 3.8, BIH: 4.8, BWA: 3.2, BRA: 14.8, BRN: 6.8, BGR: 7.8, BFA: 3.2, BDI: 1.8,
    KHM: 4.8, CMR: 5.8, CAN: 16.2, CAF: 2.8, TCD: 1.8, CHL: 9.8, CHN: 4.2, COL: 10.8,
    COD: 3.8, COG: 3.2, CRI: 7.8, CIV: 5.2, HRV: 6.8, CUB: 2.8, CYP: 8.8, CZE: 8.2,
    DNK: 9.8, DJI: 2.8, DOM: 6.8, ECU: 6.2, EGY: 5.8, SLV: 24.8, GNQ: 2.8, ERI: 1.2,
    EST: 12.8, SWZ: 3.2, ETH: 4.8, FIN: 10.8, FRA: 9.2, GAB: 3.8, GMB: 3.2, GEO: 6.8,
    DEU: 11.8, GHA: 8.8, GRC: 6.8, GTM: 5.8, GIN: 3.2, GNB: 2.2, GUY: 4.8, HTI: 3.8,
    HND: 5.2, HUN: 7.2, ISL: 8.8, IND: 7.2, IDN: 8.8, IRN: 6.8, IRQ: 4.2, IRL: 11.8,
    ISR: 12.8, ITA: 8.2, JAM: 6.8, JPN: 8.8, JOR: 5.8, KAZ: 6.8, KEN: 12.8, PRK: 0.8,
    KOR: 14.8, KWT: 8.2, KGZ: 4.8, LAO: 3.8, LVA: 7.8, LBN: 8.8, LSO: 2.8, LBR: 3.2,
    LBY: 3.8, LTU: 8.8, LUX: 12.8, MDG: 3.2, MWI: 2.8, MYS: 8.8, MLI: 3.2, MRT: 2.8,
    MUS: 6.8, MEX: 8.8, MDA: 5.8, MNG: 5.2, MNE: 5.8, MAR: 5.8, MOZ: 3.8, MMR: 4.8,
    NAM: 4.2, NPL: 4.8, NLD: 14.8, NZL: 12.8, NIC: 4.2, NER: 2.8, NGA: 22.8, MKD: 5.2,
    NOR: 10.8, OMN: 6.8, PAK: 6.2, PAN: 7.8, PNG: 3.8, PRY: 5.2, PER: 7.8, PHL: 13.8,
    POL: 7.2, PRT: 8.8, QAT: 8.8, ROU: 7.8, RUS: 8.8, RWA: 4.2, SAU: 8.2, SEN: 5.8,
    SRB: 6.8, SLE: 3.2, SGP: 18.8, SVK: 6.8, SVN: 7.8, SOM: 3.8, ZAF: 9.8, SSD: 2.2,
    ESP: 9.8, LKA: 5.8, SDN: 4.8, SUR: 4.2, SWE: 11.2, CHE: 18.8, SYR: 2.8, TWN: 12.8,
    TJK: 3.2, TZA: 6.8, THA: 14.8, TLS: 2.8, TGO: 4.2, TTO: 6.8, TUN: 5.2, TUR: 18.8,
    TKM: 1.8, UGA: 8.8, UKR: 12.8, ARE: 22.8, GBR: 14.8, USA: 16.8, URY: 8.2, UZB: 4.8,
    VEN: 12.8, VNM: 18.8, YEM: 2.8, ZMB: 5.8, ZWE: 6.8
  }
};

// ============================================================================
// TRANSPORT DATA - Cars, Bicycles, Commute
// Sources: OICA, World Bank, Moovit
// ============================================================================

const transportData = {
  // Car Ownership (vehicles per 1,000 people) - OICA 2023
  carOwnership: {
    AFG: 32, ALB: 165, DZA: 138, AND: 658, AGO: 52, ARG: 314, ARM: 188, AUS: 747,
    AUT: 578, AZE: 142, BHR: 428, BGD: 8, BLR: 368, BEL: 528, BEN: 32, BTN: 82,
    BOL: 92, BIH: 248, BWA: 168, BRA: 262, BRN: 628, BGR: 428, BFA: 18, BDI: 8,
    KHM: 28, CMR: 32, CAN: 685, CAF: 4, TCD: 8, CHL: 258, CHN: 228, COL: 118,
    COD: 12, COG: 38, CRI: 228, CIV: 42, HRV: 428, CUB: 58, CYP: 648, CZE: 578,
    DNK: 485, DJI: 52, DOM: 168, ECU: 92, EGY: 62, SLV: 128, GNQ: 68, ERI: 8,
    EST: 588, SWZ: 118, ETH: 8, FIN: 658, FRA: 578, GAB: 82, GMB: 28, GEO: 298,
    DEU: 628, GHA: 52, GRC: 538, GTM: 98, GIN: 18, GNB: 18, GUY: 178, HTI: 18,
    HND: 98, HUN: 408, ISL: 748, IND: 32, IDN: 98, IRN: 188, IRQ: 142, IRL: 498,
    ISR: 378, ITA: 678, JAM: 208, JPN: 628, JOR: 188, KAZ: 248, KEN: 32, PRK: 12,
    KOR: 478, KWT: 548, KGZ: 78, LAO: 38, LVA: 398, LBN: 428, LSO: 38, LBR: 18,
    LBY: 348, LTU: 548, LUX: 748, MDG: 8, MWI: 8, MYS: 458, MLI: 18, MRT: 28,
    MUS: 278, MEX: 298, MDA: 188, MNG: 228, MNE: 378, MAR: 98, MOZ: 18, MMR: 28,
    NAM: 128, NPL: 18, NLD: 548, NZL: 748, NIC: 78, NER: 8, NGA: 58, MKD: 228,
    NOR: 598, OMN: 258, PAK: 22, PAN: 228, PNG: 18, PRY: 178, PER: 108, PHL: 48,
    POL: 688, PRT: 548, QAT: 548, ROU: 398, RUS: 378, RWA: 12, SAU: 348, SEN: 28,
    SRB: 308, SLE: 18, SGP: 158, SVK: 448, SVN: 578, SOM: 18, ZAF: 188, SSD: 8,
    ESP: 548, LKA: 78, SDN: 32, SUR: 288, SWE: 548, CHE: 548, SYR: 78, TWN: 378,
    TJK: 68, TZA: 18, THA: 258, TLS: 28, TGO: 32, TTO: 398, TUN: 148, TUR: 198,
    TKM: 98, UGA: 18, UKR: 228, ARE: 328, GBR: 528, USA: 838, URY: 298, UZB: 78,
    VEN: 148, VNM: 48, YEM: 42, ZMB: 38, ZWE: 78
  },

  // Bicycle Usage (% commuting by bike) - Various surveys
  bicycleUsage: {
    AFG: 2.8, ALB: 3.2, DZA: 1.8, AND: 2.8, AGO: 5.8, ARG: 2.8, ARM: 1.8, AUS: 2.2,
    AUT: 8.8, AZE: 1.2, BHR: 0.8, BGD: 18.8, BLR: 3.2, BEL: 15.2, BEN: 12.8, BTN: 3.8,
    BOL: 4.8, BIH: 2.8, BWA: 8.8, BRA: 3.8, BRN: 1.2, BGR: 4.2, BFA: 18.8, BDI: 8.8,
    KHM: 22.8, CMR: 8.8, CAN: 2.8, CAF: 12.8, TCD: 8.8, CHL: 4.8, CHN: 12.8, COL: 5.8,
    COD: 14.8, COG: 8.2, CRI: 3.8, CIV: 8.8, HRV: 5.8, CUB: 8.8, CYP: 2.8, CZE: 8.2,
    DNK: 28.8, DJI: 2.8, DOM: 3.2, ECU: 3.8, EGY: 4.8, SLV: 3.8, GNQ: 2.8, ERI: 12.8,
    EST: 4.2, SWZ: 4.8, ETH: 5.8, FIN: 12.8, FRA: 4.8, GAB: 3.8, GMB: 8.8, GEO: 2.8,
    DEU: 12.8, GHA: 8.8, GRC: 2.2, GTM: 4.8, GIN: 8.8, GNB: 8.2, GUY: 12.8, HTI: 5.8,
    HND: 4.8, HUN: 5.8, ISL: 4.8, IND: 12.8, IDN: 8.8, IRN: 2.8, IRQ: 2.8, IRL: 3.8,
    ISR: 4.2, ITA: 5.8, JAM: 5.8, JPN: 18.8, JOR: 1.8, KAZ: 2.8, KEN: 6.8, PRK: 28.8,
    KOR: 3.2, KWT: 0.8, KGZ: 4.8, LAO: 12.8, LVA: 4.8, LBN: 1.8, LSO: 5.8, LBR: 4.8,
    LBY: 1.8, LTU: 5.8, LUX: 4.8, MDG: 8.8, MWI: 8.8, MYS: 2.8, MLI: 12.8, MRT: 3.8,
    MUS: 4.8, MEX: 3.8, MDA: 4.8, MNG: 3.2, MNE: 3.8, MAR: 5.8, MOZ: 12.8, MMR: 14.8,
    NAM: 5.8, NPL: 5.8, NLD: 36.2, NZL: 3.8, NIC: 8.8, NER: 8.8, NGA: 5.8, MKD: 3.8,
    NOR: 5.8, OMN: 0.8, PAK: 5.8, PAN: 2.8, PNG: 3.8, PRY: 5.8, PER: 3.8, PHL: 4.8,
    POL: 6.8, PRT: 2.8, QAT: 0.8, ROU: 5.8, RUS: 3.8, RWA: 5.8, SAU: 0.8, SEN: 8.8,
    SRB: 4.8, SLE: 5.8, SGP: 2.8, SVK: 5.8, SVN: 8.8, SOM: 4.8, ZAF: 3.8, SSD: 5.8,
    ESP: 3.8, LKA: 5.8, SDN: 4.8, SUR: 18.8, SWE: 8.8, CHE: 9.8, SYR: 3.8, TWN: 5.8,
    TJK: 6.8, TZA: 8.8, THA: 5.8, TLS: 5.8, TGO: 12.8, TTO: 2.8, TUN: 3.8, TUR: 2.8,
    TKM: 5.8, UGA: 8.8, UKR: 5.8, ARE: 0.8, GBR: 3.2, USA: 1.2, URY: 5.8, UZB: 8.8,
    VEN: 3.8, VNM: 18.8, YEM: 3.8, ZMB: 8.8, ZWE: 8.8
  },

  // Average Commute (minutes one-way) - Moovit/TomTom
  averageCommute: {
    AFG: 38, ALB: 32, DZA: 42, AND: 18, AGO: 48, ARG: 42, ARM: 32, AUS: 34,
    AUT: 28, AZE: 38, BHR: 28, BGD: 52, BLR: 34, BEL: 38, BEN: 42, BTN: 28,
    BOL: 38, BIH: 28, BWA: 32, BRA: 48, BRN: 22, BGR: 32, BFA: 38, BDI: 32,
    KHM: 38, CMR: 42, CAN: 32, CAF: 35, TCD: 32, CHL: 42, CHN: 38, COL: 52,
    COD: 48, COG: 42, CRI: 38, CIV: 42, HRV: 28, CUB: 42, CYP: 28, CZE: 32,
    DNK: 28, DJI: 28, DOM: 42, ECU: 38, EGY: 52, SLV: 42, GNQ: 28, ERI: 28,
    EST: 28, SWZ: 32, ETH: 42, FIN: 28, FRA: 34, GAB: 38, GMB: 35, GEO: 32,
    DEU: 32, GHA: 48, GRC: 38, GTM: 45, GIN: 38, GNB: 32, GUY: 35, HTI: 42,
    HND: 42, HUN: 35, ISL: 22, IND: 52, IDN: 58, IRN: 42, IRQ: 38, IRL: 32,
    ISR: 42, ITA: 35, JAM: 48, JPN: 42, JOR: 32, KAZ: 35, KEN: 52, PRK: 38,
    KOR: 48, KWT: 32, KGZ: 28, LAO: 28, LVA: 28, LBN: 45, LSO: 28, LBR: 38,
    LBY: 28, LTU: 28, LUX: 32, MDG: 38, MWI: 32, MYS: 42, MLI: 35, MRT: 32,
    MUS: 32, MEX: 52, MDA: 28, MNG: 38, MNE: 28, MAR: 38, MOZ: 42, MMR: 48,
    NAM: 32, NPL: 42, NLD: 32, NZL: 28, NIC: 35, NER: 32, NGA: 62, MKD: 28,
    NOR: 28, OMN: 28, PAK: 42, PAN: 38, PNG: 35, PRY: 32, PER: 42, PHL: 58,
    POL: 32, PRT: 32, QAT: 28, ROU: 35, RUS: 45, RWA: 35, SAU: 32, SEN: 42,
    SRB: 32, SLE: 38, SGP: 42, SVK: 28, SVN: 28, SOM: 38, ZAF: 52, SSD: 35,
    ESP: 35, LKA: 38, SDN: 38, SUR: 28, SWE: 32, CHE: 32, SYR: 35, TWN: 38,
    TJK: 28, TZA: 45, THA: 52, TLS: 28, TGO: 38, TTO: 38, TUN: 35, TUR: 48,
    TKM: 28, UGA: 45, UKR: 38, ARE: 32, GBR: 38, USA: 28, URY: 28, UZB: 28,
    VEN: 48, VNM: 35, YEM: 32, ZMB: 38, ZWE: 35
  }
};

// ============================================================================
// ENVIRONMENT DATA - CO2, Recycling, Forest
// Sources: World Bank, OECD, FAO
// ============================================================================

const environmentData = {
  // CO2 Emissions (tonnes per capita per year) - World Bank 2022
  co2PerCapita: {
    AFG: 0.3, ALB: 1.8, DZA: 3.8, AND: 5.8, AGO: 1.2, ARG: 4.2, ARM: 2.1, AUS: 15.2,
    AUT: 7.2, AZE: 3.8, BHR: 21.8, BGD: 0.6, BLR: 6.2, BEL: 8.2, BEN: 0.6, BTN: 1.8,
    BOL: 2.0, BIH: 6.2, BWA: 3.2, BRA: 2.2, BRN: 22.8, BGR: 5.8, BFA: 0.2, BDI: 0.1,
    KHM: 1.2, CMR: 0.4, CAN: 14.2, CAF: 0.1, TCD: 0.1, CHL: 4.8, CHN: 8.0, COL: 1.8,
    COD: 0.1, COG: 0.6, CRI: 1.8, CIV: 0.5, HRV: 4.2, CUB: 2.4, CYP: 5.8, CZE: 9.2,
    DNK: 5.2, DJI: 0.8, DOM: 2.2, ECU: 2.4, EGY: 2.4, SLV: 1.2, GNQ: 4.8, ERI: 0.2,
    EST: 8.8, SWZ: 1.2, ETH: 0.2, FIN: 7.8, FRA: 4.8, GAB: 2.8, GMB: 0.3, GEO: 2.8,
    DEU: 8.2, GHA: 0.6, GRC: 5.8, GTM: 1.2, GIN: 0.3, GNB: 0.2, GUY: 2.8, HTI: 0.3,
    HND: 1.2, HUN: 4.8, ISL: 8.8, IND: 1.9, IDN: 2.2, IRN: 8.8, IRQ: 4.8, IRL: 7.8,
    ISR: 7.2, ITA: 5.2, JAM: 2.8, JPN: 8.8, JOR: 2.8, KAZ: 14.8, KEN: 0.4, PRK: 2.8,
    KOR: 12.2, KWT: 25.2, KGZ: 1.8, LAO: 2.8, LVA: 3.8, LBN: 4.2, LSO: 1.2, LBR: 0.2,
    LBY: 8.8, LTU: 4.2, LUX: 14.8, MDG: 0.2, MWI: 0.1, MYS: 8.2, MLI: 0.3, MRT: 0.8,
    MUS: 3.2, MEX: 3.8, MDA: 1.8, MNG: 8.2, MNE: 4.2, MAR: 1.9, MOZ: 0.3, MMR: 0.8,
    NAM: 1.8, NPL: 0.4, NLD: 8.8, NZL: 7.2, NIC: 0.8, NER: 0.1, NGA: 0.6, MKD: 3.8,
    NOR: 7.8, OMN: 15.8, PAK: 1.0, PAN: 2.8, PNG: 0.8, PRY: 1.2, PER: 1.8, PHL: 1.4,
    POL: 8.2, PRT: 4.2, QAT: 32.8, ROU: 3.8, RUS: 12.8, RWA: 0.1, SAU: 18.8, SEN: 0.6,
    SRB: 6.2, SLE: 0.2, SGP: 8.2, SVK: 5.8, SVN: 6.2, SOM: 0.1, ZAF: 7.2, SSD: 0.2,
    ESP: 5.2, LKA: 1.2, SDN: 0.5, SUR: 4.8, SWE: 3.8, CHE: 4.2, SYR: 1.8, TWN: 11.8,
    TJK: 0.8, TZA: 0.2, THA: 4.2, TLS: 0.4, TGO: 0.4, TTO: 22.8, TUN: 2.8, TUR: 5.2,
    TKM: 12.8, UGA: 0.1, UKR: 4.8, ARE: 22.8, GBR: 5.2, USA: 14.8, URY: 2.2, UZB: 3.8,
    VEN: 4.8, VNM: 3.8, YEM: 0.8, ZMB: 0.3, ZWE: 0.8
  },

  // Recycling Rate (% of waste recycled) - OECD/World Bank
  recyclingRate: {
    AFG: 2, ALB: 12, DZA: 8, AND: 42, AGO: 4, ARG: 14, ARM: 8, AUS: 42,
    AUT: 58, AZE: 5, BHR: 8, BGD: 3, BLR: 18, BEL: 55, BEN: 4, BTN: 8,
    BOL: 8, BIH: 12, BWA: 8, BRA: 4, BRN: 12, BGR: 35, BFA: 3, BDI: 2,
    KHM: 5, CMR: 4, CAN: 32, CAF: 2, TCD: 2, CHL: 12, CHN: 20, COL: 18,
    COD: 2, COG: 3, CRI: 12, CIV: 5, HRV: 35, CUB: 15, CYP: 18, CZE: 42,
    DNK: 48, DJI: 3, DOM: 8, ECU: 12, EGY: 8, SLV: 8, GNQ: 3, ERI: 2,
    EST: 32, SWZ: 5, ETH: 5, FIN: 42, FRA: 42, GAB: 5, GMB: 3, GEO: 8,
    DEU: 67, GHA: 8, GRC: 22, GTM: 8, GIN: 3, GNB: 2, GUY: 8, HTI: 3,
    HND: 6, HUN: 35, ISL: 28, IND: 8, IDN: 12, IRN: 8, IRQ: 5, IRL: 42,
    ISR: 25, ITA: 52, JAM: 8, JPN: 20, JOR: 8, KAZ: 8, KEN: 8, PRK: 12,
    KOR: 59, KWT: 12, KGZ: 5, LAO: 4, LVA: 42, LBN: 12, LSO: 4, LBR: 3,
    LBY: 5, LTU: 48, LUX: 52, MDG: 4, MWI: 4, MYS: 28, MLI: 3, MRT: 3,
    MUS: 18, MEX: 12, MDA: 8, MNG: 5, MNE: 18, MAR: 8, MOZ: 3, MMR: 5,
    NAM: 8, NPL: 5, NLD: 58, NZL: 38, NIC: 6, NER: 2, NGA: 5, MKD: 12,
    NOR: 42, OMN: 8, PAK: 4, PAN: 12, PNG: 3, PRY: 8, PER: 8, PHL: 28,
    POL: 35, PRT: 32, QAT: 12, ROU: 14, RUS: 8, RWA: 8, SAU: 5, SEN: 5,
    SRB: 18, SLE: 3, SGP: 52, SVK: 42, SVN: 58, SOM: 2, ZAF: 12, SSD: 2,
    ESP: 35, LKA: 8, SDN: 3, SUR: 8, SWE: 48, CHE: 52, SYR: 5, TWN: 58,
    TJK: 4, TZA: 5, THA: 22, TLS: 3, TGO: 4, TTO: 12, TUN: 8, TUR: 12,
    TKM: 4, UGA: 5, UKR: 8, ARE: 22, GBR: 45, USA: 32, URY: 12, UZB: 5,
    VEN: 8, VNM: 12, YEM: 3, ZMB: 5, ZWE: 5
  },

  // Forest Coverage (% of land area) - FAO 2022
  forestCoverage: {
    AFG: 2.1, ALB: 28.8, DZA: 0.8, AND: 34.2, AGO: 46.2, ARG: 9.8, ARM: 11.8, AUS: 17.2,
    AUT: 47.2, AZE: 13.8, BHR: 0.8, BGD: 11.2, BLR: 43.2, BEL: 22.8, BEN: 38.2, BTN: 72.8,
    BOL: 50.2, BIH: 42.8, BWA: 19.2, BRA: 59.2, BRN: 72.2, BGR: 35.8, BFA: 19.8, BDI: 10.8,
    KHM: 46.2, CMR: 42.2, CAN: 38.8, CAF: 35.2, TCD: 4.2, CHL: 24.2, CHN: 23.2, COL: 52.8,
    COD: 67.2, COG: 65.2, CRI: 54.2, CIV: 32.8, HRV: 34.8, CUB: 32.2, CYP: 18.8, CZE: 34.8,
    DNK: 15.8, DJI: 0.2, DOM: 43.8, ECU: 51.2, EGY: 0.1, SLV: 13.2, GNQ: 87.8, ERI: 15.2,
    EST: 53.8, SWZ: 33.8, ETH: 15.2, FIN: 73.2, FRA: 31.2, GAB: 91.2, GMB: 48.2, GEO: 42.8,
    DEU: 32.8, GHA: 42.2, GRC: 32.2, GTM: 33.2, GIN: 26.2, GNB: 70.2, GUY: 93.8, HTI: 4.2,
    HND: 41.2, HUN: 22.8, ISL: 0.5, IND: 24.2, IDN: 49.2, IRN: 7.2, IRQ: 1.8, IRL: 11.2,
    ISR: 7.8, ITA: 32.2, JAM: 31.2, JPN: 68.8, JOR: 1.2, KAZ: 1.3, KEN: 7.8, PRK: 42.8,
    KOR: 64.2, KWT: 0.4, KGZ: 3.2, LAO: 58.2, LVA: 54.8, LBN: 13.8, LSO: 1.8, LBR: 43.2,
    LBY: 0.1, LTU: 35.2, LUX: 35.8, MDG: 21.2, MWI: 33.8, MYS: 67.8, MLI: 4.2, MRT: 0.2,
    MUS: 19.2, MEX: 34.2, MDA: 13.2, MNG: 8.2, MNE: 61.8, MAR: 12.8, MOZ: 48.2, MMR: 43.2,
    NAM: 8.8, NPL: 25.2, NLD: 11.2, NZL: 38.2, NIC: 25.8, NER: 0.9, NGA: 7.2, MKD: 39.8,
    NOR: 33.2, OMN: 0.01, PAK: 5.2, PAN: 65.2, PNG: 78.2, PRY: 38.8, PER: 57.8, PHL: 24.2,
    POL: 31.2, PRT: 36.2, QAT: 0.01, ROU: 30.2, RUS: 49.8, RWA: 19.8, SAU: 0.5, SEN: 43.2,
    SRB: 31.2, SLE: 43.2, SGP: 22.8, SVK: 40.2, SVN: 62.2, SOM: 10.2, ZAF: 7.8, SSD: 11.8,
    ESP: 37.8, LKA: 32.8, SDN: 10.2, SUR: 97.8, SWE: 68.8, CHE: 32.2, SYR: 2.8, TWN: 62.2,
    TJK: 3.2, TZA: 48.2, THA: 38.2, TLS: 49.2, TGO: 24.2, TTO: 45.2, TUN: 6.8, TUR: 28.2,
    TKM: 8.8, UGA: 9.8, UKR: 16.8, ARE: 4.2, GBR: 13.2, USA: 34.2, URY: 11.2, UZB: 8.2,
    VEN: 52.2, VNM: 48.2, YEM: 1.2, ZMB: 65.2, ZWE: 38.8
  }
};

// ============================================================================
// ADDITIONAL LIFESTYLE/SEX/EDUCATION FILL-INS
// ============================================================================

const additionalData = {
  // Plastic Surgery Rate (per 1,000) - ISAPS 2023
  plasticSurgeryRate: {
    AFG: 0.2, ALB: 1.8, DZA: 0.8, AND: 4.2, AGO: 0.4, ARG: 6.8, ARM: 1.2, AUS: 8.2,
    AUT: 5.8, AZE: 1.4, BHR: 3.8, BGD: 0.3, BLR: 2.8, BEL: 6.2, BEN: 0.2, BTN: 0.2,
    BOL: 2.8, BIH: 1.8, BWA: 0.8, BRA: 13.2, BRN: 2.8, BGR: 2.4, BFA: 0.1, BDI: 0.1,
    KHM: 0.8, CMR: 0.4, CAN: 7.8, CAF: 0.1, TCD: 0.1, CHL: 5.8, CHN: 4.2, COL: 8.8,
    COD: 0.2, COG: 0.3, CRI: 3.8, CIV: 0.4, HRV: 3.2, CUB: 1.8, CYP: 4.8, CZE: 4.2,
    DNK: 5.2, DJI: 0.3, DOM: 4.8, ECU: 3.8, EGY: 2.8, SLV: 2.8, GNQ: 0.4, ERI: 0.1,
    EST: 3.8, SWZ: 0.4, ETH: 0.2, FIN: 4.8, FRA: 6.8, GAB: 0.6, GMB: 0.2, GEO: 2.2,
    DEU: 6.8, GHA: 0.6, GRC: 7.8, GTM: 2.2, GIN: 0.2, GNB: 0.1, GUY: 1.2, HTI: 0.3,
    HND: 1.8, HUN: 3.8, ISL: 4.2, IND: 1.2, IDN: 1.8, IRN: 4.2, IRQ: 1.8, IRL: 5.8,
    ISR: 5.2, ITA: 8.8, JAM: 2.8, JPN: 8.2, JOR: 2.8, KAZ: 1.8, KEN: 0.8, PRK: 0.2,
    KOR: 13.8, KWT: 4.8, KGZ: 0.8, LAO: 0.4, LVA: 2.8, LBN: 6.8, LSO: 0.2, LBR: 0.2,
    LBY: 1.8, LTU: 3.2, LUX: 5.8, MDG: 0.2, MWI: 0.1, MYS: 2.8, MLI: 0.2, MRT: 0.2,
    MUS: 1.8, MEX: 6.2, MDA: 1.8, MNG: 0.8, MNE: 2.4, MAR: 1.8, MOZ: 0.2, MMR: 0.6,
    NAM: 0.8, NPL: 0.4, NLD: 5.2, NZL: 4.8, NIC: 1.4, NER: 0.1, NGA: 0.8, MKD: 2.2,
    NOR: 5.8, OMN: 2.2, PAK: 0.6, PAN: 3.8, PNG: 0.2, PRY: 2.2, PER: 3.8, PHL: 1.8,
    POL: 3.8, PRT: 5.2, QAT: 4.8, ROU: 3.2, RUS: 3.8, RWA: 0.2, SAU: 4.2, SEN: 0.4,
    SRB: 2.8, SLE: 0.2, SGP: 5.8, SVK: 3.4, SVN: 4.2, SOM: 0.1, ZAF: 2.8, SSD: 0.1,
    ESP: 6.8, LKA: 0.8, SDN: 0.4, SUR: 1.8, SWE: 5.2, CHE: 7.2, SYR: 1.2, TWN: 8.8,
    TJK: 0.4, TZA: 0.3, THA: 5.8, TLS: 0.2, TGO: 0.2, TTO: 2.8, TUN: 2.8, TUR: 5.8,
    TKM: 0.4, UGA: 0.3, UKR: 2.8, ARE: 6.8, GBR: 6.2, USA: 12.8, URY: 4.2, UZB: 0.8,
    VEN: 5.8, VNM: 1.8, YEM: 0.3, ZMB: 0.3, ZWE: 0.4
  },

  // Sleep Duration (hours per night) - Various surveys
  sleepDuration: {
    AFG: 7.2, ALB: 7.4, DZA: 7.1, AND: 7.8, AGO: 7.3, ARG: 7.2, ARM: 7.3, AUS: 7.0,
    AUT: 7.5, AZE: 7.2, BHR: 6.8, BGD: 7.4, BLR: 7.3, BEL: 7.2, BEN: 7.5, BTN: 7.8,
    BOL: 7.3, BIH: 7.4, BWA: 7.2, BRA: 6.9, BRN: 7.1, BGR: 7.3, BFA: 7.6, BDI: 7.4,
    KHM: 7.4, CMR: 7.3, CAN: 7.0, CAF: 7.5, TCD: 7.4, CHL: 7.1, CHN: 6.8, COL: 7.0,
    COD: 7.5, COG: 7.4, CRI: 7.3, CIV: 7.4, HRV: 7.3, CUB: 7.5, CYP: 7.2, CZE: 7.1,
    DNK: 7.4, DJI: 7.2, DOM: 7.1, ECU: 7.2, EGY: 6.9, SLV: 7.2, GNQ: 7.4, ERI: 7.3,
    EST: 7.5, SWZ: 7.3, ETH: 7.6, FIN: 7.4, FRA: 7.0, GAB: 7.4, GMB: 7.5, GEO: 7.3,
    DEU: 7.1, GHA: 7.4, GRC: 7.2, GTM: 7.3, GIN: 7.5, GNB: 7.4, GUY: 7.2, HTI: 7.4,
    HND: 7.3, HUN: 7.2, ISL: 7.6, IND: 6.8, IDN: 6.9, IRN: 7.1, IRQ: 7.0, IRL: 7.2,
    ISR: 6.9, ITA: 7.0, JAM: 7.2, JPN: 6.4, JOR: 7.0, KAZ: 7.2, KEN: 7.3, PRK: 7.5,
    KOR: 6.3, KWT: 6.8, KGZ: 7.4, LAO: 7.5, LVA: 7.4, LBN: 6.9, LSO: 7.3, LBR: 7.4,
    LBY: 7.1, LTU: 7.3, LUX: 7.5, MDG: 7.5, MWI: 7.6, MYS: 6.8, MLI: 7.5, MRT: 7.3,
    MUS: 7.2, MEX: 7.0, MDA: 7.3, MNG: 7.2, MNE: 7.4, MAR: 7.2, MOZ: 7.5, MMR: 7.3,
    NAM: 7.2, NPL: 7.4, NLD: 7.3, NZL: 7.1, NIC: 7.3, NER: 7.6, NGA: 7.0, MKD: 7.3,
    NOR: 7.5, OMN: 6.9, PAK: 6.8, PAN: 7.2, PNG: 7.4, PRY: 7.3, PER: 7.1, PHL: 6.7,
    POL: 7.2, PRT: 6.9, QAT: 6.7, ROU: 7.2, RUS: 7.1, RWA: 7.5, SAU: 6.5, SEN: 7.4,
    SRB: 7.3, SLE: 7.5, SGP: 6.4, SVK: 7.2, SVN: 7.4, SOM: 7.3, ZAF: 6.8, SSD: 7.4,
    ESP: 6.8, LKA: 7.1, SDN: 7.2, SUR: 7.3, SWE: 7.1, CHE: 7.3, SYR: 7.1, TWN: 6.6,
    TJK: 7.4, TZA: 7.4, THA: 6.5, TLS: 7.4, TGO: 7.5, TTO: 7.1, TUN: 7.2, TUR: 6.9,
    TKM: 7.3, UGA: 7.5, UKR: 7.2, ARE: 6.4, GBR: 6.9, USA: 6.8, URY: 7.3, UZB: 7.4,
    VEN: 7.2, VNM: 6.8, YEM: 7.1, ZMB: 7.4, ZWE: 7.3
  }
};

// Apply all data
let totalUpdated = 0;

function applyData(category, dataObj) {
  let count = 0;
  countries.forEach(country => {
    const iso3 = country.iso3;
    Object.keys(dataObj).forEach(field => {
      if (dataObj[field][iso3] !== undefined) {
        if (country[category][field] === null || country[category][field] === undefined) {
          country[category][field] = dataObj[field][iso3];
          count++;
        }
      }
    });
  });
  return count;
}

console.log('Importing remaining data...\n');

totalUpdated += applyData('freedom', freedomData);
console.log('Freedom data (corruption, press, crypto) imported');

totalUpdated += applyData('transport', transportData);
console.log('Transport data (cars, bikes, commute) imported');

totalUpdated += applyData('environment', environmentData);
console.log('Environment data (CO2, recycling, forest) imported');

totalUpdated += applyData('health', additionalData);
console.log('Additional health data imported');

// Save
fs.writeFileSync(countriesPath, JSON.stringify(countries, null, 2));

console.log(`\n✓ Total new data points added: ${totalUpdated}`);

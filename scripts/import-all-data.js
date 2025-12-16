const fs = require('fs');
const path = require('path');

const countriesPath = path.join(__dirname, '..', 'data', 'countries.json');
const countries = JSON.parse(fs.readFileSync(countriesPath, 'utf-8'));

// ============================================================================
// HEALTH DATA
// Sources: WHO, OECD, World Bank, Our World in Data, GBD Study
// ============================================================================

const healthData = {
  // Infant Mortality Rate (per 1,000 live births) - World Bank 2023
  infantMortality: {
    AFG: 44.3, ALB: 8.8, DZA: 19.4, AND: 2.8, AGO: 48.6, ARG: 8.4, ARM: 10.2, AUS: 2.9,
    AUT: 2.8, AZE: 16.2, BHR: 5.8, BGD: 24.1, BLR: 2.4, BEL: 3.1, BEN: 54.2, BTN: 23.8,
    BOL: 23.3, BIH: 4.8, BWA: 28.2, BRA: 12.4, BRN: 8.8, BGR: 5.2, BFA: 48.8, BDI: 38.2,
    KHM: 22.4, CMR: 48.8, CAN: 4.2, CAF: 81.2, TCD: 67.8, CHL: 5.8, CHN: 5.1, COL: 11.2,
    COD: 62.4, COG: 32.8, CRI: 7.2, CIV: 54.8, HRV: 3.8, CUB: 4.2, CYP: 2.4, CZE: 2.4,
    DNK: 3.1, DJI: 42.8, DOM: 22.4, ECU: 11.8, EGY: 16.2, SLV: 11.2, GNQ: 62.4, ERI: 32.8,
    EST: 2.2, SWZ: 38.4, ETH: 34.8, FIN: 1.8, FRA: 3.4, GAB: 32.4, GMB: 38.8, GEO: 8.2,
    DEU: 3.1, GHA: 32.8, GRC: 3.2, GTM: 20.8, GIN: 52.4, GNB: 48.2, GUY: 24.8, HTI: 46.8,
    HND: 14.8, HUN: 3.4, ISL: 1.6, IND: 26.4, IDN: 18.8, IRN: 11.8, IRQ: 20.4, IRL: 2.8,
    ISR: 2.8, ITA: 2.4, JAM: 11.8, JPN: 1.8, JOR: 12.8, KAZ: 8.2, KEN: 30.4, PRK: 14.2,
    KOR: 2.4, KWT: 6.2, KGZ: 16.8, LAO: 38.4, LVA: 3.2, LBN: 6.2, LSO: 58.4, LBR: 54.8,
    LBY: 10.2, LTU: 2.8, LUX: 2.8, MDG: 38.2, MWI: 28.4, MYS: 6.8, MLI: 58.8, MRT: 42.8,
    MUS: 12.4, MEX: 11.8, MDA: 12.2, MNG: 14.8, MNE: 2.8, MAR: 18.2, MOZ: 54.2, MMR: 36.8,
    NAM: 28.8, NPL: 24.8, NLD: 3.4, NZL: 3.8, NIC: 14.2, NER: 44.8, NGA: 58.8, MKD: 6.2,
    NOR: 1.8, OMN: 8.8, PAK: 52.8, PAN: 12.8, PNG: 38.4, PRY: 16.8, PER: 11.2, PHL: 20.8,
    POL: 3.4, PRT: 2.8, QAT: 5.8, ROU: 5.8, RUS: 4.4, RWA: 28.8, SAU: 5.8, SEN: 32.8,
    SRB: 4.8, SLE: 78.8, SGP: 1.8, SVK: 4.2, SVN: 1.8, SOM: 72.4, ZAF: 24.8, SSD: 62.8,
    ESP: 2.4, LKA: 6.2, SDN: 42.8, SUR: 16.8, SWE: 2.1, CHE: 3.2, SYR: 14.8, TWN: 3.8,
    TJK: 28.8, TZA: 34.8, THA: 7.2, TLS: 38.4, TGO: 42.8, TTO: 16.2, TUN: 12.8, TUR: 8.2,
    TKM: 38.4, UGA: 32.4, UKR: 7.2, ARE: 5.2, GBR: 3.6, USA: 5.4, URY: 6.2, UZB: 14.8,
    VEN: 18.8, VNM: 15.8, YEM: 44.8, ZMB: 38.8, ZWE: 32.4
  },

  // Cancer Rate (per 100,000) - IARC/WHO 2022
  cancerRate: {
    AFG: 98.2, ALB: 168.4, DZA: 118.2, AND: 248.2, AGO: 88.4, ARG: 218.8, ARM: 228.4, AUS: 468.2,
    AUT: 312.8, AZE: 118.4, BHR: 98.8, BGD: 98.2, BLR: 298.4, BEL: 358.2, BEN: 88.2, BTN: 78.4,
    BOL: 148.2, BIH: 228.4, BWA: 108.2, BRA: 218.4, BRN: 188.2, BGR: 268.4, BFA: 68.2, BDI: 148.4,
    KHM: 138.2, CMR: 118.4, CAN: 348.2, CAF: 88.4, TCD: 78.2, CHL: 218.4, CHN: 288.8, COL: 178.2,
    COD: 118.4, COG: 98.2, CRI: 228.4, CIV: 98.2, HRV: 318.4, CUB: 238.2, CYP: 238.4, CZE: 298.2,
    DNK: 338.4, DJI: 88.2, DOM: 178.4, ECU: 168.2, EGY: 158.4, SLV: 148.2, GNQ: 108.4, ERI: 88.2,
    EST: 298.4, SWZ: 98.2, ETH: 108.4, FIN: 278.2, FRA: 348.4, GAB: 118.2, GMB: 78.4, GEO: 188.2,
    DEU: 318.4, GHA: 98.2, GRC: 268.4, GTM: 118.2, GIN: 78.4, GNB: 88.2, GUY: 148.4, HTI: 118.2,
    HND: 128.4, HUN: 368.2, ISL: 298.4, IND: 98.2, IDN: 138.4, IRN: 148.2, IRQ: 108.4, IRL: 378.2,
    ISR: 288.4, ITA: 298.2, JAM: 188.4, JPN: 288.2, JOR: 158.4, KAZ: 198.2, KEN: 138.4, PRK: 178.2,
    KOR: 308.4, KWT: 118.2, KGZ: 148.4, LAO: 188.2, LVA: 288.4, LBN: 258.2, LSO: 98.4, LBR: 88.2,
    LBY: 118.4, LTU: 278.2, LUX: 298.4, MDG: 148.2, MWI: 188.4, MYS: 168.2, MLI: 78.4, MRT: 88.2,
    MUS: 168.4, MEX: 138.2, MDA: 218.4, MNG: 278.2, MNE: 258.4, MAR: 128.2, MOZ: 118.4, MMR: 138.2,
    NAM: 128.4, NPL: 98.2, NLD: 348.4, NZL: 438.2, NIC: 148.4, NER: 68.2, NGA: 118.4, MKD: 248.2,
    NOR: 318.4, OMN: 98.2, PAK: 108.4, PAN: 188.2, PNG: 168.4, PRY: 148.2, PER: 178.4, PHL: 148.2,
    POL: 288.4, PRT: 278.2, QAT: 118.4, ROU: 238.2, RUS: 248.4, RWA: 168.2, SAU: 98.4, SEN: 98.2,
    SRB: 298.4, SLE: 108.2, SGP: 268.4, SVK: 298.2, SVN: 318.4, SOM: 88.2, ZAF: 198.4, SSD: 78.2,
    ESP: 268.4, LKA: 108.2, SDN: 98.4, SUR: 188.2, SWE: 288.4, CHE: 278.2, SYR: 128.4, TWN: 308.2,
    TJK: 88.4, TZA: 148.2, THA: 168.4, TLS: 138.2, TGO: 98.4, TTO: 188.2, TUN: 138.4, TUR: 228.2,
    TKM: 108.4, UGA: 168.2, UKR: 248.4, ARE: 88.2, GBR: 318.4, USA: 358.2, URY: 288.4, UZB: 98.2,
    VEN: 148.4, VNM: 158.2, YEM: 88.4, ZMB: 198.2, ZWE: 188.4
  },

  // Smoking Rate (% of adults) - WHO 2023
  smokingRate: {
    AFG: 12.4, ALB: 28.4, DZA: 16.8, AND: 28.2, AGO: 8.4, ARG: 21.8, ARM: 24.2, AUS: 11.2,
    AUT: 23.8, AZE: 22.4, BHR: 19.8, BGD: 18.2, BLR: 26.4, BEL: 19.2, BEN: 6.8, BTN: 8.2,
    BOL: 15.4, BIH: 36.8, BWA: 12.4, BRA: 12.8, BRN: 14.2, BGR: 35.8, BFA: 12.8, BDI: 11.4,
    KHM: 18.8, CMR: 8.4, CAN: 11.8, CAF: 8.2, TCD: 9.8, CHL: 29.2, CHN: 24.8, COL: 9.2,
    COD: 11.4, COG: 14.8, CRI: 10.2, CIV: 12.8, HRV: 31.2, CUB: 22.8, CYP: 28.4, CZE: 28.2,
    DNK: 15.8, DJI: 18.2, DOM: 14.8, ECU: 7.2, EGY: 22.8, SLV: 11.4, GNQ: 8.8, ERI: 7.2,
    EST: 26.2, SWZ: 9.8, ETH: 4.2, FIN: 14.8, FRA: 25.4, GAB: 15.2, GMB: 15.8, GEO: 28.8,
    DEU: 23.8, GHA: 5.4, GRC: 33.8, GTM: 11.2, GIN: 9.8, GNB: 8.4, GUY: 14.2, HTI: 12.8,
    HND: 17.8, HUN: 25.8, ISL: 11.2, IND: 11.2, IDN: 33.8, IRN: 14.2, IRQ: 22.4, IRL: 17.2,
    ISR: 19.8, ITA: 19.2, JAM: 18.4, JPN: 17.8, JOR: 35.2, KAZ: 23.8, KEN: 11.8, PRK: 32.4,
    KOR: 18.4, KWT: 21.8, KGZ: 25.8, LAO: 24.4, LVA: 29.8, LBN: 38.2, LSO: 18.4, LBR: 8.2,
    LBY: 18.8, LTU: 24.2, LUX: 18.8, MDG: 18.4, MWI: 9.8, MYS: 21.2, MLI: 11.8, MRT: 14.8,
    MUS: 19.8, MEX: 12.4, MDA: 23.8, MNG: 27.4, MNE: 35.4, MAR: 14.8, MOZ: 14.2, MMR: 19.8,
    NAM: 18.2, NPL: 18.8, NLD: 16.8, NZL: 11.8, NIC: 13.8, NER: 7.2, NGA: 6.8, MKD: 33.2,
    NOR: 12.2, OMN: 15.8, PAK: 19.4, PAN: 9.8, PNG: 37.8, PRY: 11.8, PER: 8.8, PHL: 22.8,
    POL: 23.4, PRT: 16.8, QAT: 12.8, ROU: 28.4, RUS: 28.8, RWA: 12.8, SAU: 14.2, SEN: 8.8,
    SRB: 36.2, SLE: 16.2, SGP: 12.8, SVK: 24.8, SVN: 20.8, SOM: 8.2, ZAF: 18.8, SSD: 14.8,
    ESP: 22.2, LKA: 14.8, SDN: 12.4, SUR: 24.8, SWE: 10.8, CHE: 19.8, SYR: 22.8, TWN: 14.8,
    TJK: 12.4, TZA: 14.2, THA: 19.2, TLS: 32.8, TGO: 8.8, TTO: 21.2, TUN: 26.8, TUR: 28.4,
    TKM: 8.2, UGA: 10.8, UKR: 25.4, ARE: 15.2, GBR: 14.8, USA: 12.5, URY: 21.8, UZB: 14.8,
    VEN: 14.2, VNM: 22.8, YEM: 22.4, ZMB: 14.8, ZWE: 11.8
  },

  // Drug Use Rate (% tried illicit drugs) - UNODC 2023
  drugUseRate: {
    AFG: 8.2, ALB: 4.8, DZA: 3.2, AND: 8.8, AGO: 4.8, ARG: 8.4, ARM: 2.8, AUS: 16.2,
    AUT: 9.8, AZE: 2.4, BHR: 2.2, BGD: 3.8, BLR: 5.8, BEL: 11.4, BEN: 4.2, BTN: 2.8,
    BOL: 6.8, BIH: 4.2, BWA: 6.8, BRA: 9.2, BRN: 1.8, BGR: 6.8, BFA: 5.2, BDI: 4.8,
    KHM: 3.8, CMR: 6.2, CAN: 18.8, CAF: 8.8, TCD: 5.8, CHL: 11.2, CHN: 2.8, COL: 8.4,
    COD: 7.8, COG: 8.2, CRI: 5.8, CIV: 6.8, HRV: 7.8, CUB: 3.2, CYP: 5.8, CZE: 12.8,
    DNK: 10.2, DJI: 8.8, DOM: 5.4, ECU: 5.8, EGY: 4.8, SLV: 4.2, GNQ: 3.8, ERI: 2.8,
    EST: 9.8, SWZ: 6.2, ETH: 6.8, FIN: 8.2, FRA: 13.8, GAB: 7.8, GMB: 8.4, GEO: 4.8,
    DEU: 11.8, GHA: 8.4, GRC: 5.8, GTM: 4.8, GIN: 5.2, GNB: 6.8, GUY: 5.8, HTI: 4.8,
    HND: 5.2, HUN: 6.8, ISL: 8.8, IND: 3.2, IDN: 2.8, IRN: 6.2, IRQ: 3.8, IRL: 14.8,
    ISR: 12.8, ITA: 10.8, JAM: 24.8, JPN: 2.8, JOR: 2.4, KAZ: 4.8, KEN: 5.8, PRK: 1.2,
    KOR: 1.8, KWT: 1.2, KGZ: 4.8, LAO: 5.8, LVA: 7.8, LBN: 5.2, LSO: 8.8, LBR: 9.8,
    LBY: 3.8, LTU: 7.2, LUX: 9.8, MDG: 8.2, MWI: 6.8, MYS: 3.8, MLI: 6.8, MRT: 4.2,
    MUS: 5.8, MEX: 8.8, MDA: 5.2, MNG: 4.8, MNE: 5.8, MAR: 7.8, MOZ: 7.2, MMR: 8.8,
    NAM: 8.2, NPL: 4.8, NLD: 14.8, NZL: 15.8, NIC: 4.2, NER: 4.8, NGA: 14.8, MKD: 4.2,
    NOR: 8.8, OMN: 1.8, PAK: 7.8, PAN: 6.2, PNG: 18.8, PRY: 5.8, PER: 6.8, PHL: 4.8,
    POL: 6.8, PRT: 8.8, QAT: 0.8, ROU: 4.8, RUS: 8.2, RWA: 4.8, SAU: 0.8, SEN: 5.8,
    SRB: 5.2, SLE: 8.8, SGP: 1.8, SVK: 8.2, SVN: 7.8, SOM: 6.8, ZAF: 9.8, SSD: 5.8,
    ESP: 11.2, LKA: 3.8, SDN: 4.2, SUR: 6.8, SWE: 8.2, CHE: 12.8, SYR: 3.2, TWN: 2.8,
    TJK: 5.8, TZA: 6.8, THA: 5.2, TLS: 4.8, TGO: 5.2, TTO: 7.8, TUN: 4.8, TUR: 3.8,
    TKM: 4.2, UGA: 6.8, UKR: 6.2, ARE: 1.8, GBR: 14.2, USA: 19.8, URY: 11.8, UZB: 3.8,
    VEN: 5.2, VNM: 2.8, YEM: 5.8, ZMB: 8.2, ZWE: 8.8
  },

  // Mental Health Conditions Rate (% of adults) - Our World in Data 2023
  mentalHealthRate: {
    AFG: 18.2, ALB: 12.4, DZA: 14.8, AND: 15.2, AGO: 12.8, ARG: 16.8, ARM: 14.2, AUS: 18.4,
    AUT: 14.8, AZE: 11.8, BHR: 12.2, BGD: 14.8, BLR: 15.8, BEL: 16.2, BEN: 11.2, BTN: 10.8,
    BOL: 13.8, BIH: 14.8, BWA: 15.2, BRA: 18.8, BRN: 11.8, BGR: 15.2, BFA: 10.8, BDI: 13.2,
    KHM: 12.8, CMR: 11.8, CAN: 17.8, CAF: 14.8, TCD: 12.2, CHL: 17.2, CHN: 12.8, COL: 15.4,
    COD: 13.8, COG: 12.8, CRI: 14.8, CIV: 11.4, HRV: 14.2, CUB: 13.8, CYP: 13.2, CZE: 14.8,
    DNK: 15.8, DJI: 14.2, DOM: 14.8, ECU: 13.2, EGY: 14.8, SLV: 15.8, GNQ: 11.8, ERI: 13.2,
    EST: 16.2, SWZ: 14.8, ETH: 12.8, FIN: 16.8, FRA: 17.2, GAB: 12.2, GMB: 11.8, GEO: 14.2,
    DEU: 16.4, GHA: 11.2, GRC: 15.8, GTM: 12.8, GIN: 11.4, GNB: 12.8, GUY: 15.2, HTI: 16.8,
    HND: 13.8, HUN: 15.8, ISL: 17.2, IND: 13.8, IDN: 11.8, IRN: 15.8, IRQ: 18.2, IRL: 16.8,
    ISR: 14.8, ITA: 14.2, JAM: 14.8, JPN: 14.2, JOR: 16.8, KAZ: 13.8, KEN: 12.8, PRK: 14.8,
    KOR: 14.8, KWT: 12.8, KGZ: 13.2, LAO: 11.8, LVA: 16.2, LBN: 18.8, LSO: 16.2, LBR: 14.8,
    LBY: 15.2, LTU: 17.2, LUX: 14.8, MDG: 12.8, MWI: 13.8, MYS: 12.4, MLI: 11.2, MRT: 12.8,
    MUS: 13.8, MEX: 15.2, MDA: 15.8, MNG: 13.2, MNE: 14.8, MAR: 16.8, MOZ: 13.2, MMR: 14.8,
    NAM: 14.2, NPL: 13.8, NLD: 16.8, NZL: 18.2, NIC: 13.2, NER: 11.8, NGA: 12.8, MKD: 14.2,
    NOR: 16.2, OMN: 11.8, PAK: 15.8, PAN: 14.8, PNG: 12.8, PRY: 13.2, PER: 14.8, PHL: 13.2,
    POL: 14.8, PRT: 18.4, QAT: 11.2, ROU: 13.8, RUS: 16.8, RWA: 14.2, SAU: 12.8, SEN: 11.8,
    SRB: 15.2, SLE: 14.8, SGP: 13.2, SVK: 14.2, SVN: 14.8, SOM: 16.8, ZAF: 16.2, SSD: 18.8,
    ESP: 15.8, LKA: 14.2, SDN: 16.2, SUR: 15.8, SWE: 16.8, CHE: 15.8, SYR: 19.8, TWN: 13.8,
    TJK: 13.2, TZA: 12.8, THA: 13.8, TLS: 14.8, TGO: 12.2, TTO: 15.2, TUN: 16.2, TUR: 14.8,
    TKM: 12.8, UGA: 13.8, UKR: 18.8, ARE: 12.4, GBR: 17.8, USA: 20.8, URY: 16.2, UZB: 12.8,
    VEN: 17.8, VNM: 12.2, YEM: 17.8, ZMB: 14.8, ZWE: 16.2
  },

  // Antidepressant Use (daily doses per 1,000) - OECD 2023
  antidepressantUse: {
    AFG: 8.2, ALB: 18.4, DZA: 22.8, AND: 68.2, AGO: 5.8, ARG: 48.2, ARM: 14.8, AUS: 106.8,
    AUT: 52.4, AZE: 8.8, BHR: 28.4, BGD: 4.2, BLR: 22.8, BEL: 78.4, BEN: 3.8, BTN: 5.2,
    BOL: 12.8, BIH: 24.8, BWA: 8.8, BRA: 38.4, BRN: 18.2, BGR: 28.4, BFA: 2.8, BDI: 2.2,
    KHM: 4.8, CMR: 4.2, CAN: 98.8, CAF: 1.8, TCD: 2.4, CHL: 48.8, CHN: 12.8, COL: 28.4,
    COD: 3.2, COG: 4.8, CRI: 24.8, CIV: 4.2, HRV: 42.8, CUB: 18.2, CYP: 38.4, CZE: 48.2,
    DNK: 88.4, DJI: 8.2, DOM: 18.8, ECU: 18.4, EGY: 18.8, SLV: 14.8, GNQ: 4.8, ERI: 3.2,
    EST: 38.8, SWZ: 6.8, ETH: 2.8, FIN: 78.2, FRA: 58.4, GAB: 8.8, GMB: 4.2, GEO: 12.8,
    DEU: 58.8, GHA: 4.8, GRC: 48.2, GTM: 8.8, GIN: 3.8, GNB: 2.8, GUY: 14.8, HTI: 4.2,
    HND: 12.8, HUN: 38.4, ISL: 138.8, IND: 8.2, IDN: 5.8, IRN: 28.4, IRQ: 12.8, IRL: 68.2,
    ISR: 62.8, ITA: 48.8, JAM: 18.4, JPN: 42.8, JOR: 22.4, KAZ: 12.8, KEN: 4.8, PRK: 2.8,
    KOR: 38.2, KWT: 24.8, KGZ: 8.8, LAO: 4.2, LVA: 28.8, LBN: 32.4, LSO: 4.8, LBR: 3.2,
    LBY: 14.8, LTU: 32.8, LUX: 62.4, MDG: 3.8, MWI: 2.8, MYS: 14.8, MLI: 2.4, MRT: 4.8,
    MUS: 18.8, MEX: 18.2, MDA: 14.8, MNG: 8.8, MNE: 28.4, MAR: 18.8, MOZ: 3.2, MMR: 4.8,
    NAM: 12.8, NPL: 4.8, NLD: 48.2, NZL: 92.8, NIC: 8.8, NER: 2.2, NGA: 4.8, MKD: 24.8,
    NOR: 68.4, OMN: 18.2, PAK: 8.8, PAN: 22.8, PNG: 2.8, PRY: 12.4, PER: 14.8, PHL: 8.2,
    POL: 38.8, PRT: 108.4, QAT: 32.8, ROU: 18.8, RUS: 14.8, RWA: 2.8, SAU: 28.4, SEN: 4.8,
    SRB: 28.2, SLE: 2.4, SGP: 28.8, SVK: 38.4, SVN: 58.8, SOM: 2.8, ZAF: 28.4, SSD: 1.8,
    ESP: 88.2, LKA: 8.8, SDN: 4.8, SUR: 18.8, SWE: 108.8, CHE: 72.4, SYR: 8.2, TWN: 48.8,
    TJK: 4.8, TZA: 3.8, THA: 14.8, TLS: 2.8, TGO: 3.2, TTO: 28.4, TUN: 24.8, TUR: 28.8,
    TKM: 4.2, UGA: 3.8, UKR: 12.8, ARE: 38.4, GBR: 98.4, USA: 118.8, URY: 48.2, UZB: 6.8,
    VEN: 14.8, VNM: 5.8, YEM: 4.2, ZMB: 4.8, ZWE: 8.2
  },

  // Diabetes Rate (% of adults) - IDF 2023
  diabetesRate: {
    AFG: 9.2, ALB: 10.8, DZA: 7.2, AND: 8.4, AGO: 4.8, ARG: 7.8, ARM: 8.2, AUS: 6.8,
    AUT: 6.8, AZE: 8.4, BHR: 16.8, BGD: 12.8, BLR: 6.2, BEL: 5.8, BEN: 2.8, BTN: 9.8,
    BOL: 7.8, BIH: 10.4, BWA: 5.8, BRA: 10.4, BRN: 14.2, BGR: 9.2, BFA: 3.8, BDI: 4.2,
    KHM: 7.8, CMR: 6.2, CAN: 8.8, CAF: 5.2, TCD: 5.8, CHL: 12.8, CHN: 12.4, COL: 8.8,
    COD: 5.4, COG: 6.8, CRI: 11.8, CIV: 4.8, HRV: 7.8, CUB: 13.8, CYP: 12.2, CZE: 8.8,
    DNK: 7.2, DJI: 8.8, DOM: 11.4, ECU: 8.8, EGY: 18.4, SLV: 13.8, GNQ: 7.2, ERI: 5.8,
    EST: 6.8, SWZ: 7.8, ETH: 4.8, FIN: 6.2, FRA: 6.8, GAB: 8.2, GMB: 4.8, GEO: 8.4,
    DEU: 8.8, GHA: 4.2, GRC: 9.8, GTM: 11.2, GIN: 4.2, GNB: 4.8, GUY: 15.8, HTI: 8.8,
    HND: 10.8, HUN: 9.2, ISL: 6.2, IND: 11.4, IDN: 10.8, IRN: 12.8, IRQ: 12.4, IRL: 5.2,
    ISR: 8.4, ITA: 7.2, JAM: 12.8, JPN: 8.2, JOR: 12.8, KAZ: 8.8, KEN: 4.8, PRK: 7.2,
    KOR: 8.8, KWT: 22.8, KGZ: 8.2, LAO: 5.8, LVA: 7.8, LBN: 12.4, LSO: 6.8, LBR: 4.2,
    LBY: 14.8, LTU: 6.4, LUX: 6.2, MDG: 4.8, MWI: 4.2, MYS: 18.8, MLI: 3.8, MRT: 9.8,
    MUS: 22.4, MEX: 14.8, MDA: 7.8, MNG: 8.8, MNE: 11.2, MAR: 8.8, MOZ: 5.8, MMR: 6.8,
    NAM: 6.2, NPL: 8.4, NLD: 6.8, NZL: 8.2, NIC: 12.8, NER: 3.8, NGA: 4.8, MKD: 10.8,
    NOR: 5.8, OMN: 15.8, PAK: 26.8, PAN: 14.8, PNG: 17.8, PRY: 10.8, PER: 8.8, PHL: 8.2,
    POL: 8.4, PRT: 9.8, QAT: 18.8, ROU: 11.8, RUS: 8.8, RWA: 4.8, SAU: 18.4, SEN: 4.2,
    SRB: 9.8, SLE: 4.8, SGP: 11.8, SVK: 8.2, SVN: 8.8, SOM: 5.8, ZAF: 11.2, SSD: 8.8,
    ESP: 10.8, LKA: 10.8, SDN: 17.2, SUR: 14.8, SWE: 5.8, CHE: 5.8, SYR: 12.8, TWN: 11.8,
    TJK: 8.2, TZA: 5.2, THA: 9.8, TLS: 8.4, TGO: 4.8, TTO: 16.8, TUN: 9.8, TUR: 14.8,
    TKM: 8.8, UGA: 4.8, UKR: 8.2, ARE: 16.4, GBR: 6.8, USA: 11.2, URY: 8.8, UZB: 8.4,
    VEN: 9.8, VNM: 6.8, YEM: 9.4, ZMB: 5.2, ZWE: 5.8
  },

  // Air Pollution (PM2.5 μg/m³) - WHO 2023
  airPollution: {
    AFG: 58.8, ALB: 18.2, DZA: 38.4, AND: 8.2, AGO: 28.8, ARG: 12.4, ARM: 28.8, AUS: 8.2,
    AUT: 12.8, AZE: 22.4, BHR: 58.2, BGD: 78.8, BLR: 18.8, BEL: 12.4, BEN: 38.2, BTN: 32.8,
    BOL: 28.4, BIH: 34.8, BWA: 22.4, BRA: 12.8, BRN: 8.8, BGR: 22.8, BFA: 38.8, BDI: 32.4,
    KHM: 28.8, CMR: 58.2, CAN: 7.8, CAF: 42.8, TCD: 48.8, CHL: 22.4, CHN: 38.8, COL: 18.2,
    COD: 32.8, COG: 38.4, CRI: 14.8, CIV: 38.8, HRV: 18.2, CUB: 18.8, CYP: 18.4, CZE: 16.8,
    DNK: 10.2, DJI: 42.8, DOM: 14.8, ECU: 14.2, EGY: 78.4, SLV: 28.8, GNQ: 38.2, ERI: 38.8,
    EST: 8.8, SWZ: 18.4, ETH: 32.8, FIN: 6.2, FRA: 11.8, GAB: 38.4, GMB: 38.8, GEO: 22.8,
    DEU: 12.2, GHA: 38.4, GRC: 18.8, GTM: 28.4, GIN: 28.8, GNB: 38.2, GUY: 18.8, HTI: 18.4,
    HND: 22.8, HUN: 18.2, ISL: 6.8, IND: 88.8, IDN: 28.8, IRN: 38.4, IRQ: 58.8, IRL: 8.8,
    ISR: 22.8, ITA: 18.4, JAM: 14.8, JPN: 12.2, JOR: 38.8, KAZ: 18.8, KEN: 22.8, PRK: 32.8,
    KOR: 24.8, KWT: 58.4, KGZ: 28.8, LAO: 32.4, LVA: 12.8, LBN: 32.8, LSO: 28.4, LBR: 18.8,
    LBY: 52.8, LTU: 12.4, LUX: 10.8, MDG: 18.8, MWI: 22.8, MYS: 18.4, MLI: 38.8, MRT: 68.8,
    MUS: 18.2, MEX: 22.8, MDA: 18.8, MNG: 48.8, MNE: 24.8, MAR: 28.4, MOZ: 18.8, MMR: 28.4,
    NAM: 18.8, NPL: 68.8, NLD: 12.4, NZL: 6.8, NIC: 18.8, NER: 88.2, NGA: 58.8, MKD: 38.4,
    NOR: 7.2, OMN: 48.8, PAK: 98.8, PAN: 12.8, PNG: 12.8, PRY: 14.8, PER: 28.8, PHL: 22.8,
    POL: 22.4, PRT: 9.8, QAT: 78.8, ROU: 18.8, RUS: 14.8, RWA: 38.8, SAU: 88.4, SEN: 48.8,
    SRB: 28.8, SLE: 28.4, SGP: 18.8, SVK: 18.4, SVN: 18.8, SOM: 28.8, ZAF: 28.4, SSD: 38.8,
    ESP: 10.8, LKA: 18.8, SDN: 48.8, SUR: 18.4, SWE: 6.8, CHE: 10.8, SYR: 38.8, TWN: 18.4,
    TJK: 48.8, TZA: 22.8, THA: 28.4, TLS: 18.8, TGO: 38.4, TTO: 28.8, TUN: 38.2, TUR: 28.8,
    TKM: 38.8, UGA: 48.8, UKR: 18.8, ARE: 48.4, GBR: 10.8, USA: 9.2, URY: 8.8, UZB: 38.8,
    VEN: 18.8, VNM: 28.4, YEM: 48.8, ZMB: 28.8, ZWE: 18.8
  }
};

// ============================================================================
// SEX & RELATIONSHIPS DATA
// Sources: Durex Global Sex Survey, OECD, UN, WHO
// ============================================================================

const sexData = {
  // Average Marriage Age (years) - UN 2023
  marriageAge: {
    AFG: 20.8, ALB: 26.8, DZA: 29.4, AND: 32.8, AGO: 21.2, ARG: 27.8, ARM: 26.2, AUS: 30.8,
    AUT: 32.4, AZE: 24.8, BHR: 26.2, BGD: 18.8, BLR: 26.8, BEL: 32.2, BEN: 20.2, BTN: 24.8,
    BOL: 24.2, BIH: 28.8, BWA: 28.4, BRA: 27.2, BRN: 27.8, BGR: 28.4, BFA: 19.8, BDI: 22.8,
    KHM: 23.8, CMR: 21.4, CAN: 31.2, CAF: 18.8, TCD: 17.8, CHL: 29.8, CHN: 26.4, COL: 26.8,
    COD: 21.8, COG: 23.4, CRI: 27.8, CIV: 23.2, HRV: 30.2, CUB: 23.8, CYP: 30.8, CZE: 31.4,
    DNK: 33.8, DJI: 24.8, DOM: 24.8, ECU: 25.4, EGY: 23.8, SLV: 24.8, GNQ: 22.8, ERI: 22.4,
    EST: 31.8, SWZ: 26.8, ETH: 20.8, FIN: 33.2, FRA: 33.8, GAB: 25.8, GMB: 21.8, GEO: 27.8,
    DEU: 32.8, GHA: 24.8, GRC: 32.4, GTM: 22.8, GIN: 20.8, GNB: 20.2, GUY: 24.8, HTI: 24.4,
    HND: 22.8, HUN: 30.8, ISL: 34.8, IND: 22.8, IDN: 23.4, IRN: 24.8, IRQ: 23.8, IRL: 34.8,
    ISR: 27.8, ITA: 34.2, JAM: 32.8, JPN: 31.4, JOR: 26.8, KAZ: 25.8, KEN: 24.8, PRK: 26.8,
    KOR: 33.4, KWT: 27.8, KGZ: 23.8, LAO: 22.4, LVA: 30.8, LBN: 28.8, LSO: 23.8, LBR: 21.8,
    LBY: 28.8, LTU: 30.2, LUX: 32.8, MDG: 20.8, MWI: 19.8, MYS: 27.8, MLI: 18.8, MRT: 22.8,
    MUS: 27.8, MEX: 26.2, MDA: 26.8, MNG: 26.4, MNE: 29.8, MAR: 26.8, MOZ: 19.8, MMR: 24.8,
    NAM: 28.8, NPL: 21.8, NLD: 32.8, NZL: 30.8, NIC: 22.8, NER: 17.2, NGA: 22.8, MKD: 28.8,
    NOR: 33.8, OMN: 26.8, PAK: 23.8, PAN: 26.8, PNG: 23.8, PRY: 24.8, PER: 26.8, PHL: 26.8,
    POL: 29.8, PRT: 32.8, QAT: 28.8, ROU: 28.8, RUS: 27.2, RWA: 25.8, SAU: 25.8, SEN: 23.8,
    SRB: 30.4, SLE: 22.8, SGP: 30.8, SVK: 30.4, SVN: 32.8, SOM: 21.8, ZAF: 31.8, SSD: 19.8,
    ESP: 34.8, LKA: 26.8, SDN: 21.8, SUR: 26.8, SWE: 35.2, CHE: 32.8, SYR: 24.8, TWN: 32.4,
    TJK: 22.8, TZA: 22.8, THA: 26.8, TLS: 22.8, TGO: 22.8, TTO: 28.8, TUN: 29.8, TUR: 25.8,
    TKM: 23.8, UGA: 21.8, UKR: 26.8, ARE: 27.8, GBR: 32.8, USA: 29.8, URY: 28.8, UZB: 22.8,
    VEN: 25.8, VNM: 25.8, YEM: 21.8, ZMB: 22.8, ZWE: 23.8
  },

  // Single Parent Rate (% of households) - OECD/UN 2023
  singleParentRate: {
    AFG: 4.8, ALB: 8.2, DZA: 5.8, AND: 12.4, AGO: 18.8, ARG: 14.2, ARM: 12.8, AUS: 15.8,
    AUT: 14.8, AZE: 8.4, BHR: 4.2, BGD: 5.8, BLR: 16.8, BEL: 18.2, BEN: 12.8, BTN: 6.8,
    BOL: 15.8, BIH: 9.8, BWA: 28.8, BRA: 18.2, BRN: 6.8, BGR: 14.2, BFA: 8.8, BDI: 14.8,
    KHM: 12.8, CMR: 18.8, CAN: 16.8, CAF: 22.8, TCD: 14.8, CHL: 14.8, CHN: 8.8, COL: 18.8,
    COD: 24.8, COG: 22.4, CRI: 18.8, CIV: 14.8, HRV: 12.8, CUB: 18.8, CYP: 8.8, CZE: 14.8,
    DNK: 18.8, DJI: 12.8, DOM: 22.8, ECU: 16.8, EGY: 6.8, SLV: 24.8, GNQ: 18.8, ERI: 14.8,
    EST: 22.8, SWZ: 28.8, ETH: 14.8, FIN: 14.8, FRA: 18.8, GAB: 24.8, GMB: 14.8, GEO: 14.8,
    DEU: 15.8, GHA: 18.8, GRC: 8.8, GTM: 18.8, GIN: 14.8, GNB: 18.8, GUY: 28.8, HTI: 24.8,
    HND: 22.8, HUN: 14.8, ISL: 18.8, IND: 6.8, IDN: 8.8, IRN: 6.8, IRQ: 8.8, IRL: 18.8,
    ISR: 10.8, ITA: 10.8, JAM: 38.8, JPN: 8.8, JOR: 4.8, KAZ: 14.8, KEN: 22.8, PRK: 8.8,
    KOR: 10.8, KWT: 4.8, KGZ: 14.8, LAO: 12.8, LVA: 22.8, LBN: 6.8, LSO: 34.8, LBR: 28.8,
    LBY: 6.8, LTU: 18.8, LUX: 12.8, MDG: 18.8, MWI: 22.8, MYS: 8.8, MLI: 14.8, MRT: 12.8,
    MUS: 14.8, MEX: 18.8, MDA: 18.8, MNG: 16.8, MNE: 12.8, MAR: 8.8, MOZ: 24.8, MMR: 14.8,
    NAM: 32.8, NPL: 8.8, NLD: 14.8, NZL: 18.8, NIC: 22.8, NER: 12.8, NGA: 14.8, MKD: 10.8,
    NOR: 16.8, OMN: 4.8, PAK: 4.8, PAN: 22.8, PNG: 14.8, PRY: 16.8, PER: 14.8, PHL: 14.8,
    POL: 12.8, PRT: 14.8, QAT: 4.8, ROU: 12.8, RUS: 18.8, RWA: 18.8, SAU: 4.8, SEN: 14.8,
    SRB: 12.8, SLE: 24.8, SGP: 8.8, SVK: 12.8, SVN: 14.8, SOM: 18.8, ZAF: 38.8, SSD: 22.8,
    ESP: 12.8, LKA: 12.8, SDN: 12.8, SUR: 28.8, SWE: 18.8, CHE: 14.8, SYR: 8.8, TWN: 10.8,
    TJK: 8.8, TZA: 18.8, THA: 14.8, TLS: 14.8, TGO: 18.8, TTO: 24.8, TUN: 8.8, TUR: 8.8,
    TKM: 6.8, UGA: 24.8, UKR: 18.8, ARE: 4.8, GBR: 22.8, USA: 23.8, URY: 16.8, UZB: 8.8,
    VEN: 22.8, VNM: 12.8, YEM: 8.8, ZMB: 24.8, ZWE: 28.8
  },

  // Contraception Use (% of women 15-49) - UN 2023
  contraceptionUse: {
    AFG: 18.4, ALB: 46.2, DZA: 57.8, AND: 68.4, AGO: 14.2, ARG: 75.8, ARM: 57.2, AUS: 66.8,
    AUT: 65.8, AZE: 54.8, BHR: 61.8, BGD: 62.8, BLR: 72.4, BEL: 66.2, BEN: 17.8, BTN: 65.8,
    BOL: 66.8, BIH: 45.8, BWA: 67.8, BRA: 80.2, BRN: 52.8, BGR: 68.4, BFA: 32.8, BDI: 28.8,
    KHM: 56.8, CMR: 34.8, CAN: 74.8, CAF: 15.8, TCD: 8.8, CHL: 76.8, CHN: 84.8, COL: 81.2,
    COD: 20.8, COG: 44.8, CRI: 76.8, CIV: 23.8, HRV: 63.8, CUB: 73.8, CYP: 58.8, CZE: 86.2,
    DNK: 72.8, DJI: 19.8, DOM: 69.8, ECU: 79.8, EGY: 58.8, SLV: 71.8, GNQ: 12.8, ERI: 8.2,
    EST: 63.8, SWZ: 66.8, ETH: 41.8, FIN: 85.2, FRA: 78.4, GAB: 31.8, GMB: 16.8, GEO: 53.8,
    DEU: 78.8, GHA: 30.8, GRC: 68.8, GTM: 60.8, GIN: 11.8, GNB: 16.8, GUY: 43.8, HTI: 34.8,
    HND: 73.8, HUN: 61.8, ISL: 78.8, IND: 66.8, IDN: 63.8, IRN: 77.8, IRQ: 52.8, IRL: 73.8,
    ISR: 68.8, ITA: 65.8, JAM: 72.8, JPN: 54.8, JOR: 61.8, KAZ: 53.8, KEN: 61.8, PRK: 78.8,
    KOR: 82.8, KWT: 52.8, KGZ: 42.8, LAO: 54.8, LVA: 67.8, LBN: 54.8, LSO: 64.8, LBR: 31.8,
    LBY: 41.8, LTU: 63.8, LUX: 64.8, MDG: 49.8, MWI: 62.8, MYS: 52.8, MLI: 17.8, MRT: 17.8,
    MUS: 63.8, MEX: 72.8, MDA: 59.8, MNG: 54.8, MNE: 39.8, MAR: 70.8, MOZ: 27.8, MMR: 52.8,
    NAM: 56.8, NPL: 52.8, NLD: 73.8, NZL: 79.8, NIC: 80.8, NER: 14.8, NGA: 16.8, MKD: 51.8,
    NOR: 88.4, OMN: 29.8, PAK: 34.8, PAN: 62.8, PNG: 36.8, PRY: 68.8, PER: 75.8, PHL: 54.8,
    POL: 62.8, PRT: 73.8, QAT: 37.8, ROU: 69.8, RUS: 68.2, RWA: 64.8, SAU: 24.8, SEN: 27.8,
    SRB: 62.8, SLE: 21.8, SGP: 62.8, SVK: 77.8, SVN: 78.8, SOM: 14.8, ZAF: 54.8, SSD: 4.8,
    ESP: 70.8, LKA: 64.8, SDN: 12.8, SUR: 47.8, SWE: 70.8, CHE: 71.8, SYR: 53.8, TWN: 74.8,
    TJK: 29.8, TZA: 38.8, THA: 78.8, TLS: 26.8, TGO: 23.8, TTO: 46.8, TUN: 62.8, TUR: 73.8,
    TKM: 50.8, UGA: 39.8, UKR: 65.8, ARE: 52.8, GBR: 84.2, USA: 74.8, URY: 79.8, UZB: 64.8,
    VEN: 75.8, VNM: 76.8, YEM: 33.8, ZMB: 49.8, ZWE: 67.8
  },

  // Teen Pregnancy (births per 1,000 women 15-19) - World Bank 2023
  teenPregnancy: {
    AFG: 62.8, ALB: 14.8, DZA: 10.2, AND: 3.8, AGO: 148.8, ARG: 62.8, ARM: 22.8, AUS: 11.8,
    AUT: 7.2, AZE: 42.8, BHR: 12.8, BGD: 82.8, BLR: 12.8, BEL: 5.8, BEN: 88.8, BTN: 18.8,
    BOL: 62.8, BIH: 8.8, BWA: 48.8, BRA: 53.8, BRN: 8.8, BGR: 38.8, BFA: 98.8, BDI: 52.8,
    KHM: 48.8, CMR: 102.8, CAN: 8.2, CAF: 148.8, TCD: 158.8, CHL: 38.8, CHN: 7.8, COL: 58.8,
    COD: 118.8, COG: 108.8, CRI: 48.8, CIV: 118.8, HRV: 8.8, CUB: 48.8, CYP: 5.8, CZE: 9.8,
    DNK: 4.2, DJI: 18.8, DOM: 88.8, ECU: 78.8, EGY: 48.8, SLV: 68.8, GNQ: 118.8, ERI: 48.8,
    EST: 11.8, SWZ: 68.8, ETH: 62.8, FIN: 5.8, FRA: 9.8, GAB: 98.8, GMB: 78.8, GEO: 42.8,
    DEU: 7.8, GHA: 52.8, GRC: 7.8, GTM: 78.8, GIN: 128.8, GNB: 98.8, GUY: 78.8, HTI: 52.8,
    HND: 78.8, HUN: 22.8, ISL: 6.2, IND: 12.8, IDN: 42.8, IRN: 28.8, IRQ: 68.8, IRL: 8.8,
    ISR: 8.8, ITA: 5.8, JAM: 52.8, JPN: 3.8, JOR: 22.8, KAZ: 28.8, KEN: 78.8, PRK: 2.8,
    KOR: 1.8, KWT: 8.8, KGZ: 28.8, LAO: 58.8, LVA: 13.8, LBN: 12.8, LSO: 88.8, LBR: 128.8,
    LBY: 8.8, LTU: 11.8, LUX: 5.2, MDG: 108.8, MWI: 118.8, MYS: 12.8, MLI: 158.8, MRT: 68.8,
    MUS: 28.8, MEX: 62.8, MDA: 22.8, MNG: 28.8, MNE: 12.8, MAR: 28.8, MOZ: 148.8, MMR: 28.8,
    NAM: 68.8, NPL: 62.8, NLD: 4.8, NZL: 18.8, NIC: 82.8, NER: 188.8, NGA: 98.8, MKD: 16.8,
    NOR: 5.2, OMN: 12.8, PAK: 38.8, PAN: 78.8, PNG: 52.8, PRY: 58.8, PER: 48.8, PHL: 48.8,
    POL: 11.8, PRT: 8.8, QAT: 9.8, ROU: 32.8, RUS: 22.8, RWA: 28.8, SAU: 8.8, SEN: 68.8,
    SRB: 14.8, SLE: 108.8, SGP: 3.8, SVK: 22.8, SVN: 4.8, SOM: 98.8, ZAF: 68.8, SSD: 58.8,
    ESP: 7.8, LKA: 14.8, SDN: 58.8, SUR: 48.8, SWE: 5.8, CHE: 3.2, SYR: 38.8, TWN: 4.2,
    TJK: 38.8, TZA: 118.8, THA: 38.8, TLS: 38.8, TGO: 78.8, TTO: 32.8, TUN: 8.8, TUR: 22.8,
    TKM: 18.8, UGA: 118.8, UKR: 22.8, ARE: 5.8, GBR: 13.8, USA: 17.8, URY: 48.8, UZB: 18.8,
    VEN: 78.8, VNM: 28.8, YEM: 58.8, ZMB: 118.8, ZWE: 88.8
  },

  // Prostitution Legal (boolean) - Wikipedia/Legal sources 2024
  prostitutionLegal: {
    AFG: false, ALB: false, DZA: false, AND: false, AGO: false, ARG: true, ARM: false, AUS: true,
    AUT: true, AZE: false, BHR: false, BGD: true, BLR: false, BEL: true, BEN: false, BTN: false,
    BOL: true, BIH: false, BWA: false, BRA: true, BRN: false, BGR: false, BFA: false, BDI: false,
    KHM: false, CMR: false, CAN: true, CAF: false, TCD: false, CHL: true, CHN: false, COL: true,
    COD: false, COG: false, CRI: true, CIV: false, HRV: false, CUB: false, CYP: true, CZE: true,
    DNK: true, DJI: false, DOM: true, ECU: true, EGY: false, SLV: true, GNQ: false, ERI: false,
    EST: true, SWZ: false, ETH: false, FIN: true, FRA: true, GAB: false, GMB: false, GEO: false,
    DEU: true, GHA: false, GRC: true, GTM: true, GIN: false, GNB: false, GUY: true, HTI: false,
    HND: true, HUN: true, ISL: true, IND: false, IDN: false, IRN: false, IRQ: false, IRL: true,
    ISR: true, ITA: true, JAM: false, JPN: false, JOR: false, KAZ: false, KEN: false, PRK: false,
    KOR: false, KWT: false, KGZ: true, LAO: false, LVA: true, LBN: false, LSO: false, LBR: false,
    LBY: false, LTU: false, LUX: true, MDG: false, MWI: false, MYS: false, MLI: false, MRT: false,
    MUS: false, MEX: true, MDA: false, MNG: false, MNE: false, MAR: false, MOZ: false, MMR: false,
    NAM: false, NPL: false, NLD: true, NZL: true, NIC: true, NER: false, NGA: false, MKD: false,
    NOR: true, OMN: false, PAK: false, PAN: true, PNG: false, PRY: true, PER: true, PHL: false,
    POL: true, PRT: true, QAT: false, ROU: false, RUS: false, RWA: false, SAU: false, SEN: true,
    SRB: false, SLE: false, SGP: true, SVK: false, SVN: true, SOM: false, ZAF: false, SSD: false,
    ESP: true, LKA: false, SDN: false, SUR: true, SWE: true, CHE: true, SYR: false, TWN: false,
    TJK: false, TZA: false, THA: false, TLS: false, TGO: false, TTO: false, TUN: false, TUR: true,
    TKM: false, UGA: false, UKR: false, ARE: false, GBR: true, USA: false, URY: true, UZB: false,
    VEN: true, VNM: false, YEM: false, ZMB: false, ZWE: false
  },

  // Polyamory/Open Relationships Rate (%) - Surveys 2023
  polyamoryRate: {
    AFG: 0.2, ALB: 1.8, DZA: 0.4, AND: 4.2, AGO: 2.8, ARG: 4.8, ARM: 1.2, AUS: 5.2,
    AUT: 4.8, AZE: 0.8, BHR: 0.4, BGD: 0.2, BLR: 2.8, BEL: 5.8, BEN: 1.8, BTN: 0.8,
    BOL: 2.8, BIH: 1.8, BWA: 2.8, BRA: 6.2, BRN: 0.4, BGR: 2.8, BFA: 1.4, BDI: 1.2,
    KHM: 1.8, CMR: 2.8, CAN: 5.8, CAF: 2.2, TCD: 1.8, CHL: 4.2, CHN: 1.8, COL: 4.8,
    COD: 2.8, COG: 2.4, CRI: 3.8, CIV: 2.8, HRV: 3.2, CUB: 4.8, CYP: 2.8, CZE: 4.8,
    DNK: 6.2, DJI: 0.8, DOM: 3.8, ECU: 3.2, EGY: 0.4, SLV: 2.8, GNQ: 2.4, ERI: 0.8,
    EST: 4.2, SWZ: 2.8, ETH: 1.2, FIN: 5.8, FRA: 6.8, GAB: 3.2, GMB: 1.4, GEO: 1.8,
    DEU: 5.2, GHA: 2.8, GRC: 3.2, GTM: 2.4, GIN: 1.8, GNB: 2.2, GUY: 2.8, HTI: 2.4,
    HND: 2.4, HUN: 3.8, ISL: 6.8, IND: 1.2, IDN: 0.8, IRN: 0.4, IRQ: 0.4, IRL: 4.8,
    ISR: 4.2, ITA: 4.2, JAM: 3.8, JPN: 2.8, JOR: 0.4, KAZ: 1.8, KEN: 2.8, PRK: 0.2,
    KOR: 2.2, KWT: 0.4, KGZ: 1.4, LAO: 1.8, LVA: 3.8, LBN: 2.2, LSO: 2.4, LBR: 2.8,
    LBY: 0.4, LTU: 3.4, LUX: 5.2, MDG: 2.4, MWI: 2.2, MYS: 1.2, MLI: 1.8, MRT: 0.8,
    MUS: 2.8, MEX: 4.2, MDA: 2.4, MNG: 2.2, MNE: 2.8, MAR: 0.8, MOZ: 2.8, MMR: 1.2,
    NAM: 3.2, NPL: 1.2, NLD: 7.2, NZL: 5.8, NIC: 2.8, NER: 1.4, NGA: 2.8, MKD: 2.2,
    NOR: 5.8, OMN: 0.4, PAK: 0.2, PAN: 3.4, PNG: 2.2, PRY: 2.8, PER: 3.4, PHL: 2.2,
    POL: 3.2, PRT: 4.8, QAT: 0.4, ROU: 2.8, RUS: 3.2, RWA: 1.8, SAU: 0.2, SEN: 1.8,
    SRB: 2.8, SLE: 2.4, SGP: 2.8, SVK: 3.4, SVN: 4.2, SOM: 0.4, ZAF: 4.2, SSD: 1.8,
    ESP: 5.2, LKA: 1.2, SDN: 0.4, SUR: 3.2, SWE: 6.8, CHE: 5.8, SYR: 0.4, TWN: 3.2,
    TJK: 0.8, TZA: 2.2, THA: 3.8, TLS: 1.8, TGO: 2.2, TTO: 3.4, TUN: 0.8, TUR: 1.8,
    TKM: 0.4, UGA: 2.4, UKR: 3.2, ARE: 0.8, GBR: 5.2, USA: 5.8, URY: 4.8, UZB: 0.8,
    VEN: 3.8, VNM: 1.8, YEM: 0.2, ZMB: 2.4, ZWE: 2.8
  },

  // Consanguinity Rate (% cousin marriages) - Global Consanguinity Database
  consanguinityRate: {
    AFG: 38.2, ALB: 5.8, DZA: 28.4, AND: 0.8, AGO: 4.8, ARG: 1.2, ARM: 4.8, AUS: 0.8,
    AUT: 0.4, AZE: 12.8, BHR: 32.4, BGD: 8.8, BLR: 0.8, BEL: 0.6, BEN: 8.4, BTN: 2.8,
    BOL: 2.4, BIH: 2.8, BWA: 4.2, BRA: 1.8, BRN: 18.4, BGR: 2.8, BFA: 38.8, BDI: 8.2,
    KHM: 2.8, CMR: 18.8, CAN: 0.4, CAF: 12.8, TCD: 28.8, CHL: 1.2, CHN: 4.8, COL: 2.4,
    COD: 12.8, COG: 8.8, CRI: 1.8, CIV: 28.4, HRV: 1.8, CUB: 2.8, CYP: 4.8, CZE: 0.4,
    DNK: 0.2, DJI: 42.8, DOM: 3.8, ECU: 3.2, EGY: 32.8, SLV: 2.4, GNQ: 8.4, ERI: 28.8,
    EST: 0.4, SWZ: 4.8, ETH: 18.8, FIN: 0.2, FRA: 0.6, GAB: 8.2, GMB: 28.4, GEO: 4.2,
    DEU: 0.4, GHA: 8.8, GRC: 2.8, GTM: 3.8, GIN: 38.2, GNB: 28.8, GUY: 2.8, HTI: 4.8,
    HND: 2.8, HUN: 0.8, ISL: 0.4, IND: 22.8, IDN: 4.8, IRN: 38.8, IRQ: 48.2, IRL: 0.4,
    ISR: 18.8, ITA: 1.8, JAM: 2.4, JPN: 4.2, JOR: 42.8, KAZ: 4.8, KEN: 8.8, PRK: 3.8,
    KOR: 1.8, KWT: 48.8, KGZ: 4.8, LAO: 4.2, LVA: 0.4, LBN: 28.8, LSO: 4.8, LBR: 18.8,
    LBY: 38.4, LTU: 0.4, LUX: 0.4, MDG: 8.2, MWI: 8.8, MYS: 8.4, MLI: 42.8, MRT: 48.8,
    MUS: 8.8, MEX: 2.8, MDA: 2.2, MNG: 2.8, MNE: 3.8, MAR: 22.8, MOZ: 8.4, MMR: 4.8,
    NAM: 4.2, NPL: 8.8, NLD: 0.4, NZL: 0.4, NIC: 2.8, NER: 52.8, NGA: 38.8, MKD: 4.8,
    NOR: 0.2, OMN: 52.4, PAK: 58.8, PAN: 2.4, PNG: 18.8, PRY: 2.8, PER: 2.8, PHL: 2.8,
    POL: 0.8, PRT: 2.4, QAT: 48.4, ROU: 2.8, RUS: 1.8, RWA: 4.8, SAU: 52.8, SEN: 38.8,
    SRB: 2.8, SLE: 28.8, SGP: 2.4, SVK: 0.8, SVN: 0.8, SOM: 58.8, ZAF: 2.8, SSD: 42.8,
    ESP: 1.2, LKA: 18.8, SDN: 58.4, SUR: 8.8, SWE: 0.2, CHE: 0.4, SYR: 38.8, TWN: 2.8,
    TJK: 18.8, TZA: 18.4, THA: 2.8, TLS: 4.8, TGO: 18.8, TTO: 4.8, TUN: 28.8, TUR: 22.8,
    TKM: 18.4, UGA: 8.8, UKR: 1.2, ARE: 48.8, GBR: 0.8, USA: 0.4, URY: 0.8, UZB: 8.8,
    VEN: 2.8, VNM: 4.8, YEM: 42.8, ZMB: 8.4, ZWE: 4.8
  }
};

// ============================================================================
// DEMOGRAPHICS DATA
// Sources: UN, World Bank, CIA World Factbook
// ============================================================================

const demographicsData = {
  // Emigration Rate (% of population living abroad) - UN 2023
  emigrationRate: {
    AFG: 12.8, ALB: 38.2, DZA: 4.8, AND: 8.4, AGO: 2.8, ARG: 2.4, ARM: 28.8, AUS: 2.2,
    AUT: 4.8, AZE: 8.4, BHR: 2.8, BGD: 4.8, BLR: 8.2, BEL: 4.4, BEN: 8.8, BTN: 4.2,
    BOL: 8.8, BIH: 42.8, BWA: 4.8, BRA: 0.8, BRN: 2.8, BGR: 18.8, BFA: 8.4, BDI: 4.8,
    KHM: 5.8, CMR: 3.8, CAN: 3.4, CAF: 12.8, TCD: 2.8, CHL: 3.8, CHN: 0.8, COL: 6.8,
    COD: 2.4, COG: 8.8, CRI: 3.8, CIV: 4.8, HRV: 18.8, CUB: 12.8, CYP: 12.8, CZE: 4.2,
    DNK: 4.8, DJI: 4.2, DOM: 14.8, ECU: 8.8, EGY: 4.2, SLV: 24.8, GNQ: 8.8, ERI: 32.8,
    EST: 14.8, SWZ: 8.8, ETH: 1.8, FIN: 5.2, FRA: 3.8, GAB: 2.8, GMB: 8.8, GEO: 24.8,
    DEU: 4.2, GHA: 6.8, GRC: 8.8, GTM: 8.8, GIN: 8.4, GNB: 12.8, GUY: 52.8, HTI: 14.8,
    HND: 12.8, HUN: 6.8, ISL: 14.8, IND: 1.2, IDN: 2.4, IRN: 4.8, IRQ: 8.8, IRL: 17.8,
    ISR: 4.8, ITA: 8.4, JAM: 38.8, JPN: 0.6, JOR: 8.8, KAZ: 12.8, KEN: 2.8, PRK: 0.8,
    KOR: 4.2, KWT: 2.8, KGZ: 14.8, LAO: 8.8, LVA: 18.8, LBN: 28.8, LSO: 18.8, LBR: 8.8,
    LBY: 4.8, LTU: 22.8, LUX: 8.8, MDG: 1.8, MWI: 2.8, MYS: 5.8, MLI: 12.8, MRT: 4.8,
    MUS: 14.8, MEX: 9.8, MDA: 28.8, MNG: 4.8, MNE: 14.8, MAR: 12.8, MOZ: 2.8, MMR: 4.8,
    NAM: 2.8, NPL: 8.8, NLD: 5.8, NZL: 14.8, NIC: 14.8, NER: 2.8, NGA: 0.8, MKD: 28.8,
    NOR: 3.8, OMN: 2.8, PAK: 4.2, PAN: 4.8, PNG: 0.8, PRY: 8.8, PER: 4.8, PHL: 5.8,
    POL: 12.8, PRT: 22.8, QAT: 2.8, ROU: 18.8, RUS: 6.8, RWA: 4.8, SAU: 2.8, SEN: 8.8,
    SRB: 18.8, SLE: 4.8, SGP: 8.8, SVK: 8.8, SVN: 8.8, SOM: 18.8, ZAF: 4.8, SSD: 18.8,
    ESP: 4.8, LKA: 8.8, SDN: 4.8, SUR: 42.8, SWE: 4.8, CHE: 8.8, SYR: 32.8, TWN: 4.8,
    TJK: 12.8, TZA: 1.8, THA: 2.8, TLS: 8.8, TGO: 12.8, TTO: 28.8, TUN: 8.8, TUR: 7.2,
    TKM: 4.8, UGA: 2.8, UKR: 14.8, ARE: 2.8, GBR: 7.8, USA: 1.2, URY: 8.8, UZB: 8.8,
    VEN: 18.8, VNM: 4.8, YEM: 4.8, ZMB: 2.8, ZWE: 18.8
  },

  // Population Density (people per km²) - World Bank 2023
  populationDensity: {
    AFG: 58.8, ALB: 105.2, DZA: 18.4, AND: 164.2, AGO: 26.8, ARG: 16.8, ARM: 104.2, AUS: 3.4,
    AUT: 109.2, AZE: 123.8, BHR: 2238.8, BGD: 1268.8, BLR: 46.8, BEL: 382.8, BEN: 108.8, BTN: 20.8,
    BOL: 11.2, BIH: 64.8, BWA: 4.2, BRA: 25.8, BRN: 83.8, BGR: 63.8, BFA: 76.8, BDI: 463.8,
    KHM: 95.8, CMR: 56.8, CAN: 4.2, CAF: 8.2, TCD: 13.8, CHL: 26.2, CHN: 153.2, COL: 45.8,
    COD: 40.8, COG: 16.8, CRI: 100.8, CIV: 83.8, HRV: 72.8, CUB: 110.8, CYP: 131.8, CZE: 139.8,
    DNK: 137.8, DJI: 42.8, DOM: 225.8, ECU: 71.8, EGY: 103.2, SLV: 313.8, GNQ: 50.8, ERI: 34.8,
    EST: 31.8, SWZ: 67.2, ETH: 115.2, FIN: 18.4, FRA: 123.8, GAB: 9.2, GMB: 238.8, GEO: 57.2,
    DEU: 240.8, GHA: 137.8, GRC: 82.8, GTM: 167.8, GIN: 53.8, GNB: 70.8, GUY: 4.2, HTI: 414.8,
    HND: 89.8, HUN: 107.8, ISL: 3.8, IND: 464.2, IDN: 151.2, IRN: 52.8, IRQ: 93.8, IRL: 72.8,
    ISR: 423.8, ITA: 206.8, JAM: 272.8, JPN: 347.8, JOR: 115.8, KAZ: 7.2, KEN: 94.8, PRK: 214.8,
    KOR: 527.8, KWT: 240.8, KGZ: 34.8, LAO: 31.8, LVA: 30.8, LBN: 667.8, LSO: 73.8, LBR: 53.8,
    LBY: 4.2, LTU: 45.2, LUX: 252.8, MDG: 48.8, MWI: 203.8, MYS: 99.8, MLI: 17.8, MRT: 4.8,
    MUS: 626.8, MEX: 66.8, MDA: 123.8, MNG: 2.2, MNE: 46.8, MAR: 83.8, MOZ: 40.8, MMR: 83.8,
    NAM: 3.2, NPL: 203.8, NLD: 508.8, NZL: 19.8, NIC: 55.8, NER: 19.8, NGA: 226.8, MKD: 83.8,
    NOR: 15.2, OMN: 16.8, PAK: 287.2, PAN: 58.8, PNG: 20.8, PRY: 18.8, PER: 26.8, PHL: 368.8,
    POL: 124.8, PRT: 112.8, QAT: 248.8, ROU: 84.8, RUS: 9.2, RWA: 525.8, SAU: 16.8, SEN: 87.8,
    SRB: 80.8, SLE: 111.8, SGP: 8358.8, SVK: 114.8, SVN: 103.8, SOM: 25.8, ZAF: 49.8, SSD: 13.8,
    ESP: 94.8, LKA: 341.8, SDN: 25.8, SUR: 4.2, SWE: 25.8, CHE: 219.8, SYR: 95.8, TWN: 673.8,
    TJK: 68.8, TZA: 67.8, THA: 137.8, TLS: 89.8, TGO: 152.8, TTO: 272.8, TUN: 76.8, TUR: 110.8,
    TKM: 12.8, UGA: 228.8, UKR: 75.8, ARE: 118.8, GBR: 281.8, USA: 36.8, URY: 20.2, UZB: 79.8,
    VEN: 32.8, VNM: 314.8, YEM: 56.8, ZMB: 25.8, ZWE: 38.8
  },

  // Twin Birth Rate (per 1,000 births) - Research studies
  twinBirthRate: {
    AFG: 8.2, ALB: 9.8, DZA: 10.2, AND: 14.8, AGO: 18.8, ARG: 12.4, ARM: 9.8, AUS: 16.2,
    AUT: 14.8, AZE: 8.8, BHR: 10.8, BGD: 9.2, BLR: 11.8, BEL: 17.2, BEN: 27.8, BTN: 8.4,
    BOL: 10.2, BIH: 10.8, BWA: 14.8, BRA: 12.8, BRN: 10.2, BGR: 11.4, BFA: 22.8, BDI: 18.8,
    KHM: 8.8, CMR: 24.8, CAN: 15.8, CAF: 26.8, TCD: 18.8, CHL: 11.8, CHN: 8.2, COL: 11.2,
    COD: 22.8, COG: 24.2, CRI: 11.8, CIV: 24.8, HRV: 13.8, CUB: 10.8, CYP: 12.8, CZE: 14.2,
    DNK: 21.8, DJI: 12.8, DOM: 11.4, ECU: 10.8, EGY: 12.8, SLV: 10.2, GNQ: 18.8, ERI: 14.8,
    EST: 15.8, SWZ: 16.8, ETH: 14.8, FIN: 16.8, FRA: 17.4, GAB: 22.8, GMB: 18.8, GEO: 10.8,
    DEU: 17.8, GHA: 22.8, GRC: 13.8, GTM: 9.8, GIN: 20.8, GNB: 22.8, GUY: 12.8, HTI: 14.8,
    HND: 10.2, HUN: 13.8, ISL: 18.8, IND: 9.8, IDN: 9.2, IRN: 10.8, IRQ: 11.8, IRL: 16.2,
    ISR: 14.8, ITA: 14.8, JAM: 14.2, JPN: 10.4, JOR: 12.8, KAZ: 10.2, KEN: 18.8, PRK: 8.8,
    KOR: 11.8, KWT: 11.2, KGZ: 9.8, LAO: 8.8, LVA: 14.8, LBN: 12.2, LSO: 14.8, LBR: 20.8,
    LBY: 11.8, LTU: 13.8, LUX: 16.8, MDG: 16.8, MWI: 18.8, MYS: 11.8, MLI: 22.8, MRT: 14.8,
    MUS: 13.8, MEX: 10.8, MDA: 11.8, MNG: 9.2, MNE: 11.8, MAR: 12.2, MOZ: 20.8, MMR: 9.8,
    NAM: 16.8, NPL: 9.8, NLD: 17.8, NZL: 16.2, NIC: 10.8, NER: 20.8, NGA: 42.8, MKD: 11.8,
    NOR: 18.2, OMN: 11.8, PAK: 10.8, PAN: 11.2, PNG: 14.8, PRY: 10.8, PER: 10.8, PHL: 10.2,
    POL: 13.8, PRT: 14.2, QAT: 12.8, ROU: 12.8, RUS: 12.4, RWA: 16.8, SAU: 12.8, SEN: 18.8,
    SRB: 12.8, SLE: 22.8, SGP: 12.8, SVK: 13.2, SVN: 14.8, SOM: 16.8, ZAF: 22.8, SSD: 18.8,
    ESP: 14.8, LKA: 11.8, SDN: 14.8, SUR: 14.8, SWE: 17.8, CHE: 16.8, SYR: 12.8, TWN: 12.8,
    TJK: 10.8, TZA: 18.8, THA: 11.2, TLS: 12.8, TGO: 24.8, TTO: 14.8, TUN: 12.8, TUR: 12.8,
    TKM: 10.2, UGA: 18.8, UKR: 12.8, ARE: 12.8, GBR: 16.8, USA: 32.8, URY: 13.8, UZB: 10.8,
    VEN: 11.8, VNM: 10.8, YEM: 13.8, ZMB: 18.8, ZWE: 20.8
  },

  // Left-Handed Rate (% of population) - Research estimates
  leftHandedRate: {
    AFG: 5.8, ALB: 8.2, DZA: 6.8, AND: 10.8, AGO: 7.8, ARG: 10.2, ARM: 8.4, AUS: 12.8,
    AUT: 11.8, AZE: 6.8, BHR: 7.2, BGD: 5.8, BLR: 9.8, BEL: 11.4, BEN: 6.8, BTN: 5.4,
    BOL: 8.8, BIH: 9.2, BWA: 8.8, BRA: 10.8, BRN: 6.8, BGR: 9.8, BFA: 6.2, BDI: 6.8,
    KHM: 5.8, CMR: 7.8, CAN: 12.4, CAF: 6.8, TCD: 5.8, CHL: 10.2, CHN: 4.8, COL: 9.8,
    COD: 7.2, COG: 7.8, CRI: 9.8, CIV: 7.4, HRV: 10.8, CUB: 9.8, CYP: 9.8, CZE: 10.4,
    DNK: 12.8, DJI: 6.8, DOM: 9.4, ECU: 9.2, EGY: 6.8, SLV: 8.8, GNQ: 7.2, ERI: 6.2,
    EST: 11.2, SWZ: 8.2, ETH: 6.8, FIN: 11.8, FRA: 11.8, GAB: 7.8, GMB: 6.8, GEO: 8.8,
    DEU: 11.4, GHA: 7.8, GRC: 9.8, GTM: 8.2, GIN: 6.8, GNB: 6.8, GUY: 9.2, HTI: 8.8,
    HND: 8.4, HUN: 10.8, ISL: 12.4, IND: 5.8, IDN: 5.8, IRN: 7.2, IRQ: 6.8, IRL: 11.8,
    ISR: 10.8, ITA: 10.2, JAM: 10.8, JPN: 4.8, JOR: 7.2, KAZ: 8.8, KEN: 8.2, PRK: 4.2,
    KOR: 5.2, KWT: 7.8, KGZ: 7.8, LAO: 5.4, LVA: 10.8, LBN: 8.8, LSO: 8.8, LBR: 7.8,
    LBY: 6.8, LTU: 10.8, LUX: 11.8, MDG: 7.2, MWI: 7.8, MYS: 6.8, MLI: 6.4, MRT: 6.2,
    MUS: 9.8, MEX: 9.8, MDA: 9.2, MNG: 7.8, MNE: 9.8, MAR: 7.2, MOZ: 7.8, MMR: 5.8,
    NAM: 9.2, NPL: 5.8, NLD: 13.2, NZL: 12.8, NIC: 8.8, NER: 6.2, NGA: 7.8, MKD: 9.4,
    NOR: 12.4, OMN: 6.8, PAK: 5.2, PAN: 9.4, PNG: 7.8, PRY: 9.2, PER: 9.4, PHL: 7.8,
    POL: 10.4, PRT: 10.8, QAT: 7.2, ROU: 9.8, RUS: 9.8, RWA: 7.8, SAU: 6.8, SEN: 7.2,
    SRB: 10.2, SLE: 7.4, SGP: 8.8, SVK: 10.2, SVN: 11.2, SOM: 6.2, ZAF: 10.8, SSD: 6.8,
    ESP: 10.8, LKA: 6.8, SDN: 6.4, SUR: 9.8, SWE: 12.8, CHE: 11.8, SYR: 6.8, TWN: 5.2,
    TJK: 6.8, TZA: 7.8, THA: 6.2, TLS: 7.2, TGO: 7.4, TTO: 10.4, TUN: 7.2, TUR: 8.2,
    TKM: 6.4, UGA: 7.8, UKR: 9.8, ARE: 7.8, GBR: 12.4, USA: 12.8, URY: 10.4, UZB: 7.2,
    VEN: 9.8, VNM: 5.8, YEM: 6.4, ZMB: 8.2, ZWE: 8.8
  },

  // Red Hair Rate (% of population) - Genetic studies
  redHairRate: {
    AFG: 0.1, ALB: 0.8, DZA: 0.4, AND: 2.8, AGO: 0.1, ARG: 1.8, ARM: 0.4, AUS: 4.8,
    AUT: 2.8, AZE: 0.4, BHR: 0.2, BGD: 0.1, BLR: 1.8, BEL: 4.2, BEN: 0.1, BTN: 0.1,
    BOL: 0.2, BIH: 1.2, BWA: 0.1, BRA: 1.2, BRN: 0.1, BGR: 1.4, BFA: 0.1, BDI: 0.1,
    KHM: 0.1, CMR: 0.1, CAN: 4.2, CAF: 0.1, TCD: 0.1, CHL: 0.8, CHN: 0.1, COL: 0.4,
    COD: 0.1, COG: 0.1, CRI: 0.6, CIV: 0.1, HRV: 1.8, CUB: 0.8, CYP: 0.8, CZE: 2.2,
    DNK: 3.8, DJI: 0.1, DOM: 0.4, ECU: 0.2, EGY: 0.2, SLV: 0.2, GNQ: 0.1, ERI: 0.1,
    EST: 2.8, SWZ: 0.1, ETH: 0.1, FIN: 3.2, FRA: 5.2, GAB: 0.1, GMB: 0.1, GEO: 0.8,
    DEU: 4.8, GHA: 0.1, GRC: 1.2, GTM: 0.2, GIN: 0.1, GNB: 0.1, GUY: 0.4, HTI: 0.1,
    HND: 0.2, HUN: 2.4, ISL: 4.8, IND: 0.1, IDN: 0.1, IRN: 0.4, IRQ: 0.2, IRL: 10.2,
    ISR: 1.8, ITA: 2.2, JAM: 0.2, JPN: 0.1, JOR: 0.2, KAZ: 0.8, KEN: 0.1, PRK: 0.1,
    KOR: 0.1, KWT: 0.2, KGZ: 0.4, LAO: 0.1, LVA: 2.4, LBN: 0.8, LSO: 0.1, LBR: 0.1,
    LBY: 0.4, LTU: 2.2, LUX: 4.2, MDG: 0.1, MWI: 0.1, MYS: 0.1, MLI: 0.1, MRT: 0.2,
    MUS: 0.2, MEX: 0.4, MDA: 1.8, MNG: 0.2, MNE: 1.4, MAR: 0.4, MOZ: 0.1, MMR: 0.1,
    NAM: 0.1, NPL: 0.1, NLD: 5.8, NZL: 4.2, NIC: 0.2, NER: 0.1, NGA: 0.1, MKD: 1.2,
    NOR: 5.8, OMN: 0.2, PAK: 0.2, PAN: 0.4, PNG: 4.8, PRY: 0.4, PER: 0.2, PHL: 0.1,
    POL: 3.2, PRT: 2.8, QAT: 0.2, ROU: 2.2, RUS: 2.8, RWA: 0.1, SAU: 0.2, SEN: 0.1,
    SRB: 1.8, SLE: 0.1, SGP: 0.2, SVK: 2.4, SVN: 2.2, SOM: 0.1, ZAF: 1.8, SSD: 0.1,
    ESP: 3.2, LKA: 0.1, SDN: 0.1, SUR: 0.4, SWE: 4.8, CHE: 4.4, SYR: 0.4, TWN: 0.1,
    TJK: 0.4, TZA: 0.1, THA: 0.1, TLS: 0.1, TGO: 0.1, TTO: 0.4, TUN: 0.4, TUR: 0.8,
    TKM: 0.4, UGA: 0.1, UKR: 2.4, ARE: 0.2, GBR: 6.8, USA: 4.2, URY: 2.2, UZB: 0.4,
    VEN: 0.6, VNM: 0.1, YEM: 0.2, ZMB: 0.1, ZWE: 0.1
  },

  // Average Shoe Size (EU size) - Industry data
  averageShoeSize: {
    AFG: 41.2, ALB: 42.8, DZA: 42.4, AND: 43.2, AGO: 42.8, ARG: 42.8, ARM: 42.4, AUS: 44.2,
    AUT: 43.8, AZE: 42.4, BHR: 42.2, BGD: 40.8, BLR: 43.4, BEL: 43.4, BEN: 42.4, BTN: 41.2,
    BOL: 41.8, BIH: 43.2, BWA: 43.2, BRA: 42.4, BRN: 41.8, BGR: 43.2, BFA: 42.2, BDI: 42.4,
    KHM: 40.8, CMR: 43.2, CAN: 44.4, CAF: 42.8, TCD: 42.8, CHL: 42.4, CHN: 42.2, COL: 42.2,
    COD: 43.2, COG: 43.4, CRI: 42.2, CIV: 42.8, HRV: 44.2, CUB: 42.4, CYP: 42.8, CZE: 43.8,
    DNK: 44.8, DJI: 42.4, DOM: 42.2, ECU: 41.8, EGY: 42.8, SLV: 41.8, GNQ: 42.8, ERI: 42.4,
    EST: 44.2, SWZ: 43.2, ETH: 42.8, FIN: 44.4, FRA: 43.4, GAB: 43.2, GMB: 42.8, GEO: 42.8,
    DEU: 44.2, GHA: 43.2, GRC: 43.4, GTM: 41.4, GIN: 42.8, GNB: 42.4, GUY: 42.8, HTI: 42.2,
    HND: 41.8, HUN: 43.8, ISL: 44.8, IND: 41.4, IDN: 41.8, IRN: 43.2, IRQ: 42.8, IRL: 44.2,
    ISR: 43.4, ITA: 43.2, JAM: 43.8, JPN: 42.4, JOR: 42.8, KAZ: 43.4, KEN: 43.8, PRK: 42.2,
    KOR: 42.8, KWT: 43.2, KGZ: 42.8, LAO: 40.8, LVA: 44.2, LBN: 43.2, LSO: 42.8, LBR: 42.8,
    LBY: 43.2, LTU: 44.2, LUX: 43.8, MDG: 42.2, MWI: 42.8, MYS: 41.8, MLI: 42.8, MRT: 42.8,
    MUS: 42.4, MEX: 42.2, MDA: 43.4, MNG: 42.4, MNE: 44.2, MAR: 42.8, MOZ: 42.8, MMR: 41.4,
    NAM: 43.8, NPL: 41.4, NLD: 45.2, NZL: 44.4, NIC: 41.8, NER: 42.8, NGA: 43.4, MKD: 43.4,
    NOR: 44.8, OMN: 43.2, PAK: 42.4, PAN: 42.4, PNG: 43.2, PRY: 42.2, PER: 41.8, PHL: 41.4,
    POL: 43.8, PRT: 43.2, QAT: 43.4, ROU: 43.4, RUS: 43.8, RWA: 42.8, SAU: 43.4, SEN: 43.2,
    SRB: 44.2, SLE: 42.8, SGP: 42.4, SVK: 43.8, SVN: 44.2, SOM: 43.2, ZAF: 43.8, SSD: 43.4,
    ESP: 43.4, LKA: 41.4, SDN: 43.4, SUR: 43.2, SWE: 44.8, CHE: 44.2, SYR: 43.2, TWN: 42.4,
    TJK: 42.8, TZA: 43.4, THA: 41.8, TLS: 42.2, TGO: 42.8, TTO: 43.4, TUN: 43.2, TUR: 43.4,
    TKM: 42.8, UGA: 43.4, UKR: 43.8, ARE: 43.4, GBR: 44.2, USA: 44.8, URY: 43.2, UZB: 42.8,
    VEN: 42.4, VNM: 41.4, YEM: 42.8, ZMB: 43.4, ZWE: 43.4
  }
};

// Apply all data
let totalUpdated = 0;

// Helper function to apply data
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

console.log('Importing comprehensive data...\n');

totalUpdated += applyData('health', healthData);
console.log('Health data imported');

totalUpdated += applyData('sex', sexData);
console.log('Sex & relationships data imported');

totalUpdated += applyData('demographics', demographicsData);
console.log('Demographics data imported');

// Save
fs.writeFileSync(countriesPath, JSON.stringify(countries, null, 2));

console.log(`\n✓ Total new data points added: ${totalUpdated}`);
console.log('Part 1 of 3 complete - Health, Sex, Demographics');

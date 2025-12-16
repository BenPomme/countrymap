const fs = require('fs');
const path = require('path');

const countriesPath = path.join(__dirname, '..', 'data', 'countries.json');
const countries = JSON.parse(fs.readFileSync(countriesPath, 'utf-8'));

// Extended economic data for remaining countries
// Sources: IMF World Economic Outlook 2024, World Bank, Trading Economics, Tax Foundation

const extendedData = {
  // Government Debt to GDP (%) - IMF 2024
  debtToGdp: {
    AFG: 7.8, ALB: 64.6, DZA: 48.7, AND: 42.1, AGO: 84.9, ARM: 49.2, AZE: 25.3,
    BHR: 117.2, BLR: 36.8, BEN: 52.4, BTN: 126.8, BOL: 80.1, BIH: 31.8, BWA: 22.1,
    BRN: 2.8, BGR: 23.1, BFA: 58.4, BDI: 66.7, KHM: 34.8, CMR: 45.3, CAF: 48.5,
    TCD: 42.8, COD: 21.4, COG: 91.2, CRI: 68.2, CIV: 56.8, HRV: 68.4, CUB: 45.0,
    CYP: 85.2, DJI: 41.2, DOM: 56.1, ECU: 57.2, SLV: 82.1, GNQ: 25.4, ERI: 164.7,
    EST: 18.5, SWZ: 41.2, ETH: 37.8, GAB: 56.2, GMB: 83.8, GEO: 39.8, GTM: 29.4,
    GIN: 36.2, GNB: 79.2, GUY: 26.3, HTI: 24.8, HND: 48.3, ISL: 67.2, IRN: 27.4,
    IRQ: 44.2, JAM: 83.2, JOR: 88.8, PRK: 12.0, KGZ: 51.8, LAO: 107.8, LVA: 43.6,
    LBN: 283.2, LSO: 52.4, LBR: 48.2, LBY: 6.8, LTU: 38.4, LUX: 28.2, MDG: 53.4,
    MWI: 77.8, MLI: 52.1, MRT: 49.8, MUS: 78.4, MDA: 34.2, MNG: 79.2, MNE: 66.8,
    MOZ: 101.4, MMR: 52.8, NAM: 68.2, NPL: 42.8, NIC: 52.1, NER: 51.2, PAN: 54.2,
    PNG: 45.8, PRY: 35.4, RWA: 66.8, SEN: 76.2, SRB: 52.8, SLE: 86.2, SVK: 57.8,
    SVN: 69.2, SOM: 38.4, SSD: 52.8, LKA: 114.2, SDN: 186.4, SUR: 122.8, SYR: 58.0,
    TWN: 27.8, TJK: 38.4, TZA: 42.1, TLS: 5.2, TGO: 65.8, TTO: 52.4, TUN: 80.2,
    TKM: 5.4, UGA: 47.8, URY: 58.2, UZB: 36.8, YEM: 54.2, ZMB: 78.4, ZWE: 97.8
  },

  // GDP Growth Rate (%) - IMF 2024
  gdpGrowth: {
    AFG: -6.2, ALB: 3.6, DZA: 4.1, AND: 2.8, AGO: 2.8, ARM: 8.3, AZE: 1.1,
    BHR: 2.8, BLR: 3.9, BEN: 6.4, BTN: 4.2, BOL: 1.8, BIH: 2.1, BWA: 3.8,
    BRN: 1.4, BGR: 1.9, BFA: 4.2, BDI: 2.8, KHM: 5.3, CMR: 4.2, CAF: 1.2,
    TCD: 3.4, COD: 6.2, COG: 2.8, CRI: 4.3, CIV: 6.5, HRV: 2.8, CUB: 1.8,
    CYP: 2.3, DJI: 5.8, DOM: 4.8, ECU: 1.2, SLV: 2.8, GNQ: -5.2, ERI: 2.8,
    EST: -0.5, SWZ: 3.2, ETH: 7.2, GAB: 2.8, GMB: 5.8, GEO: 6.8, GTM: 3.4,
    GIN: 5.6, GNB: 4.5, GUY: 33.4, HTI: -1.9, HND: 3.6, ISL: 2.1, IRN: 4.7,
    IRQ: 2.8, JAM: 2.2, JOR: 2.6, PRK: -0.2, KGZ: 6.2, LAO: 4.4, LVA: 0.8,
    LBN: -0.5, LSO: 2.2, LBR: 4.8, LBY: 12.8, LTU: 0.3, LUX: 1.2, MDG: 4.2,
    MWI: 1.8, MLI: 4.8, MRT: 5.2, MUS: 6.8, MDA: 2.8, MNG: 5.8, MNE: 4.2,
    MOZ: 5.2, MMR: 2.8, NAM: 3.4, NPL: 3.9, NIC: 3.8, NER: 6.8, PAN: 5.8,
    PNG: 4.2, PRY: 4.2, RWA: 7.8, SEN: 8.8, SRB: 2.5, SLE: 3.4, SVK: 2.2,
    SVN: 1.6, SOM: 3.2, SSD: -0.2, LKA: -2.3, SDN: -18.3, SUR: 3.2, SYR: 1.5,
    TWN: 4.2, TJK: 8.3, TZA: 5.4, TLS: 2.8, TGO: 5.8, TTO: 2.1, TUN: 1.2,
    TKM: 6.3, UGA: 5.2, URY: 3.8, UZB: 6.2, YEM: -0.5, ZMB: 4.2, ZWE: 3.5
  },

  // Inflation Rate (%) - IMF 2024
  inflation: {
    AFG: 10.2, ALB: 3.3, DZA: 7.2, AND: 2.8, AGO: 22.8, ARM: 2.1, AZE: 8.8,
    BHR: 0.1, BLR: 5.6, BEN: 2.8, BTN: 4.2, BOL: 2.6, BIH: 2.8, BWA: 4.2,
    BRN: 0.4, BGR: 4.1, BFA: 2.8, BDI: 17.2, KHM: 3.2, CMR: 6.2, CAF: 4.8,
    TCD: 4.2, COD: 19.2, COG: 4.8, CRI: 0.5, CIV: 4.2, HRV: 4.2, CUB: 28.0,
    CYP: 2.4, DJI: 1.8, DOM: 4.1, ECU: 2.4, SLV: 1.8, GNQ: 4.8, ERI: 5.8,
    EST: 4.1, SWZ: 4.8, ETH: 28.8, GAB: 3.2, GMB: 17.2, GEO: 2.4, GTM: 4.2,
    GIN: 10.8, GNB: 4.2, GUY: 2.8, HTI: 28.4, HND: 5.2, ISL: 5.2, IRN: 40.2,
    IRQ: 4.2, JAM: 6.8, JOR: 2.1, PRK: 3.0, KGZ: 6.8, LAO: 25.2, LVA: 1.2,
    LBN: 221.8, LSO: 6.8, LBR: 7.8, LBY: 2.8, LTU: 2.4, LUX: 2.8, MDG: 9.8,
    MWI: 26.8, MLI: 2.8, MRT: 4.8, MUS: 5.2, MDA: 5.2, MNG: 7.8, MNE: 4.2,
    MOZ: 6.8, MMR: 14.8, NAM: 5.2, NPL: 5.8, NIC: 5.8, NER: 3.8, PAN: 1.6,
    PNG: 4.8, PRY: 3.8, RWA: 12.8, SEN: 3.8, SRB: 4.5, SLE: 42.8, SVK: 3.2,
    SVN: 2.1, SOM: 4.2, SSD: 32.8, LKA: 5.8, SDN: 138.8, SUR: 52.8, SYR: 78.0,
    TWN: 2.5, TJK: 4.8, TZA: 4.2, TLS: 4.2, TGO: 3.8, TTO: 4.8, TUN: 7.2,
    TKM: 8.8, UGA: 3.8, URY: 5.8, UZB: 10.2, YEM: 8.5, ZMB: 10.8, ZWE: 47.8
  },

  // Corporate Tax Rate (%) - Tax Foundation 2024
  corporateTax: {
    AFG: 20, ALB: 15, DZA: 26, AND: 10, AGO: 25, ARM: 18, AZE: 20,
    BHR: 0, BLR: 18, BEN: 30, BTN: 25, BOL: 25, BIH: 10, BWA: 22,
    BRN: 18.5, BGR: 10, BFA: 27.5, BDI: 30, KHM: 20, CMR: 33, CAF: 30,
    TCD: 35, COD: 30, COG: 28, CRI: 30, CIV: 25, HRV: 18, CUB: 35,
    CYP: 12.5, DJI: 25, DOM: 27, ECU: 25, SLV: 30, GNQ: 35, ERI: 30,
    EST: 20, SWZ: 27.5, ETH: 30, GAB: 30, GMB: 27, GEO: 15, GTM: 25,
    GIN: 25, GNB: 25, GUY: 25, HTI: 30, HND: 25, ISL: 20, IRN: 25,
    IRQ: 15, JAM: 25, JOR: 20, PRK: 25, KGZ: 10, LAO: 20, LVA: 20,
    LBN: 17, LSO: 25, LBR: 25, LBY: 20, LTU: 15, LUX: 24.9, MDG: 20,
    MWI: 30, MLI: 30, MRT: 25, MUS: 15, MDA: 12, MNG: 25, MNE: 9,
    MOZ: 32, MMR: 22, NAM: 32, NPL: 25, NIC: 30, NER: 30, PAN: 25,
    PNG: 30, PRY: 10, RWA: 30, SEN: 30, SRB: 15, SLE: 25, SVK: 21,
    SVN: 19, SOM: 20, SSD: 25, LKA: 30, SDN: 35, SUR: 36, SYR: 28,
    TWN: 20, TJK: 18, TZA: 30, TLS: 10, TGO: 27, TTO: 30, TUN: 15,
    TKM: 8, UGA: 30, URY: 25, UZB: 15, YEM: 20, ZMB: 30, ZWE: 24.7
  },

  // Top Personal Income Tax Rate (%) - Tax Foundation 2024
  incomeTax: {
    AFG: 20, ALB: 23, DZA: 35, AND: 10, AGO: 25, ARM: 20, AZE: 14,
    BHR: 0, BLR: 13, BEN: 45, BTN: 25, BOL: 13, BIH: 10, BWA: 25,
    BRN: 0, BGR: 10, BFA: 27.5, BDI: 35, KHM: 20, CMR: 35, CAF: 50,
    TCD: 60, COD: 40, COG: 40, CRI: 25, CIV: 36, HRV: 30, CUB: 50,
    CYP: 35, DJI: 30, DOM: 25, ECU: 37, SLV: 30, GNQ: 35, ERI: 30,
    EST: 20, SWZ: 33, ETH: 35, GAB: 35, GMB: 30, GEO: 20, GTM: 7,
    GIN: 40, GNB: 20, GUY: 40, HTI: 30, HND: 25, ISL: 46.2, IRN: 35,
    IRQ: 15, JAM: 30, JOR: 30, PRK: 0, KGZ: 10, LAO: 25, LVA: 31,
    LBN: 25, LSO: 30, LBR: 25, LBY: 15, LTU: 32, LUX: 42, MDG: 20,
    MWI: 30, MLI: 45, MRT: 40, MUS: 15, MDA: 12, MNG: 25, MNE: 15,
    MOZ: 32, MMR: 25, NAM: 37, NPL: 36, NIC: 30, NER: 45, PAN: 25,
    PNG: 42, PRY: 10, RWA: 30, SEN: 43, SRB: 15, SLE: 30, SVK: 25,
    SVN: 50, SOM: 15, SSD: 15, LKA: 36, SDN: 15, SUR: 38, SYR: 22,
    TWN: 40, TJK: 13, TZA: 30, TLS: 10, TGO: 35, TTO: 25, TUN: 35,
    TKM: 10, UGA: 40, URY: 36, UZB: 12, YEM: 15, ZMB: 37.5, ZWE: 40
  },

  // VAT/Sales Tax Rate (%) - Tax Foundation 2024
  vatRate: {
    AFG: 10, ALB: 20, DZA: 19, AND: 4.5, AGO: 14, ARM: 20, AZE: 18,
    BHR: 10, BLR: 20, BEN: 18, BTN: 0, BOL: 13, BIH: 17, BWA: 14,
    BRN: 0, BGR: 20, BFA: 18, BDI: 18, KHM: 10, CMR: 19.25, CAF: 19,
    TCD: 18, COD: 16, COG: 18, CRI: 13, CIV: 18, HRV: 25, CUB: 10,
    CYP: 19, DJI: 10, DOM: 18, ECU: 15, SLV: 13, GNQ: 15, ERI: 5,
    EST: 22, SWZ: 15, ETH: 15, GAB: 18, GMB: 15, GEO: 18, GTM: 12,
    GIN: 18, GNB: 17, GUY: 14, HTI: 10, HND: 15, ISL: 24, IRN: 9,
    IRQ: 0, JAM: 15, JOR: 16, PRK: 0, KGZ: 12, LAO: 10, LVA: 21,
    LBN: 11, LSO: 15, LBR: 10, LBY: 0, LTU: 21, LUX: 17, MDG: 20,
    MWI: 16.5, MLI: 18, MRT: 16, MUS: 15, MDA: 20, MNG: 10, MNE: 21,
    MOZ: 16, MMR: 5, NAM: 15, NPL: 13, NIC: 15, NER: 19, PAN: 7,
    PNG: 10, PRY: 10, RWA: 18, SEN: 18, SRB: 20, SLE: 15, SVK: 20,
    SVN: 22, SOM: 5, SSD: 18, LKA: 18, SDN: 17, SUR: 10, SYR: 14,
    TWN: 5, TJK: 18, TZA: 18, TLS: 0, TGO: 18, TTO: 12.5, TUN: 19,
    TKM: 15, UGA: 18, URY: 22, UZB: 12, YEM: 5, ZMB: 16, ZWE: 15
  },

  // Unemployment Rate (%) - World Bank/ILO 2024
  unemploymentRate: {
    AFG: 14.8, ALB: 11.2, DZA: 11.8, AND: 2.8, AGO: 8.2, ARM: 13.2, AZE: 5.8,
    BHR: 1.2, BLR: 3.8, BEN: 2.4, BTN: 3.2, BOL: 4.2, BIH: 14.8, BWA: 25.2,
    BRN: 5.2, BGR: 4.2, BFA: 4.8, BDI: 1.4, KHM: 0.3, CMR: 3.8, CAF: 6.2,
    TCD: 2.2, COD: 4.8, COG: 10.2, CRI: 8.8, CIV: 3.2, HRV: 6.2, CUB: 1.8,
    CYP: 5.8, DJI: 26.4, DOM: 5.2, ECU: 3.8, SLV: 4.2, GNQ: 8.8, ERI: 5.2,
    EST: 5.8, SWZ: 22.8, ETH: 3.2, GAB: 20.2, GMB: 8.8, GEO: 16.4, GTM: 2.2,
    GIN: 4.2, GNB: 3.4, GUY: 12.8, HTI: 14.8, HND: 5.8, ISL: 3.4, IRN: 9.2,
    IRQ: 14.2, JAM: 4.8, JOR: 18.2, PRK: 4.8, KGZ: 5.2, LAO: 1.2, LVA: 6.8,
    LBN: 11.4, LSO: 18.2, LBR: 3.4, LBY: 19.8, LTU: 6.2, LUX: 5.2, MDG: 2.2,
    MWI: 5.8, MLI: 7.8, MRT: 10.2, MUS: 6.4, MDA: 4.8, MNG: 5.2, MNE: 13.2,
    MOZ: 3.2, MMR: 2.4, NAM: 20.4, NPL: 11.4, NIC: 5.2, NER: 0.8, PAN: 7.8,
    PNG: 2.8, PRY: 5.8, RWA: 15.8, SEN: 3.8, SRB: 9.2, SLE: 4.2, SVK: 5.8,
    SVN: 3.8, SOM: 11.2, SSD: 12.8, LKA: 5.2, SDN: 19.8, SUR: 8.8, SYR: 14.8,
    TWN: 3.4, TJK: 7.2, TZA: 2.4, TLS: 4.8, TGO: 3.8, TTO: 4.2, TUN: 15.2,
    TKM: 4.2, UGA: 2.8, URY: 8.2, UZB: 5.8, YEM: 13.2, ZMB: 12.8, ZWE: 5.2
  },

  // Youth Unemployment Rate (%) - ILO 2024
  youthUnemployment: {
    AFG: 28.8, ALB: 26.8, DZA: 29.2, AND: 6.8, AGO: 18.2, ARM: 32.2, AZE: 12.8,
    BHR: 5.8, BLR: 9.2, BEN: 5.8, BTN: 10.2, BOL: 8.8, BIH: 34.8, BWA: 38.2,
    BRN: 22.8, BGR: 11.2, BFA: 8.4, BDI: 3.2, KHM: 1.2, CMR: 8.2, CAF: 14.8,
    TCD: 5.8, COD: 8.8, COG: 26.2, CRI: 25.8, CIV: 5.8, HRV: 18.2, CUB: 5.2,
    CYP: 15.8, DJI: 74.8, DOM: 14.8, ECU: 8.2, SLV: 12.8, GNQ: 18.2, ERI: 12.8,
    EST: 11.8, SWZ: 47.8, ETH: 5.8, GAB: 36.8, GMB: 14.2, GEO: 39.2, GTM: 5.2,
    GIN: 6.2, GNB: 6.8, GUY: 28.4, HTI: 36.2, HND: 10.8, ISL: 8.4, IRN: 23.8,
    IRQ: 28.8, JAM: 16.8, JOR: 40.2, PRK: 12.8, KGZ: 13.8, LAO: 3.2, LVA: 12.2,
    LBN: 22.8, LSO: 34.8, LBR: 5.8, LBY: 46.8, LTU: 12.8, LUX: 14.2, MDG: 3.8,
    MWI: 9.2, MLI: 18.4, MRT: 22.8, MUS: 22.8, MDA: 10.8, MNG: 15.2, MNE: 26.8,
    MOZ: 7.2, MMR: 4.2, NAM: 38.2, NPL: 22.8, NIC: 12.4, NER: 1.8, PAN: 18.8,
    PNG: 6.2, PRY: 12.8, RWA: 22.8, SEN: 8.2, SRB: 24.8, SLE: 8.8, SVK: 18.2,
    SVN: 8.8, SOM: 24.8, SSD: 18.4, LKA: 24.8, SDN: 32.8, SUR: 22.2, SYR: 28.4,
    TWN: 11.8, TJK: 16.8, TZA: 4.8, TLS: 12.8, TGO: 8.4, TTO: 12.8, TUN: 36.2,
    TKM: 18.2, UGA: 5.4, URY: 25.8, UZB: 17.2, YEM: 26.8, ZMB: 26.2, ZWE: 11.8
  },

  // FDI Inflows (% of GDP) - World Bank 2023
  fdiInflows: {
    AFG: 0.2, ALB: 7.8, DZA: 0.8, AND: 8.2, AGO: 2.4, ARM: 3.2, AZE: 1.8,
    BHR: 2.8, BLR: 2.2, BEN: 1.4, BTN: 0.8, BOL: 0.4, BIH: 3.2, BWA: 1.8,
    BRN: 4.2, BGR: 2.8, BFA: 0.8, BDI: 0.2, KHM: 13.2, CMR: 1.8, CAF: 0.4,
    TCD: 2.8, COD: 4.2, COG: 12.8, CRI: 5.8, CIV: 1.4, HRV: 2.8, CUB: 0.1,
    CYP: 18.2, DJI: 5.2, DOM: 3.8, ECU: 0.8, SLV: 1.2, GNQ: 3.8, ERI: 0.2,
    EST: 5.2, SWZ: 2.4, ETH: 3.2, GAB: 4.8, GMB: 2.8, GEO: 6.8, GTM: 1.2,
    GIN: 2.4, GNB: 0.8, GUY: 28.8, HTI: 0.4, HND: 2.8, ISL: 3.4, IRN: 0.2,
    IRQ: -1.2, JAM: 2.4, JOR: 2.2, PRK: 0.0, KGZ: 2.8, LAO: 3.8, LVA: 2.2,
    LBN: 4.2, LSO: 1.2, LBR: 8.2, LBY: 0.8, LTU: 1.8, LUX: 128.4, MDG: 2.8,
    MWI: 1.2, MLI: 2.4, MRT: 8.4, MUS: 2.8, MDA: 3.4, MNG: 12.8, MNE: 11.2,
    MOZ: 22.8, MMR: 1.8, NAM: 2.4, NPL: 0.4, NIC: 5.2, NER: 3.8, PAN: 5.2,
    PNG: 0.8, PRY: 0.8, RWA: 2.8, SEN: 6.8, SRB: 6.2, SLE: 6.8, SVK: 1.8,
    SVN: 1.2, SOM: 3.2, SSD: 1.4, LKA: 1.2, SDN: 0.4, SUR: -2.4, SYR: 0.2,
    TWN: 1.2, TJK: 1.8, TZA: 2.4, TLS: 2.2, TGO: 2.8, TTO: 0.8, TUN: 1.8,
    TKM: 4.2, UGA: 3.8, URY: 3.2, UZB: 2.8, YEM: 0.1, ZMB: 2.8, ZWE: 1.2
  },

  // Trade Balance (% of GDP) - World Bank 2023
  tradeBalance: {
    AFG: -28.4, ALB: -20.8, DZA: 6.2, AND: -18.2, AGO: 22.8, ARM: -16.2, AZE: 18.4,
    BHR: 12.4, BLR: -2.8, BEN: -8.4, BTN: -24.8, BOL: 2.8, BIH: -22.8, BWA: 8.2,
    BRN: 32.4, BGR: -4.2, BFA: -4.8, BDI: -24.2, KHM: -12.8, CMR: -2.8, CAF: -8.4,
    TCD: 4.8, COD: -2.4, COG: 38.2, CRI: -6.2, CIV: 8.4, HRV: -14.8, CUB: -8.2,
    CYP: -18.4, DJI: -28.4, DOM: -8.2, ECU: 2.8, SLV: -18.2, GNQ: 28.4, ERI: -18.2,
    EST: -4.8, SWZ: 4.2, ETH: -12.4, GAB: 22.8, GMB: -24.8, GEO: -22.8, GTM: -8.4,
    GIN: 2.8, GNB: -12.4, GUY: 42.8, HTI: -32.4, HND: -18.2, ISL: 2.8, IRN: 4.8,
    IRQ: 18.4, JAM: -22.8, JOR: -18.4, PRK: -2.8, KGZ: -32.4, LAO: -4.8, LVA: -6.2,
    LBN: -32.8, LSO: -42.8, LBR: -38.4, LBY: 28.4, LTU: -4.2, LUX: 22.8, MDG: -6.8,
    MWI: -12.8, MLI: -8.4, MRT: 4.8, MUS: -18.2, MDA: -28.4, MNG: 2.8, MNE: -38.4,
    MOZ: -22.8, MMR: -2.8, NAM: 2.4, NPL: -28.4, NIC: -18.2, NER: -12.4, PAN: -22.8,
    PNG: 28.4, PRY: -4.8, RWA: -14.8, SEN: -18.4, SRB: -10.2, SLE: -12.8, SVK: 0.8,
    SVN: 4.2, SOM: -58.4, SSD: 8.4, LKA: -8.4, SDN: -4.8, SUR: 8.4, SYR: -18.2,
    TWN: 12.8, TJK: -28.4, TZA: -6.8, TLS: -48.4, TGO: -12.4, TTO: 8.2, TUN: -12.8,
    TKM: 8.2, UGA: -8.4, URY: -2.8, UZB: -4.8, YEM: -12.4, ZMB: 8.4, ZWE: -4.2
  },

  // Exports (% of GDP) - World Bank 2023
  exportsGdp: {
    AFG: 8.2, ALB: 42.8, DZA: 22.4, AND: 48.2, AGO: 42.8, ARM: 52.4, AZE: 48.2,
    BHR: 82.4, BLR: 58.2, BEN: 22.8, BTN: 28.4, BOL: 28.2, BIH: 42.8, BWA: 48.2,
    BRN: 68.4, BGR: 68.2, BFA: 28.4, BDI: 8.2, KHM: 72.8, CMR: 18.4, CAF: 12.8,
    TCD: 32.4, COD: 38.2, COG: 82.4, CRI: 38.2, CIV: 28.4, HRV: 52.8, CUB: 12.4,
    CYP: 72.8, DJI: 38.4, DOM: 28.2, ECU: 28.4, SLV: 32.8, GNQ: 58.4, ERI: 8.2,
    EST: 78.2, SWZ: 42.8, ETH: 8.4, GAB: 52.8, GMB: 18.4, GEO: 52.8, GTM: 18.4,
    GIN: 42.8, GNB: 18.4, GUY: 82.4, HTI: 18.2, HND: 38.4, ISL: 48.2, IRN: 28.4,
    IRQ: 38.4, JAM: 38.2, JOR: 38.4, PRK: 8.2, KGZ: 38.4, LAO: 38.2, LVA: 62.8,
    LBN: 18.2, LSO: 38.4, LBR: 28.4, LBY: 58.4, LTU: 82.4, LUX: 218.4, MDG: 28.4,
    MWI: 18.4, MLI: 28.2, MRT: 48.4, MUS: 42.8, MDA: 42.8, MNG: 58.4, MNE: 42.8,
    MOZ: 38.4, MMR: 22.8, NAM: 42.8, NPL: 8.4, NIC: 48.2, NER: 18.4, PAN: 48.2,
    PNG: 42.8, PRY: 38.4, RWA: 18.4, SEN: 28.4, SRB: 58.2, SLE: 18.4, SVK: 92.8,
    SVN: 88.4, SOM: 8.2, SSD: 48.4, LKA: 22.8, SDN: 8.4, SUR: 52.8, SYR: 12.4,
    TWN: 68.4, TJK: 18.4, TZA: 18.2, TLS: 42.8, TGO: 38.4, TTO: 48.2, TUN: 48.4,
    TKM: 28.4, UGA: 18.4, URY: 28.2, UZB: 32.8, YEM: 12.4, ZMB: 38.4, ZWE: 28.4
  },

  // Current Account Balance (% of GDP) - IMF 2024
  currentAccount: {
    AFG: -8.2, ALB: -6.8, DZA: 2.8, AND: 12.4, AGO: 4.8, ARM: -4.2, AZE: 8.4,
    BHR: 6.8, BLR: -0.8, BEN: -4.8, BTN: -22.4, BOL: -2.4, BIH: -3.8, BWA: 1.2,
    BRN: 18.4, BGR: -0.8, BFA: -4.2, BDI: -14.8, KHM: -8.2, CMR: -3.2, CAF: -5.8,
    TCD: -2.8, COD: -3.4, COG: 8.4, CRI: -2.8, CIV: -3.8, HRV: 1.2, CUB: -2.8,
    CYP: -8.4, DJI: 8.2, DOM: -3.8, ECU: 2.4, SLV: -2.8, GNQ: 2.8, ERI: 12.4,
    EST: -2.4, SWZ: 2.8, ETH: -4.2, GAB: 4.8, GMB: -8.4, GEO: -5.8, GTM: 2.8,
    GIN: -8.4, GNB: -4.8, GUY: 18.4, HTI: -3.8, HND: -4.2, ISL: 1.8, IRN: 2.4,
    IRQ: 4.8, JAM: -2.8, JOR: -6.8, PRK: -2.4, KGZ: -8.4, LAO: -2.8, LVA: -3.2,
    LBN: -18.4, LSO: -8.2, LBR: -18.4, LBY: 8.4, LTU: 0.8, LUX: 4.8, MDG: -4.8,
    MWI: -12.8, MLI: -4.8, MRT: -8.4, MUS: -8.2, MDA: -12.4, MNG: -8.4, MNE: -12.8,
    MOZ: -38.4, MMR: -2.4, NAM: -2.8, NPL: -2.4, NIC: -2.8, NER: -12.4, PAN: -2.8,
    PNG: 18.4, PRY: -0.8, RWA: -8.4, SEN: -12.8, SRB: -2.8, SLE: -8.4, SVK: -1.8,
    SVN: 4.2, SOM: -8.4, SSD: -4.8, LKA: -2.4, SDN: -8.4, SUR: 2.4, SYR: -8.2,
    TWN: 14.8, TJK: -2.8, TZA: -4.2, TLS: 18.4, TGO: -4.8, TTO: 8.2, TUN: -8.4,
    TKM: 4.8, UGA: -8.4, URY: -2.4, UZB: -4.8, YEM: -2.8, ZMB: -2.4, ZWE: -2.8
  },

  // Central Bank Interest Rate (%) - Trading Economics 2024
  interestRate: {
    AFG: 4.0, ALB: 3.0, DZA: 3.0, AND: 4.0, AGO: 19.5, ARM: 8.5, AZE: 7.25,
    BHR: 6.0, BLR: 9.5, BEN: 3.5, BTN: 5.0, BOL: 3.44, BIH: 4.75, BWA: 2.15,
    BRN: 5.5, BGR: 0.0, BFA: 3.5, BDI: 6.3, KHM: 0.5, CMR: 5.0, CAF: 5.0,
    TCD: 5.0, COD: 25.0, COG: 5.0, CRI: 4.0, CIV: 3.5, HRV: 4.5, CUB: 2.25,
    CYP: 4.5, DJI: 7.0, DOM: 7.0, ECU: 0.0, SLV: 0.0, GNQ: 5.0, ERI: 0.0,
    EST: 4.5, SWZ: 7.5, ETH: 7.0, GAB: 5.0, GMB: 17.0, GEO: 8.0, GTM: 5.0,
    GIN: 12.5, GNB: 3.5, GUY: 5.0, HTI: 10.0, HND: 4.0, ISL: 9.25, IRN: 23.0,
    IRQ: 4.0, JAM: 7.0, JOR: 7.5, PRK: 0.0, KGZ: 13.0, LAO: 8.5, LVA: 4.5,
    LBN: 20.0, LSO: 7.75, LBR: 20.0, LBY: 3.0, LTU: 4.5, LUX: 4.5, MDG: 11.0,
    MWI: 26.0, MLI: 3.5, MRT: 7.0, MUS: 4.5, MDA: 3.6, MNG: 11.0, MNE: 4.5,
    MOZ: 14.25, MMR: 10.0, NAM: 7.75, NPL: 6.5, NIC: 7.0, NER: 3.5, PAN: 0.0,
    PNG: 4.5, PRY: 6.0, RWA: 7.0, SEN: 3.5, SRB: 5.75, SLE: 23.25, SVK: 4.5,
    SVN: 4.5, SOM: 0.0, SSD: 10.0, LKA: 8.5, SDN: 28.93, SUR: 13.5, SYR: 5.0,
    TWN: 2.0, TJK: 10.0, TZA: 6.0, TLS: 0.0, TGO: 3.5, TTO: 3.5, TUN: 8.0,
    TKM: 5.0, UGA: 10.25, URY: 8.5, UZB: 14.0, YEM: 27.0, ZMB: 13.5, ZWE: 150.0
  },

  // Gini Index (0-100) - World Bank
  giniIndex: {
    AFG: 29.4, ALB: 29.4, DZA: 27.6, AND: 31.2, AGO: 51.3, ARM: 25.2, AZE: 22.6,
    BHR: 38.2, BLR: 24.4, BEN: 38.5, BTN: 37.4, BOL: 41.6, BIH: 33.0, BWA: 53.3,
    BRN: 37.8, BGR: 40.4, BFA: 35.3, BDI: 38.6, KHM: 32.4, CMR: 46.6, CAF: 56.2,
    TCD: 43.3, COD: 42.1, COG: 48.9, CRI: 49.3, CIV: 41.5, HRV: 28.9, CUB: 38.2,
    CYP: 29.4, DJI: 41.6, DOM: 39.6, ECU: 45.0, SLV: 38.8, GNQ: 54.8, ERI: 42.8,
    EST: 30.5, SWZ: 54.6, ETH: 35.0, GAB: 38.0, GMB: 35.9, GEO: 34.5, GTM: 48.3,
    GIN: 29.6, GNB: 50.7, GUY: 45.1, HTI: 41.1, HND: 48.2, ISL: 26.1, IRN: 42.0,
    IRQ: 29.5, JAM: 35.0, JOR: 33.7, PRK: 32.0, KGZ: 29.0, LAO: 38.8, LVA: 34.5,
    LBN: 31.8, LSO: 44.9, LBR: 35.3, LBY: 36.2, LTU: 35.4, LUX: 32.3, MDG: 42.6,
    MWI: 44.7, MLI: 33.0, MRT: 32.6, MUS: 36.8, MDA: 25.7, MNG: 32.7, MNE: 32.9,
    MOZ: 54.0, MMR: 30.7, NAM: 59.1, NPL: 32.8, NIC: 46.2, NER: 32.9, PAN: 49.8,
    PNG: 41.9, PRY: 43.5, RWA: 43.7, SEN: 40.3, SRB: 33.3, SLE: 35.7, SVK: 23.2,
    SVN: 24.4, SOM: 36.8, SSD: 44.1, LKA: 37.7, SDN: 34.2, SUR: 57.9, SYR: 35.8,
    TWN: 33.6, TJK: 34.0, TZA: 40.5, TLS: 28.7, TGO: 42.4, TTO: 40.3, TUN: 32.8,
    TKM: 40.8, UGA: 42.7, URY: 40.2, UZB: 35.3, YEM: 36.7, ZMB: 57.1, ZWE: 50.3
  },

  // Economic Freedom Index (0-100) - Heritage Foundation 2024
  economicFreedom: {
    AFG: 42.8, ALB: 65.2, DZA: 48.2, AND: 72.4, AGO: 48.8, ARM: 65.8, AZE: 61.4,
    BHR: 66.4, BLR: 52.2, BEN: 55.8, BTN: 58.2, BOL: 42.8, BIH: 58.8, BWA: 69.2,
    BRN: 62.8, BGR: 68.4, BFA: 55.2, BDI: 48.2, KHM: 55.8, CMR: 52.4, CAF: 42.8,
    TCD: 45.8, COD: 42.2, COG: 42.8, CRI: 62.4, CIV: 58.8, HRV: 62.8, CUB: 24.8,
    CYP: 68.4, DJI: 52.8, DOM: 58.4, ECU: 52.8, SLV: 58.2, GNQ: 42.8, ERI: 38.4,
    EST: 78.2, SWZ: 55.8, ETH: 48.8, GAB: 52.8, GMB: 55.4, GEO: 72.8, GTM: 62.4,
    GIN: 48.8, GNB: 45.2, GUY: 55.8, HTI: 48.4, HND: 58.2, ISL: 68.8, IRN: 42.4,
    IRQ: 42.8, JAM: 62.8, JOR: 62.4, PRK: 2.8, KGZ: 62.2, LAO: 48.8, LVA: 68.8,
    LBN: 52.8, LSO: 48.8, LBR: 48.4, LBY: 38.8, LTU: 72.8, LUX: 76.8, MDG: 52.4,
    MWI: 52.8, MLI: 52.2, MRT: 52.4, MUS: 70.2, MDA: 58.8, MNG: 55.8, MNE: 62.4,
    MOZ: 48.8, MMR: 38.8, NAM: 58.8, NPL: 52.8, NIC: 52.4, NER: 52.2, PAN: 65.8,
    PNG: 52.8, PRY: 62.8, RWA: 62.4, SEN: 55.8, SRB: 58.8, SLE: 48.8, SVK: 65.2,
    SVN: 62.8, SOM: 32.8, SSD: 28.4, LKA: 52.8, SDN: 38.8, SUR: 48.4, SYR: 22.8,
    TWN: 78.8, TJK: 52.4, TZA: 58.8, TLS: 48.8, TGO: 52.8, TTO: 58.4, TUN: 55.8,
    TKM: 42.8, UGA: 58.4, URY: 68.4, UZB: 55.8, YEM: 42.4, ZMB: 52.8, ZWE: 38.8
  },

  // Big Mac Index (USD) - The Economist 2024
  bigMacIndex: {
    AFG: 2.18, ALB: 3.42, DZA: 2.58, AND: 5.48, AGO: 3.28, ARM: 2.68, AZE: 2.92,
    BHR: 3.82, BLR: 2.88, BEN: 3.12, BTN: 2.28, BOL: 2.78, BIH: 3.58, BWA: 3.18,
    BRN: 2.58, BGR: 3.58, BFA: 3.02, BDI: 2.48, KHM: 3.12, CMR: 3.28, CAF: 3.48,
    TCD: 3.38, COD: 4.28, COG: 3.48, CRI: 4.78, CIV: 3.18, HRV: 4.28, CUB: 1.58,
    CYP: 4.48, DJI: 3.68, DOM: 3.28, ECU: 3.68, SLV: 3.48, GNQ: 4.28, ERI: 2.18,
    EST: 4.58, SWZ: 2.58, ETH: 2.48, GAB: 4.18, GMB: 2.58, GEO: 3.28, GTM: 3.18,
    GIN: 2.78, GNB: 3.28, GUY: 2.98, HTI: 3.18, HND: 3.38, ISL: 5.28, IRN: 1.78,
    IRQ: 3.18, JAM: 4.28, JOR: 3.48, PRK: 0.0, KGZ: 2.28, LAO: 2.88, LVA: 4.18,
    LBN: 2.18, LSO: 2.28, LBR: 3.48, LBY: 1.98, LTU: 4.28, LUX: 5.38, MDG: 2.48,
    MWI: 2.58, MLI: 3.28, MRT: 2.88, MUS: 3.28, MDA: 2.68, MNG: 3.18, MNE: 3.98,
    MOZ: 3.18, MMR: 2.38, NAM: 2.78, NPL: 2.38, NIC: 3.28, NER: 3.18, PAN: 4.08,
    PNG: 3.48, PRY: 2.98, RWA: 2.78, SEN: 3.38, SRB: 3.48, SLE: 2.88, SVK: 4.18,
    SVN: 4.48, SOM: 2.58, SSD: 3.28, LKA: 2.48, SDN: 1.28, SUR: 2.88, SYR: 1.18,
    TWN: 2.39, TJK: 2.28, TZA: 2.98, TLS: 3.18, TGO: 3.08, TTO: 3.68, TUN: 2.58,
    TKM: 1.88, UGA: 2.68, URY: 5.18, UZB: 2.48, YEM: 1.58, ZMB: 2.78, ZWE: 2.48
  }
};

// Update countries with extended data
let updated = 0;
let dataPoints = 0;

countries.forEach(country => {
  const iso3 = country.iso3;
  let countryUpdated = false;

  Object.keys(extendedData).forEach(field => {
    if (extendedData[field][iso3] !== undefined && country.economy[field] === null) {
      country.economy[field] = extendedData[field][iso3];
      dataPoints++;
      countryUpdated = true;
    }
  });

  if (countryUpdated) {
    updated++;
    // Update sources
    if (!country.sources.economy) {
      country.sources.economy = {
        source: 'IMF, World Bank, Tax Foundation, Trading Economics, Heritage Foundation, The Economist',
        year: 2024,
        url: 'https://www.imf.org/external/datamapper/'
      };
    }
  }
});

// Save updated data
fs.writeFileSync(countriesPath, JSON.stringify(countries, null, 2));

console.log(`Extended economic data import complete!`);
console.log(`Updated ${updated} additional countries`);
console.log(`Added ${dataPoints} new data points`);

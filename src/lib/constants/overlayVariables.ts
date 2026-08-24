import type { VariableConfig, ColorVariable } from '@/types/country'
import { VARIABLES } from './variables'

/** Four overlay datasets merged onto countries.json by iso3 at load time. */
export const OVERLAY_VARIABLES: Record<string, VariableConfig> = {
  'freedom.passportPower': {
    id: 'freedom.passportPower' as ColorVariable,
    name: 'Passport Power',
    description: 'Visa-free and visa-on-arrival destinations (Arton Capital Passport Index, 2026)',
    category: 'governance',
    type: 'numeric',
    domain: [0, 180],
    colorScheme: 'interpolateBlues',
    format: (v) => v !== null ? `${Math.round(v as number)} destinations` : 'N/A',
    higherIsBetter: true,
  },
  'sex.childMarriageRate': {
    id: 'sex.childMarriageRate' as ColorVariable,
    name: 'Child Marriage Rate',
    description: 'Share of women aged 20–24 first married by 18 (UNICEF SDG 5.3.1 via Our World in Data, latest survey year per country)',
    category: 'sex',
    type: 'numeric',
    domain: [0, 80],
    colorScheme: 'interpolateOranges',
    format: (v) => v !== null ? `${(v as number).toFixed(1)}%` : 'N/A',
    higherIsBetter: false,
  },
  'conflict.militarySpendingGdp': {
    id: 'conflict.militarySpendingGdp' as ColorVariable,
    name: 'Military Spending (% GDP)',
    description: 'Military expenditure as a share of GDP (SIPRI via Our World in Data, latest year per country, 1999–2025)',
    category: 'safety',
    type: 'numeric',
    domain: [0, 10],
    colorScheme: 'interpolateReds',
    format: (v) => v !== null ? `${(v as number).toFixed(1)}%` : 'N/A',
    higherIsBetter: false,
  },
  'religion.importance': {
    id: 'religion.importance' as ColorVariable,
    name: 'Religion Very Important',
    description: "Share of people who say religion is 'very important' in their life (Pew / World Values Survey via Our World in Data, latest survey year per country)",
    category: 'religion',
    type: 'numeric',
    domain: [0, 100],
    colorScheme: 'interpolatePurples',
    format: (v) => v !== null ? `${(v as number).toFixed(1)}%` : 'N/A',
    higherIsBetter: true,
  },
}

Object.assign(VARIABLES, OVERLAY_VARIABLES)

import type { Country } from '@/types/country'
import countriesData from '../../../data/countries.json'
import overlayData from '../../../data/stat-overlay.json'
import { mergeOverlay } from './mergeOverlay'
import '../constants/overlayVariables'

export const countries: Country[] = mergeOverlay(
  countriesData as Country[],
  overlayData as Record<string, unknown>
)

export default countries

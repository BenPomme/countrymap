export { countries } from '@/lib/data/loadCountries'

/** Nested lookup with boolean legality fields coerced to 0/1. */
export function getNestedValue(obj: Record<string, unknown>, path: string): number | string | null {
  const keys = path.split('.')
  let value: unknown = obj
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = (value as Record<string, unknown>)[key]
    } else {
      return null
    }
  }
  if (typeof value === 'boolean') return value ? 1 : 0
  return value as number | string | null
}

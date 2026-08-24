/**
 * Deep-merge stat-overlay.json onto countries.json by iso3.
 * No Next path aliases — importable from tsx scripts via relative path.
 */

export type StatOverlay = Record<string, Record<string, Record<string, number | null>>>

export function deepMerge<T extends Record<string, unknown>>(
  base: T,
  extra: Record<string, unknown>
): T {
  const out: Record<string, unknown> = { ...base }
  for (const key of Object.keys(extra)) {
    const extraVal = extra[key]
    const baseVal = out[key]
    if (
      extraVal &&
      typeof extraVal === 'object' &&
      !Array.isArray(extraVal) &&
      baseVal &&
      typeof baseVal === 'object' &&
      !Array.isArray(baseVal)
    ) {
      out[key] = deepMerge(
        baseVal as Record<string, unknown>,
        extraVal as Record<string, unknown>
      )
    } else {
      out[key] = extraVal
    }
  }
  return out as T
}

export function mergeOverlay<T extends { iso3: string }>(
  countries: T[],
  overlay: Record<string, unknown>
): T[] {
  return countries.map((country) => {
    const extra = overlay[country.iso3]
    if (!extra || typeof extra !== 'object' || Array.isArray(extra)) {
      return country
    }
    return deepMerge(
      country as unknown as Record<string, unknown>,
      extra as Record<string, unknown>
    ) as T
  })
}

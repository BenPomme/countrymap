import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((current, key) => {
    return current && typeof current === 'object' ? (current as Record<string, unknown>)[key] : undefined
  }, obj as unknown)
}

export function formatNumber(value: number | null, decimals = 0): string {
  if (value === null || value === undefined) return 'N/A'
  return value.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export function formatPercent(value: number | null, decimals = 1): string {
  if (value === null || value === undefined) return 'N/A'
  return `${value.toFixed(decimals)}%`
}

export function formatCurrency(value: number | null): string {
  if (value === null || value === undefined) return 'N/A'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

export function normalizeValue(
  value: number,
  min: number,
  max: number,
  invert = false
): number {
  const normalized = (value - min) / (max - min)
  return invert ? 1 - normalized : normalized
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function countrySlug(name: string): string {
  return slugify(name)
}

export function variableSlug(name: string): string {
  return slugify(`${name} by country`).replace(/-by-country$/, '') || slugify(name)
}

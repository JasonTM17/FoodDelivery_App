const databasePriceRanges = {
  low: '$',
  medium: '$$',
  high: '$$$',
} as const

export type SeedPriceRange = keyof typeof databasePriceRanges

export function toDatabasePriceRange(value: SeedPriceRange): (typeof databasePriceRanges)[SeedPriceRange] {
  return databasePriceRanges[value]
}

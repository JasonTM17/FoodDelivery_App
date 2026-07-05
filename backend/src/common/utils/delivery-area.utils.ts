export const VIETNAM_DELIVERY_BOUNDS = {
  south: 3.8,
  north: 23.5,
  west: 102.0,
  east: 117.5,
} as const

export function isWithinVietnamDeliveryBounds(
  lat: number | null | undefined,
  lng: number | null | undefined,
): boolean {
  return Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat! >= VIETNAM_DELIVERY_BOUNDS.south &&
    lat! <= VIETNAM_DELIVERY_BOUNDS.north &&
    lng! >= VIETNAM_DELIVERY_BOUNDS.west &&
    lng! <= VIETNAM_DELIVERY_BOUNDS.east &&
    !(lat === 0 && lng === 0)
}

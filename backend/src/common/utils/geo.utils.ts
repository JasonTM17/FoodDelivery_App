export function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function toRad(deg: number): number {
  return deg * Math.PI / 180
}

export function estimateETA(distanceKm: number, avgSpeedKmh = 20, bufferMinutes = 5): number {
  return Math.round(distanceKm / avgSpeedKmh * 60 + bufferMinutes)
}

export function isWithinRadius(lat1: number, lng1: number, lat2: number, lng2: number, radiusKm: number): boolean {
  return haversineDistance(lat1, lng1, lat2, lng2) <= radiusKm
}

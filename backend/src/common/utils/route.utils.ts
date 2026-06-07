import { haversineDistance } from './geo.utils'
import { GeoPoint } from '../types/location.types'

/**
 * Decode a Google encoded polyline string into lat/lng points.
 * Spec: https://developers.google.com/maps/documentation/utilities/polylinealgorithm
 */
export function decodePolyline(encoded: string): GeoPoint[] {
  const points: GeoPoint[] = []
  let index = 0
  let lat = 0
  let lng = 0

  while (index < encoded.length) {
    let shift = 0
    let result = 0
    let b: number

    do {
      b = encoded.charCodeAt(index++) - 63
      result |= (b & 0x1f) << shift
      shift += 5
    } while (b >= 0x20)

    const dLat = result & 1 ? ~(result >> 1) : result >> 1
    lat += dLat

    shift = 0
    result = 0

    do {
      b = encoded.charCodeAt(index++) - 63
      result |= (b & 0x1f) << shift
      shift += 5
    } while (b >= 0x20)

    const dLng = result & 1 ? ~(result >> 1) : result >> 1
    lng += dLng

    points.push({ lat: lat / 1e5, lng: lng / 1e5 })
  }

  return points
}

/**
 * Return the minimum haversine distance (km) from the given point to any
 * vertex on the decoded polyline.
 *
 * Note: vertex-only snap is O(n) and sufficient for the 100 m deviation
 * threshold used here. Segment-projection snap would be more accurate for
 * sparse polylines but adds complexity without meaningful gain at this scale.
 */
export function snapToPolylineDistanceKm(
  encoded: string,
  lat: number,
  lng: number,
): number {
  const points = decodePolyline(encoded)
  if (points.length === 0) return Infinity

  let minDist = Infinity
  for (const p of points) {
    const d = haversineDistance(lat, lng, p.lat, p.lng)
    if (d < minDist) minDist = d
  }
  return minDist
}

/**
 * Returns true when the driver has moved more than `thresholdMeters` from
 * the nearest vertex of the cached route polyline.
 */
export function hasDeviatedFromRoute(
  encoded: string,
  lat: number,
  lng: number,
  thresholdMeters = 100,
): boolean {
  const distKm = snapToPolylineDistanceKm(encoded, lat, lng)
  return distKm * 1000 > thresholdMeters
}

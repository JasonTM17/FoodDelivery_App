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

  const readDelta = (): number | null => {
    let shift = 0
    let result = 0
    let b: number

    do {
      if (index >= encoded.length) return null
      b = encoded.charCodeAt(index++) - 63
      if (b < 0) return null
      result |= (b & 0x1f) << shift
      shift += 5
      if (shift > 30) return null
    } while (b >= 0x20)

    return result & 1 ? ~(result >> 1) : result >> 1
  }

  while (index < encoded.length) {
    const dLat = readDelta()
    const dLng = readDelta()
    if (dLat === null || dLng === null) return []
    lat += dLat
    lng += dLng

    const point = { lat: lat / 1e5, lng: lng / 1e5 }
    if (!isValidWorldCoordinate(point)) return []
    points.push(point)
  }

  return points
}

function isValidWorldCoordinate(point: GeoPoint): boolean {
  return Number.isFinite(point.lat) &&
    Number.isFinite(point.lng) &&
    point.lat >= -90 &&
    point.lat <= 90 &&
    point.lng >= -180 &&
    point.lng <= 180
}

/**
 * Return the minimum distance (km) from the given point to the decoded route.
 *
 * The route is treated as connected polyline segments, not isolated vertices.
 * That matters for sparse provider polylines: a driver can be perfectly on the
 * street segment between two encoded points and still be hundreds of meters
 * from the nearest vertex.
 */
export function snapToPolylineDistanceKm(
  encoded: string,
  lat: number,
  lng: number,
): number {
  const points = decodePolyline(encoded)
  if (points.length === 0) return Infinity
  if (points.length === 1) return haversineDistance(lat, lng, points[0].lat, points[0].lng)

  let minDist = Infinity
  const point = { lat, lng }
  for (let i = 0; i < points.length - 1; i += 1) {
    const d = distanceToSegmentKm(point, points[i], points[i + 1])
    if (d < minDist) minDist = d
  }
  return minDist
}

function distanceToSegmentKm(point: GeoPoint, start: GeoPoint, end: GeoPoint): number {
  if (start.lat === end.lat && start.lng === end.lng) {
    return haversineDistance(point.lat, point.lng, start.lat, start.lng)
  }

  const meanLatRad = toRadians((point.lat + start.lat + end.lat) / 3)
  const metersPerDegreeLat = 110_574
  const metersPerDegreeLng = 111_320 * Math.cos(meanLatRad)

  const segmentX = (end.lng - start.lng) * metersPerDegreeLng
  const segmentY = (end.lat - start.lat) * metersPerDegreeLat
  const pointX = (point.lng - start.lng) * metersPerDegreeLng
  const pointY = (point.lat - start.lat) * metersPerDegreeLat
  const lengthSquared = segmentX ** 2 + segmentY ** 2

  if (lengthSquared === 0) {
    return haversineDistance(point.lat, point.lng, start.lat, start.lng)
  }

  const projection = Math.max(
    0,
    Math.min(1, (pointX * segmentX + pointY * segmentY) / lengthSquared),
  )
  const closestX = segmentX * projection
  const closestY = segmentY * projection
  const dx = pointX - closestX
  const dy = pointY - closestY

  return Math.sqrt(dx ** 2 + dy ** 2) / 1000
}

function toRadians(degrees: number): number {
  return degrees * Math.PI / 180
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

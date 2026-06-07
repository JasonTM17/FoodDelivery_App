import { decodePolyline, snapToPolylineDistanceKm, hasDeviatedFromRoute } from '../common/utils/route.utils'

// Well-known Google example polyline: encodes [(38.5,-120.2),(40.7,-120.95),(43.252,-126.453)]
// Source: https://developers.google.com/maps/documentation/utilities/polylinealgorithm
const GOOGLE_EXAMPLE_POLYLINE = '_p~iF~ps|U_ulLnnqC_mqNvxq`@'

describe('decodePolyline', () => {
  it('decodes Google example polyline to correct coordinates', () => {
    const points = decodePolyline(GOOGLE_EXAMPLE_POLYLINE)
    expect(points).toHaveLength(3)
    expect(points[0].lat).toBeCloseTo(38.5, 1)
    expect(points[0].lng).toBeCloseTo(-120.2, 1)
    expect(points[1].lat).toBeCloseTo(40.7, 1)
    expect(points[1].lng).toBeCloseTo(-120.95, 1)
    expect(points[2].lat).toBeCloseTo(43.252, 2)
    expect(points[2].lng).toBeCloseTo(-126.453, 2)
  })

  it('returns empty array for empty string', () => {
    expect(decodePolyline('')).toEqual([])
  })

  it('decodes single-point polyline', () => {
    const points = decodePolyline('_p~iF~ps|U')
    expect(points).toHaveLength(1)
    expect(points[0].lat).toBeCloseTo(38.5, 1)
    expect(points[0].lng).toBeCloseTo(-120.2, 1)
  })
})

describe('snapToPolylineDistanceKm', () => {
  it('returns ~0 when point is exactly at a polyline vertex', () => {
    // Snap driver to a vertex of the polyline — should be within 1 m
    const dist = snapToPolylineDistanceKm(GOOGLE_EXAMPLE_POLYLINE, 38.5, -120.2)
    expect(dist).toBeCloseTo(0, 1)
  })

  it('returns Infinity for an empty polyline', () => {
    const dist = snapToPolylineDistanceKm('', 10.8, 106.7)
    expect(dist).toBe(Infinity)
  })

  it('returns larger distance for points further from the polyline', () => {
    // Point close to first vertex vs point far away
    const near = snapToPolylineDistanceKm(GOOGLE_EXAMPLE_POLYLINE, 38.5, -120.2)
    const far  = snapToPolylineDistanceKm(GOOGLE_EXAMPLE_POLYLINE, 10.8, 106.7)
    expect(near).toBeLessThan(far)
  })
})

describe('hasDeviatedFromRoute', () => {
  it('returns false when driver is at a polyline vertex (0 m deviation)', () => {
    const deviated = hasDeviatedFromRoute(GOOGLE_EXAMPLE_POLYLINE, 38.5, -120.2)
    expect(deviated).toBe(false)
  })

  it('returns true when driver is >100m from every polyline vertex', () => {
    // (10.8, 106.7) is thousands of km from the US-based polyline
    const deviated = hasDeviatedFromRoute(GOOGLE_EXAMPLE_POLYLINE, 10.8, 106.7)
    expect(deviated).toBe(true)
  })

  it('respects custom threshold — boundary values', () => {
    // At ~38.5° lat, 1° ≈ 111 km → 0.0001° ≈ 11 m (within 100 m) → false
    const notDeviated = hasDeviatedFromRoute(GOOGLE_EXAMPLE_POLYLINE, 38.5001, -120.2, 100)
    // 0.001° ≈ 111 m > 100 m → true
    const deviated = hasDeviatedFromRoute(GOOGLE_EXAMPLE_POLYLINE, 38.501, -120.2, 100)
    expect(notDeviated).toBe(false)
    expect(deviated).toBe(true)
  })
})

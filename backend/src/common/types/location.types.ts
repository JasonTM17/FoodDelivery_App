export interface GeoPoint {
  lat: number
  lng: number
}

export interface RouteResult {
  /** Google encoded polyline string */
  polyline: string
  distanceMeters: number
  /** Wall-clock travel time in seconds (traffic-aware when available) */
  durationSeconds: number
  waypoints: GeoPoint[]
  /** Which provider returned this result */
  provider: 'google' | 'osrm' | 'haversine'
}

export interface DriverLocation {
  driverId: string
  lat: number
  lng: number
  bearing: number
  speed: number
  accuracy: number
  timestamp: string
  orderId?: string
}

export interface NearbyQuery {
  lat: number
  lng: number
  radiusKm: number
  cuisine?: string
  page?: number
  limit?: number
}

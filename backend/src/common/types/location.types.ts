export interface GeoPoint {
  lat: number
  lng: number
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

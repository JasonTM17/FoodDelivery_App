export interface DriverCandidate {
  driverId: string
  distKm: number
  rating: number
}

export interface DispatchResult {
  assigned: boolean
  driverId?: string
}

export interface DispatchJob {
  orderId: string
  restaurantLat: number
  restaurantLng: number
  radius?: number
}

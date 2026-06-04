export interface WsLocationUpdate {
  lat: number
  lng: number
  bearing: number
  speed: number
  accuracy: number
  timestamp: string
}

export interface WsOrderSubscription {
  orderId: string
}

export interface WsDriverAssigned {
  driverId: string
  driverName: string
  etaMinutes: number
}

export interface WsOrderStatusChanged {
  orderId: string
  status: string
  timestamp: string
}

export interface WsEtaUpdated {
  orderId: string
  etaMinutes: number
}

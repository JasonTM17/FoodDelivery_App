import { OrderStatus, PaymentMethod } from '@prisma/client'

export interface OrderStats {
  totalOrders: number
  todayOrders: number
  todayRevenue: number
  activeDrivers: number
  totalUsers: number
  totalRestaurants: number
  orderByStatus: Record<string, number>
}

export interface CreateOrderInput {
  addressId: string
  paymentMethod: PaymentMethod
  promotionCode?: string
  notes?: string
}

export interface OrderTrackingData {
  orderId: string
  status: OrderStatus
  driver?: { id: string; name: string; phone: string }
  etaMinutes?: number
}

import { Injectable } from '@nestjs/common'

export interface CommissionInput {
  total: number
  deliveryFee: number
  restaurantId: string
  commissionRate?: number
}

export interface CommissionSplit {
  platformCut: number
  restaurantPayout: number
  driverPayout: number
  platformDriverFee: number
  commissionRate: number
}

const DEFAULT_COMMISSION_RATE = 15

@Injectable()
export class CommissionService {
  calculateSplit(order: CommissionInput): CommissionSplit {
    const rate = order.commissionRate ?? DEFAULT_COMMISSION_RATE
    const foodAmount = order.total - order.deliveryFee

    const platformCut = Math.round((foodAmount * rate) / 100)
    const restaurantPayout = foodAmount - platformCut
    const driverPayout = Math.round(order.deliveryFee * 0.85)
    const platformDriverFee = order.deliveryFee - driverPayout

    return {
      platformCut,
      restaurantPayout,
      driverPayout,
      platformDriverFee,
      commissionRate: rate,
    }
  }
}

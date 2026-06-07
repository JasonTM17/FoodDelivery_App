import { CommissionService } from './commission.service'

describe('CommissionService', () => {
  let service: CommissionService

  beforeEach(() => {
    service = new CommissionService()
  })

  describe('calculateSplit', () => {
    it('splits food amount by commission rate', () => {
      const result = service.calculateSplit({
        total: 100_000,
        deliveryFee: 20_000,
        restaurantId: 'rest-1',
        commissionRate: 20,
      })

      // foodAmount = 80_000
      expect(result.platformCut).toBe(16_000)       // 80k * 20%
      expect(result.restaurantPayout).toBe(64_000)  // 80k - 16k
      expect(result.driverPayout).toBe(17_000)      // 20k * 85%
      expect(result.platformDriverFee).toBe(3_000)  // 20k - 17k
      expect(result.commissionRate).toBe(20)
    })

    it('uses DEFAULT_COMMISSION_RATE=15 when commissionRate not provided', () => {
      const result = service.calculateSplit({
        total: 100_000,
        deliveryFee: 10_000,
        restaurantId: 'rest-2',
      })

      const foodAmount = 90_000
      expect(result.platformCut).toBe(Math.round((foodAmount * 15) / 100))
      expect(result.commissionRate).toBe(15)
    })

    it('split sum invariant: platformCut + restaurantPayout === foodAmount', () => {
      const deliveryFee = 15_000
      const total = 85_000
      const result = service.calculateSplit({
        total,
        deliveryFee,
        restaurantId: 'rest-3',
        commissionRate: 12,
      })

      const foodAmount = total - deliveryFee
      expect(result.platformCut + result.restaurantPayout).toBe(foodAmount)
    })

    it('delivery fee split invariant: driverPayout + platformDriverFee === deliveryFee', () => {
      const deliveryFee = 25_000
      const result = service.calculateSplit({
        total: 125_000,
        deliveryFee,
        restaurantId: 'rest-4',
        commissionRate: 10,
      })

      expect(result.driverPayout + result.platformDriverFee).toBe(deliveryFee)
    })

    it('handles zero delivery fee', () => {
      const result = service.calculateSplit({
        total: 50_000,
        deliveryFee: 0,
        restaurantId: 'rest-5',
        commissionRate: 15,
      })

      expect(result.driverPayout).toBe(0)
      expect(result.platformDriverFee).toBe(0)
      expect(result.platformCut + result.restaurantPayout).toBe(50_000)
    })

    it('rounds platform cut correctly', () => {
      // 33_333 * 15% = 4_999.95 → rounds to 5_000
      const result = service.calculateSplit({
        total: 33_333,
        deliveryFee: 0,
        restaurantId: 'rest-6',
        commissionRate: 15,
      })

      expect(result.platformCut).toBe(Math.round((33_333 * 15) / 100))
    })
  })
})

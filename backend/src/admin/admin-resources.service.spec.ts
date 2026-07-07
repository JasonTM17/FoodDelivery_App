import { NotFoundException } from '@nestjs/common'
import { AdminResourcesService } from './admin-resources.service'
import { PrismaService } from '../database/prisma.service'
import { OrdersService } from '../orders/orders.service'

describe('AdminResourcesService', () => {
  const mockPrisma = {
    order: { findUnique: jest.fn(), count: jest.fn() },
    user: { findUnique: jest.fn() },
    promotion: { findMany: jest.fn() },
    promotionUsage: { groupBy: jest.fn(), findMany: jest.fn() },
    driverKycSubmission: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  }
  const mockOrders = { updateOrderStatus: jest.fn() }
  let service: AdminResourcesService

  beforeEach(() => {
    jest.clearAllMocks()
    service = new AdminResourcesService(
      mockPrisma as unknown as PrismaService,
      mockOrders as unknown as OrdersService,
    )
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('getOrder', () => {
    it('serializes order detail into the admin web shape', async () => {
      mockPrisma.order.findUnique.mockResolvedValueOnce({
        id: 'order-1',
        orderCode: 'FD260702ABCD',
        status: 'restaurant_accepted',
        total: '80000',
        subtotal: '65000',
        deliveryFee: '15000',
        promotionDiscount: '0',
        notes: null,
        customer: { id: 'customer-1', fullName: 'Customer One', phone: '0900000000' },
        restaurant: { id: 'restaurant-1', name: 'Pho 24', addressLine: '1 Le Loi' },
        driver: null,
        deliveryAddress: { id: 'address-1', addressLine: '2 Nguyen Hue' },
        orderItems: [{ nameSnapshot: 'Phở bò', quantity: 1, unitPrice: '65000' }],
      })

      const result = await service.getOrder('order-1')

      expect(result).toMatchObject({
        id: 'order-1',
        status: 'restaurant_accepted',
        total: 80000,
        deliveryFee: 15000,
        discount: 0,
        note: '',
        deliveryAddress: '2 Nguyen Hue',
        customer: { id: 'customer-1', name: 'Customer One', phone: '0900000000' },
        restaurant: { id: 'restaurant-1', name: 'Pho 24', address: '1 Le Loi' },
        items: [{ name: 'Phở bò', quantity: 1, price: 65000 }],
      })
    })

    it('throws NotFound when the order does not exist', async () => {
      mockPrisma.order.findUnique.mockResolvedValueOnce(null)

      await expect(service.getOrder('missing-order')).rejects.toThrow(NotFoundException)
    })
  })

  describe('driver KYC resources', () => {
    it('returns an explicit unavailable state for non-driver users', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({ id: 'user-1', driverProfile: null })

      await expect(service.getUserKyc('user-1')).resolves.toEqual({
        available: false,
        reason: 'NOT_A_DRIVER',
      })
      expect(mockPrisma.driverKycSubmission.findMany).not.toHaveBeenCalled()
    })

    it('returns real driver KYC submissions for driver users', async () => {
      const submissions = [{ id: 'kyc-1', status: 'pending', documentUrls: { idFront: 'https://example.test/id.jpg' } }]
      mockPrisma.user.findUnique.mockResolvedValueOnce({ id: 'user-1', driverProfile: { id: 'driver-profile-1' } })
      mockPrisma.driverKycSubmission.findMany.mockResolvedValueOnce(submissions)

      await expect(service.getUserKyc('user-1')).resolves.toEqual({
        available: true,
        submissions,
      })
      expect(mockPrisma.driverKycSubmission.findMany).toHaveBeenCalledWith({
        where: { driverProfileId: 'driver-profile-1' },
        orderBy: { createdAt: 'desc' },
      })
    })

    it('reviews one driver KYC submission with backend DTO status values', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({ id: 'user-1', driverProfile: { id: 'driver-profile-1' } })
      mockPrisma.driverKycSubmission.findFirst.mockResolvedValueOnce({ id: 'kyc-1' })
      mockPrisma.driverKycSubmission.update.mockResolvedValueOnce({ id: 'kyc-1', status: 'approved' })

      await expect(service.reviewUserKyc('user-1', 'kyc-1', 'approved', 'admin-1')).resolves.toEqual({
        id: 'kyc-1',
        status: 'approved',
      })
      expect(mockPrisma.driverKycSubmission.update).toHaveBeenCalledWith({
        where: { id: 'kyc-1' },
        data: {
          status: 'approved',
          rejectionReason: undefined,
          reviewedById: 'admin-1',
          reviewedAt: expect.any(Date),
        },
      })
    })
  })

  describe('getUserVouchers', () => {
    it('returns real available promotions and real usage history instead of a not-modelled placeholder', async () => {
      const now = new Date('2026-07-07T09:00:00.000Z')
      jest.useFakeTimers().setSystemTime(now)
      mockPrisma.user.findUnique.mockResolvedValueOnce({ id: 'user-1' })
      mockPrisma.promotion.findMany.mockResolvedValueOnce([
        makePromotion({ id: 'promo-available', code: 'SAVE20', maxPerUser: 2 }),
        makePromotion({ id: 'promo-exhausted', code: 'DONE', currentUsageCount: 10, usageLimit: 10 }),
        makePromotion({ id: 'promo-per-user', code: 'USEDUP', maxPerUser: 1 }),
        makePromotion({ id: 'promo-first-order', code: 'FIRST', firstOrderOnly: true }),
      ])
      mockPrisma.promotionUsage.groupBy.mockResolvedValueOnce([
        { promotionId: 'promo-per-user', _count: { _all: 1 } },
      ])
      mockPrisma.order.count.mockResolvedValueOnce(3)
      mockPrisma.promotionUsage.findMany.mockResolvedValueOnce([
        {
          id: 'usage-1',
          promotionId: 'promo-used',
          userId: 'user-1',
          orderId: 'order-1',
          discountAmount: '15000',
          usedAt: new Date('2026-07-06T10:00:00.000Z'),
          order: { orderCode: 'FD260706ABCD' },
          promotion: makePromotion({
            id: 'promo-used',
            code: 'LUNCH15',
            type: 'fixed',
            value: '15000',
            minOrderAmount: '50000',
            maxDiscount: null,
          }),
        },
      ])

      const result = await service.getUserVouchers('user-1')

      expect(result).toEqual({
        owned: [
          expect.objectContaining({
            id: 'promo-available',
            promotionId: 'promo-available',
            code: 'SAVE20',
            discountType: 'percentage',
            discountValue: 20,
            usedAt: null,
          }),
        ],
        used: [
          expect.objectContaining({
            id: 'usage-1',
            promotionId: 'promo-used',
            code: 'LUNCH15',
            discountType: 'fixed',
            discountValue: 15000,
            orderCode: 'FD260706ABCD',
            usedAt: '2026-07-06T10:00:00.000Z',
          }),
        ],
        totalSaved: 15000,
      })
      expect(mockPrisma.promotion.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          isActive: true,
          status: 'active',
          startsAt: { lte: now },
          expiresAt: { gt: now },
        }),
      }))
      expect(mockPrisma.promotionUsage.groupBy).toHaveBeenCalledWith({
        by: ['promotionId'],
        where: { userId: 'user-1' },
        _count: { _all: true },
      })
    })

    it('throws NotFound instead of returning a fake empty voucher wallet for missing users', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null)

      await expect(service.getUserVouchers('missing-user')).rejects.toThrow(NotFoundException)
      expect(mockPrisma.promotion.findMany).not.toHaveBeenCalled()
      expect(mockPrisma.promotionUsage.findMany).not.toHaveBeenCalled()
    })
  })
})

function makePromotion(overrides: Record<string, unknown> = {}) {
  return {
    id: 'promo-1',
    code: 'SAVE20',
    name: 'Save 20%',
    description: 'Real promotion from persisted promotions',
    type: 'percentage',
    status: 'active',
    value: '20',
    minOrderAmount: '100000',
    maxDiscount: '30000',
    usageLimit: 100,
    usageCount: 0,
    currentUsageCount: 0,
    maxPerUser: null,
    firstOrderOnly: false,
    budget: null,
    usedBudget: '0',
    recurrence: null,
    targeting: { audience: 'all' },
    channels: [],
    restaurantId: null,
    createdById: null,
    startsAt: new Date('2026-07-01T00:00:00.000Z'),
    expiresAt: new Date('2026-07-31T23:59:59.000Z'),
    isActive: true,
    createdAt: new Date('2026-07-01T00:00:00.000Z'),
    updatedAt: new Date('2026-07-01T00:00:00.000Z'),
    ...overrides,
  }
}

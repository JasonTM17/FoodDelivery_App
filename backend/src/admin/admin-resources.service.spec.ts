import { NotFoundException } from '@nestjs/common'
import { AdminResourcesService } from './admin-resources.service'
import { PrismaService } from '../database/prisma.service'
import { OrdersService } from '../orders/orders.service'

describe('AdminResourcesService', () => {
  const mockPrisma = {
    order: { findUnique: jest.fn() },
    user: { findUnique: jest.fn() },
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
})

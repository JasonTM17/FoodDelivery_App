import { BadRequestException, NotFoundException } from '@nestjs/common'
import { Queue } from 'bullmq'
import { PartialFulfillmentService } from './partial-fulfillment.service'
import { PrismaService } from '../database/prisma.service'

describe('PartialFulfillmentService', () => {
  let service: PartialFulfillmentService

  const mockTx = {
    order: { update: jest.fn().mockResolvedValue({}) },
    orderStatusHistory: { create: jest.fn().mockResolvedValue({}) },
  }

  const mockPrisma = {
    restaurantProfile: { findUnique: jest.fn() },
    order: { findUnique: jest.fn() },
    $transaction: jest.fn().mockImplementation(
      (fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx),
    ),
  }

  const mockRefundQueue = { add: jest.fn().mockResolvedValue({ id: 'job-1' }) }

  const restaurantUserId = 'rest-user-1'
  const restaurantId = 'rest-id-1'
  const orderId = 'order-id-1'

  const baseOrder = {
    id: orderId,
    restaurantId,
    status: 'restaurant_accepted',
    total: 100000,
    payment: null as null | { status: string; transactionId: string },
    orderItems: [
      { id: 'item-1', quantity: 1, unitPrice: 30000 },
      { id: 'item-2', quantity: 2, unitPrice: 20000 },
    ],
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockPrisma.$transaction.mockImplementation(
      (fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx),
    )
    mockPrisma.restaurantProfile.findUnique.mockResolvedValue({ restaurantId })
    mockPrisma.order.findUnique.mockResolvedValue({ ...baseOrder })

    service = new PartialFulfillmentService(
      mockPrisma as unknown as PrismaService,
      mockRefundQueue as unknown as Queue,
    )
  })

  it('returns correct newTotal and refundAmount for single item', async () => {
    const result = await service.markItemsUnavailable(orderId, restaurantUserId, {
      unavailableItemIds: ['item-1'],
    })
    expect(result.refundAmount).toBe(30000)
    expect(result.newTotal).toBe(70000)
  })

  it('handles multiple items unavailable', async () => {
    const result = await service.markItemsUnavailable(orderId, restaurantUserId, {
      unavailableItemIds: ['item-1', 'item-2'],
    })
    expect(result.refundAmount).toBe(70000)
    expect(result.newTotal).toBe(30000)
  })

  it('enqueues refund job when payment is completed', async () => {
    mockPrisma.order.findUnique.mockResolvedValue({
      ...baseOrder,
      payment: { status: 'completed', transactionId: 'TXN-001' },
    })
    await service.markItemsUnavailable(orderId, restaurantUserId, { unavailableItemIds: ['item-1'] })
    expect(mockRefundQueue.add).toHaveBeenCalledTimes(1)
    expect(mockRefundQueue.add).toHaveBeenCalledWith(
      'payment-refund.partial',
      expect.objectContaining({
        refundId: `partial-${orderId}-item-1`,
        orderId,
        transactionRef: 'TXN-001',
        amount: 30_000,
        kind: 'partial',
        attemptNo: 1,
      }),
      expect.objectContaining({
        attempts: 3,
        jobId: `payment-refund-partial-${orderId}-item-1`,
      }),
    )
  })

  it('does not enqueue refund when payment is absent', async () => {
    await service.markItemsUnavailable(orderId, restaurantUserId, { unavailableItemIds: ['item-1'] })
    expect(mockRefundQueue.add).not.toHaveBeenCalled()
  })

  it('does not enqueue refund when payment is pending', async () => {
    mockPrisma.order.findUnique.mockResolvedValue({ ...baseOrder, payment: { status: 'pending', transactionId: 'TXN-001' } })
    await service.markItemsUnavailable(orderId, restaurantUserId, { unavailableItemIds: ['item-1'] })
    expect(mockRefundQueue.add).not.toHaveBeenCalled()
  })

  it('throws BadRequestException when unavailableItemIds is empty', async () => {
    await expect(
      service.markItemsUnavailable(orderId, restaurantUserId, { unavailableItemIds: [] }),
    ).rejects.toThrow(BadRequestException)
  })

  it('throws NotFoundException when restaurant profile not found', async () => {
    mockPrisma.restaurantProfile.findUnique.mockResolvedValue(null)
    await expect(
      service.markItemsUnavailable(orderId, restaurantUserId, { unavailableItemIds: ['item-1'] }),
    ).rejects.toThrow(NotFoundException)
  })

  it('throws NotFoundException when order not found', async () => {
    mockPrisma.order.findUnique.mockResolvedValue(null)
    await expect(
      service.markItemsUnavailable(orderId, restaurantUserId, { unavailableItemIds: ['item-1'] }),
    ).rejects.toThrow(NotFoundException)
  })

  it('throws NotFoundException when order belongs to different restaurant', async () => {
    mockPrisma.order.findUnique.mockResolvedValue({ ...baseOrder, restaurantId: 'other-rest' })
    await expect(
      service.markItemsUnavailable(orderId, restaurantUserId, { unavailableItemIds: ['item-1'] }),
    ).rejects.toThrow(NotFoundException)
  })

  it('throws BadRequestException when order not in modifiable state', async () => {
    mockPrisma.order.findUnique.mockResolvedValue({ ...baseOrder, status: 'delivering' })
    await expect(
      service.markItemsUnavailable(orderId, restaurantUserId, { unavailableItemIds: ['item-1'] }),
    ).rejects.toThrow(BadRequestException)
  })

  it('throws BadRequestException when none of the item IDs match order items', async () => {
    await expect(
      service.markItemsUnavailable(orderId, restaurantUserId, { unavailableItemIds: ['nonexistent'] }),
    ).rejects.toThrow(BadRequestException)
  })

  it('accepts preparing status as modifiable', async () => {
    mockPrisma.order.findUnique.mockResolvedValue({ ...baseOrder, status: 'preparing' })
    const result = await service.markItemsUnavailable(orderId, restaurantUserId, {
      unavailableItemIds: ['item-1'],
    })
    expect(result.refundAmount).toBe(30000)
  })
})

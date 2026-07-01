import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common'
import { Queue } from 'bullmq'
import { OrdersService } from './orders.service'
import { PrismaService } from '../database/prisma.service'
import { PaymentsService } from './payments.service'
import { OrdersGateway } from './orders.gateway'
import { CancellationService } from './cancellation.service'

describe('OrdersService', () => {
  let service: OrdersService
  let mockDispatchQueue: jest.Mocked<Pick<Queue, 'add'>>
  let mockRefundQueue: jest.Mocked<Pick<Queue, 'add'>>
  let mockOrderTimeoutQueue: jest.Mocked<Pick<Queue, 'add'>>
  let mockGateway: { broadcastToOrder: jest.Mock; notifyRestaurant: jest.Mock; notifyAdmins: jest.Mock }
  let mockCancellationService: { assertCanCancel: jest.Mock }
  let mockTx: {
    $executeRaw: jest.Mock
    order: { findUniqueOrThrow: jest.Mock; update: jest.Mock }
    restaurantProfile: { findUnique: jest.Mock }
    orderStatusHistory: { create: jest.Mock }
    payment: { findUnique: jest.Mock; update: jest.Mock }
  }
  let mockPrisma: {
    order: { findUniqueOrThrow: jest.Mock }
    $transaction: jest.Mock
  }

  const orderId = 'order-uuid-1'
  const userId = 'user-uuid-1'

  beforeEach(() => {
    mockTx = {
      $executeRaw: jest.fn().mockResolvedValue(1),
      order: {
        findUniqueOrThrow: jest.fn().mockResolvedValue({ id: orderId, status: 'paid', restaurantId: 'restaurant-1', driverId: null }),
        update: jest.fn().mockResolvedValue({ id: orderId, status: 'restaurant_pending' }),
      },
      restaurantProfile: { findUnique: jest.fn().mockResolvedValue({ restaurantId: 'restaurant-1' }) },
      orderStatusHistory: { create: jest.fn().mockResolvedValue({}) },
      payment: { findUnique: jest.fn().mockResolvedValue(null), update: jest.fn().mockResolvedValue({}) },
    }
    mockPrisma = {
      order: { findUniqueOrThrow: jest.fn() },
      $transaction: jest.fn().mockImplementation(
        (fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx),
      ),
    }
    mockGateway = { broadcastToOrder: jest.fn(), notifyRestaurant: jest.fn(), notifyAdmins: jest.fn() }
    mockCancellationService = { assertCanCancel: jest.fn() }
    mockDispatchQueue = { add: jest.fn().mockResolvedValue({}) }
    mockRefundQueue = { add: jest.fn().mockResolvedValue({}) }
    mockOrderTimeoutQueue = { add: jest.fn().mockResolvedValue({}) }

    service = new OrdersService(
      mockPrisma as unknown as PrismaService,
      {} as unknown as PaymentsService,
      mockGateway as unknown as OrdersGateway,
      mockCancellationService as unknown as CancellationService,
      mockDispatchQueue as unknown as Queue,
      mockRefundQueue as unknown as Queue,
      mockOrderTimeoutQueue as unknown as Queue,
    )
  })

  describe('transition()', () => {
    it('acquires advisory lock, updates status, inserts history, emits WS event', async () => {
      mockTx.order.findUniqueOrThrow.mockResolvedValue({ id: orderId, status: 'paid' })
      mockTx.order.update.mockResolvedValue({ id: orderId, status: 'restaurant_pending' })

      const result = await service.transition(orderId, 'restaurant_pending', userId, 'system')

      expect(mockTx.$executeRaw).toHaveBeenCalledTimes(1)
      expect(mockTx.order.update).toHaveBeenCalledWith({
        where: { id: orderId },
        data: expect.objectContaining({ status: 'restaurant_pending' }),
      })
      expect(mockTx.orderStatusHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ orderId, status: 'restaurant_pending' }) }),
      )
      expect(mockGateway.broadcastToOrder).toHaveBeenCalledWith(
        orderId, 'order:status:changed', expect.objectContaining({ status: 'restaurant_pending' }),
      )
      expect(result).toMatchObject({ id: orderId })
    })

    it('includes ip address in note when provided', async () => {
      mockTx.order.findUniqueOrThrow.mockResolvedValue({ id: orderId, status: 'paid' })
      mockTx.order.update.mockResolvedValue({ id: orderId, status: 'restaurant_pending' })

      await service.transition(orderId, 'restaurant_pending', userId, 'system', 'reason', '127.0.0.1')

      expect(mockTx.orderStatusHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ note: expect.stringContaining('ip=127.0.0.1') }),
        }),
      )
    })

    it('sets cancelledReason on order when transitioning to cancelled', async () => {
      mockTx.order.findUniqueOrThrow.mockResolvedValue({ id: orderId, status: 'paid' })
      mockTx.order.update.mockResolvedValue({ id: orderId, status: 'cancelled' })

      await service.transition(orderId, 'cancelled', userId, 'customer', 'Changed my mind')

      expect(mockTx.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ cancelledReason: 'Changed my mind' }),
        }),
      )
    })

    it('marks payment refunded and enqueues refund job when cancelled with completed payment', async () => {
      mockTx.order.findUniqueOrThrow.mockResolvedValue({ id: orderId, status: 'paid' })
      mockTx.order.update.mockResolvedValue({ id: orderId, status: 'cancelled' })
      mockTx.payment.findUnique.mockResolvedValue({ id: 'pay-1', status: 'completed' })

      await service.transition(orderId, 'cancelled', userId, 'customer', 'reason')

      expect(mockTx.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'refunded' } }),
      )
      expect(mockRefundQueue.add).toHaveBeenCalledTimes(1)
      expect(mockRefundQueue.add).toHaveBeenCalledWith(
        'refund.order',
        expect.objectContaining({ orderId }),
        expect.objectContaining({ attempts: 3 }),
      )
    })

    it('does not enqueue refund job when cancelled with no payment', async () => {
      mockTx.order.findUniqueOrThrow.mockResolvedValue({ id: orderId, status: 'paid' })
      mockTx.order.update.mockResolvedValue({ id: orderId, status: 'cancelled' })
      mockTx.payment.findUnique.mockResolvedValue(null)

      await service.transition(orderId, 'cancelled', userId, 'customer', 'reason')

      expect(mockRefundQueue.add).not.toHaveBeenCalled()
    })

    it('enqueues dispatch job when transitioning to restaurant_accepted', async () => {
      mockTx.order.findUniqueOrThrow.mockResolvedValue({ id: orderId, status: 'restaurant_pending', restaurantId: 'restaurant-1' })
      mockTx.order.update.mockResolvedValue({ id: orderId, status: 'restaurant_accepted' })

      await service.transition(orderId, 'restaurant_accepted', userId, 'restaurant')

      expect(mockDispatchQueue.add).toHaveBeenCalledWith(
        'dispatch.driver',
        { orderId },
        expect.objectContaining({ jobId: `dispatch-${orderId}` }),
      )
    })

    it('does not enqueue dispatch for non-restaurant_accepted transitions', async () => {
      mockTx.order.findUniqueOrThrow.mockResolvedValue({ id: orderId, status: 'paid' })
      mockTx.order.update.mockResolvedValue({ id: orderId, status: 'restaurant_pending' })

      await service.transition(orderId, 'restaurant_pending', userId, 'system')

      expect(mockDispatchQueue.add).not.toHaveBeenCalled()
    })

    it('propagates ConflictException from state machine validation', async () => {
      mockTx.order.findUniqueOrThrow.mockResolvedValue({ id: orderId, status: 'completed' })

      await expect(
        service.transition(orderId, 'cancelled', userId, 'admin'),
      ).rejects.toThrow(ConflictException)
    })
  })

  describe('cancelOrder()', () => {
    beforeEach(() => {
      mockPrisma.order.findUniqueOrThrow.mockResolvedValue({
        id: orderId,
        customerId: userId,
        status: 'paid',
      })
      // Stub the transaction path used inside transition()
      mockTx.order.findUniqueOrThrow.mockResolvedValue({ id: orderId, status: 'paid' })
      mockTx.order.update.mockResolvedValue({ id: orderId, status: 'cancelled' })
    })

    it('throws NotFoundException when non-admin user does not own the order', async () => {
      mockPrisma.order.findUniqueOrThrow.mockResolvedValue({
        id: orderId, customerId: 'other-user', status: 'paid',
      })
      await expect(
        service.cancelOrder(orderId, userId, 'customer', { reason: 'test' }),
      ).rejects.toThrow(NotFoundException)
    })

    it('calls cancellationService.assertCanCancel with correct args', async () => {
      await service.cancelOrder(orderId, userId, 'customer', { reason: 'test' })
      expect(mockCancellationService.assertCanCancel).toHaveBeenCalledWith(
        'customer', 'paid', 'test',
      )
    })

    it('passes reason as cancelledReason through transition', async () => {
      await service.cancelOrder(orderId, userId, 'customer', { reason: 'Wrong order' })
      expect(mockTx.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ cancelledReason: 'Wrong order' }),
        }),
      )
    })

    it('allows admin to cancel any order regardless of customerId', async () => {
      mockPrisma.order.findUniqueOrThrow.mockResolvedValue({
        id: orderId, customerId: 'other-user', status: 'preparing',
      })
      mockTx.order.findUniqueOrThrow.mockResolvedValue({ id: orderId, status: 'preparing' })
      await expect(
        service.cancelOrder(orderId, userId, 'admin'),
      ).resolves.toBeDefined()
    })

    it('re-throws ForbiddenException from cancellationService', async () => {
      mockCancellationService.assertCanCancel.mockImplementation(() => {
        throw new ForbiddenException('blocked')
      })
      await expect(
        service.cancelOrder(orderId, userId, 'customer'),
      ).rejects.toThrow(ForbiddenException)
    })
  })

  describe('updateOrderStatus()', () => {
    it('delegates to transition() with correct parameters', async () => {
      mockTx.order.findUniqueOrThrow.mockResolvedValue({ id: orderId, status: 'restaurant_pending', restaurantId: 'restaurant-1' })
      mockTx.order.update.mockResolvedValue({ id: orderId, status: 'restaurant_accepted' })

      const result = await service.updateOrderStatus(orderId, 'restaurant_accepted', userId, 'restaurant', 'Accepted')

      expect(mockTx.orderStatusHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ note: 'Accepted' }),
        }),
      )
      expect(result).toMatchObject({ status: 'restaurant_accepted' })
    })
  })
})

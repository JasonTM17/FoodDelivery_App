import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common'
import { Queue } from 'bullmq'
import dayjs from 'dayjs'
import { Prisma } from '@prisma/client'
import { generateOrderCode, OrdersService } from './orders.service'
import { PrismaService } from '../database/prisma.service'
import { PaymentsService } from './payments.service'
import { OrdersGateway } from './orders.gateway'
import { CancellationService } from './cancellation.service'
import { PromotionsService } from '../promotions/promotions.service'
import { PaymentMethodDto } from './orders.dto'

describe('OrdersService', () => {
  let service: OrdersService
  let mockDispatchQueue: jest.Mocked<Pick<Queue, 'add'>>
  let mockRefundQueue: jest.Mocked<Pick<Queue, 'add'>>
  let mockOrderTimeoutQueue: jest.Mocked<Pick<Queue, 'add'>>
  let mockGateway: { broadcastToOrder: jest.Mock; notifyRestaurant: jest.Mock; notifyAdmins: jest.Mock }
  let mockCancellationService: { assertCanCancel: jest.Mock }
  let mockPaymentsService: { processPayment: jest.Mock }
  let mockPromotionsService: { claimInTransaction: jest.Mock }
  let mockRedis: { get: jest.Mock; del: jest.Mock }
  let mockTx: {
    $executeRaw: jest.Mock
    order: { findUniqueOrThrow: jest.Mock; update: jest.Mock; create: jest.Mock }
    restaurantProfile: { findUnique: jest.Mock }
    orderStatusHistory: { create: jest.Mock }
    payment: { findUnique: jest.Mock; update: jest.Mock }
    cartItem: { deleteMany: jest.Mock }
    cart: { delete: jest.Mock }
  }
  let mockPrisma: {
    order: { findUniqueOrThrow: jest.Mock; findFirst: jest.Mock }
    cart: { findUnique: jest.Mock }
    restaurant: { findUniqueOrThrow: jest.Mock }
    address: { findFirst: jest.Mock }
    $transaction: jest.Mock
    $queryRawUnsafe: jest.Mock
  }

  const orderId = 'order-uuid-1'
  const userId = 'user-uuid-1'

  beforeEach(() => {
    mockTx = {
      $executeRaw: jest.fn().mockResolvedValue(1),
      order: {
        findUniqueOrThrow: jest.fn().mockResolvedValue({ id: orderId, status: 'paid', restaurantId: 'restaurant-1', driverId: null }),
        update: jest.fn().mockResolvedValue({ id: orderId, status: 'restaurant_pending' }),
        create: jest.fn().mockResolvedValue({ id: 'order-new', total: 115000 }),
      },
      restaurantProfile: { findUnique: jest.fn().mockResolvedValue({ restaurantId: 'restaurant-1' }) },
      orderStatusHistory: { create: jest.fn().mockResolvedValue({}) },
      payment: { findUnique: jest.fn().mockResolvedValue(null), update: jest.fn().mockResolvedValue({}) },
      cartItem: { deleteMany: jest.fn().mockResolvedValue({ count: 1 }) },
      cart: { delete: jest.fn().mockResolvedValue({}) },
    }
    mockPrisma = {
      order: { findUniqueOrThrow: jest.fn(), findFirst: jest.fn() },
      cart: { findUnique: jest.fn() },
      restaurant: { findUniqueOrThrow: jest.fn() },
      address: { findFirst: jest.fn() },
      $transaction: jest.fn().mockImplementation(
        (fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx),
      ),
      $queryRawUnsafe: jest.fn().mockResolvedValue([{ restaurantLat: 10.8, restaurantLng: 106.7 }]),
    }
    mockGateway = { broadcastToOrder: jest.fn(), notifyRestaurant: jest.fn(), notifyAdmins: jest.fn() }
    mockCancellationService = { assertCanCancel: jest.fn() }
    mockPaymentsService = {
      processPayment: jest.fn().mockResolvedValue({ readyForRestaurant: true }),
    }
    mockPromotionsService = {
      claimInTransaction: jest.fn().mockResolvedValue({ discountAmount: 0 }),
    }
    mockRedis = {
      get: jest.fn().mockResolvedValue(null),
      del: jest.fn().mockResolvedValue(1),
    }
    mockDispatchQueue = { add: jest.fn().mockResolvedValue({}) }
    mockRefundQueue = { add: jest.fn().mockResolvedValue({}) }
    mockOrderTimeoutQueue = { add: jest.fn().mockResolvedValue({}) }

    service = new OrdersService(
      mockPrisma as unknown as PrismaService,
      mockPaymentsService as unknown as PaymentsService,
      mockGateway as unknown as OrdersGateway,
      mockCancellationService as unknown as CancellationService,
      mockPromotionsService as unknown as PromotionsService,
      mockRedis as never,
      mockDispatchQueue as unknown as Queue,
      mockRefundQueue as unknown as Queue,
      mockOrderTimeoutQueue as unknown as Queue,
    )
  })

  describe('generateOrderCode()', () => {
    it('fits the 12 character database column', () => {
      const code = generateOrderCode(dayjs('2026-07-02T00:00:00Z'))

      expect(code).toHaveLength(12)
      expect(code).toMatch(/^FD260702.{4}$/)
    })
  })

  describe('getTracking()', () => {
    it('queries by both order and customer to preserve tenant isolation', async () => {
      const snapshot = {
        id: orderId,
        status: 'delivering',
        driverId: 'driver-1',
        estimatedDeliveryTimeMinutes: 12,
        routePolyline: 'encoded-route',
      }
      mockPrisma.order.findFirst.mockResolvedValue(snapshot)

      await expect(service.getTracking(orderId, userId)).resolves.toBe(snapshot)
      expect(mockPrisma.order.findFirst).toHaveBeenCalledWith({
        where: { id: orderId, customerId: userId },
        select: {
          id: true,
          status: true,
          driverId: true,
          estimatedDeliveryTimeMinutes: true,
          routePolyline: true,
        },
      })
    })

    it('does not disclose whether another customer order exists', async () => {
      mockPrisma.order.findFirst.mockResolvedValue(null)

      await expect(service.getTracking(orderId, 'other-customer'))
        .rejects.toThrow(NotFoundException)
    })
  })

  describe('placeOrder()', () => {
    beforeEach(() => {
      mockPrisma.cart.findUnique.mockResolvedValue({
        id: 'cart-1',
        restaurantId: 'restaurant-1',
        promotionCode: null,
        items: [{
          menuItemId: 'menu-1',
          unitPrice: 100000,
          quantity: 1,
          selectedOptions: [],
          notes: null,
          menuItem: { name: 'Pho bo' },
        }],
      })
      mockPrisma.restaurant.findUniqueOrThrow.mockResolvedValue({
        id: 'restaurant-1',
        isOpen: true,
        isActive: true,
        minOrderAmount: 0,
        prepTimeAvgMinutes: 15,
      })
      mockPrisma.address.findFirst.mockResolvedValue({ id: 'address-1', userId })
      mockTx.order.create.mockResolvedValue({ id: 'order-new', total: 115000 })
    })

    it('charges the base total when no promotion code is present', async () => {
      await service.placeOrder(userId, { addressId: 'address-1', paymentMethod: PaymentMethodDto.cash })

      expect(mockPromotionsService.claimInTransaction).not.toHaveBeenCalled()
      expect(mockPaymentsService.processPayment).toHaveBeenCalledWith('order-new', 115000, 'cash')
      expect(mockTx.cartItem.deleteMany).toHaveBeenCalledWith({ where: { cartId: 'cart-1' } })
      expect(mockTx.cart.delete).toHaveBeenCalledWith({ where: { id: 'cart-1' } })
    })

    it('retries order code collisions before charging payment', async () => {
      const collision = Object.assign(new Error('duplicate order code'), {
        code: 'P2002',
        meta: { target: ['order_code'] },
      })
      mockTx.order.create
        .mockRejectedValueOnce(collision)
        .mockResolvedValueOnce({ id: 'order-new', total: 115000 })

      await service.placeOrder(userId, { addressId: 'address-1', paymentMethod: PaymentMethodDto.cash })

      expect(mockTx.order.create).toHaveBeenCalledTimes(2)
      expect(mockPaymentsService.processPayment).toHaveBeenCalledTimes(1)
      expect(mockPaymentsService.processPayment).toHaveBeenCalledWith('order-new', 115000, 'cash')
    })

    it('claims promotion inside the order transaction and charges the discounted total', async () => {
      mockPromotionsService.claimInTransaction.mockResolvedValueOnce({ discountAmount: 10000 })
      mockTx.order.update.mockResolvedValueOnce({
        id: 'order-new',
        total: 105000,
        promotionDiscount: 10000,
      })

      await service.placeOrder(userId, {
        addressId: 'address-1',
        paymentMethod: PaymentMethodDto.cash,
        promotionCode: 'SAVE10',
      })

      expect(mockPromotionsService.claimInTransaction).toHaveBeenCalledWith(
        mockTx,
        'SAVE10',
        { subtotal: 100000, restaurantId: 'restaurant-1' },
        userId,
        'order-new',
      )
      expect(mockTx.order.update).toHaveBeenCalledWith({
        where: { id: 'order-new' },
        data: { promotionDiscount: 10000, total: 105000 },
      })
      expect(mockPaymentsService.processPayment).toHaveBeenCalledWith('order-new', 105000, 'cash')
    })

    it('does not settle payment or clear cart when promotion claim fails', async () => {
      mockPromotionsService.claimInTransaction.mockRejectedValueOnce(new BadRequestException('PROMOTION_INVALID'))

      await expect(
        service.placeOrder(userId, {
          addressId: 'address-1',
          paymentMethod: PaymentMethodDto.cash,
          promotionCode: 'BADCODE',
        }),
      ).rejects.toThrow(BadRequestException)

      expect(mockPaymentsService.processPayment).not.toHaveBeenCalled()
      expect(mockTx.cartItem.deleteMany).not.toHaveBeenCalled()
      expect(mockTx.cart.delete).not.toHaveBeenCalled()
    })
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

    it('clears stale route geometry when transitioning from pickup to dropoff phase', async () => {
      mockTx.order.findUniqueOrThrow.mockResolvedValue({
        id: orderId,
        status: 'driver_arriving_restaurant',
        driverId: userId,
      })
      mockTx.order.update.mockResolvedValue({ id: orderId, status: 'picked_up' })

      await service.transition(orderId, 'picked_up', userId, 'driver')

      expect(mockTx.order.update).toHaveBeenCalledWith({
        where: { id: orderId },
        data: expect.objectContaining({
          status: 'picked_up',
          estimatedDeliveryTimeMinutes: null,
          routePolyline: null,
          routeWaypoints: Prisma.DbNull,
        }),
      })
    })

    it('keeps route geometry when the route phase does not change', async () => {
      mockTx.order.findUniqueOrThrow.mockResolvedValue({
        id: orderId,
        status: 'driver_assigned',
        driverId: userId,
      })
      mockTx.order.update.mockResolvedValue({ id: orderId, status: 'driver_arriving_restaurant' })

      await service.transition(orderId, 'driver_arriving_restaurant', userId, 'driver')

      expect(mockTx.order.update).toHaveBeenCalledWith({
        where: { id: orderId },
        data: expect.not.objectContaining({
          estimatedDeliveryTimeMinutes: null,
          routePolyline: null,
          routeWaypoints: Prisma.DbNull,
        }),
      })
    })

    it('enqueues real payment refund without marking payment refunded before provider success', async () => {
      mockTx.order.findUniqueOrThrow.mockResolvedValue({ id: orderId, status: 'paid' })
      mockTx.order.update.mockResolvedValue({ id: orderId, status: 'cancelled' })
      mockTx.payment.findUnique.mockResolvedValue({
        id: 'pay-1',
        status: 'completed',
        transactionId: 'TXN-001',
        amount: 50_000,
      })

      await service.transition(orderId, 'cancelled', userId, 'customer', 'reason')

      expect(mockTx.payment.update).not.toHaveBeenCalled()
      expect(mockRefundQueue.add).toHaveBeenCalledTimes(1)
      expect(mockRefundQueue.add).toHaveBeenCalledWith(
        'payment-refund.full',
        expect.objectContaining({
          refundId: `full-${orderId}`,
          orderId,
          transactionRef: 'TXN-001',
          amount: 50_000,
          reason: 'reason',
          kind: 'full',
          attemptNo: 1,
        }),
        expect.objectContaining({
          attempts: 3,
          jobId: `payment-refund-full-${orderId}`,
        }),
      )
    })

    it('releases driver current order when a terminal order still owns the redis assignment', async () => {
      mockTx.order.findUniqueOrThrow.mockResolvedValue({
        id: orderId,
        status: 'delivering',
        driverId: 'driver-1',
      })
      mockTx.order.update.mockResolvedValue({ id: orderId, status: 'delivered', driverId: 'driver-1' })
      mockRedis.get.mockResolvedValueOnce(orderId)

      await service.transition(orderId, 'delivered', 'driver-1', 'driver', 'Completed delivery')

      expect(mockRedis.get).toHaveBeenCalledWith('driver:driver-1:current_order')
      expect(mockRedis.del).toHaveBeenCalledWith('driver:driver-1:current_order')
    })

    it('does not release a driver assignment that has already moved to another order', async () => {
      mockTx.order.findUniqueOrThrow.mockResolvedValue({
        id: orderId,
        status: 'delivering',
        driverId: 'driver-1',
      })
      mockTx.order.update.mockResolvedValue({ id: orderId, status: 'delivered', driverId: 'driver-1' })
      mockRedis.get.mockResolvedValueOnce('other-order')

      await service.transition(orderId, 'delivered', 'driver-1', 'driver', 'Completed delivery')

      expect(mockRedis.get).toHaveBeenCalledWith('driver:driver-1:current_order')
      expect(mockRedis.del).not.toHaveBeenCalled()
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

      expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledWith(expect.stringContaining('ST_Y'), orderId)
      expect(mockDispatchQueue.add).toHaveBeenCalledWith(
        'dispatch.driver',
        { orderId, restaurantLat: 10.8, restaurantLng: 106.7, attempt: 1 },
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

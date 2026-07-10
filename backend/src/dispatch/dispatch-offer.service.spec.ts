import { ConflictException } from '@nestjs/common'
import { createHash } from 'node:crypto'
import { DispatchOfferService } from './dispatch-offer.service'

describe('DispatchOfferService', () => {
  const now = new Date('2026-07-10T12:00:00.000Z')
  const offer = {
    id: 'offer-1',
    orderId: 'order-1',
    driverId: 'driver-1',
    tokenHash: createHash('sha256').update('offer-token').digest('hex'),
    status: 'pending',
    attempt: 2,
    restaurantLat: 10.8,
    restaurantLng: 106.7,
    distanceKm: 1.2,
    driverRating: 4.8,
    totalDeliveries: 120,
    surgeMultiplier: 1,
    expiresAt: new Date('2026-07-10T12:00:30.000Z'),
    respondedAt: null,
    createdAt: now,
    updatedAt: now,
  }

  const tx = {
    dispatchOffer: {
      updateMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    order: {
      updateMany: jest.fn(),
      findUnique: jest.fn(),
    },
    orderStatusHistory: { create: jest.fn() },
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
  }
  const prisma = {
    dispatchOffer: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      updateMany: jest.fn(),
    },
    order: { findUniqueOrThrow: jest.fn(), findUnique: jest.fn() },
    $transaction: jest.fn((callback: (client: typeof tx) => unknown) => callback(tx)),
  }
  const redis = { eval: jest.fn(), del: jest.fn() }
  const queue = { add: jest.fn() }
  const cooldown = { recordTimeout: jest.fn() }
  const notifier = {
    sendNewOrderOffer: jest.fn(),
    sendAssignedOrder: jest.fn(),
  }
  const ordersGateway = { broadcastToOrder: jest.fn() }
  const metrics = {
    successTotal: { inc: jest.fn() },
    timeToAssign: { observe: jest.fn() },
  }
  const service = new DispatchOfferService(
    prisma as never,
    redis as never,
    queue as never,
    cooldown as never,
    notifier as never,
    ordersGateway as never,
    metrics as never,
  )

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(now)
    jest.clearAllMocks()
    prisma.$transaction.mockImplementation((callback: (client: typeof tx) => unknown) => callback(tx))
    queue.add.mockResolvedValue({ id: 'job-1' })
    cooldown.recordTimeout.mockResolvedValue(undefined)
    redis.del.mockResolvedValue(0)
    redis.eval.mockResolvedValue(1)
    tx.dispatchOffer.updateMany.mockResolvedValue({ count: 0 })
    tx.dispatchOffer.update.mockResolvedValue({})
    tx.order.updateMany.mockResolvedValue({ count: 1 })
    tx.orderStatusHistory.create.mockResolvedValue({})
    tx.$executeRaw.mockResolvedValue(1)
    tx.$queryRaw.mockResolvedValue([{
      restLng: 106.7,
      restLat: 10.8,
      custLng: 106.71,
      custLat: 10.81,
    }])
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('stores only a token hash and schedules a persisted timeout job', async () => {
    prisma.order.findUniqueOrThrow.mockResolvedValue({
      total: 150000,
      deliveryFee: 20000,
      deliveryAddress: { addressLine: 'Customer address' },
      restaurant: { name: 'Restaurant', addressLine: 'Restaurant address' },
    })
    tx.dispatchOffer.create.mockImplementation(({ data }) => ({
      ...offer,
      ...data,
      id: 'offer-1',
    }))

    await service.createOffer({
      orderId: 'order-1',
      candidate: {
        driverId: 'driver-1',
        distKm: 1.2,
        rating: 4.8,
        totalDeliveries: 120,
      },
      restaurantLat: 10.8,
      restaurantLng: 106.7,
      attempt: 2,
      surgeMultiplier: 1,
    })

    const persisted = tx.dispatchOffer.create.mock.calls[0][0].data
    const published = notifier.sendNewOrderOffer.mock.calls[0][1]
    expect(persisted.tokenHash).toHaveLength(64)
    expect(persisted.tokenHash).toBe(
      createHash('sha256').update(published.offerToken).digest('hex'),
    )
    expect(persisted).not.toHaveProperty('offerToken')
    expect(queue.add).toHaveBeenCalledWith(
      'dispatch.offer-timeout',
      { offerId: 'offer-1' },
      expect.objectContaining({ delay: 30_000 }),
    )
  })

  it('rejects an invalid or expired token without revealing which check failed', async () => {
    prisma.dispatchOffer.findFirst.mockResolvedValue(null)

    await expect(service.respondToOffer(
      'order-1',
      'driver-1',
      'invalid-token',
      'accept',
    )).rejects.toThrow('DISPATCH_OFFER_INVALID_OR_EXPIRED')
    expect(prisma.dispatchOffer.updateMany).not.toHaveBeenCalled()
  })

  it('resolves a rejection exactly once and immediately requeues dispatch', async () => {
    prisma.dispatchOffer.findFirst.mockResolvedValue(offer)
    prisma.dispatchOffer.updateMany.mockResolvedValue({ count: 1 })

    await expect(service.respondToOffer(
      'order-1',
      'driver-1',
      'offer-token',
      'reject',
    )).resolves.toEqual({
      orderId: 'order-1',
      decision: 'reject',
      status: 'rejected',
    })
    expect(cooldown.recordTimeout).toHaveBeenCalledWith('driver-1')
    expect(queue.add).toHaveBeenCalledWith(
      'dispatch.driver',
      expect.objectContaining({ orderId: 'order-1', attempt: 2 }),
      expect.objectContaining({ jobId: expect.stringContaining('offer-1') }),
    )
  })

  it('claims Redis and commits the order, delivery task, and offer atomically on accept', async () => {
    prisma.dispatchOffer.findFirst.mockResolvedValue(offer)
    prisma.dispatchOffer.updateMany.mockResolvedValue({ count: 1 })

    await expect(service.respondToOffer(
      'order-1',
      'driver-1',
      'offer-token',
      'accept',
    )).resolves.toEqual({
      orderId: 'order-1',
      decision: 'accept',
      status: 'assigned',
    })

    expect(redis.eval).toHaveBeenCalledWith(
      expect.stringContaining('current == ARGV[1]'),
      3,
      'driver:driver-1:status',
      'driver:driver-1:current_order',
      'driver:driver-1:idle_since',
      'order-1',
    )
    expect(tx.order.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        id: 'order-1',
        driverId: null,
        status: { in: ['restaurant_accepted', 'preparing', 'ready_for_pickup'] },
      }),
    }))
    const deliveryTaskSql = tx.$executeRaw.mock.calls[0][0]
    expect(deliveryTaskSql.sql).toContain('"pickupLocation"')
    expect(deliveryTaskSql.sql).toContain('"dropoffLocation"')
    expect(deliveryTaskSql.sql).toContain('id, order_id, driver_id')
    expect(tx.dispatchOffer.update).toHaveBeenCalledWith({
      where: { id: 'offer-1' },
      data: { status: 'assigned' },
    })
    expect(notifier.sendAssignedOrder).toHaveBeenCalledWith(
      'driver-1',
      { orderId: 'order-1' },
    )
    expect(ordersGateway.broadcastToOrder).toHaveBeenCalledWith(
      'order-1',
      'driver:assigned',
      { driverId: 'driver-1', etaMinutes: null },
    )
  })

  it('does not enter the database assignment transaction when Redis claim loses the race', async () => {
    prisma.dispatchOffer.findFirst.mockResolvedValue(offer)
    prisma.dispatchOffer.updateMany.mockResolvedValue({ count: 1 })
    redis.eval.mockResolvedValueOnce(0)

    await expect(service.respondToOffer(
      'order-1',
      'driver-1',
      'offer-token',
      'accept',
    )).rejects.toBeInstanceOf(ConflictException)
    expect(prisma.$transaction).not.toHaveBeenCalled()
    expect(notifier.sendAssignedOrder).not.toHaveBeenCalled()
  })

  it('expires a pending offer and schedules the next untried driver', async () => {
    const expiredOffer = {
      ...offer,
      expiresAt: new Date('2026-07-10T11:59:59.000Z'),
    }
    prisma.dispatchOffer.findUnique.mockResolvedValue(expiredOffer)
    prisma.dispatchOffer.updateMany.mockResolvedValue({ count: 1 })

    await expect(service.expireOffer('offer-1')).resolves.toEqual({ expired: true })
    expect(cooldown.recordTimeout).toHaveBeenCalledWith('driver-1')
    expect(queue.add).toHaveBeenCalledWith(
      'dispatch.driver',
      expect.objectContaining({ orderId: 'order-1', attempt: 2 }),
      expect.any(Object),
    )
  })

  it('recovers an accepted offer left behind by a terminated serverless invocation', async () => {
    const stranded = {
      ...offer,
      status: 'accepted',
      updatedAt: new Date('2026-07-10T11:59:40.000Z'),
    }
    prisma.dispatchOffer.findUnique.mockResolvedValue(stranded)
    prisma.order.findUnique.mockResolvedValue({ driverId: null })
    prisma.dispatchOffer.updateMany.mockResolvedValue({ count: 1 })

    await expect(service.expireOffer('offer-1')).resolves.toEqual({ expired: true })
    expect(redis.eval).toHaveBeenCalledWith(
      expect.stringContaining('redis.call("get", KEYS[1]) == ARGV[1]'),
      3,
      'driver:driver-1:current_order',
      'driver:driver-1:status',
      'driver:driver-1:idle_since',
      'order-1',
      expect.any(String),
    )
    expect(queue.add).toHaveBeenCalledWith(
      'dispatch.driver',
      expect.objectContaining({ orderId: 'order-1' }),
      expect.any(Object),
    )
  })
})

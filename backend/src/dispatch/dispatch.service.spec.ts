import { Test, TestingModule } from '@nestjs/testing'
import { DispatchService } from './dispatch.service'
import { DispatchOfferService } from './dispatch-offer.service'
import { PrismaService } from '../database/prisma.service'
import { DriverScoringService } from './driver-scoring.service'
import { CooldownService } from './cooldown.service'
import { SurgePricingService } from './surge-pricing.service'
import { DispatchMetrics } from './dispatch.metrics'
import { OrdersService } from '../orders/orders.service'
import { OrdersGateway } from '../orders/orders.gateway'

describe('DispatchService', () => {
  let service: DispatchService

  function mockPipelineResult(results: Array<[Error | null, unknown]> = [[null, 'OK']]) {
    return {
      set: jest.fn().mockReturnThis(),
      del: jest.fn().mockReturnThis(),
      get: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(results),
    }
  }

  const redis = {
    call: jest.fn(),
    set: jest.fn(),
    eval: jest.fn(),
    pipeline: jest.fn(() => mockPipelineResult()),
  }
  const metrics = {
    attemptsTotal: { inc: jest.fn() },
    successTotal: { inc: jest.fn() },
    noDriverTotal: { inc: jest.fn() },
    timeToAssign: { observe: jest.fn() },
    availableDriversPerZone: { set: jest.fn() },
  }
  const scoring = { score: jest.fn().mockReturnValue(0.75) }
  const cooldown = { isInCooldown: jest.fn().mockResolvedValue(false) }
  const surge = {
    checkAndUpdate: jest.fn().mockReturnValue(1),
    getMultiplier: jest.fn().mockReturnValue(1),
  }
  const offers = {
    attemptedDriverIds: jest.fn().mockResolvedValue(new Set<string>()),
    createOffer: jest.fn().mockResolvedValue({ offerId: 'offer-1', driverId: 'driver-1' }),
  }
  const ordersGateway = { broadcastToOrder: jest.fn() }
  const prisma = { order: { findUnique: jest.fn() } }
  const ordersService = {
    transition: jest.fn().mockResolvedValue({ id: 'order-1', status: 'cancelled' }),
  }

  beforeEach(async () => {
    jest.clearAllMocks()
    redis.pipeline.mockReturnValue(mockPipelineResult())
    cooldown.isInCooldown.mockResolvedValue(false)
    scoring.score.mockReturnValue(0.75)
    offers.attemptedDriverIds.mockResolvedValue(new Set<string>())
    offers.createOffer.mockResolvedValue({ offerId: 'offer-1', driverId: 'driver-1' })

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DispatchService,
        { provide: DispatchOfferService, useValue: offers },
        { provide: OrdersGateway, useValue: ordersGateway },
        { provide: PrismaService, useValue: prisma },
        { provide: 'REDIS_CLIENT', useValue: redis },
        { provide: DriverScoringService, useValue: scoring },
        { provide: CooldownService, useValue: cooldown },
        { provide: SurgePricingService, useValue: surge },
        { provide: DispatchMetrics, useValue: metrics },
        { provide: OrdersService, useValue: ordersService },
      ],
    }).compile()

    service = module.get(DispatchService)
  })

  it('returns not assigned when the order dispatch lock is held', async () => {
    redis.set.mockResolvedValueOnce(null)

    await expect(service.dispatchOrder('order-1', 10.8231, 106.6297, 5, 1))
      .resolves.toEqual({ assigned: false })
    expect(offers.createOffer).not.toHaveBeenCalled()
  })

  it('persists one offer and returns immediately instead of waiting for a socket callback', async () => {
    redis.set.mockResolvedValueOnce('OK')
    redis.call.mockResolvedValueOnce([['driver:driver-1', '0.5']])
    redis.pipeline.mockReturnValueOnce(mockPipelineResult([
      [null, 'online'], [null, ''], [null, '4.8'], [null, '1'],
      [null, '0.9'], [null, '0.95'], [null, null], [null, '120'],
    ]))

    await expect(service.dispatchOrder('order-1', 10.8231, 106.6297, 5, 2))
      .resolves.toEqual({
        assigned: false,
        pending: true,
        driverId: 'driver-1',
        offerId: 'offer-1',
      })
    expect(offers.createOffer).toHaveBeenCalledWith(expect.objectContaining({
      orderId: 'order-1',
      restaurantLat: 10.8231,
      restaurantLng: 106.6297,
      attempt: 2,
      candidate: expect.objectContaining({ driverId: 'driver-1' }),
    }))
    expect(metrics.attemptsTotal.inc).toHaveBeenCalledWith({ attempt_no: '2' })
  })

  it('does not re-offer the same order to an already attempted driver', async () => {
    redis.set.mockResolvedValueOnce('OK')
    redis.call.mockResolvedValueOnce([['driver:driver-1', '0.5']])
    redis.pipeline.mockReturnValueOnce(mockPipelineResult([
      [null, 'online'], [null, ''], [null, '4.8'], [null, '1'],
      [null, '0.9'], [null, '0.95'], [null, null], [null, '120'],
    ]))
    offers.attemptedDriverIds.mockResolvedValueOnce(new Set(['driver-1']))

    await expect(service.dispatchOrder('order-1', 10.8231, 106.6297, 5, 1))
      .resolves.toEqual({ assigned: false })
    expect(offers.createOffer).not.toHaveBeenCalled()
    expect(metrics.noDriverTotal.inc).toHaveBeenCalledWith({ reason: 'no_candidates' })
  })

  it('releases the distributed lock even when no candidates exist', async () => {
    redis.set.mockResolvedValueOnce('OK')
    redis.call.mockResolvedValueOnce([])

    await service.dispatchOrder('order-1', 10.8231, 106.6297, 5, 1)

    expect(redis.eval).toHaveBeenCalledWith(
      expect.stringContaining('KEYS[1]'),
      1,
      'lock:dispatch:order-1',
      expect.any(String),
    )
  })

  describe('findCandidates', () => {
    it('filters busy and cooldown drivers', async () => {
      redis.call.mockResolvedValueOnce([
        ['driver:available', '0.5'],
        ['driver:busy', '1.2'],
        ['driver:cooldown', '1.4'],
      ])
      redis.pipeline
        .mockReturnValueOnce(mockPipelineResult([
          [null, 'online'], [null, ''], [null, '4.5'], [null, '1'],
          [null, '0.9'], [null, '0.95'], [null, null], [null, '50'],
        ]))
        .mockReturnValueOnce(mockPipelineResult([
          [null, 'online'], [null, 'order-2'], [null, '4.8'], [null, '1'],
          [null, '0.9'], [null, '0.95'], [null, null], [null, '70'],
        ]))
        .mockReturnValueOnce(mockPipelineResult([
          [null, 'online'], [null, ''], [null, '4.7'], [null, '1'],
          [null, '0.9'], [null, '0.95'], [null, null], [null, '60'],
        ]))
      cooldown.isInCooldown
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true)

      await expect(service.findCandidates(10.8231, 106.6297, 5))
        .resolves.toEqual([expect.objectContaining({ driverId: 'available' })])
    })

    it('sorts scored candidates and accepts flat GEOSEARCH replies', async () => {
      redis.call.mockResolvedValueOnce(['driver:one', '2.0', 'driver:two', '1.0'])
      scoring.score.mockReturnValueOnce(0.5).mockReturnValueOnce(0.8)
      redis.pipeline
        .mockReturnValueOnce(mockPipelineResult([
          [null, 'online'], [null, ''], [null, '4.2'], [null, '1'],
          [null, '0.7'], [null, '0.8'], [null, null], [null, '50'],
        ]))
        .mockReturnValueOnce(mockPipelineResult([
          [null, 'online'], [null, ''], [null, '4.8'], [null, '1'],
          [null, '0.95'], [null, '0.98'], [null, null], [null, '80'],
        ]))

      const result = await service.findCandidates(10.8231, 106.6297, 5)

      expect(result.map(item => item.driverId)).toEqual(['two', 'one'])
    })
  })

  describe('autoCancelOrder', () => {
    it('transitions only orders that are still waiting for dispatch', async () => {
      prisma.order.findUnique.mockResolvedValueOnce({
        id: 'order-1',
        status: 'restaurant_accepted',
      })

      await service.autoCancelOrder('order-1')

      expect(ordersService.transition).toHaveBeenCalledWith(
        'order-1',
        'cancelled',
        'system',
        'system',
        'no_driver_available',
      )
      expect(ordersGateway.broadcastToOrder).toHaveBeenCalledWith(
        'order-1',
        'order:auto_cancelled',
        expect.objectContaining({ orderId: 'order-1' }),
      )
    })

    it('does not cancel an in-flight delivery', async () => {
      prisma.order.findUnique.mockResolvedValueOnce({ id: 'order-1', status: 'delivering' })

      await service.autoCancelOrder('order-1')

      expect(ordersService.transition).not.toHaveBeenCalled()
      expect(ordersGateway.broadcastToOrder).not.toHaveBeenCalled()
    })
  })
})

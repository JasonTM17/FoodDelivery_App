import { Test, TestingModule } from '@nestjs/testing'
import { DispatchService } from './dispatch.service'
import { DispatchGateway } from './dispatch.gateway'
import { PrismaService } from '../database/prisma.service'
import { DriverScoringService } from './driver-scoring.service'
import { CooldownService } from './cooldown.service'
import { SurgePricingService } from './surge-pricing.service'
import { DispatchMetrics } from './dispatch.metrics'
import { OrdersService } from '../orders/orders.service'
import { Prisma } from '@prisma/client'

describe('DispatchService', () => {
  let service: DispatchService

  function mockPipelineResult(results: Array<[Error | null, unknown]> = [[null, 'OK'], [null, 'OK'], [null, 1]]) {
    return {
      set: jest.fn().mockReturnThis(),
      del: jest.fn().mockReturnThis(),
      get: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(results),
    }
  }

  const mockRedis = {
    call: jest.fn(),
    set: jest.fn(),
    get: jest.fn().mockResolvedValue(null),
    del: jest.fn(),
    setex: jest.fn(),
    eval: jest.fn(),
    pipeline: jest.fn(() => mockPipelineResult()),
  }

  const mockMetrics = {
    attemptsTotal: { inc: jest.fn() },
    successTotal: { inc: jest.fn() },
    noDriverTotal: { inc: jest.fn() },
    timeToAssign: { observe: jest.fn() },
    availableDriversPerZone: { set: jest.fn() },
  }

  const mockScoring = { score: jest.fn().mockReturnValue(0.75) }

  const mockCooldown = {
    isInCooldown: jest.fn().mockResolvedValue(false),
    recordTimeout: jest.fn().mockResolvedValue(undefined),
  }

  const mockSurge = {
    checkAndUpdate: jest.fn().mockReturnValue(1.0),
    getMultiplier: jest.fn().mockReturnValue(1.0),
  }

  const mockGateway = {
    sendNewOrderOffer: jest.fn(),
    sendAssignedOrder: jest.fn(),
    registerOfferResponse: jest.fn(),
    broadcastToOrder: jest.fn(),
  }

  const mockTx = {
    order: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
    orderStatusHistory: { create: jest.fn() },
    $executeRaw: jest.fn(),
  }

  const mockPrisma = {
    order: { findUnique: jest.fn(), update: jest.fn(), findUniqueOrThrow: jest.fn() },
    orderStatusHistory: { create: jest.fn() },
    $transaction: jest.fn(async (fn: unknown) => {
      if (typeof fn === 'function') {
        return (fn as (tx: typeof mockTx) => Promise<unknown>)(mockTx)
      }
      return fn
    }),
    $executeRaw: jest.fn(),
    $queryRaw: jest.fn(),
  }

  const mockOrdersService = {
    transition: jest.fn().mockResolvedValue({ id: 'order-1', status: 'cancelled' }),
  }

  beforeEach(async () => {
    jest.clearAllMocks()
    mockRedis.pipeline.mockReturnValue(mockPipelineResult())

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DispatchService,
        { provide: DispatchGateway, useValue: mockGateway },
        { provide: PrismaService, useValue: mockPrisma },
        { provide: 'REDIS_CLIENT', useValue: mockRedis },
        { provide: DriverScoringService, useValue: mockScoring },
        { provide: CooldownService, useValue: mockCooldown },
        { provide: SurgePricingService, useValue: mockSurge },
        { provide: DispatchMetrics, useValue: mockMetrics },
        { provide: OrdersService, useValue: mockOrdersService },
      ],
    }).compile()

    service = module.get(DispatchService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('dispatchOrder', () => {
    it('returns not assigned when lock is held', async () => {
      mockRedis.set.mockResolvedValueOnce(null)
      const result = await service.dispatchOrder('order-1', 10.8231, 106.6297, 5, 1)
      expect(result.assigned).toBe(false)
    })

    it('increments attempts metric with the attempt number', async () => {
      mockRedis.set.mockResolvedValueOnce('OK')
      mockRedis.call.mockResolvedValueOnce([])
      mockRedis.eval.mockResolvedValueOnce(1)

      await service.dispatchOrder('order-1', 10.8231, 106.6297, 3, 2)
      expect(mockMetrics.attemptsTotal.inc).toHaveBeenCalledWith({ attempt_no: '2' })
    })

    it('returns not assigned and records no_candidates metric when no drivers found', async () => {
      mockRedis.set.mockResolvedValueOnce('OK')
      mockRedis.call.mockResolvedValueOnce([])
      mockRedis.eval.mockResolvedValueOnce(1)

      const result = await service.dispatchOrder('order-1', 10.8231, 106.6297, 5, 1)
      expect(result.assigned).toBe(false)
      expect(mockMetrics.noDriverTotal.inc).toHaveBeenCalledWith({ reason: 'no_candidates' })
    })

    it('releases lock via Lua even when no candidates found', async () => {
      mockRedis.set.mockResolvedValueOnce('OK')
      mockRedis.call.mockResolvedValueOnce([])
      mockRedis.eval.mockResolvedValueOnce(1)

      await service.dispatchOrder('order-1', 10.8231, 106.6297, 5, 1)
      expect(mockRedis.eval).toHaveBeenCalledWith(expect.stringContaining('KEYS[1]'), 1, 'lock:dispatch:order-1', expect.any(String))
    })
  })

  describe('findCandidates', () => {
    it('returns empty array when no drivers in area', async () => {
      mockRedis.call.mockResolvedValueOnce([])
      const result = await service.findCandidates(10.8231, 106.6297, 5)
      expect(result).toEqual([])
    })

    it('filters out busy drivers (current_order set)', async () => {
      mockRedis.call.mockResolvedValueOnce([['driver:1', '0.5'], ['driver:2', '1.2']])
      mockRedis.pipeline
        .mockReturnValueOnce(mockPipelineResult([
          [null, 'online'], [null, ''], [null, '4.5'], [null, '1'],
          [null, '0.9'], [null, '0.95'], [null, null], [null, '50'],
        ]))
        .mockReturnValueOnce(mockPipelineResult([
          [null, 'online'], [null, 'order:123'], [null, '4.0'], [null, '1'],
          [null, '0.8'], [null, '0.9'], [null, null], [null, '30'],
        ]))
      const result = await service.findCandidates(10.8231, 106.6297, 5)
      expect(result).toHaveLength(1)
      expect(result[0].driverId).toBe('1')
    })

    it('excludes drivers in cooldown', async () => {
      mockRedis.call.mockResolvedValueOnce([['driver:1', '0.5']])
      mockRedis.pipeline.mockReturnValueOnce(mockPipelineResult([
        [null, 'online'], [null, ''], [null, '4.5'], [null, '1'],
        [null, '0.9'], [null, '0.95'], [null, null], [null, '50'],
      ]))
      mockCooldown.isInCooldown.mockResolvedValueOnce(true)
      const result = await service.findCandidates(10.8231, 106.6297, 5)
      expect(result).toHaveLength(0)
    })

    it('sorts candidates by descending score (higher score first)', async () => {
      mockRedis.call.mockResolvedValueOnce([['driver:1', '2.0'], ['driver:2', '2.0']])
      // driver:1 gets score 0.5, driver:2 gets score 0.8 → driver:2 should come first
      mockScoring.score.mockReturnValueOnce(0.5).mockReturnValueOnce(0.8)
      mockRedis.pipeline
        .mockReturnValueOnce(mockPipelineResult([
          [null, 'online'], [null, ''], [null, '4.2'], [null, '1'],
          [null, '0.7'], [null, '0.8'], [null, null], [null, '50'],
        ]))
        .mockReturnValueOnce(mockPipelineResult([
          [null, 'online'], [null, ''], [null, '4.8'], [null, '1'],
          [null, '0.95'], [null, '0.98'], [null, null], [null, '80'],
        ]))
      const result = await service.findCandidates(10.8231, 106.6297, 5)
      expect(result[0].score).toBeGreaterThan(result[1].score)
    })

    it('keeps compatibility with flat GEOSEARCH replies', async () => {
      mockRedis.call.mockResolvedValueOnce(['driver:1', '0.5'])
      mockRedis.pipeline.mockReturnValueOnce(mockPipelineResult([
        [null, 'online'], [null, ''], [null, '4.5'], [null, '1'],
        [null, '0.9'], [null, '0.95'], [null, null], [null, '50'],
      ]))

      const result = await service.findCandidates(10.8231, 106.6297, 5)

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({ driverId: '1', distKm: 0.5 })
    })
  })

  describe('autoCancelOrder', () => {
    it('transitions via OrdersService and emits order:auto_cancelled event', async () => {
      mockPrisma.order.findUnique.mockResolvedValueOnce({ id: 'order-1', status: 'restaurant_accepted' })
      await service.autoCancelOrder('order-1')
      expect(mockOrdersService.transition).toHaveBeenCalledWith(
        'order-1',
        'cancelled',
        'system',
        'system',
        'no_driver_available',
      )
      expect(mockGateway.broadcastToOrder).toHaveBeenCalledWith(
        'order-1', 'order:auto_cancelled', expect.objectContaining({ orderId: 'order-1' }),
      )
    })

    it('skips cancel when order already left dispatchable states', async () => {
      mockPrisma.order.findUnique.mockResolvedValueOnce({ id: 'order-1', status: 'delivering' })
      await service.autoCancelOrder('order-1')
      expect(mockOrdersService.transition).not.toHaveBeenCalled()
      expect(mockGateway.broadcastToOrder).not.toHaveBeenCalled()
    })
  })

  describe('assignDriver', () => {
    const assignableOrder = {
      restaurantId: '00000000-0000-0000-0000-000000000001',
      deliveryAddressId: '00000000-0000-0000-0000-000000000002',
      status: 'restaurant_accepted',
      driverId: null,
    }

    it('conditionally assigns via updateMany and does not broadcast speed-based ETA', async () => {
      mockPrisma.order.findUniqueOrThrow.mockResolvedValueOnce(assignableOrder)
      mockPrisma.$queryRaw.mockResolvedValueOnce([{
        restLng: 106.7001,
        restLat: 10.8001,
        custLng: 106.7101,
        custLat: 10.8101,
      }])

      await (service as unknown as {
        assignDriver: (
          orderId: string,
          candidate: {
            driverId: string
            distKm: number
            rating: number
            totalDeliveries: number
            score: number
          },
        ) => Promise<void>
      }).assignDriver('order-1', {
        driverId: 'driver-1',
        distKm: 4,
        rating: 4.8,
        totalDeliveries: 120,
        score: 0.9,
      })

      expect(mockRedis.del).toHaveBeenCalledWith('route:order-1:pickup', 'route:order-1:dropoff')
      expect(mockTx.order.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'order-1',
          driverId: null,
          status: { in: ['restaurant_accepted', 'preparing', 'ready_for_pickup'] },
        },
        data: expect.objectContaining({
          driverId: 'driver-1',
          status: 'driver_assigned',
          estimatedDeliveryTimeMinutes: null,
          routePolyline: null,
          routeWaypoints: Prisma.DbNull,
        }),
      })
      expect(mockGateway.sendAssignedOrder).toHaveBeenCalledWith('driver-1', { orderId: 'order-1' })
      expect(mockGateway.broadcastToOrder).toHaveBeenCalledWith(
        'order-1',
        'driver:assigned',
        { driverId: 'driver-1', etaMinutes: null },
      )
    })

    it('rejects assignment when order status is not assignable (B-DISP-02)', async () => {
      mockPrisma.order.findUniqueOrThrow.mockResolvedValueOnce({
        ...assignableOrder,
        status: 'cancelled',
      })

      await expect((service as unknown as {
        assignDriver: (orderId: string, candidate: { driverId: string; distKm: number; rating: number; totalDeliveries: number; score: number }) => Promise<void>
      }).assignDriver('order-1', {
        driverId: 'driver-1',
        distKm: 4,
        rating: 4.8,
        totalDeliveries: 120,
        score: 0.9,
      })).rejects.toThrow(/ORDER_NOT_ASSIGNABLE/)

      expect(mockPrisma.$transaction).not.toHaveBeenCalled()
    })

    it('does not notify driver when Redis driver assignment fails after DB assign', async () => {
      mockPrisma.order.findUniqueOrThrow.mockResolvedValueOnce(assignableOrder)
      mockPrisma.$queryRaw.mockResolvedValueOnce([{
        restLng: 106.7001,
        restLat: 10.8001,
        custLng: 106.7101,
        custLat: 10.8101,
      }])
      mockRedis.pipeline.mockReturnValueOnce(mockPipelineResult([
        [new Error('redis down'), null],
        [null, 'OK'],
        [null, 1],
      ]))

      await expect((service as unknown as {
        assignDriver: (
          orderId: string,
          candidate: {
            driverId: string
            distKm: number
            rating: number
            totalDeliveries: number
            score: number
          },
        ) => Promise<void>
      }).assignDriver('order-1', {
        driverId: 'driver-1',
        distKm: 4,
        rating: 4.8,
        totalDeliveries: 120,
        score: 0.9,
      })).rejects.toThrow('REDIS_DRIVER_ASSIGNMENT_FAILED')

      expect(mockPrisma.$transaction).toHaveBeenCalled()
      expect(mockGateway.sendAssignedOrder).not.toHaveBeenCalled()
    })
  })
})

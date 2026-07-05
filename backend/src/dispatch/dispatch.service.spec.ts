import { Test, TestingModule } from '@nestjs/testing'
import { DispatchService } from './dispatch.service'
import { DispatchGateway } from './dispatch.gateway'
import { PrismaService } from '../database/prisma.service'
import { DriverScoringService } from './driver-scoring.service'
import { CooldownService } from './cooldown.service'
import { SurgePricingService } from './surge-pricing.service'
import { DispatchMetrics } from './dispatch.metrics'

describe('DispatchService', () => {
  let service: DispatchService

  const mockRedis = {
    call: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    setex: jest.fn(),
    eval: jest.fn(),
    pipeline: jest.fn(() => ({
      set: jest.fn().mockReturnThis(),
      get: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([]),
    })),
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

  const mockPrisma = {
    order: { findUnique: jest.fn(), update: jest.fn(), findUniqueOrThrow: jest.fn() },
    orderStatusHistory: { create: jest.fn() },
    $transaction: jest.fn().mockResolvedValue([]),
    $executeRawUnsafe: jest.fn(),
    $queryRawUnsafe: jest.fn(),
  }

  beforeEach(async () => {
    jest.clearAllMocks()
    mockRedis.pipeline.mockReturnValue({
      set: jest.fn().mockReturnThis(),
      get: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([]),
    })

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
        .mockReturnValueOnce({
          set: jest.fn().mockReturnThis(),
          get: jest.fn().mockReturnThis(),
          exec: jest.fn().mockResolvedValue([
            [null, 'online'], [null, ''], [null, '4.5'], [null, '1'],
            [null, '0.9'], [null, '0.95'], [null, null], [null, '50'],
          ]),
        })
        .mockReturnValueOnce({
          set: jest.fn().mockReturnThis(),
          get: jest.fn().mockReturnThis(),
          exec: jest.fn().mockResolvedValue([
            [null, 'online'], [null, 'order:123'], [null, '4.0'], [null, '1'],
            [null, '0.8'], [null, '0.9'], [null, null], [null, '30'],
          ]),
        })
      const result = await service.findCandidates(10.8231, 106.6297, 5)
      expect(result).toHaveLength(1)
      expect(result[0].driverId).toBe('1')
    })

    it('excludes drivers in cooldown', async () => {
      mockRedis.call.mockResolvedValueOnce([['driver:1', '0.5']])
      mockRedis.pipeline.mockReturnValueOnce({
        set: jest.fn().mockReturnThis(),
        get: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([
          [null, 'online'], [null, ''], [null, '4.5'], [null, '1'],
          [null, '0.9'], [null, '0.95'], [null, null], [null, '50'],
        ]),
      })
      mockCooldown.isInCooldown.mockResolvedValueOnce(true)
      const result = await service.findCandidates(10.8231, 106.6297, 5)
      expect(result).toHaveLength(0)
    })

    it('sorts candidates by descending score (higher score first)', async () => {
      mockRedis.call.mockResolvedValueOnce([['driver:1', '2.0'], ['driver:2', '2.0']])
      // driver:1 gets score 0.5, driver:2 gets score 0.8 → driver:2 should come first
      mockScoring.score.mockReturnValueOnce(0.5).mockReturnValueOnce(0.8)
      mockRedis.pipeline
        .mockReturnValueOnce({
          set: jest.fn().mockReturnThis(),
          get: jest.fn().mockReturnThis(),
          exec: jest.fn().mockResolvedValue([
            [null, 'online'], [null, ''], [null, '4.2'], [null, '1'],
            [null, '0.7'], [null, '0.8'], [null, null], [null, '50'],
          ]),
        })
        .mockReturnValueOnce({
          set: jest.fn().mockReturnThis(),
          get: jest.fn().mockReturnThis(),
          exec: jest.fn().mockResolvedValue([
            [null, 'online'], [null, ''], [null, '4.8'], [null, '1'],
            [null, '0.95'], [null, '0.98'], [null, null], [null, '80'],
          ]),
        })
      const result = await service.findCandidates(10.8231, 106.6297, 5)
      expect(result[0].score).toBeGreaterThan(result[1].score)
    })

    it('keeps compatibility with flat GEOSEARCH replies', async () => {
      mockRedis.call.mockResolvedValueOnce(['driver:1', '0.5'])
      mockRedis.pipeline.mockReturnValueOnce({
        set: jest.fn().mockReturnThis(),
        get: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([
          [null, 'online'], [null, ''], [null, '4.5'], [null, '1'],
          [null, '0.9'], [null, '0.95'], [null, null], [null, '50'],
        ]),
      })

      const result = await service.findCandidates(10.8231, 106.6297, 5)

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({ driverId: '1', distKm: 0.5 })
    })
  })

  describe('autoCancelOrder', () => {
    it('calls $transaction and emits order:auto_cancelled event', async () => {
      await service.autoCancelOrder('order-1')
      expect(mockPrisma.$transaction).toHaveBeenCalled()
      expect(mockGateway.broadcastToOrder).toHaveBeenCalledWith(
        'order-1', 'order:auto_cancelled', expect.objectContaining({ orderId: 'order-1' }),
      )
    })
  })
})

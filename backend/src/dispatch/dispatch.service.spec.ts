import { Test, TestingModule } from '@nestjs/testing'
import { DispatchService } from './dispatch.service'
import { DispatchGateway } from './dispatch.gateway'
import { PrismaService } from '../database/prisma.service'
import { getQueueToken } from '@nestjs/bullmq'

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
    geosearch: jest.fn(),
  }

  const mockDispatchQueue = { add: jest.fn() }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DispatchService,
        { provide: DispatchGateway, useValue: { sendNewOrderOffer: jest.fn(), registerOfferResponse: jest.fn(), broadcastToOrder: jest.fn() } },
        { provide: PrismaService, useValue: { order: { findUnique: jest.fn(), update: jest.fn(), findUniqueOrThrow: jest.fn() }, orderStatusHistory: { create: jest.fn() }, $transaction: jest.fn(), $executeRawUnsafe: jest.fn(), $queryRawUnsafe: jest.fn() } },
        { provide: getQueueToken('dispatch'), useValue: mockDispatchQueue },
        { provide: 'REDIS_CLIENT', useValue: mockRedis },
      ],
    }).compile()

    service = module.get(DispatchService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('dispatchOrder', () => {
    it('should return not assigned when lock is held', async () => {
      mockRedis.set.mockResolvedValueOnce(null) // SET NX fails
      const result = await service.dispatchOrder('order-1', 10.8231, 106.6297)
      expect(result.assigned).toBe(false)
    })

    it('should try to find candidates when lock acquired', async () => {
      mockRedis.set.mockResolvedValueOnce('OK') // lock acquired
      mockRedis.call.mockResolvedValueOnce([]) // no candidates
      mockRedis.eval.mockResolvedValueOnce(1) // lock released

      const result = await service.dispatchOrder('order-1', 10.8231, 106.6297)
      expect(result.assigned).toBe(false)
    })
  })

  describe('findCandidates', () => {
    it('should return empty array when no drivers in area', async () => {
      mockRedis.call.mockResolvedValueOnce([])
      const result = await service.findCandidates(10.8231, 106.6297, 5)
      expect(result).toEqual([])
    })

    it('should filter busy drivers', async () => {
      mockRedis.call.mockResolvedValueOnce([['driver:1', '0.5'], ['driver:2', '1.2']])
      mockRedis.pipeline.mockReturnValueOnce({
        get: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([
          [null, 'online'], [null, ''], [null, '4.5'], [null, '1'], // driver 1: free
          [null, 'online'], [null, 'order:123'], [null, '4.0'], [null, '1'], // driver 2: busy
        ]),
      })
      const result = await service.findCandidates(10.8231, 106.6297, 5)
      expect(result).toHaveLength(1)
      expect(result[0].driverId).toBe('1')
    })

    it('should sort by distance ASC then rating DESC', async () => {
      mockRedis.call.mockResolvedValueOnce([
        ['driver:1', '2.0'], ['driver:2', '2.0'], // same distance
      ])
      mockRedis.pipeline.mockReturnValueOnce({
        get: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([
          [null, 'online'], [null, ''], [null, '4.2'], [null, '1'],
          [null, 'online'], [null, ''], [null, '4.8'], [null, '1'],
        ]),
      })
      const result = await service.findCandidates(10.8231, 106.6297, 5)
      expect(result[0].rating).toBe(4.8)
      expect(result[1].rating).toBe(4.2)
    })
  })
})

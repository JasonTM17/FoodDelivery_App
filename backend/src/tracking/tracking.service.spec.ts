import { Test, TestingModule } from '@nestjs/testing'
import { TrackingService } from './tracking.service'
import { PrismaService } from '../database/prisma.service'

describe('TrackingService', () => {
  let service: TrackingService
  const mockRedis = { geoadd: jest.fn(), setex: jest.fn(), get: jest.fn(), geopos: jest.fn() }
  const mockPrisma = { $executeRawUnsafe: jest.fn(), $queryRawUnsafe: jest.fn().mockResolvedValue([]) }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrackingService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: 'REDIS_CLIENT', useValue: mockRedis },
      ],
    }).compile()
    service = module.get(TrackingService)
  })

  describe('calculateETA', () => {
    it('returns positive minutes for valid distance', () => {
      const eta = service.calculateETA(10.8231, 106.6297, 10.7800, 106.6950)
      expect(eta).toBeGreaterThan(0)
    })

    it('nearby locations have shorter ETA', () => {
      const near = service.calculateETA(10.8, 106.7, 10.8001, 106.7001)
      const far = service.calculateETA(10.8, 106.7, 11.0, 107.0)
      expect(near).toBeLessThan(far)
    })
  })

  describe('handleLocationUpdate', () => {
    it('stores driver location in Redis', async () => {
      mockRedis.get.mockResolvedValueOnce(null)
      const orderId = await service.handleLocationUpdate('d1', {
        lat: 10.8, lng: 106.7, bearing: 90, speed: 20, accuracy: 10,
      })
      expect(mockRedis.geoadd).toHaveBeenCalled()
      expect(mockRedis.setex).toHaveBeenCalled()
    })
  })
})

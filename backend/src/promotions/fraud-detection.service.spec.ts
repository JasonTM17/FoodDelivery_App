import { Test, TestingModule } from '@nestjs/testing'
import { FraudDetectionService } from './fraud-detection.service'

const redisMock = {
  zremrangebyscore: jest.fn().mockResolvedValue(0),
  zcard: jest.fn().mockResolvedValue(0),
  zadd: jest.fn().mockResolvedValue(1),
  expire: jest.fn().mockResolvedValue(1),
}

describe('FraudDetectionService', () => {
  let service: FraudDetectionService

  beforeEach(async () => {
    jest.clearAllMocks()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FraudDetectionService,
        { provide: 'REDIS_CLIENT', useValue: redisMock },
      ],
    }).compile()

    service = module.get(FraudDetectionService)
  })

  describe('check', () => {
    it('is not blocked when device has 0 prior claims', async () => {
      redisMock.zcard.mockResolvedValueOnce(0)
      const result = await service.check('device-abc')
      expect(result.blocked).toBe(false)
    })

    it('is not blocked when device has 2 prior claims (below threshold)', async () => {
      redisMock.zcard.mockResolvedValueOnce(2)
      const result = await service.check('device-abc')
      expect(result.blocked).toBe(false)
    })

    it('is blocked when device has exactly 3 claims (at threshold)', async () => {
      redisMock.zcard.mockResolvedValueOnce(3)
      const result = await service.check('device-abc')
      expect(result.blocked).toBe(true)
      expect(result.reason).toContain('3')
    })

    it('is blocked when device has more than 3 claims (4th attempt)', async () => {
      redisMock.zcard.mockResolvedValueOnce(4)
      const result = await service.check('device-abc')
      expect(result.blocked).toBe(true)
    })

    it('calls zremrangebyscore to prune stale entries', async () => {
      await service.check('device-xyz')
      expect(redisMock.zremrangebyscore).toHaveBeenCalledWith(
        'promo:device:device-xyz',
        '-inf',
        expect.any(Number),
      )
    })
  })

  describe('record', () => {
    it('adds entry to sorted set with correct key', async () => {
      await service.record('device-abc')
      expect(redisMock.zadd).toHaveBeenCalledWith(
        'promo:device:device-abc',
        expect.any(Number),
        expect.any(String),
      )
    })

    it('sets TTL of 3600 seconds on the key', async () => {
      await service.record('device-abc')
      expect(redisMock.expire).toHaveBeenCalledWith('promo:device:device-abc', 3600)
    })
  })
})

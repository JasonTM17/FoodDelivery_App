import { CooldownService } from './cooldown.service'

const makeMockRedis = () => ({
  zadd: jest.fn().mockResolvedValue(1),
  pexpire: jest.fn().mockResolvedValue(1),
  zcount: jest.fn().mockResolvedValue(0),
  zrange: jest.fn().mockResolvedValue([]),
  zremrangebyscore: jest.fn().mockResolvedValue(0),
  scan: jest.fn().mockResolvedValue(['0', []]),
})

describe('CooldownService', () => {
  let service: CooldownService
  let redis: ReturnType<typeof makeMockRedis>

  beforeEach(() => {
    redis = makeMockRedis()
    service = new CooldownService(redis as never)
  })

  describe('recordTimeout', () => {
    it('adds current timestamp to sorted set for the driver', async () => {
      const before = Date.now()
      await service.recordTimeout('d1')
      const [key, score] = redis.zadd.mock.calls[0] as [string, number, string]
      expect(key).toBe('cooldown:driver:d1')
      expect(score).toBeGreaterThanOrEqual(before)
    })

    it('sets 24-hour TTL on the key', async () => {
      await service.recordTimeout('d1')
      expect(redis.pexpire).toHaveBeenCalledWith('cooldown:driver:d1', 24 * 60 * 60 * 1000)
    })

    it('records multiple timeouts with unique members', async () => {
      await service.recordTimeout('d1')
      await service.recordTimeout('d1')
      expect(redis.zadd).toHaveBeenCalledTimes(2)
    })
  })

  describe('isInCooldown', () => {
    it('returns false when driver has 0 recent timeouts', async () => {
      redis.zcount.mockResolvedValue(0)
      expect(await service.isInCooldown('d1')).toBe(false)
    })

    it('returns false when driver has 2 recent timeouts (below threshold of 3)', async () => {
      redis.zcount.mockResolvedValue(2)
      expect(await service.isInCooldown('d1')).toBe(false)
    })

    it('returns true when 3+ timeouts in window AND latest within 5 min', async () => {
      redis.zcount.mockResolvedValue(3)
      const recent = (Date.now() - 60_000).toString()  // 1 min ago — within 5-min cooldown
      redis.zrange.mockResolvedValue([recent, recent])
      expect(await service.isInCooldown('d1')).toBe(true)
    })

    it('returns false when 3 timeouts in window BUT latest older than 5 min', async () => {
      redis.zcount.mockResolvedValue(3)
      const old = (Date.now() - 6 * 60 * 1000).toString()  // 6 min ago
      redis.zrange.mockResolvedValue([old, old])
      expect(await service.isInCooldown('d1')).toBe(false)
    })

    it('returns false when zrange returns empty (key missing or inconsistent state)', async () => {
      redis.zcount.mockResolvedValue(5)
      redis.zrange.mockResolvedValue([])
      expect(await service.isInCooldown('d1')).toBe(false)
    })

    it('queries correct Redis key per driverId', async () => {
      await service.isInCooldown('driverXYZ')
      expect(redis.zcount).toHaveBeenCalledWith('cooldown:driver:driverXYZ', expect.any(Number), '+inf')
    })

    it('counts only timestamps within 15-minute window', async () => {
      await service.isInCooldown('d1')
      const [, min] = redis.zcount.mock.calls[0] as [string, number, string]
      expect(Date.now() - min).toBeGreaterThanOrEqual(15 * 60 * 1000 - 50)  // approx 15 min
    })
  })

  describe('pruneDriver', () => {
    it('removes entries older than 24h for a specific driver', async () => {
      const before = Date.now()
      await service.pruneDriver('d1')
      const [key, , max] = redis.zremrangebyscore.mock.calls[0] as [string, string, number]
      expect(key).toBe('cooldown:driver:d1')
      expect(max).toBeLessThanOrEqual(before - 24 * 60 * 60 * 1000 + 50)
    })
  })

  describe('pruneAll', () => {
    it('scans cooldown:driver:* keys and prunes each one', async () => {
      redis.scan.mockResolvedValue(['0', ['cooldown:driver:d1', 'cooldown:driver:d2']])
      await service.pruneAll()
      expect(redis.zremrangebyscore).toHaveBeenCalledTimes(2)
      expect(redis.zremrangebyscore).toHaveBeenCalledWith('cooldown:driver:d1', '-inf', expect.any(Number))
      expect(redis.zremrangebyscore).toHaveBeenCalledWith('cooldown:driver:d2', '-inf', expect.any(Number))
    })

    it('handles empty scan result gracefully without throwing', async () => {
      redis.scan.mockResolvedValue(['0', []])
      await expect(service.pruneAll()).resolves.not.toThrow()
    })

    it('iterates until cursor returns 0 (pagination)', async () => {
      redis.scan
        .mockResolvedValueOnce(['42', ['cooldown:driver:d1']])
        .mockResolvedValueOnce(['0', ['cooldown:driver:d2']])
      await service.pruneAll()
      expect(redis.scan).toHaveBeenCalledTimes(2)
      expect(redis.zremrangebyscore).toHaveBeenCalledTimes(2)
    })
  })
})

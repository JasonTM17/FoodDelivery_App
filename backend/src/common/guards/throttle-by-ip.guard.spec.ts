import { ThrottleByIpGuard } from './throttle-by-ip.guard'
import { Request } from 'express'

describe('ThrottleByIpGuard', () => {
  describe('getTracker', () => {
    const getTracker = ThrottleByIpGuard.prototype['getTracker'].bind(
      Object.create(ThrottleByIpGuard.prototype),
    )

    it('returns the request IP when present', async () => {
      const req = { ip: '192.168.1.1' } as Request
      const result = await getTracker(req)
      expect(result).toBe('192.168.1.1')
    })

    it('returns "unknown" when req.ip is undefined', async () => {
      const req = {} as Request
      const result = await getTracker(req)
      expect(result).toBe('unknown')
    })

    it('returns "unknown" when req.ip is null', async () => {
      const req = { ip: null } as unknown as Request
      const result = await getTracker(req)
      expect(result).toBe('unknown')
    })

    it('returns the exact IP string without modification', async () => {
      const req = { ip: '::1' } as Request
      const result = await getTracker(req)
      expect(result).toBe('::1')
    })
  })
})

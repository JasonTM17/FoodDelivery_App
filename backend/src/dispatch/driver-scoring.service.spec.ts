import { DriverScoringService, DriverScoreInput } from './driver-scoring.service'

const svc = new DriverScoringService()

function input(overrides: Partial<DriverScoreInput> = {}): DriverScoreInput {
  return {
    driverId: 'test-driver',
    distKm: 2,
    rating: 4.5,
    acceptanceRate7d: 0.9,
    completionRate7d: 0.95,
    idleMinutes: 10,
    totalDeliveries: 50,
    ...overrides,
  }
}

describe('DriverScoringService', () => {
  describe('baseline', () => {
    it('score for typical driver is in range [0, 1]', () => {
      const s = svc.score(input())
      expect(s).toBeGreaterThanOrEqual(0)
      expect(s).toBeLessThanOrEqual(1)
    })

    it('closer driver scores higher than farther driver (all else equal)', () => {
      expect(svc.score(input({ distKm: 1 }))).toBeGreaterThan(svc.score(input({ distKm: 6 })))
    })

    it('higher-rated driver scores higher (all else equal)', () => {
      expect(svc.score(input({ rating: 5 }))).toBeGreaterThan(svc.score(input({ rating: 3 })))
    })

    it('renormalizes measured factors instead of inventing missing rates or idle time', () => {
      const score = svc.score(input({
        distKm: 0,
        rating: 5,
        acceptanceRate7d: undefined,
        completionRate7d: undefined,
        idleMinutes: undefined,
        totalDeliveries: 50,
      }))

      expect(score).toBeCloseTo(1, 5)
    })
  })

  describe('distance component (40% weight)', () => {
    it('dist=0 contributes full 0.40 and nothing else when all others are min', () => {
      const s = svc.score(input({ distKm: 0, rating: 0, acceptanceRate7d: 0, completionRate7d: 0, idleMinutes: 0, totalDeliveries: 50 }))
      expect(s).toBeCloseTo(0.40, 5)
    })

    it('dist=10km (max) gives zero distance contribution', () => {
      const s = svc.score(input({ distKm: 10, rating: 0, acceptanceRate7d: 0, completionRate7d: 0, idleMinutes: 0, totalDeliveries: 50 }))
      expect(s).toBeCloseTo(0, 5)
    })

    it('dist > max is clamped — same as dist=10', () => {
      const atMax = svc.score(input({ distKm: 10, rating: 4, acceptanceRate7d: 0.8, completionRate7d: 0.9, idleMinutes: 30, totalDeliveries: 50 }))
      const over = svc.score(input({ distKm: 15, rating: 4, acceptanceRate7d: 0.8, completionRate7d: 0.9, idleMinutes: 30, totalDeliveries: 50 }))
      expect(over).toBeCloseTo(atMax, 5)
    })
  })

  describe('rating component (20% weight)', () => {
    it('rating=5 adds full 0.20 when all others are zero', () => {
      const s = svc.score(input({ distKm: 10, rating: 5, acceptanceRate7d: 0, completionRate7d: 0, idleMinutes: 0, totalDeliveries: 50 }))
      expect(s).toBeCloseTo(0.20, 5)
    })

    it('rating=0 gives zero rating contribution', () => {
      const s = svc.score(input({ distKm: 10, rating: 0, acceptanceRate7d: 0, completionRate7d: 0, idleMinutes: 0, totalDeliveries: 50 }))
      expect(s).toBeCloseTo(0, 5)
    })
  })

  describe('cold-start blending', () => {
    it('totalDeliveries=0 uses full 4.5 prior regardless of raw rating (0 vs 5)', () => {
      const zero = svc.score(input({ rating: 0, totalDeliveries: 0, distKm: 10, acceptanceRate7d: 0, completionRate7d: 0, idleMinutes: 0 }))
      const five = svc.score(input({ rating: 5, totalDeliveries: 0, distKm: 10, acceptanceRate7d: 0, completionRate7d: 0, idleMinutes: 0 }))
      expect(zero).toBeCloseTo(five, 5)
    })

    it('totalDeliveries=0 effective rating equals prior (4.5)', () => {
      // When totalDeliveries=0, effectiveRating = 4.5 → score = 4.5/5 * 0.20 = 0.18
      const s = svc.score(input({ rating: 1, totalDeliveries: 0, distKm: 10, acceptanceRate7d: 0, completionRate7d: 0, idleMinutes: 0 }))
      expect(s).toBeCloseTo(4.5 / 5 * 0.20, 4)
    })

    it('totalDeliveries=10 blends raw rating with prior at 50%', () => {
      const raw = 2.0
      // effectiveRating = (raw*10 + 4.5*10) / 20 = (raw + 4.5) / 2
      const expected = ((raw + 4.5) / 2) / 5 * 0.20
      const s = svc.score(input({ rating: raw, totalDeliveries: 10, distKm: 10, acceptanceRate7d: 0, completionRate7d: 0, idleMinutes: 0 }))
      expect(s).toBeCloseTo(expected, 4)
    })

    it('totalDeliveries=20 uses raw rating (no blending applied)', () => {
      // prior 4.5 > raw 3.0, so blended (19 deliveries) > raw (20 deliveries)
      const blended = svc.score(input({ rating: 3.0, totalDeliveries: 19 }))
      const raw = svc.score(input({ rating: 3.0, totalDeliveries: 20 }))
      expect(blended).toBeGreaterThan(raw)
    })

    it('new driver (0 deliveries, rating=1) beats same low-rated veteran on rating score', () => {
      const newD = svc.score(input({ rating: 1.0, totalDeliveries: 0, distKm: 10, acceptanceRate7d: 0, completionRate7d: 0, idleMinutes: 0 }))
      const vet = svc.score(input({ rating: 1.0, totalDeliveries: 100, distKm: 10, acceptanceRate7d: 0, completionRate7d: 0, idleMinutes: 0 }))
      expect(newD).toBeGreaterThan(vet)
    })
  })

  describe('acceptance and completion rate (15% + 15%)', () => {
    it('acceptanceRate=0 and completionRate=0 contributes nothing', () => {
      const s = svc.score(input({ distKm: 10, rating: 0, acceptanceRate7d: 0, completionRate7d: 0, idleMinutes: 0, totalDeliveries: 50 }))
      expect(s).toBeCloseTo(0, 5)
    })

    it('completionRate=1 alone contributes exactly 0.15', () => {
      const s = svc.score(input({ distKm: 10, rating: 0, acceptanceRate7d: 0, completionRate7d: 1, idleMinutes: 0, totalDeliveries: 50 }))
      expect(s).toBeCloseTo(0.15, 5)
    })

    it('rates above 1.0 are clamped — no overflow beyond weights', () => {
      const normal = svc.score(input({ acceptanceRate7d: 1.0, completionRate7d: 1.0 }))
      const overflow = svc.score(input({ acceptanceRate7d: 2.5, completionRate7d: 3.0 }))
      expect(overflow).toBeCloseTo(normal, 5)
    })
  })

  describe('idle time component (10% weight)', () => {
    it('idleMinutes=0 gives zero idle contribution', () => {
      const s = svc.score(input({ distKm: 10, rating: 0, acceptanceRate7d: 0, completionRate7d: 0, idleMinutes: 0, totalDeliveries: 50 }))
      expect(s).toBeCloseTo(0, 5)
    })

    it('idleMinutes=120 (max) contributes exactly 0.10', () => {
      const s = svc.score(input({ distKm: 10, rating: 0, acceptanceRate7d: 0, completionRate7d: 0, idleMinutes: 120, totalDeliveries: 50 }))
      expect(s).toBeCloseTo(0.10, 5)
    })

    it('idleMinutes=999 is capped — same score as idleMinutes=120', () => {
      const capped = svc.score(input({ idleMinutes: 999 }))
      const atMax = svc.score(input({ idleMinutes: 120 }))
      expect(capped).toBeCloseTo(atMax, 5)
    })
  })

  describe('boundary / extreme cases', () => {
    it('all maximum values yields score of exactly 1.0', () => {
      const s = svc.score(input({ distKm: 0, rating: 5, acceptanceRate7d: 1, completionRate7d: 1, idleMinutes: 120, totalDeliveries: 100 }))
      expect(s).toBeCloseTo(1.0, 5)
    })

    it('all minimum values (dist=10, zero rates) yields score of 0', () => {
      const s = svc.score(input({ distKm: 10, rating: 0, acceptanceRate7d: 0, completionRate7d: 0, idleMinutes: 0, totalDeliveries: 50 }))
      expect(s).toBeCloseTo(0, 5)
    })
  })
})

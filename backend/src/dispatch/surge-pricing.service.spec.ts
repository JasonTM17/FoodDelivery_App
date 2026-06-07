import { SurgePricingService } from './surge-pricing.service'

const mockGateway = { emitToAdmins: jest.fn(), broadcastToOrder: jest.fn() }

describe('SurgePricingService', () => {
  let service: SurgePricingService

  beforeEach(() => {
    jest.clearAllMocks()
    service = new SurgePricingService(mockGateway as never)
  })

  describe('checkAndUpdate — no surge conditions', () => {
    it('returns 1.0 when drivers found regardless of attempt', () => {
      expect(service.checkAndUpdate(10.8, 106.7, 5, true)).toBe(1.0)
    })

    it('returns 1.0 for attempt 1 with no drivers (below trigger)', () => {
      expect(service.checkAndUpdate(10.8, 106.7, 1, false)).toBe(1.0)
    })

    it('returns 1.0 for attempt 2 with no drivers (below trigger)', () => {
      expect(service.checkAndUpdate(10.8, 106.7, 2, false)).toBe(1.0)
    })
  })

  describe('checkAndUpdate — surge activation', () => {
    it('activates surge at 1.2x on attempt 3 with no drivers', () => {
      expect(service.checkAndUpdate(10.8, 106.7, 3, false)).toBe(1.2)
    })

    it('emits dispatch:surge_active admin event on first activation', () => {
      service.checkAndUpdate(10.8, 106.7, 3, false)
      expect(mockGateway.emitToAdmins).toHaveBeenCalledTimes(1)
      expect(mockGateway.emitToAdmins).toHaveBeenCalledWith(
        'dispatch:surge_active',
        expect.objectContaining({ multiplier: 1.2 }),
      )
    })

    it('does NOT re-emit surge event when zone is already active', () => {
      service.checkAndUpdate(10.8, 106.7, 3, false)
      service.checkAndUpdate(10.8, 106.7, 4, false)
      expect(mockGateway.emitToAdmins).toHaveBeenCalledTimes(1)
    })
  })

  describe('checkAndUpdate — multiplier escalation', () => {
    it('increments multiplier by 0.1 on each subsequent failure', () => {
      service.checkAndUpdate(10.8, 106.7, 3, false)  // 1.2
      const m = service.checkAndUpdate(10.8, 106.7, 4, false)  // 1.3
      expect(m).toBeCloseTo(1.3, 5)
    })

    it('caps multiplier at 1.5 and does not exceed it', () => {
      service.checkAndUpdate(10.8, 106.7, 3, false)  // 1.2
      service.checkAndUpdate(10.8, 106.7, 4, false)  // 1.3
      service.checkAndUpdate(10.8, 106.7, 5, false)  // 1.4
      service.checkAndUpdate(10.8, 106.7, 5, false)  // 1.5
      const capped1 = service.checkAndUpdate(10.8, 106.7, 5, false)  // still 1.5
      const capped2 = service.checkAndUpdate(10.8, 106.7, 5, false)  // still 1.5
      expect(capped1).toBeCloseTo(1.5, 5)
      expect(capped2).toBeCloseTo(1.5, 5)
    })
  })

  describe('checkAndUpdate — surge clearing', () => {
    it('clears zone surge when drivers are found', () => {
      service.checkAndUpdate(10.8, 106.7, 3, false)
      service.checkAndUpdate(10.8, 106.7, 4, true)  // drivers found — clear
      expect(service.getMultiplier(10.8, 106.7)).toBe(1.0)
    })

    it('zone count drops to 0 after clearing', () => {
      service.checkAndUpdate(10.8, 106.7, 3, false)
      service.checkAndUpdate(10.8, 106.7, 4, true)
      expect(service.activeZoneCount()).toBe(0)
    })
  })

  describe('zone isolation', () => {
    it('different lat/lng zones are tracked independently', () => {
      service.checkAndUpdate(10.8, 106.7, 3, false)  // zone A surges
      const zoneB = service.checkAndUpdate(10.0, 106.0, 1, false)  // zone B: attempt < trigger
      expect(zoneB).toBe(1.0)
    })

    it('two active zones tracked simultaneously', () => {
      service.checkAndUpdate(10.8, 106.7, 3, false)
      service.checkAndUpdate(11.5, 107.5, 3, false)
      expect(service.activeZoneCount()).toBe(2)
    })
  })

  describe('getMultiplier', () => {
    it('returns 1.0 for a zone with no surge', () => {
      expect(service.getMultiplier(10.8, 106.7)).toBe(1.0)
    })

    it('returns active multiplier for a surged zone', () => {
      service.checkAndUpdate(10.8, 106.7, 3, false)
      expect(service.getMultiplier(10.8, 106.7)).toBe(1.2)
    })
  })
})

import { Injectable } from '@nestjs/common'
import { DispatchNotifierService } from './dispatch-notifier.service'

const BASE_MULTIPLIER = 1.0
const SURGE_STEP_MULTIPLIER = 1.2
const SURGE_INCREMENT = 0.1
const SURGE_CAP = 1.5
const SURGE_DURATION_MS = 15 * 60 * 1000  // 15 min per zone
const TRIGGER_ATTEMPT = 3  // start surge after this many failed attempts

interface ZoneState {
  multiplier: number
  activatedAt: number
}

// Approximate geohash precision-5 (~4.9km × 4.9km cells) using 0.05° buckets
function zoneId(lat: number, lng: number): string {
  return `${Math.floor(lat * 20)}:${Math.floor(lng * 20)}`
}

@Injectable()
export class SurgePricingService {
  private readonly zones = new Map<string, ZoneState>()

  constructor(private readonly notifier: DispatchNotifierService) {}

  /**
   * Evaluate surge for a zone after a failed dispatch round.
   * Returns the current surge multiplier to apply to the driver payout.
   * Emits `dispatch:surge_active` to admins when first activated.
   */
  checkAndUpdate(lat: number, lng: number, attempt: number, foundDrivers: boolean): number {
    this.pruneExpired()
    const zone = zoneId(lat, lng)

    if (foundDrivers) {
      this.zones.delete(zone)
      return BASE_MULTIPLIER
    }

    if (attempt < TRIGGER_ATTEMPT) {
      return this.zones.get(zone)?.multiplier ?? BASE_MULTIPLIER
    }

    const existing = this.zones.get(zone)

    if (!existing) {
      const multiplier = SURGE_STEP_MULTIPLIER
      this.zones.set(zone, { multiplier, activatedAt: Date.now() })
      this.notifier.emitToAdmins('dispatch:surge_active', { zone, multiplier, lat, lng })
      return multiplier
    }

    const bumped = Math.min(SURGE_CAP, existing.multiplier + SURGE_INCREMENT)
    this.zones.set(zone, { ...existing, multiplier: bumped })
    return bumped
  }

  /**
   * Get the current surge multiplier for a lat/lng zone without modifying state.
   */
  getMultiplier(lat: number, lng: number): number {
    this.pruneExpired()
    return this.zones.get(zoneId(lat, lng))?.multiplier ?? BASE_MULTIPLIER
  }

  /** Visible for testing */
  activeZoneCount(): number {
    this.pruneExpired()
    return this.zones.size
  }

  private pruneExpired(): void {
    const now = Date.now()
    for (const [key, state] of this.zones) {
      if (now - state.activatedAt > SURGE_DURATION_MS) {
        this.zones.delete(key)
      }
    }
  }
}

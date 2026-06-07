import { Injectable } from '@nestjs/common'

export interface DriverScoreInput {
  driverId: string
  distKm: number
  rating: number
  acceptanceRate7d: number  // 0-1
  completionRate7d: number  // 0-1
  idleMinutes: number
  totalDeliveries: number
}

const MAX_DIST_KM = 10
const MAX_IDLE_MIN = 120
const COLD_START_THRESHOLD = 20
const COLD_START_RATING_PRIOR = 4.5

// Weight distribution: distance 40%, rating 20%, acceptance 15%, completion 15%, idle 10%
const W_DIST = 0.40
const W_RATING = 0.20
const W_ACCEPT = 0.15
const W_COMPLETION = 0.15
const W_IDLE = 0.10

@Injectable()
export class DriverScoringService {
  /**
   * Score a driver candidate for dispatch assignment.
   * Returns a value in [0, 1] where higher = better candidate.
   * Cold-start blending: drivers with < 20 deliveries get a Bayesian
   * shrinkage toward a 4.5 prior to avoid penalising new drivers.
   */
  score(input: DriverScoreInput): number {
    const effectiveRating = this.effectiveRating(input.rating, input.totalDeliveries)

    const distScore = Math.max(0, 1 - input.distKm / MAX_DIST_KM)
    const ratingScore = Math.max(0, Math.min(1, effectiveRating / 5.0))
    const acceptScore = Math.max(0, Math.min(1, input.acceptanceRate7d))
    const completionScore = Math.max(0, Math.min(1, input.completionRate7d))
    const idleScore = Math.min(1, input.idleMinutes / MAX_IDLE_MIN)

    return (
      distScore * W_DIST +
      ratingScore * W_RATING +
      acceptScore * W_ACCEPT +
      completionScore * W_COMPLETION +
      idleScore * W_IDLE
    )
  }

  private effectiveRating(rawRating: number, totalDeliveries: number): number {
    if (totalDeliveries >= COLD_START_THRESHOLD) return rawRating
    // Bayesian blend: weighted average of observed rating + prior
    const weight = totalDeliveries
    const priorWeight = COLD_START_THRESHOLD - totalDeliveries
    return (rawRating * weight + COLD_START_RATING_PRIOR * priorWeight) / COLD_START_THRESHOLD
  }
}

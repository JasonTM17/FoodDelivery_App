import { Injectable, Inject, Logger, ServiceUnavailableException } from '@nestjs/common'
import Redis from 'ioredis'
import { GeoPoint, RouteResult } from '../common/types/location.types'

// ─── Provider response shapes ────────────────────────────────────────────────

interface GoogleLeg {
  distance: { value: number }
  duration: { value: number }
  duration_in_traffic?: { value: number }
  steps: Array<{ end_location: { lat: number; lng: number } }>
}

interface GoogleDirectionsResponse {
  status: string
  routes: Array<{
    overview_polyline: { points: string }
    legs: GoogleLeg[]
  }>
}

interface OsrmStep {
  maneuver: { location: [number, number] }
}

interface OsrmResponse {
  code: string
  routes: Array<{
    geometry: string
    distance: number
    duration: number
    legs: Array<{ steps: OsrmStep[] }>
  }>
}

// ─── Provider abstraction ─────────────────────────────────────────────────────

interface IRouteProvider {
  fetchRoute(origin: GeoPoint, destination: GeoPoint): Promise<RouteResult>
}

const DIRECTIONS_TIMEOUT_MS = Number.parseInt(process.env.DIRECTIONS_TIMEOUT_MS ?? '5000', 10)

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), DIRECTIONS_TIMEOUT_MS)
  try {
    return await fetch(url, { signal: controller.signal })
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      throw new Error(`Directions provider timed out after ${DIRECTIONS_TIMEOUT_MS}ms`)
    }
    throw error
  } finally {
    clearTimeout(timeout)
  }
}

class GoogleDirectionsProvider implements IRouteProvider {
  private readonly logger = new Logger('GoogleDirectionsProvider')

  constructor(private readonly apiKey: string) {}

  async fetchRoute(origin: GeoPoint, destination: GeoPoint): Promise<RouteResult> {
    const url =
      `https://maps.googleapis.com/maps/api/directions/json` +
      `?origin=${origin.lat},${origin.lng}` +
      `&destination=${destination.lat},${destination.lng}` +
      `&departure_time=now&traffic_model=best_guess` +
      `&key=${this.apiKey}`

    const res = await fetchWithTimeout(url)
    if (!res.ok) throw new Error(`Google Directions HTTP ${res.status}`)

    const json = (await res.json()) as GoogleDirectionsResponse
    if (json.status !== 'OK' || !json.routes.length) {
      throw new Error(`Google Directions status: ${json.status}`)
    }

    const leg = json.routes[0].legs[0]
    const waypoints: GeoPoint[] = leg.steps.map((s) => ({
      lat: s.end_location.lat,
      lng: s.end_location.lng,
    }))

    return {
      polyline: json.routes[0].overview_polyline.points,
      distanceMeters: leg.distance.value,
      durationSeconds: leg.duration_in_traffic?.value ?? leg.duration.value,
      waypoints,
      provider: 'google',
    }
  }
}

class OsrmRouteProvider implements IRouteProvider {
  constructor(private readonly baseUrl: string) {}

  async fetchRoute(origin: GeoPoint, destination: GeoPoint): Promise<RouteResult> {
    const url =
      `${this.baseUrl}/route/v1/driving/` +
      `${origin.lng},${origin.lat};${destination.lng},${destination.lat}` +
      `?overview=full&geometries=polyline&steps=true`

    const res = await fetchWithTimeout(url)
    if (!res.ok) throw new Error(`OSRM HTTP ${res.status}`)

    const json = (await res.json()) as OsrmResponse
    if (json.code !== 'Ok' || !json.routes.length) {
      throw new Error(`OSRM status: ${json.code}`)
    }

    const route = json.routes[0]
    const waypoints: GeoPoint[] = route.legs[0].steps.map((s) => ({
      lat: s.maneuver.location[1],
      lng: s.maneuver.location[0],
    }))

    return {
      polyline: route.geometry,
      distanceMeters: Math.round(route.distance),
      durationSeconds: Math.round(route.duration),
      waypoints,
      provider: 'osrm',
    }
  }
}

// ─── Orchestrator service ─────────────────────────────────────────────────────

@Injectable()
export class DirectionsApiService {
  private readonly logger = new Logger(DirectionsApiService.name)
  private readonly googleProvider: IRouteProvider | null
  private readonly osrmProvider: IRouteProvider | null

  /** Daily limit before switching to OSRM. Default 10 000 (Google free tier). */
  private readonly dailyLimit: number

  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY
    this.googleProvider = apiKey ? new GoogleDirectionsProvider(apiKey) : null
    const osrmUrl = resolveOsrmUrl(process.env)
    this.osrmProvider = osrmUrl ? new OsrmRouteProvider(osrmUrl) : null
    this.dailyLimit = parseInt(process.env.DIRECTIONS_DAILY_LIMIT ?? '10000', 10)

    if (!this.googleProvider && !this.osrmProvider) {
      this.logger.warn('No directions provider configured; route calculation is unavailable')
    }
  }

  async fetchRoute(origin: GeoPoint, destination: GeoPoint): Promise<RouteResult> {
    if (this.googleProvider && (await this.isQuotaAvailable())) {
      try {
        const result = await this.googleProvider.fetchRoute(origin, destination)
        await this.incrementQuota()
        return result
      } catch (err) {
        this.logger.warn(
          `Google Directions failed, falling back to OSRM: ${(err as Error).message}`,
        )
      }
    } else if (this.googleProvider) {
      this.logger.warn('Google Directions quota at 80 % — using OSRM fallback')
    }

    if (!this.osrmProvider) {
      throw new ServiceUnavailableException('DIRECTIONS_PROVIDER_NOT_CONFIGURED')
    }

    return this.osrmProvider.fetchRoute(origin, destination)
  }

  // ─── Quota helpers ──────────────────────────────────────────────────────────

  private quotaKey(): string {
    return `directions:quota:${new Date().toISOString().slice(0, 10)}`
  }

  async isQuotaAvailable(): Promise<boolean> {
    const used = parseInt((await this.redis.get(this.quotaKey())) ?? '0', 10)
    return used < this.dailyLimit * 0.8
  }

  private async incrementQuota(): Promise<void> {
    const key = this.quotaKey()
    await this.redis.incr(key)
    // TTL set once; INCR on existing key preserves TTL, so only set on first call
    await this.redis.expire(key, 86_400)
  }
}

function resolveOsrmUrl(env: NodeJS.ProcessEnv): string | undefined {
  const configuredUrl = env.OSRM_URL?.trim()
  if (configuredUrl) return configuredUrl

  if (env.NODE_ENV === 'production') {
    return undefined
  }

  return 'https://router.project-osrm.org'
}

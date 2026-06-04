import { Injectable, Inject } from '@nestjs/common'
import { PrismaService } from '../database/prisma.service'
import Redis from 'ioredis'

interface LocationData {
  lat: number
  lng: number
  bearing: number
  speed: number
  accuracy: number
}

interface LocationRecord {
  driverId: string
  lng: number
  lat: number
  recordedAt: Date
}

@Injectable()
export class TrackingService {
  private batchBuffer: LocationRecord[] = []
  private flushInterval: ReturnType<typeof setInterval> | null = null

  constructor(
    private readonly prisma: PrismaService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {
    this.flushInterval = setInterval(() => this.flush(), 15000)
  }

  async handleLocationUpdate(driverId: string, data: LocationData): Promise<string | null> {
    await this.redis.geoadd('drivers:active', data.lng, data.lat, `driver:${driverId}`)
    await this.redis.setex(`driver:${driverId}:alive`, 35, '1')

    this.batchBuffer.push({
      driverId,
      lng: data.lng,
      lat: data.lat,
      recordedAt: new Date(),
    })

    const orderId = await this.redis.get(`driver:${driverId}:current_order`)
    return orderId || null
  }

  calculateETA(driverLat: number, driverLng: number, destLat: number, destLng: number): number {
    const distKm = this.haversine(driverLat, driverLng, destLat, destLng)
    const avgSpeedKmh = 20
    const bufferMinutes = 5
    return Math.round(distKm / avgSpeedKmh * 60 + bufferMinutes)
  }

  async getDriverLocation(driverId: string): Promise<{ lat: number; lng: number; timestamp: string } | null> {
    const pos = await this.redis.geopos('drivers:active', `driver:${driverId}`)
    if (!pos || !pos[0]) return null
    const [lng, lat] = pos[0]
    return { lat: parseFloat(lat), lng: parseFloat(lng), timestamp: new Date().toISOString() }
  }

  async findNearbyDriversPostGIS(lat: number, lng: number, radiusKm: number): Promise<Array<{ driverId: string; distKm: number; rating: number }>> {
    const results = await this.prisma.$queryRawUnsafe<Array<{ driverId: string; distKm: number; rating: number }>>(
      `SELECT d.user_id AS "driverId",
              ST_Distance(dl.location, ST_SetSRID(ST_MakePoint($1::float8, $2::float8), 4326)::geography) / 1000 AS "distKm",
              d.rating::float8 AS "rating"
       FROM driver_profiles d
       JOIN driver_location_history dl ON dl.driver_id = d.user_id
       WHERE d.is_online = true
         AND ST_DWithin(dl.location, ST_SetSRID(ST_MakePoint($1::float8, $2::float8), 4326)::geography, $3::float8)
         AND dl.recorded_at > NOW() - INTERVAL '30 seconds'
         AND NOT EXISTS (SELECT 1 FROM orders o WHERE o.driver_id = d.user_id AND o.status IN ('driver_assigned', 'driver_arriving_restaurant', 'picked_up', 'delivering'))
       ORDER BY "distKm", rating DESC
       LIMIT 10`,
      lng, lat, radiusKm * 1000,
    )
    return results
  }

  private haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }

  private async flush(): Promise<void> {
    if (this.batchBuffer.length === 0) return
    const batch = [...this.batchBuffer]
    this.batchBuffer = []
    try {
      await this.prisma.$executeRawUnsafe(
        `INSERT INTO driver_location_history (driver_id, location, recorded_at)
         VALUES ${batch.map((_, i) => `($${i * 3 + 1}::uuid, ST_SetSRID(ST_MakePoint($${i * 3 + 2}::float8, $${i * 3 + 3}::float8), 4326), $${i * 3 + 4}::timestamptz)`).join(', ')}`,
        ...batch.flatMap(r => [r.driverId, r.lng, r.lat, r.recordedAt]),
      )
    } catch (err) {
      console.error('Failed to flush location batch:', err)
    }
  }
}

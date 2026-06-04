import { Controller, Get, Inject, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { Roles } from '../auth/roles.decorator'
import Redis from 'ioredis'

@Controller('admin')
@UseGuards(JwtAuthGuard)
@Roles('admin')
export class AdminTrackingController {
  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  @Get('online-drivers')
  async getOnlineDrivers() {
    const members = await this.redis.call('GEOSEARCH', 'drivers:active',
      'FROMLONLAT', '106.6297', '10.8231',
      'BYRADIUS', '50', 'km',
      'WITHCOORD', 'ASC',
    ) as Array<[string, [string, string]]>

    if (!members || members.length === 0) return []

    const drivers: Array<Record<string, unknown>> = []
    for (let i = 0; i < members.length; i += 2) {
      const member = members[i] as unknown as string
      const coords = members[i + 1] as unknown as [string, string]
      const driverId = member.replace('driver:', '')

      const [status, orderId, ratingStr] = await this.redis.mget(
        `driver:${driverId}:status`,
        `driver:${driverId}:current_order`,
        `driver:${driverId}:rating`,
      )

      drivers.push({
        driverId,
        lat: parseFloat(coords[1]),
        lng: parseFloat(coords[0]),
        status: status ?? 'offline',
        orderId: orderId || undefined,
        rating: parseFloat(ratingStr ?? '4.0'),
      })
    }

    return drivers
  }
}

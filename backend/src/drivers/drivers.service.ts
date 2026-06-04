import { Injectable, Inject, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../database/prisma.service'
import Redis from 'ioredis'

@Injectable()
export class DriversService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {}

  async goOnline(driverId: string, lat: number, lng: number): Promise<void> {
    const profile = await this.prisma.driverProfile.findUniqueOrThrow({ where: { userId: driverId } })
    if (!profile.isVerified) throw new BadRequestException('DRIVER_NOT_VERIFIED')

    await this.redis.geoadd('drivers:active', lng, lat, `driver:${driverId}`)
    await this.redis.set(`driver:${driverId}:status`, 'online')
    await this.redis.setex(`driver:${driverId}:alive`, 35, '1')
    await this.redis.set(`driver:${driverId}:rating`, profile.rating.toString())
    await this.redis.set(`driver:${driverId}:current_order`, '')

    await this.prisma.driverProfile.update({
      where: { userId: driverId },
      data: { isOnline: true, currentLat: lat, currentLng: lng },
    })
  }

  async goOffline(driverId: string): Promise<void> {
    await this.redis.zrem('drivers:active', `driver:${driverId}`)
    await this.redis.del(`driver:${driverId}:status`)
    await this.redis.del(`driver:${driverId}:alive`)
    await this.redis.del(`driver:${driverId}:current_order`)

    await this.prisma.driverProfile.update({
      where: { userId: driverId },
      data: { isOnline: false },
    })
  }

  async getEarnings(driverId: string, period: 'today' | 'week' | 'month'): Promise<{
    totalEarnings: number; totalOrders: number; averagePerOrder: number;
  }> {
    const now = new Date()
    let startDate: Date
    if (period === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    } else if (period === 'week') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    }

    const payments = await this.prisma.payment.findMany({
      where: {
        status: 'completed',
        paidAt: { gte: startDate },
        order: { driverId },
      },
      select: { amount: true },
    })

    const totalEarnings = payments.reduce((sum, p) => sum + Number(p.amount), 0)
    const totalOrders = payments.length

    return {
      totalEarnings,
      totalOrders,
      averagePerOrder: totalOrders > 0 ? Math.round(totalEarnings / totalOrders) : 0,
    }
  }
}

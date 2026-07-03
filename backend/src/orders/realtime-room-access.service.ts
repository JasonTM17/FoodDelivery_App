import { Injectable } from '@nestjs/common'
import { UserRole } from '@prisma/client'
import type { AuthenticatedSocketUser } from '../auth/websocket-auth.service'
import { PrismaService } from '../database/prisma.service'

@Injectable()
export class RealtimeRoomAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async canAccessOrder(user: AuthenticatedSocketUser, orderId: string): Promise<boolean> {
    if (user.role === UserRole.admin) return true
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        customerId: true,
        driverId: true,
        restaurantId: true,
      },
    })
    if (!order) return false
    if (user.role === UserRole.customer) return order.customerId === user.sub
    if (user.role === UserRole.driver) return order.driverId === user.sub
    if (user.role !== UserRole.restaurant) return false
    return this.canAccessRestaurant(user, order.restaurantId)
  }

  async canAccessRestaurant(
    user: AuthenticatedSocketUser,
    restaurantId: string,
  ): Promise<boolean> {
    if (user.role !== UserRole.restaurant) return false
    const profile = await this.prisma.restaurantProfile.findFirst({
      where: {
        userId: user.sub,
        restaurantId,
        isActive: true,
      },
      select: { id: true },
    })
    return Boolean(profile)
  }
}

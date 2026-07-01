import { Injectable } from '@nestjs/common'
import { PrismaService } from '../database/prisma.service'
import { RestaurantAccessService } from './restaurant-access.service'
import { UpdateRestaurantProfileDto } from './restaurant-profile.dto'

@Injectable()
export class RestaurantProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: RestaurantAccessService,
  ) {}

  async get(userId: string) {
    const profile = await this.prisma.restaurantProfile.findUniqueOrThrow({
      where: { userId },
      include: {
        restaurant: { include: { openingHours: { orderBy: { dayOfWeek: 'asc' } } } },
      },
    })
    return this.serialize(profile)
  }

  async update(userId: string, dto: UpdateRestaurantProfileDto) {
    const profile = await this.access.getProfile(userId)
    const { openingHours, ...restaurantData } = dto

    await this.prisma.$transaction(async (tx) => {
      await tx.restaurant.update({
        where: { id: profile.restaurantId },
        data: restaurantData,
      })
      if (openingHours) {
        await tx.restaurantOpeningHour.deleteMany({ where: { restaurantId: profile.restaurantId } })
        if (openingHours.length > 0) {
          await tx.restaurantOpeningHour.createMany({
            data: openingHours.map(hour => ({ ...hour, restaurantId: profile.restaurantId })),
          })
        }
      }
    })

    return this.get(userId)
  }

  private serialize(profile: Awaited<ReturnType<RestaurantProfileService['loadForSerialization']>>) {
    const { restaurant, ...membership } = profile
    return {
      ...restaurant,
      minOrderAmount: Number(restaurant.minOrderAmount),
      rating: Number(restaurant.rating),
      membership: {
        id: membership.id,
        role: membership.staffRole,
        permissions: membership.permissions,
        onboardingCompletedAt: membership.onboardingCompletedAt,
      },
    }
  }

  private loadForSerialization(userId: string) {
    return this.prisma.restaurantProfile.findUniqueOrThrow({
      where: { userId },
      include: { restaurant: { include: { openingHours: true } } },
    })
  }
}

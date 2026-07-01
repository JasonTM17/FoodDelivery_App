import { ForbiddenException, Injectable } from '@nestjs/common'
import { PrismaService } from '../database/prisma.service'

@Injectable()
export class RestaurantAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const profile = await this.prisma.restaurantProfile.findUnique({
      where: { userId },
      include: { restaurant: true },
    })
    if (!profile || !profile.isActive) {
      throw new ForbiddenException('RESTAURANT_PROFILE_NOT_FOUND')
    }
    return profile
  }

  async getRestaurantId(userId: string): Promise<string> {
    return (await this.getProfile(userId)).restaurantId
  }
}

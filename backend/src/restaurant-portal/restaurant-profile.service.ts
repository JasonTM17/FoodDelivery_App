import { BadRequestException, Injectable } from '@nestjs/common'
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
        restaurant: {
          include: {
            openingHours: { orderBy: { dayOfWeek: 'asc' } },
            holidayClosures: { orderBy: { date: 'asc' } },
          },
        },
      },
    })
    return this.serialize(profile)
  }

  async update(userId: string, dto: UpdateRestaurantProfileDto) {
    const profile = await this.access.getProfile(userId)
    const { openingHours, holidayClosures, ...restaurantData } = dto
    const normalizedClosures = holidayClosures ? normalizeHolidayClosures(holidayClosures) : undefined

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
      if (holidayClosures) {
        await tx.restaurantHolidayClosure.deleteMany({ where: { restaurantId: profile.restaurantId } })
        if (normalizedClosures && normalizedClosures.length > 0) {
          await tx.restaurantHolidayClosure.createMany({
            data: normalizedClosures.map(closure => ({
              ...closure,
              restaurantId: profile.restaurantId,
            })),
          })
        }
      }
    })

    return this.get(userId)
  }

  getMembership(userId: string) {
    return this.access.getProfile(userId)
  }

  private serialize(profile: Awaited<ReturnType<RestaurantProfileService['loadForSerialization']>>) {
    const { restaurant, ...membership } = profile
    return {
      ...restaurant,
      minOrderAmount: Number(restaurant.minOrderAmount),
      rating: Number(restaurant.rating),
      holidayClosures: restaurant.holidayClosures.map(closure => ({
        id: closure.id,
        date: formatHolidayClosureDate(closure.date),
        reason: closure.reason,
      })),
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
      include: { restaurant: { include: { openingHours: true, holidayClosures: true } } },
    })
  }
}

function normalizeHolidayClosures(
  holidayClosures: NonNullable<UpdateRestaurantProfileDto['holidayClosures']>,
): Array<{ date: Date; reason: string | null }> {
  const seenDates = new Set<string>()
  return holidayClosures.map(closure => {
    const date = parseHolidayClosureDate(closure.date)
    const dateKey = formatHolidayClosureDate(date)
    if (seenDates.has(dateKey)) throw new BadRequestException('DUPLICATE_HOLIDAY_CLOSURE_DATE')
    seenDates.add(dateKey)
    const reason = closure.reason?.trim()
    return {
      date,
      reason: reason ? reason : null,
    }
  })
}

function parseHolidayClosureDate(value: string): Date {
  const date = new Date(`${value}T00:00:00.000Z`)
  if (Number.isNaN(date.getTime()) || formatHolidayClosureDate(date) !== value) {
    throw new BadRequestException('INVALID_HOLIDAY_CLOSURE_DATE')
  }
  return date
}

function formatHolidayClosureDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

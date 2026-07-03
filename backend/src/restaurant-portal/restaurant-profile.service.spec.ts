import { BadRequestException } from '@nestjs/common'
import { PrismaService } from '../database/prisma.service'
import { RestaurantAccessService } from './restaurant-access.service'
import { RestaurantProfileService } from './restaurant-profile.service'

describe('RestaurantProfileService', () => {
  const mockTx = {
    restaurant: { update: jest.fn() },
    restaurantOpeningHour: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    restaurantHolidayClosure: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
  }
  const prisma = {
    restaurantProfile: { findUniqueOrThrow: jest.fn() },
    $transaction: jest.fn(async (callback: (tx: typeof mockTx) => Promise<void>) => callback(mockTx)),
  }
  const access = {
    getProfile: jest.fn(),
  }
  let service: RestaurantProfileService

  beforeEach(() => {
    jest.clearAllMocks()
    service = new RestaurantProfileService(
      prisma as unknown as PrismaService,
      access as unknown as RestaurantAccessService,
    )
    access.getProfile.mockResolvedValue({ restaurantId: 'restaurant-1' })
    prisma.restaurantProfile.findUniqueOrThrow.mockResolvedValue(profileRow())
  })

  it('serializes holiday closure dates as local date-only strings', async () => {
    const result = await service.get('owner-1')

    expect(prisma.restaurantProfile.findUniqueOrThrow).toHaveBeenCalledWith({
      where: { userId: 'owner-1' },
      include: {
        restaurant: {
          include: {
            openingHours: { orderBy: { dayOfWeek: 'asc' } },
            holidayClosures: { orderBy: { date: 'asc' } },
          },
        },
      },
    })
    expect(result.holidayClosures).toEqual([
      { id: 'closure-1', date: '2026-02-10', reason: 'Tet holiday' },
    ])
  })

  it('replaces holiday closures for the authenticated restaurant only', async () => {
    await service.update('owner-1', {
      holidayClosures: [
        { date: '2026-02-10', reason: '  Tet holiday  ' },
        { date: '2026-02-11' },
      ],
    })

    expect(access.getProfile).toHaveBeenCalledWith('owner-1')
    expect(mockTx.restaurant.update).toHaveBeenCalledWith({
      where: { id: 'restaurant-1' },
      data: {},
    })
    expect(mockTx.restaurantHolidayClosure.deleteMany).toHaveBeenCalledWith({
      where: { restaurantId: 'restaurant-1' },
    })
    expect(mockTx.restaurantHolidayClosure.createMany).toHaveBeenCalledWith({
      data: [
        {
          restaurantId: 'restaurant-1',
          date: new Date('2026-02-10T00:00:00.000Z'),
          reason: 'Tet holiday',
        },
        {
          restaurantId: 'restaurant-1',
          date: new Date('2026-02-11T00:00:00.000Z'),
          reason: null,
        },
      ],
    })
  })

  it('rejects duplicate holiday closure dates before opening a transaction', async () => {
    await expect(
      service.update('owner-1', {
        holidayClosures: [
          { date: '2026-02-10', reason: 'Morning' },
          { date: '2026-02-10', reason: 'Evening' },
        ],
      }),
    ).rejects.toThrow(BadRequestException)

    expect(prisma.$transaction).not.toHaveBeenCalled()
  })
})

function profileRow() {
  return {
    id: 'membership-1',
    userId: 'owner-1',
    restaurantId: 'restaurant-1',
    staffRole: 'owner',
    permissions: ['profile:update'],
    onboardingCompletedAt: null,
    restaurant: {
      id: 'restaurant-1',
      name: 'Pho 24',
      minOrderAmount: 0,
      rating: 4.8,
      openingHours: [],
      holidayClosures: [
        {
          id: 'closure-1',
          date: new Date('2026-02-10T00:00:00.000Z'),
          reason: 'Tet holiday',
        },
      ],
    },
  }
}

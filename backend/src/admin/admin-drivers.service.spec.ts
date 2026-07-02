import { OrderStatus, VehicleType } from '@prisma/client'
import { PrismaService } from '../database/prisma.service'
import { AdminDriversService } from './admin-drivers.service'

describe('AdminDriversService', () => {
  const driverProfile = {
    findMany: jest.fn(),
    count: jest.fn(),
  }
  const service = new AdminDriversService({ driverProfile } as unknown as PrismaService)

  beforeEach(() => {
    jest.clearAllMocks()
    driverProfile.count.mockResolvedValue(2)
    driverProfile.findMany.mockResolvedValue([
      makeProfile({ isOnline: true }),
      makeProfile({
        id: 'profile-2',
        isOnline: true,
        user: makeUser({ id: 'driver-2', ordersAsDriver: [{ id: 'order-1' }] }),
      }),
    ])
  })

  it('returns canonical data/meta pagination and real derived statuses', async () => {
    const result = await service.list({ page: 1, limit: 20 })

    expect(result.data).toEqual([
      expect.objectContaining({ id: 'driver-1', status: 'online', rating: 4.8 }),
      expect.objectContaining({ id: 'driver-2', status: 'delivering' }),
    ])
    expect(result.meta).toEqual({ page: 1, limit: 20, total: 2, totalPages: 1 })
    expect(driverProfile.findMany).toHaveBeenCalledWith(expect.objectContaining({
      skip: 0,
      take: 20,
      orderBy: { user: { createdAt: 'desc' } },
    }))
  })

  it('filters delivering drivers without issuing per-driver queries', async () => {
    await service.list({ status: 'delivering', page: 2, limit: 10 })

    expect(driverProfile.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        user: {
          ordersAsDriver: {
            some: { status: { in: expect.arrayContaining([OrderStatus.delivering]) } },
          },
        },
      },
      skip: 10,
      take: 10,
    }))
    expect(driverProfile.findMany).toHaveBeenCalledTimes(1)
  })

  it('searches identity and vehicle fields case-insensitively', async () => {
    await service.list({ search: '  minh  ', page: 1, limit: 20 })

    const call = driverProfile.findMany.mock.calls[0][0]
    expect(call.where.OR).toEqual(expect.arrayContaining([
      { user: { fullName: { contains: 'minh', mode: 'insensitive' } } },
      { vehiclePlate: { contains: 'minh', mode: 'insensitive' } },
    ]))
  })
})

function makeProfile(overrides: Record<string, unknown> = {}) {
  return {
    id: 'profile-1',
    vehicleType: VehicleType.motorbike,
    vehiclePlate: '59-A1 12345',
    isOnline: false,
    isVerified: true,
    rating: { toString: () => '4.8' },
    totalDeliveries: 42,
    user: makeUser(),
    ...overrides,
  }
}

function makeUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'driver-1',
    fullName: 'Nguyen Minh',
    email: 'minh@example.com',
    phone: '0900000000',
    isActive: true,
    createdAt: new Date('2026-07-01T00:00:00.000Z'),
    ordersAsDriver: [],
    ...overrides,
  }
}

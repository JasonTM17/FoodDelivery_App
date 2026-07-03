import { ForbiddenException, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../database/prisma.service'
import { RestaurantAccessService } from './restaurant-access.service'
import { RestaurantStaffService } from './restaurant-staff.service'

describe('RestaurantStaffService', () => {
  const getProfile = jest.fn()
  const findStaff = jest.fn()
  const updateStaff = jest.fn()
  const findStaffList = jest.fn()
  const findInvite = jest.fn()
  const findInvites = jest.fn()
  const createInvite = jest.fn()
  const findUser = jest.fn()
  const findShift = jest.fn()
  const findShifts = jest.fn()
  const createShift = jest.fn()

  let service: RestaurantStaffService

  beforeEach(() => {
    jest.clearAllMocks()
    getProfile.mockResolvedValue(makeActor())
    findStaffList.mockResolvedValue([])
    findInvites.mockResolvedValue([])
    findShifts.mockResolvedValue([])

    service = new RestaurantStaffService(
      {
        restaurantProfile: {
          findMany: findStaffList,
          findFirst: findStaff,
          update: updateStaff,
        },
        staffInvite: {
          findMany: findInvites,
          findFirst: findInvite,
          create: createInvite,
        },
        staffShift: {
          findMany: findShifts,
          findFirst: findShift,
          create: createShift,
        },
        user: { findFirst: findUser },
      } as unknown as PrismaService,
      { getProfile } as unknown as RestaurantAccessService,
    )
  })

  it('requires the staff capability when a manager changes staff resources', async () => {
    getProfile.mockResolvedValue(makeActor({ staffRole: 'manager', permissions: ['orders'] }))

    await expect(service.invite('manager-user', {
      emails: ['staff@example.com'],
      role: 'viewer',
    })).rejects.toThrow(ForbiddenException)

    expect(findUser).not.toHaveBeenCalled()
  })

  it('prevents a manager from inviting or managing another manager', async () => {
    getProfile.mockResolvedValue(makeActor({ staffRole: 'manager', permissions: ['staff'] }))

    await expect(service.invite('manager-user', {
      emails: ['manager@example.com'],
      role: 'manager',
    })).rejects.toThrow('MANAGER_CANNOT_INVITE_MANAGER')

    findStaff.mockResolvedValue(makeStaffRecord({ staffRole: 'manager' }))
    await expect(service.update('manager-user', 'manager-profile', {
      permissions: ['orders'],
    })).rejects.toThrow('MANAGER_CANNOT_MANAGE_MANAGER')
  })

  it('scopes staff updates to the actor restaurant and returns the public member shape', async () => {
    findStaff.mockResolvedValue(makeStaffRecord())
    updateStaff.mockResolvedValue(makeStaffRecord({
      permissions: ['orders', 'menu'],
      user: {
        fullName: 'Kitchen User',
        email: 'kitchen@example.com',
        avatarUrl: null,
      },
    }))

    const result = await service.update('owner-user', 'staff-profile', {
      permissions: ['orders', 'menu'],
    })

    expect(findStaff).toHaveBeenCalledWith({
      where: { id: 'staff-profile', restaurantId: 'restaurant-1' },
    })
    expect(updateStaff).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'staff-profile' },
      data: { permissions: ['orders', 'menu'] },
    }))
    expect(result).toMatchObject({
      id: 'staff-profile',
      email: 'kitchen@example.com',
      permissions: ['orders', 'menu'],
    })
  })

  it('does not expose invite token hashes in the staff overview query', async () => {
    await service.list('owner-user')

    expect(findInvites).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        restaurantId: 'restaurant-1',
        status: 'pending',
        expiresAt: { gt: expect.any(Date) },
      }),
      select: expect.not.objectContaining({ tokenHash: true }),
    }))
  })

  it('rejects a shift when the selected profile is outside the actor tenant', async () => {
    findStaff.mockResolvedValue(null)

    await expect(service.createShift('owner-user', {
      restaurantProfileId: 'other-tenant-profile',
      startsAt: '2026-07-06T02:00:00.000Z',
      endsAt: '2026-07-06T03:00:00.000Z',
    })).rejects.toThrow(NotFoundException)

    expect(findStaff).toHaveBeenCalledWith({
      where: {
        id: 'other-tenant-profile',
        restaurantId: 'restaurant-1',
        isActive: true,
      },
    })
    expect(createShift).not.toHaveBeenCalled()
  })

  it('rejects shifts with invalid time ranges before querying staff', async () => {
    await expect(service.createShift('owner-user', {
      restaurantProfileId: 'staff-profile',
      startsAt: '2026-07-06T03:00:00.000Z',
      endsAt: '2026-07-06T02:00:00.000Z',
    })).rejects.toThrow('SHIFT_END_BEFORE_START')

    expect(findStaff).not.toHaveBeenCalled()
    expect(createShift).not.toHaveBeenCalled()
  })

  it('rejects overlapping scheduled shifts', async () => {
    findStaff.mockResolvedValue(makeStaffRecord())
    findShift.mockResolvedValue({ id: 'existing-shift' })

    await expect(service.createShift('owner-user', {
      restaurantProfileId: 'staff-profile',
      startsAt: '2026-07-06T02:00:00.000Z',
      endsAt: '2026-07-06T03:00:00.000Z',
    })).rejects.toThrow('SHIFT_OVERLAP')

    expect(createShift).not.toHaveBeenCalled()
  })

  it('protects the owner record and prevents self-deactivation', async () => {
    findStaff.mockResolvedValue(makeStaffRecord({ staffRole: 'owner' }))
    await expect(service.update('owner-user', 'owner-profile', {
      permissions: ['orders'],
    })).rejects.toThrow('OWNER_CANNOT_BE_MODIFIED')

    findStaff.mockResolvedValue(makeStaffRecord({ id: 'owner-profile' }))
    await expect(service.update('owner-user', 'owner-profile', {
      isActive: false,
    })).rejects.toThrow('STAFF_CANNOT_DEACTIVATE_SELF')

    expect(updateStaff).not.toHaveBeenCalled()
  })
})

function makeActor(overrides: Record<string, unknown> = {}) {
  return {
    id: 'owner-profile',
    userId: 'owner-user',
    restaurantId: 'restaurant-1',
    staffRole: 'owner',
    permissions: ['orders', 'menu', 'reports', 'settings', 'staff', 'promotions'],
    isActive: true,
    ...overrides,
  }
}

function makeStaffRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: 'staff-profile',
    userId: 'staff-user',
    restaurantId: 'restaurant-1',
    staffRole: 'kitchen',
    permissions: ['orders'],
    isActive: true,
    joinedAt: new Date('2026-07-01T00:00:00.000Z'),
    user: {
      fullName: 'Kitchen User',
      email: 'kitchen@example.com',
      avatarUrl: null,
    },
    ...overrides,
  }
}

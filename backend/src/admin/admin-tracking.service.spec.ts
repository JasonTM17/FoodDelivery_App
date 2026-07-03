import { OrderStatus } from '@prisma/client'
import { AdminTrackingService, parseGeoSearchMembers } from './admin-tracking.service'

describe('parseGeoSearchMembers', () => {
  it('parses Redis GEOSEARCH WITHCOORD response shape', () => {
    expect(parseGeoSearchMembers([
      ['driver:driver-1', ['106.7001', '10.8001']],
      ['driver-2', ['106.7002', '10.8002']],
      ['bad', ['not-a-number', '10.8']],
    ])).toEqual([
      { driverId: 'driver-1', lng: 106.7001, lat: 10.8001 },
      { driverId: 'driver-2', lng: 106.7002, lat: 10.8002 },
    ])
  })
})

describe('AdminTrackingService', () => {
  const redis = {
    call: jest.fn(),
    mget: jest.fn(),
  }
  const prisma = {
    driverProfile: { findMany: jest.fn() },
    order: { findMany: jest.fn() },
  }
  const service = new AdminTrackingService(prisma as never, redis as never)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns enriched online driver map records from Redis coordinates and DB profiles', async () => {
    redis.call.mockResolvedValue([
      ['driver:driver-1', ['106.7001', '10.8001']],
      ['driver:driver-2', ['106.7002', '10.8002']],
    ])
    redis.mget.mockResolvedValue([
      '1', 'online', '',
      '1', 'busy', 'order-2',
    ])
    prisma.driverProfile.findMany.mockResolvedValue([
      {
        userId: 'driver-1',
        vehicleType: 'motorbike',
        vehiclePlate: '59A1-12345',
        isOnline: true,
        rating: { toString: () => '4.8' },
        user: { fullName: 'Driver One' },
      },
      {
        userId: 'driver-2',
        vehicleType: 'motorbike',
        vehiclePlate: '59A1-99999',
        isOnline: true,
        rating: { toString: () => '4.7' },
        user: { fullName: 'Driver Two' },
      },
    ])
    prisma.order.findMany.mockResolvedValue([
      { id: 'order-2', orderCode: 'FF0002', driverId: 'driver-2', status: OrderStatus.delivering },
    ])

    const result = await service.getOnlineDrivers()

    expect(redis.call).toHaveBeenCalledWith(
      'GEOSEARCH',
      'drivers:active',
      'FROMLONLAT',
      '108',
      '14',
      'BYRADIUS',
      '1400',
      'km',
      'WITHCOORD',
      'ASC',
    )
    expect(result).toHaveLength(2)
    expect(result[0]).toMatchObject({
      id: 'driver-1',
      name: 'Driver One',
      lat: 10.8001,
      lng: 106.7001,
      status: 'online',
      vehicleType: 'motorbike',
    })
    expect(result[1]).toMatchObject({
      id: 'driver-2',
      name: 'Driver Two',
      status: 'delivering',
      currentOrder: 'FF0002',
    })
  })

  it('drops stale Redis geo entries when the alive key expired', async () => {
    redis.call.mockResolvedValue([['driver:driver-1', ['106.7001', '10.8001']]])
    redis.mget.mockResolvedValue([null, 'online', ''])
    prisma.driverProfile.findMany.mockResolvedValue([
      {
        userId: 'driver-1',
        vehicleType: 'motorbike',
        vehiclePlate: '59A1-12345',
        isOnline: true,
        rating: { toString: () => '4.8' },
        user: { fullName: 'Driver One' },
      },
    ])
    prisma.order.findMany.mockResolvedValue([])

    await expect(service.getOnlineDrivers()).resolves.toEqual([])
  })

  it('filters Redis geo entries outside the Vietnam map bounds', async () => {
    redis.call.mockResolvedValue([
      ['driver:driver-1', ['106.7001', '10.8001']],
      ['driver:driver-outside', ['120.0000', '24.0000']],
    ])
    redis.mget.mockResolvedValue(['1', 'online', ''])
    prisma.driverProfile.findMany.mockResolvedValue([
      {
        userId: 'driver-1',
        vehicleType: 'motorbike',
        vehiclePlate: '59A1-12345',
        isOnline: true,
        rating: { toString: () => '4.8' },
        user: { fullName: 'Driver One' },
      },
    ])
    prisma.order.findMany.mockResolvedValue([])

    const result = await service.getOnlineDrivers()

    expect(redis.mget).toHaveBeenCalledWith(
      'driver:driver-1:alive',
      'driver:driver-1:status',
      'driver:driver-1:current_order',
    )
    expect(prisma.driverProfile.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: { in: ['driver-1'] }, user: { isActive: true } },
    }))
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('driver-1')
  })
})

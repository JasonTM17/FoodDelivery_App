import { UserRole } from '@prisma/client'
import { RealtimeRoomAccessService } from './realtime-room-access.service'

describe('RealtimeRoomAccessService', () => {
  const findOrder = jest.fn()
  const findRestaurantProfile = jest.fn()
  const service = new RealtimeRoomAccessService({
    order: { findUnique: findOrder },
    restaurantProfile: { findFirst: findRestaurantProfile },
  } as never)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('allows admins without querying participant records', async () => {
    await expect(service.canAccessOrder(
      { sub: 'admin-1', role: UserRole.admin },
      'order-1',
    )).resolves.toBe(true)
    expect(findOrder).not.toHaveBeenCalled()
  })

  it('only allows the customer or driver assigned to the order', async () => {
    findOrder.mockResolvedValue({
      customerId: 'customer-1',
      driverId: 'driver-1',
      restaurantId: 'restaurant-1',
    })

    await expect(service.canAccessOrder(
      { sub: 'customer-1', role: UserRole.customer },
      'order-1',
    )).resolves.toBe(true)
    await expect(service.canAccessOrder(
      { sub: 'driver-2', role: UserRole.driver },
      'order-1',
    )).resolves.toBe(false)
  })

  it('requires an active tenant-scoped restaurant profile', async () => {
    findOrder.mockResolvedValue({
      customerId: 'customer-1',
      driverId: 'driver-1',
      restaurantId: 'restaurant-1',
    })
    findRestaurantProfile.mockResolvedValueOnce({ id: 'profile-1' })

    await expect(service.canAccessOrder(
      { sub: 'restaurant-user', role: UserRole.restaurant },
      'order-1',
    )).resolves.toBe(true)
    expect(findRestaurantProfile).toHaveBeenCalledWith({
      where: {
        userId: 'restaurant-user',
        restaurantId: 'restaurant-1',
        isActive: true,
      },
      select: { id: true },
    })

    findRestaurantProfile.mockResolvedValueOnce(null)
    await expect(service.canAccessRestaurant(
      { sub: 'other-restaurant', role: UserRole.restaurant },
      'restaurant-1',
    )).resolves.toBe(false)
  })
})

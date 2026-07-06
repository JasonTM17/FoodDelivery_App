import { OrderStatus, UserRole } from '@prisma/client'
import { TrackingController } from './tracking.controller'

describe('TrackingController', () => {
  const getDriverLocation = jest.fn()
  const getCachedRoute = jest.fn()
  const getTracking = jest.fn()
  const controller = new TrackingController(
    { getDriverLocation, getCachedRoute } as never,
    { getTracking } as never,
  )

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('resolves the assigned driver before reading live Redis coordinates', async () => {
    getTracking.mockResolvedValue({
      id: 'order-1',
      status: OrderStatus.delivering,
      driverId: 'driver-1',
      estimatedDeliveryTimeMinutes: 18,
      routePolyline: 'persisted-route',
    })
    getDriverLocation.mockResolvedValue({
      lat: 10.8,
      lng: 106.7,
      timestamp: '2026-07-03T02:00:00.000Z',
    })
    getCachedRoute.mockResolvedValue({
      polyline: 'live-route',
      durationSeconds: 601,
    })

    await expect(controller.getTracking(
      { sub: 'customer-1', role: UserRole.customer },
      'order-1',
    )).resolves.toEqual({
      orderId: 'order-1',
      status: OrderStatus.delivering,
      routePhase: 'dropoff',
      driverLocation: {
        lat: 10.8,
        lng: 106.7,
        lastUpdated: '2026-07-03T02:00:00.000Z',
      },
      etaMinutes: 10,
      routePolyline: 'live-route',
    })
    expect(getTracking).toHaveBeenCalledWith('order-1', 'customer-1', UserRole.customer)
    expect(getDriverLocation).toHaveBeenCalledWith('driver-1')
    expect(getCachedRoute).toHaveBeenCalledWith('order-1', 'dropoff')
  })

  it('reads the pickup route cache before the driver has picked up the order', async () => {
    getTracking.mockResolvedValue({
      id: 'order-3',
      status: OrderStatus.driver_assigned,
      driverId: 'driver-1',
      estimatedDeliveryTimeMinutes: null,
      routePolyline: null,
    })
    getDriverLocation.mockResolvedValue(null)
    getCachedRoute.mockResolvedValue(null)

    await expect(controller.getTracking(
      { sub: 'customer-1', role: UserRole.customer },
      'order-3',
    )).resolves.toMatchObject({
      orderId: 'order-3',
      routePhase: 'pickup',
      etaMinutes: null,
      routePolyline: null,
    })
    expect(getCachedRoute).toHaveBeenCalledWith('order-3', 'pickup')
  })

  it('does not reuse persisted route geometry while waiting for a pickup-phase route cache', async () => {
    getTracking.mockResolvedValue({
      id: 'order-6',
      status: OrderStatus.driver_assigned,
      driverId: 'driver-1',
      estimatedDeliveryTimeMinutes: 18,
      routePolyline: 'stale-dropoff-route',
    })
    getDriverLocation.mockResolvedValue(null)
    getCachedRoute.mockResolvedValue(null)

    await expect(controller.getTracking(
      { sub: 'customer-1', role: UserRole.customer },
      'order-6',
    )).resolves.toMatchObject({
      orderId: 'order-6',
      routePhase: 'pickup',
      etaMinutes: null,
      routePolyline: null,
    })
  })

  it('does not surface persisted estimated minutes when no routed cache exists', async () => {
    getTracking.mockResolvedValue({
      id: 'order-4',
      status: OrderStatus.delivering,
      driverId: 'driver-1',
      estimatedDeliveryTimeMinutes: 18,
      routePolyline: 'persisted-route',
    })
    getDriverLocation.mockResolvedValue(null)
    getCachedRoute.mockResolvedValue(null)

    await expect(controller.getTracking(
      { sub: 'customer-1', role: UserRole.customer },
      'order-4',
    )).resolves.toMatchObject({
      orderId: 'order-4',
      routePhase: 'dropoff',
      etaMinutes: null,
      routePolyline: 'persisted-route',
    })
  })

  it('returns persisted tracking metadata without fabricating a driver location', async () => {
    getTracking.mockResolvedValue({
      id: 'order-2',
      status: OrderStatus.preparing,
      driverId: null,
      estimatedDeliveryTimeMinutes: null,
      routePolyline: null,
    })
    getCachedRoute.mockResolvedValue(null)

    await expect(controller.getTracking(
      { sub: 'customer-1', role: UserRole.customer },
      'order-2',
    )).resolves.toEqual({
      orderId: 'order-2',
      status: OrderStatus.preparing,
      routePhase: 'dropoff',
      driverLocation: null,
      etaMinutes: null,
      routePolyline: null,
    })
    expect(getDriverLocation).not.toHaveBeenCalled()
  })

  it('passes restaurant identity through so the service can enforce tenant ownership', async () => {
    getTracking.mockResolvedValue({
      id: 'order-5',
      status: OrderStatus.ready_for_pickup,
      driverId: 'driver-2',
      estimatedDeliveryTimeMinutes: null,
      routePolyline: null,
    })
    getDriverLocation.mockResolvedValue(null)
    getCachedRoute.mockResolvedValue(null)

    await controller.getTracking(
      { sub: 'restaurant-user-1', role: UserRole.restaurant },
      'order-5',
    )

    expect(getTracking).toHaveBeenCalledWith('order-5', 'restaurant-user-1', UserRole.restaurant)
  })
})

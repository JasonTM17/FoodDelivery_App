import { OrderStatus } from '@prisma/client'
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
      { sub: 'customer-1', role: 'customer' },
      'order-1',
    )).resolves.toEqual({
      orderId: 'order-1',
      status: OrderStatus.delivering,
      driverLocation: {
        lat: 10.8,
        lng: 106.7,
        lastUpdated: '2026-07-03T02:00:00.000Z',
      },
      etaMinutes: 10,
      routePolyline: 'live-route',
    })
    expect(getTracking).toHaveBeenCalledWith('order-1', 'customer-1')
    expect(getDriverLocation).toHaveBeenCalledWith('driver-1')
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
      { sub: 'customer-1', role: 'customer' },
      'order-2',
    )).resolves.toEqual({
      orderId: 'order-2',
      status: OrderStatus.preparing,
      driverLocation: null,
      etaMinutes: null,
      routePolyline: null,
    })
    expect(getDriverLocation).not.toHaveBeenCalled()
  })
})

import { UserRole } from '@prisma/client'
import type { Socket } from 'socket.io'
import { TrackingGateway } from './tracking.gateway'

describe('TrackingGateway authorization', () => {
  const handleLocationUpdate = jest.fn()
  const getDriverLocation = jest.fn()
  const getOrFetchRoute = jest.fn()
  const maybeEnqueueRecompute = jest.fn()
  const authenticate = jest.fn()
  const getUser = jest.fn()
  const canAccessOrder = jest.fn()
  const orderFindUnique = jest.fn()
  const queryRawUnsafe = jest.fn()
  const notifyAdminDriverLocation = jest.fn()
  const emitToRoom = jest.fn()
  const to = jest.fn(() => ({ emit: emitToRoom }))
  let gateway: TrackingGateway

  beforeEach(() => {
    jest.clearAllMocks()
    gateway = new TrackingGateway(
      {
        handleLocationUpdate,
        getDriverLocation,
        getOrFetchRoute,
        maybeEnqueueRecompute,
      } as never,
      {
        order: { findUnique: orderFindUnique },
        $queryRawUnsafe: queryRawUnsafe,
      } as never,
      { notifyAdminDriverLocation } as never,
      { authenticate, getUser } as never,
      { canAccessOrder } as never,
    )
    gateway.server = { to } as never
  })

  it('disconnects unauthenticated clients', async () => {
    const client = makeClient()
    authenticate.mockRejectedValue(new Error('invalid token'))

    await gateway.handleConnection(client)

    expect(client.disconnect).toHaveBeenCalledWith(true)
  })

  it('only accepts driver location events from driver accounts', async () => {
    const client = makeClient()
    getUser.mockReturnValue({ sub: 'customer-1', role: UserRole.customer })

    await gateway.handleLocationUpdate(client, {
      lat: 10.8,
      lng: 106.7,
      bearing: 0,
      speed: 20,
      accuracy: 5,
    })
    expect(handleLocationUpdate).not.toHaveBeenCalled()

    getUser.mockReturnValue({ sub: 'driver-1', role: UserRole.driver })
    handleLocationUpdate.mockResolvedValue(null)
    await gateway.handleLocationUpdate(client, {
      lat: 10.8,
      lng: 106.7,
      bearing: 0,
      speed: 20,
      accuracy: 5,
    })
    expect(handleLocationUpdate).toHaveBeenCalledWith('driver-1', expect.any(Object))
  })

  it('emits admin map updates for idle drivers without entering order routing flow', async () => {
    getUser.mockReturnValue({ sub: 'driver-1', role: UserRole.driver })
    getDriverLocation.mockResolvedValue(null)
    handleLocationUpdate.mockResolvedValue(null)

    await gateway.handleLocationUpdate(makeClient(), {
      lat: 10.8,
      lng: 106.7,
      bearing: 0,
      speed: 20,
      accuracy: 5,
    })

    expect(emitToRoom).toHaveBeenCalledWith('admin:driver_location_changed', expect.objectContaining({
      driverId: 'driver-1',
      lat: 10.8,
      lng: 106.7,
      status: 'online',
    }))
    expect(notifyAdminDriverLocation).toHaveBeenCalledWith(expect.objectContaining({
      driverId: 'driver-1',
      status: 'online',
    }))
    expect(queryRawUnsafe).not.toHaveBeenCalled()
    expect(getOrFetchRoute).not.toHaveBeenCalled()
  })

  it('marks routed ETA updates as non-degraded provider values', async () => {
    getUser.mockReturnValue({ sub: 'driver-1', role: UserRole.driver })
    getDriverLocation.mockResolvedValue(null)
    handleLocationUpdate.mockResolvedValue('order-1')
    queryRawUnsafe.mockResolvedValue([{
      status: 'delivering',
      restaurantLat: 10.77,
      restaurantLng: 106.68,
      deliveryLat: 10.75,
      deliveryLng: 106.65,
    }])
    getOrFetchRoute.mockResolvedValue({
      polyline: 'encoded-route',
      distanceMeters: 4_000,
      durationSeconds: 600,
      waypoints: [],
      provider: 'google',
    })

    await gateway.handleLocationUpdate(makeClient(), {
      lat: 10.8,
      lng: 106.7,
      bearing: 0,
      speed: 20,
      accuracy: 5,
    })

    expect(emitToRoom).toHaveBeenCalledWith('delivery:eta_updated', {
      orderId: 'order-1',
      etaMinutes: 10,
      source: 'google',
      degraded: false,
      routePolyline: 'encoded-route',
      routePhase: 'dropoff',
    })
    expect(getOrFetchRoute).toHaveBeenCalledWith(
      'order-1',
      10.8,
      106.7,
      10.75,
      106.65,
      'dropoff',
    )
    expect(emitToRoom).toHaveBeenCalledWith('driver:location_changed', expect.objectContaining({
      orderId: 'order-1',
      driverId: 'driver-1',
      lat: 10.8,
      lng: 106.7,
    }))
  })

  it('emits unavailable ETA without fabricating straight-line minutes when route providers fail', async () => {
    getUser.mockReturnValue({ sub: 'driver-1', role: UserRole.driver })
    getDriverLocation.mockResolvedValue(null)
    handleLocationUpdate.mockResolvedValue('order-1')
    queryRawUnsafe.mockResolvedValue([{
      status: 'delivering',
      restaurantLat: 10.77,
      restaurantLng: 106.68,
      deliveryLat: 10.75,
      deliveryLng: 106.65,
    }])
    getOrFetchRoute.mockResolvedValue(null)

    await gateway.handleLocationUpdate(makeClient(), {
      lat: 10.8,
      lng: 106.7,
      bearing: 0,
      speed: 20,
      accuracy: 5,
    })

    expect(emitToRoom).toHaveBeenCalledWith('delivery:eta_updated', {
      orderId: 'order-1',
      etaMinutes: null,
      source: 'route_unavailable',
      degraded: true,
      routePolyline: null,
      routePhase: 'dropoff',
    })
  })

  it('routes drivers to the restaurant before pickup', async () => {
    getUser.mockReturnValue({ sub: 'driver-1', role: UserRole.driver })
    getDriverLocation.mockResolvedValue(null)
    handleLocationUpdate.mockResolvedValue('order-1')
    queryRawUnsafe.mockResolvedValue([{
      status: 'driver_assigned',
      restaurantLat: 10.77,
      restaurantLng: 106.68,
      deliveryLat: 10.75,
      deliveryLng: 106.65,
    }])
    getOrFetchRoute.mockResolvedValue({
      polyline: 'pickup-route',
      distanceMeters: 1_200,
      durationSeconds: 300,
      waypoints: [],
      provider: 'osrm',
    })

    await gateway.handleLocationUpdate(makeClient(), {
      lat: 10.8,
      lng: 106.7,
      bearing: 0,
      speed: 20,
      accuracy: 5,
    })

    expect(getOrFetchRoute).toHaveBeenCalledWith(
      'order-1',
      10.8,
      106.7,
      10.77,
      106.68,
      'pickup',
    )
    expect(emitToRoom).toHaveBeenCalledWith('delivery:eta_updated', {
      orderId: 'order-1',
      etaMinutes: 5,
      source: 'osrm',
      degraded: false,
      routePolyline: 'pickup-route',
      routePhase: 'pickup',
    })
  })

  it('checks order participation before joining tracking rooms', async () => {
    const client = makeClient()
    const user = { sub: 'customer-1', role: UserRole.customer }
    getUser.mockReturnValue(user)
    canAccessOrder.mockResolvedValueOnce(false).mockResolvedValueOnce(true)

    await expect(gateway.handleOrderSubscribe(client, { orderId: 'order-1' }))
      .resolves.toEqual({ success: false })
    await expect(gateway.handleOrderSubscribe(client, { orderId: 'order-1' }))
      .resolves.toEqual({ success: true })
    expect(client.join).toHaveBeenCalledTimes(1)
    expect(client.join).toHaveBeenCalledWith('order:order-1')
  })
})

function makeClient(): Socket {
  return {
    join: jest.fn(),
    leave: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
    data: {},
  } as unknown as Socket
}

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
  const queryRaw = jest.fn()
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
        $queryRaw: queryRaw,
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
      timestamp: new Date().toISOString(),
    })
    expect(handleLocationUpdate).toHaveBeenCalledWith('driver-1', expect.any(Object))
  })

  it('emits admin map updates for idle drivers without entering order routing flow', async () => {
    getUser.mockReturnValue({ sub: 'driver-1', role: UserRole.driver })
    getDriverLocation.mockResolvedValue(null)
    handleLocationUpdate.mockResolvedValue(null)
    const sampledAt = new Date().toISOString()

    await gateway.handleLocationUpdate(makeClient(), {
      lat: 10.8,
      lng: 106.7,
      bearing: 0,
      speed: 20,
      accuracy: 5,
      timestamp: sampledAt,
    })

    expect(handleLocationUpdate).toHaveBeenCalledWith('driver-1', expect.objectContaining({
      timestamp: sampledAt,
    }))
    expect(emitToRoom).toHaveBeenCalledWith('admin:driver_location_changed', expect.objectContaining({
      driverId: 'driver-1',
      lat: 10.8,
      lng: 106.7,
      status: 'online',
      timestamp: sampledAt,
    }))
    expect(notifyAdminDriverLocation).toHaveBeenCalledWith(expect.objectContaining({
      driverId: 'driver-1',
      status: 'online',
      timestamp: sampledAt,
    }))
    expect(queryRaw).not.toHaveBeenCalled()
    expect(getOrFetchRoute).not.toHaveBeenCalled()
  })

  it('rejects invalid driver GPS timestamps before mutating tracking state', async () => {
    const client = makeClient()
    getUser.mockReturnValue({ sub: 'driver-1', role: UserRole.driver })
    getDriverLocation.mockResolvedValue(null)

    await gateway.handleLocationUpdate(client, {
      lat: 10.8,
      lng: 106.7,
      timestamp: 'not-a-date',
    })

    expect(client.emit).toHaveBeenCalledWith('driver:location_rejected', { reason: 'invalid_timestamp' })
    expect(handleLocationUpdate).not.toHaveBeenCalled()
    expect(emitToRoom).not.toHaveBeenCalled()
  })

  it('rejects missing driver GPS timestamps before mutating tracking state', async () => {
    const client = makeClient()
    getUser.mockReturnValue({ sub: 'driver-1', role: UserRole.driver })
    getDriverLocation.mockResolvedValue(null)

    await gateway.handleLocationUpdate(client, {
      lat: 10.8,
      lng: 106.7,
    })

    expect(client.emit).toHaveBeenCalledWith('driver:location_rejected', { reason: 'invalid_timestamp' })
    expect(handleLocationUpdate).not.toHaveBeenCalled()
    expect(emitToRoom).not.toHaveBeenCalled()
  })

  it('rejects stale buffered GPS timestamps before mutating live map state', async () => {
    const client = makeClient()
    getUser.mockReturnValue({ sub: 'driver-1', role: UserRole.driver })
    getDriverLocation.mockResolvedValue(null)

    await gateway.handleLocationUpdate(client, {
      lat: 10.8,
      lng: 106.7,
      timestamp: new Date(Date.now() - 60_000).toISOString(),
    })

    expect(client.emit).toHaveBeenCalledWith('driver:location_rejected', { reason: 'stale_timestamp' })
    expect(handleLocationUpdate).not.toHaveBeenCalled()
    expect(emitToRoom).not.toHaveBeenCalled()
  })

  it('rejects GPS timestamps beyond the accepted future clock-skew window', async () => {
    const client = makeClient()
    getUser.mockReturnValue({ sub: 'driver-1', role: UserRole.driver })
    getDriverLocation.mockResolvedValue(null)

    await gateway.handleLocationUpdate(client, {
      lat: 10.8,
      lng: 106.7,
      timestamp: new Date(Date.now() + 20_000).toISOString(),
    })

    expect(client.emit).toHaveBeenCalledWith('driver:location_rejected', { reason: 'future_timestamp' })
    expect(handleLocationUpdate).not.toHaveBeenCalled()
    expect(emitToRoom).not.toHaveBeenCalled()
  })

  it('marks routed ETA updates as non-degraded provider values', async () => {
    getUser.mockReturnValue({ sub: 'driver-1', role: UserRole.driver })
    getDriverLocation.mockResolvedValue(null)
    handleLocationUpdate.mockResolvedValue('order-1')
    queryRaw.mockResolvedValue([{
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

    const sampledAt = new Date().toISOString()
    await gateway.handleLocationUpdate(makeClient(), {
      lat: 10.8,
      lng: 106.7,
      bearing: 0,
      speed: 20,
      accuracy: 5,
      timestamp: sampledAt,
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
    expect(queryRaw).toHaveBeenCalledWith(expect.objectContaining({
      values: expect.arrayContaining(['order-1', 'driver-1']),
    }))
    expect(emitToRoom).toHaveBeenCalledWith('driver:location_changed', expect.objectContaining({
      orderId: 'order-1',
      driverId: 'driver-1',
      lat: 10.8,
      lng: 106.7,
      timestamp: sampledAt,
    }))
  })

  it('emits unavailable ETA without fabricating straight-line minutes when route providers fail', async () => {
    getUser.mockReturnValue({ sub: 'driver-1', role: UserRole.driver })
    getDriverLocation.mockResolvedValue(null)
    handleLocationUpdate.mockResolvedValue('order-1')
    queryRaw.mockResolvedValue([{
      status: 'delivering',
      restaurantLat: 10.77,
      restaurantLng: 106.68,
      deliveryLat: 10.75,
      deliveryLng: 106.65,
    }])
    getOrFetchRoute.mockResolvedValue(null)
    const sampledAt = new Date().toISOString()

    await gateway.handleLocationUpdate(makeClient(), {
      lat: 10.8,
      lng: 106.7,
      bearing: 0,
      speed: 20,
      accuracy: 5,
      timestamp: sampledAt,
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
    queryRaw.mockResolvedValue([{
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
    const sampledAt = new Date().toISOString()

    await gateway.handleLocationUpdate(makeClient(), {
      lat: 10.8,
      lng: 106.7,
      bearing: 0,
      speed: 20,
      accuracy: 5,
      timestamp: sampledAt,
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

  it('estimates live ETA from route progress instead of reusing stale cached duration', async () => {
    getUser.mockReturnValue({ sub: 'driver-1', role: UserRole.driver })
    getDriverLocation.mockResolvedValue(null)
    handleLocationUpdate.mockResolvedValue('order-1')
    queryRaw.mockResolvedValue([{
      status: 'delivering',
      restaurantLat: 10.77,
      restaurantLng: 106.68,
      deliveryLat: 10.75,
      deliveryLng: 106.65,
    }])
    getOrFetchRoute.mockResolvedValue({
      polyline: '_k|`A_zfjSf{Cf{Cf{Cf{C',
      distanceMeters: 6000,
      durationSeconds: 600,
      waypoints: [],
      provider: 'google',
    })

    await gateway.handleLocationUpdate(makeClient(), {
      lat: 10.75,
      lng: 106.65,
      bearing: 0,
      speed: 5,
      accuracy: 5,
      timestamp: new Date().toISOString(),
    })

    expect(emitToRoom).toHaveBeenCalledWith('delivery:eta_updated', {
      orderId: 'order-1',
      etaMinutes: 0,
      source: 'google',
      degraded: false,
      routePolyline: '_k|`A_zfjSf{Cf{Cf{Cf{C',
      routePhase: 'dropoff',
    })
  })

  it('does not broadcast into an order room when the active order is not assigned to the driver', async () => {
    getUser.mockReturnValue({ sub: 'driver-1', role: UserRole.driver })
    getDriverLocation.mockResolvedValue(null)
    handleLocationUpdate.mockResolvedValue('order-owned-by-other-driver')
    queryRaw.mockResolvedValue([])

    await gateway.handleLocationUpdate(makeClient(), {
      lat: 10.8,
      lng: 106.7,
      bearing: 0,
      speed: 20,
      accuracy: 5,
      timestamp: new Date().toISOString(),
    })

    expect(getOrFetchRoute).not.toHaveBeenCalled()
    expect(maybeEnqueueRecompute).not.toHaveBeenCalled()
    expect(emitToRoom).not.toHaveBeenCalledWith(
      'driver:location_changed',
      expect.objectContaining({ orderId: 'order-owned-by-other-driver' }),
    )
    expect(emitToRoom).not.toHaveBeenCalledWith(
      'delivery:eta_updated',
      expect.objectContaining({ orderId: 'order-owned-by-other-driver' }),
    )
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

import { UserRole } from '@prisma/client'
import type { Socket } from 'socket.io'
import { TrackingGateway } from './tracking.gateway'
import { DriverOfflineLocationError } from './tracking.service'

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
  const recordGpsAccepted = jest.fn()
  const recordGpsRejected = jest.fn()
  const recordSocketConnection = jest.fn()
  const emitToRoom = jest.fn()
  const to = jest.fn(() => ({ emit: emitToRoom }))
  let gateway: TrackingGateway

  beforeEach(() => {
    jest.clearAllMocks()
    maybeEnqueueRecompute.mockResolvedValue(undefined)
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
      undefined,
      { recordGpsAccepted, recordGpsRejected, recordSocketConnection } as never,
    )
    gateway.server = { to } as never
  })

  it('disconnects unauthenticated clients', async () => {
    const client = makeClient()
    authenticate.mockRejectedValue(new Error('invalid token'))

    await gateway.handleConnection(client)

    expect(client.disconnect).toHaveBeenCalledWith(true)
    expect(recordSocketConnection).toHaveBeenCalledWith('rejected')
  })

  it('signals readiness only after authenticating a client', async () => {
    const client = makeClient()
    authenticate.mockResolvedValue({ sub: 'driver-1', role: UserRole.driver })

    await gateway.handleConnection(client)

    expect(client.emit).toHaveBeenCalledWith('auth:ready')
    expect(client.disconnect).not.toHaveBeenCalled()
    expect(recordSocketConnection).toHaveBeenCalledWith('authenticated')
  })

  it('records recovered Socket.IO connections separately', async () => {
    const client = { ...makeClient(), recovered: true } as unknown as Socket
    authenticate.mockResolvedValue({ sub: 'driver-1', role: UserRole.driver })

    await gateway.handleConnection(client)

    expect(recordSocketConnection).toHaveBeenCalledWith('recovered')
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
    expect(recordGpsAccepted).toHaveBeenCalledWith(expect.any(Number))
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

  it.each([
    null,
    { lat: Number.NaN, lng: 106.7, timestamp: new Date().toISOString() },
    { lat: 10.8, lng: Number.POSITIVE_INFINITY, timestamp: new Date().toISOString() },
  ])('rejects malformed coordinates at the WebSocket boundary', async (sample) => {
    await gateway.processLocationUpdate('driver-1', sample as never)

    expect(recordGpsRejected).toHaveBeenCalledWith('invalid_coordinates')
    expect(handleLocationUpdate).not.toHaveBeenCalled()
  })

  it('rejects low-quality GPS samples before mutating tracking state', async () => {
    const client = makeClient()
    getUser.mockReturnValue({ sub: 'driver-1', role: UserRole.driver })
    getDriverLocation.mockResolvedValue(null)

    await gateway.handleLocationUpdate(client, {
      lat: 10.8,
      lng: 106.7,
      accuracy: 50.1,
      timestamp: new Date().toISOString(),
    })

    expect(client.emit).toHaveBeenCalledWith('driver:location_rejected', {
      reason: 'poor_accuracy',
    })
    expect(recordGpsRejected).toHaveBeenCalledWith('poor_accuracy')
    expect(handleLocationUpdate).not.toHaveBeenCalled()
    expect(emitToRoom).not.toHaveBeenCalled()
  })

  it('rejects GPS updates atomically after the driver goes Offline', async () => {
    getDriverLocation.mockResolvedValue(null)
    handleLocationUpdate.mockRejectedValueOnce(new DriverOfflineLocationError())

    await expect(gateway.processLocationUpdate('driver-1', {
      lat: 10.8,
      lng: 106.7,
      accuracy: 5,
      timestamp: new Date().toISOString(),
    })).resolves.toEqual({ accepted: false, reason: 'driver_offline' })

    expect(recordGpsRejected).toHaveBeenCalledWith('driver_offline')
    expect(notifyAdminDriverLocation).not.toHaveBeenCalled()
  })

  it.each([
    [{ bearing: -1 }, 'invalid_bearing'],
    [{ bearing: 360 }, 'invalid_bearing'],
    [{ speed: -0.1 }, 'invalid_speed'],
    [{ speed: 150.1 }, 'speed_exceeded'],
  ] as const)('rejects invalid motion metadata %p', async (motion, reason) => {
    getDriverLocation.mockResolvedValue(null)

    await gateway.processLocationUpdate('driver-1', {
      lat: 10.8,
      lng: 106.7,
      accuracy: 5,
      timestamp: new Date().toISOString(),
      ...motion,
    })

    expect(recordGpsRejected).toHaveBeenCalledWith(reason)
    expect(handleLocationUpdate).not.toHaveBeenCalled()
  })

  it('accepts the idempotent initial GPS replay after going online', async () => {
    const client = makeClient()
    const timestamp = new Date().toISOString()
    getUser.mockReturnValue({ sub: 'driver-1', role: UserRole.driver })
    getDriverLocation.mockResolvedValue({ lat: 10.8, lng: 106.7, timestamp })
    handleLocationUpdate.mockResolvedValue(null)

    await gateway.handleLocationUpdate(client, {
      lat: 10.8,
      lng: 106.7,
      timestamp,
    })

    expect(handleLocationUpdate).toHaveBeenCalledWith(
      'driver-1',
      expect.objectContaining({ timestamp }),
    )
    expect(client.emit).not.toHaveBeenCalledWith(
      'driver:location_rejected',
      expect.anything(),
    )
  })

  it('rejects a different coordinate that reuses an initial GPS timestamp', async () => {
    const client = makeClient()
    const timestamp = new Date().toISOString()
    getUser.mockReturnValue({ sub: 'driver-1', role: UserRole.driver })
    getDriverLocation.mockResolvedValue({ lat: 10.8, lng: 106.7, timestamp })

    await gateway.handleLocationUpdate(client, {
      lat: 10.9,
      lng: 106.8,
      timestamp,
    })

    expect(client.emit).toHaveBeenCalledWith('driver:location_rejected', {
      reason: 'teleportation',
    })
    expect(handleLocationUpdate).not.toHaveBeenCalled()
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

  it('broadcasts the latest throttled GPS sample on the trailing edge', async () => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2026-07-15T08:00:00.000Z'))
    try {
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

      await gateway.handleLocationUpdate(makeClient(), {
        lat: 10.8,
        lng: 106.7,
        accuracy: 5,
        timestamp: new Date().toISOString(),
      })
      await jest.advanceTimersByTimeAsync(500)
      await gateway.handleLocationUpdate(makeClient(), {
        lat: 10.801,
        lng: 106.701,
        accuracy: 5,
        timestamp: new Date().toISOString(),
      })

      const locationBroadcasts = () => emitToRoom.mock.calls
        .filter(([event]) => event === 'driver:location_changed')
      expect(locationBroadcasts()).toHaveLength(1)

      await jest.advanceTimersByTimeAsync(1_500)

      expect(locationBroadcasts()).toHaveLength(2)
      expect(locationBroadcasts()[1][1]).toEqual(expect.objectContaining({
        lat: 10.801,
        lng: 106.701,
      }))
    } finally {
      jest.useRealTimers()
    }
  })

  it('serializes trailing GPS broadcasts behind a slow earlier route lookup', async () => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2026-07-15T08:00:00.000Z'))
    const routeTarget = [{
      status: 'delivering',
      restaurantLat: 10.77,
      restaurantLng: 106.68,
      deliveryLat: 10.75,
      deliveryLng: 106.65,
    }]
    let releaseFirstQuery!: (value: typeof routeTarget) => void
    const firstQuery = new Promise<typeof routeTarget>((resolve) => {
      releaseFirstQuery = resolve
    })

    try {
      getDriverLocation.mockResolvedValue(null)
      handleLocationUpdate.mockResolvedValue('order-1')
      queryRaw
        .mockImplementationOnce(() => firstQuery)
        .mockResolvedValue(routeTarget)
      getOrFetchRoute.mockResolvedValue(null)

      const firstUpdate = gateway.processLocationUpdate('driver-1', {
        lat: 10.8,
        lng: 106.7,
        accuracy: 5,
        timestamp: new Date().toISOString(),
      })
      for (let attempt = 0; attempt < 10 && queryRaw.mock.calls.length === 0; attempt += 1) {
        await Promise.resolve()
      }
      expect(queryRaw).toHaveBeenCalledTimes(1)

      await jest.advanceTimersByTimeAsync(500)
      await gateway.processLocationUpdate('driver-1', {
        lat: 10.801,
        lng: 106.701,
        accuracy: 5,
        timestamp: new Date().toISOString(),
      })
      await jest.advanceTimersByTimeAsync(1_500)

      const locationBroadcasts = () => emitToRoom.mock.calls
        .filter(([event]) => event === 'driver:location_changed')
      expect(locationBroadcasts()).toHaveLength(0)

      releaseFirstQuery(routeTarget)
      await firstUpdate
      await gateway.onModuleDestroy()

      expect(locationBroadcasts().map(([, payload]) => payload.lat)).toEqual([
        10.8,
        10.801,
      ])
    } finally {
      jest.useRealTimers()
    }
  })

  it('broadcasts the latest throttled GPS sample to Admin on the trailing edge', async () => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2026-07-15T08:00:00.000Z'))
    try {
      getDriverLocation.mockResolvedValue(null)
      handleLocationUpdate.mockResolvedValue(null)

      await gateway.processLocationUpdate('driver-1', {
        lat: 10.8,
        lng: 106.7,
        accuracy: 5,
        timestamp: new Date().toISOString(),
      })
      await jest.advanceTimersByTimeAsync(500)
      await gateway.processLocationUpdate('driver-1', {
        lat: 10.801,
        lng: 106.701,
        accuracy: 5,
        timestamp: new Date().toISOString(),
      })

      expect(notifyAdminDriverLocation).toHaveBeenCalledTimes(1)
      await jest.advanceTimersByTimeAsync(1_500)

      expect(notifyAdminDriverLocation).toHaveBeenCalledTimes(2)
      expect(notifyAdminDriverLocation).toHaveBeenLastCalledWith(expect.objectContaining({
        lat: 10.801,
        lng: 106.701,
      }))
    } finally {
      jest.useRealTimers()
    }
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

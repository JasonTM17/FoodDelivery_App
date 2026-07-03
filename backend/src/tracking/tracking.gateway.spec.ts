import { UserRole } from '@prisma/client'
import type { Socket } from 'socket.io'
import { TrackingGateway } from './tracking.gateway'

describe('TrackingGateway authorization', () => {
  const handleLocationUpdate = jest.fn()
  const getDriverLocation = jest.fn()
  const getOrFetchRoute = jest.fn()
  const calculateETA = jest.fn()
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
        calculateETA,
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

  it('marks routed ETA updates as non-degraded provider values', async () => {
    getUser.mockReturnValue({ sub: 'driver-1', role: UserRole.driver })
    getDriverLocation.mockResolvedValue(null)
    handleLocationUpdate.mockResolvedValue('order-1')
    orderFindUnique.mockResolvedValue({ deliveryAddressId: 'address-1' })
    queryRawUnsafe.mockResolvedValue([{ lat: 10.75, lng: 106.65 }])
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
    })
  })

  it('marks straight-line ETA updates as degraded when route providers fail', async () => {
    getUser.mockReturnValue({ sub: 'driver-1', role: UserRole.driver })
    getDriverLocation.mockResolvedValue(null)
    handleLocationUpdate.mockResolvedValue('order-1')
    orderFindUnique.mockResolvedValue({ deliveryAddressId: 'address-1' })
    queryRawUnsafe.mockResolvedValue([{ lat: 10.75, lng: 106.65 }])
    getOrFetchRoute.mockResolvedValue(null)
    calculateETA.mockReturnValue(18)

    await gateway.handleLocationUpdate(makeClient(), {
      lat: 10.8,
      lng: 106.7,
      bearing: 0,
      speed: 20,
      accuracy: 5,
    })

    expect(emitToRoom).toHaveBeenCalledWith('delivery:eta_updated', {
      orderId: 'order-1',
      etaMinutes: 18,
      source: 'straight_line_estimate',
      degraded: true,
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

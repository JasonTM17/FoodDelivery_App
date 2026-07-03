import { UserRole } from '@prisma/client'
import type { Socket } from 'socket.io'
import { TrackingGateway } from './tracking.gateway'

describe('TrackingGateway authorization', () => {
  const handleLocationUpdate = jest.fn()
  const authenticate = jest.fn()
  const getUser = jest.fn()
  const canAccessOrder = jest.fn()
  const gateway = new TrackingGateway(
    {
      handleLocationUpdate,
      getDriverLocation: jest.fn(),
    } as never,
    {} as never,
    {} as never,
    { authenticate, getUser } as never,
    { canAccessOrder } as never,
  )

  beforeEach(() => {
    jest.clearAllMocks()
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

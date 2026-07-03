import { UserRole } from '@prisma/client'
import type { Socket } from 'socket.io'
import { DispatchGateway } from './dispatch.gateway'

describe('DispatchGateway authentication', () => {
  const redis = {
    get: jest.fn(),
    del: jest.fn(),
  }
  const authenticate = jest.fn()
  const getUser = jest.fn()
  const gateway = new DispatchGateway(
    redis as never,
    { authenticate, getUser } as never,
  )

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('joins an authenticated driver to only their offer room', async () => {
    const client = makeClient()
    authenticate.mockResolvedValue({ sub: 'driver-1', role: UserRole.driver })

    await gateway.handleConnection(client)

    expect(client.join).toHaveBeenCalledWith('driver:driver-1')
    expect(client.disconnect).not.toHaveBeenCalled()
  })

  it('disconnects non-driver accounts from the dispatch namespace', async () => {
    const client = makeClient()
    authenticate.mockResolvedValue({ sub: 'admin-1', role: UserRole.admin })

    await gateway.handleConnection(client)

    expect(client.disconnect).toHaveBeenCalledWith(true)
    expect(client.join).not.toHaveBeenCalled()
  })

  it('rejects non-driver clients before reading offer tokens', async () => {
    const client = makeClient()
    getUser.mockReturnValue({ sub: 'customer-1', role: UserRole.customer })

    await expect(gateway.handleAccept(client, {
      orderId: 'order-1',
      offerToken: 'offer-token',
    })).resolves.toEqual({
      event: 'error',
      data: { message: 'Unauthorized driver' },
    })
    expect(redis.get).not.toHaveBeenCalled()
  })

  it('accepts a valid offer only for the authenticated driver', async () => {
    const client = makeClient()
    getUser.mockReturnValue({ sub: 'driver-1', role: UserRole.driver })
    redis.get.mockResolvedValue('offer-token')
    redis.del.mockResolvedValue(1)
    const callback = jest.fn()
    gateway.registerOfferResponse('order-1:driver-1', callback)

    await expect(gateway.handleAccept(client, {
      orderId: 'order-1',
      offerToken: 'offer-token',
    })).resolves.toEqual({
      event: 'dispatch:accepted',
      data: { orderId: 'order-1' },
    })
    expect(callback).toHaveBeenCalledWith(true)
    expect(redis.del).toHaveBeenCalledWith('offer:order-1:driver-1')
  })
})

function makeClient(): Socket {
  return {
    data: {},
    join: jest.fn(),
    disconnect: jest.fn(),
  } as unknown as Socket
}

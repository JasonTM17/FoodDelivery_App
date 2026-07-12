import { UserRole } from '@prisma/client'
import type { Socket } from 'socket.io'
import { DispatchGateway } from './dispatch.gateway'

describe('DispatchGateway authentication', () => {
  const authenticate = jest.fn()
  const getUser = jest.fn()
  const respondToOffer = jest.fn()
  const attachSocketServer = jest.fn()
  const gateway = new DispatchGateway(
    { authenticate, getUser } as never,
    { respondToOffer } as never,
    { attachSocketServer } as never,
  )

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('joins an authenticated driver to only their offer room', async () => {
    const client = makeClient()
    authenticate.mockResolvedValue({ sub: 'driver-1', role: UserRole.driver })

    await gateway.handleConnection(client)

    expect(client.join).toHaveBeenCalledWith('driver:driver-1')
    expect(client.emit).toHaveBeenCalledWith('auth:ready')
    expect(client.disconnect).not.toHaveBeenCalled()
  })

  it('disconnects non-driver accounts from the dispatch namespace', async () => {
    const client = makeClient()
    authenticate.mockResolvedValue({ sub: 'admin-1', role: UserRole.admin })

    await gateway.handleConnection(client)

    expect(client.disconnect).toHaveBeenCalledWith(true)
    expect(client.join).not.toHaveBeenCalled()
  })

  it('rejects non-driver clients before resolving offer tokens', async () => {
    const client = makeClient()
    getUser.mockReturnValue({ sub: 'customer-1', role: UserRole.customer })

    await expect(gateway.handleAccept(client, {
      orderId: 'order-1',
      offerToken: 'offer-token',
    })).resolves.toEqual({
      event: 'error',
      data: { message: 'Unauthorized driver' },
    })
    expect(respondToOffer).not.toHaveBeenCalled()
  })

  it('accepts a valid offer only for the authenticated driver', async () => {
    const client = makeClient()
    getUser.mockReturnValue({ sub: 'driver-1', role: UserRole.driver })
    respondToOffer.mockResolvedValue({
      orderId: 'order-1',
      decision: 'accept',
      status: 'assigned',
    })

    await expect(gateway.handleAccept(client, {
      orderId: 'order-1',
      offerToken: 'offer-token',
    })).resolves.toEqual({
      event: 'dispatch:accepted',
      data: { orderId: 'order-1' },
    })
    expect(respondToOffer).toHaveBeenCalledWith(
      'order-1',
      'driver-1',
      'offer-token',
      'accept',
    )
  })

  it('attaches the Socket.IO server to the shared notifier', () => {
    const server = {} as never
    gateway.afterInit(server)
    expect(attachSocketServer).toHaveBeenCalledWith(server)
  })
})

function makeClient(): Socket {
  return {
    data: {},
    join: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
  } as unknown as Socket
}

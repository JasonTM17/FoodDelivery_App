import type { Socket } from 'socket.io'
import { NotificationsGateway } from './notifications.gateway'

describe('NotificationsGateway authentication', () => {
  const authenticate = jest.fn()
  const markAsRead = jest.fn()
  const markAllAsRead = jest.fn()
  const gateway = new NotificationsGateway(
    { authenticate } as never,
    { markAsRead, markAllAsRead } as never,
  )

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('joins only the authenticated user notification room', async () => {
    const client = makeClient()
    authenticate.mockResolvedValue({ sub: 'user-1', role: 'customer' })

    await gateway.handleConnection(client)

    expect(client.join).toHaveBeenCalledWith('user:user-1:notifications')
    expect(client.emit).toHaveBeenCalledWith('auth:ready')
    expect(client.disconnect).not.toHaveBeenCalled()
  })

  it('disconnects clients with invalid access tokens', async () => {
    const client = makeClient()
    authenticate.mockRejectedValue(new Error('invalid token'))

    await gateway.handleConnection(client)

    expect(client.disconnect).toHaveBeenCalledWith(true)
    expect(client.join).not.toHaveBeenCalled()
  })

  it('uses the authenticated socket user for notification mutations', async () => {
    const client = makeClient({ sub: 'user-1', role: 'customer' })
    markAsRead.mockResolvedValue(undefined)
    markAllAsRead.mockResolvedValue(undefined)

    await expect(gateway.handleMarkAsRead(client, { notificationId: 'notification-1' }))
      .resolves.toEqual({ success: true })
    await expect(gateway.handleMarkAllAsRead(client))
      .resolves.toEqual({ success: true })
    expect(markAsRead).toHaveBeenCalledWith('notification-1', 'user-1')
    expect(markAllAsRead).toHaveBeenCalledWith('user-1')
  })
})

function makeClient(user?: { sub: string; role: string }): Socket {
  return {
    id: 'socket-1',
    data: user ? { user } : {},
    join: jest.fn(),
    leave: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
  } as unknown as Socket
}

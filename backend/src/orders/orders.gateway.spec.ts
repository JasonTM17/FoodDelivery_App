import { UserRole } from '@prisma/client'
import type { Socket } from 'socket.io'
import { OrdersGateway } from './orders.gateway'

describe('OrdersGateway realtime room authorization', () => {
  const authenticate = jest.fn()
  const getUser = jest.fn()
  const canAccessOrder = jest.fn()
  const canAccessRestaurant = jest.fn()
  const gateway = new OrdersGateway(
    { authenticate, getUser } as never,
    { canAccessOrder, canAccessRestaurant } as never,
  )

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('disconnects clients whose access token cannot be authenticated', async () => {
    const client = makeClient()
    authenticate.mockRejectedValue(new Error('invalid token'))

    await gateway.handleConnection(client)

    expect(client.disconnect).toHaveBeenCalledWith(true)
  })

  it('signals readiness after authenticating a client', async () => {
    const client = makeClient()
    authenticate.mockResolvedValue({ sub: 'customer-1', role: UserRole.customer })

    await gateway.handleConnection(client)

    expect(client.emit).toHaveBeenCalledWith('auth:ready')
    expect(client.disconnect).not.toHaveBeenCalled()
  })

  it('only lets admins subscribe to driver and order administration rooms', () => {
    const client = makeClient()
    getUser.mockReturnValue({ sub: 'restaurant-1', role: UserRole.restaurant })

    expect(gateway.handleAdminSubscribe(client)).toEqual({ success: false })
    expect(gateway.handleAdminOrderSubscribe(client)).toEqual({ success: false })
    expect(client.join).not.toHaveBeenCalled()

    getUser.mockReturnValue({ sub: 'admin-1', role: UserRole.admin })
    expect(gateway.handleAdminSubscribe(client)).toEqual({ success: true })
    expect(gateway.handleAdminOrderSubscribe(client)).toEqual({ success: true })
    expect(client.join).toHaveBeenCalledWith('admin:drivers:all')
    expect(client.join).toHaveBeenCalledWith('admin:orders')
  })

  it('checks order and restaurant tenant access before joining rooms', async () => {
    const client = makeClient()
    const user = { sub: 'restaurant-user', role: UserRole.restaurant }
    getUser.mockReturnValue(user)
    canAccessOrder.mockResolvedValue(false)
    canAccessRestaurant.mockResolvedValue(true)

    await expect(gateway.handleOrderSubscribe(client, { orderId: 'order-1' }))
      .resolves.toEqual({ success: false })
    await expect(gateway.handleRestaurantSubscribe(client, {
      restaurantId: 'restaurant-1',
    })).resolves.toEqual({ success: true })

    expect(canAccessOrder).toHaveBeenCalledWith(user, 'order-1')
    expect(canAccessRestaurant).toHaveBeenCalledWith(user, 'restaurant-1')
    expect(client.join).not.toHaveBeenCalledWith('order:order-1')
    expect(client.join).toHaveBeenCalledWith('restaurant:restaurant-1')
  })

  it('keeps restaurant-driver chat events out of customer order rooms', async () => {
    const customer = makeClient()
    getUser.mockReturnValue({ sub: 'customer-1', role: UserRole.customer })
    canAccessOrder.mockResolvedValue(true)

    await expect(gateway.handleOrderSubscribe(customer, { orderId: 'order-1' }))
      .resolves.toEqual({ success: true })
    expect(customer.join).toHaveBeenCalledWith('order:order-1')
    expect(customer.join).not.toHaveBeenCalledWith('order:order-1:restaurant-driver')

    const restaurant = makeClient()
    getUser.mockReturnValue({ sub: 'restaurant-user', role: UserRole.restaurant })

    await expect(gateway.handleOrderSubscribe(restaurant, { orderId: 'order-1' }))
      .resolves.toEqual({ success: true })
    expect(restaurant.join).toHaveBeenCalledWith('order:order-1')
    expect(restaurant.join).toHaveBeenCalledWith('order:order-1:restaurant-driver')
  })

  it('broadcasts saved chat messages only to the participant chat room', () => {
    const emit = jest.fn()
    gateway.server = { to: jest.fn(() => ({ emit })) } as never

    gateway.broadcastToRestaurantDriverChat('order-1', 'order:message_created', {
      orderId: 'order-1',
      id: 'message-1',
    })

    expect(gateway.server.to).toHaveBeenCalledWith('order:order-1:restaurant-driver')
    expect(emit).toHaveBeenCalledWith('order:message_created', {
      orderId: 'order-1',
      id: 'message-1',
    })
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

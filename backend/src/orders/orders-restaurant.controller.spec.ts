import { Test, TestingModule } from '@nestjs/testing'
import { OrdersController } from './orders.controller'
import { OrdersService } from './orders.service'

describe('OrdersController — Restaurant', () => {
  let controller: OrdersController

  const mockOrdersService = {
    getRestaurantOrders: jest.fn().mockResolvedValue({ orders: [], meta: { page: 1, limit: 50, total: 0 } }),
    updateOrderStatus: jest.fn().mockResolvedValue({ id: 'order-1', status: 'restaurant_accepted' }),
    getRestaurantOrderDetail: jest.fn().mockResolvedValue({ id: 'order-1', status: 'restaurant_accepted' }),
    placeOrder: jest.fn(),
    getCustomerOrders: jest.fn(),
    getOrderDetail: jest.fn(),
    getTracking: jest.fn(),
    cancelOrder: jest.fn(),
    submitReview: jest.fn(),
  }

  const mockRedis = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        { provide: OrdersService, useValue: mockOrdersService },
        { provide: 'REDIS_CLIENT', useValue: mockRedis },
      ],
    }).compile()
    controller = module.get(OrdersController)
  })

  it('should return restaurant orders', async () => {
    const user = { sub: 'restaurant-1', role: 'restaurant' }
    const result = await controller.getRestaurantOrders(user)
    expect(result).toEqual({ orders: [], meta: { page: 1, limit: 50, total: 0 } })
    expect(mockOrdersService.getRestaurantOrders).toHaveBeenCalledWith('restaurant-1', undefined)
  })

  it('should filter by status', async () => {
    const user = { sub: 'restaurant-1', role: 'restaurant' }
    await controller.getRestaurantOrders(user, 'preparing')
    expect(mockOrdersService.getRestaurantOrders).toHaveBeenCalledWith('restaurant-1', 'preparing')
  })

  it('should update order status as restaurant', async () => {
    const user = { sub: 'restaurant-1', role: 'restaurant' }
    const result = await controller.updateRestaurantOrderStatus(user, 'order-1', { status: 'restaurant_accepted', note: 'OK' })
    expect(result.status).toBe('restaurant_accepted')
    expect(mockOrdersService.getRestaurantOrderDetail).toHaveBeenCalledWith('order-1', 'restaurant-1')
  })

  it('should update delivery status as driver', async () => {
    const user = { sub: 'driver-1', role: 'driver' }
    const result = await controller.updateDriverOrderStatus(user, 'order-1', { status: 'picked_up' })
    expect(result.status).toBe('restaurant_accepted')
  })
})

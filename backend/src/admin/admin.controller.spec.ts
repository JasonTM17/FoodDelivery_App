import { Test, TestingModule } from '@nestjs/testing'
import { AdminController } from './admin.controller'
import { AdminService } from './admin.service'

describe('AdminController', () => {
  let controller: AdminController

  const mockAdminService = {
    getDashboard: jest.fn().mockResolvedValue({
      totalOrders: 100, todayOrders: 10, todayRevenue: 5000000,
      activeDrivers: 5, totalUsers: 50, totalRestaurants: 20,
      orderByStatus: {}, recentOrders: [],
    }),
    getOrders: jest.fn().mockResolvedValue({ orders: [], meta: { page: 1, limit: 20, total: 0 } }),
    getUsers: jest.fn().mockResolvedValue({ users: [], meta: { page: 1, limit: 20, total: 0 } }),
    toggleUserStatus: jest.fn().mockResolvedValue({ id: 'u1', isActive: false }),
    getRestaurants: jest.fn().mockResolvedValue({ restaurants: [], meta: { page: 1, limit: 20, total: 0 } }),
    toggleRestaurantStatus: jest.fn(),
    getSupportTickets: jest.fn().mockResolvedValue({ tickets: [], meta: { page: 1, limit: 20, total: 0 } }),
    updateSupportTicket: jest.fn(),
    getAuditLogs: jest.fn().mockResolvedValue({ logs: [], meta: { page: 1, limit: 50, total: 0 } }),
    getTopRestaurants: jest.fn().mockResolvedValue([]),
    getRevenueChart: jest.fn().mockResolvedValue([]),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [{ provide: AdminService, useValue: mockAdminService }],
    }).compile()
    controller = module.get(AdminController)
  })

  it('getDashboard returns KPIs', async () => {
    const result = await controller.getDashboard()
    expect(result.totalOrders).toBe(100)
    expect(result.todayRevenue).toBe(5000000)
  })

  it('getUsers returns paginated users', async () => {
    const result = await controller.getUsers()
    expect(result.meta.total).toBe(0)
  })

  it('toggleUserStatus bans user', async () => {
    const result = await controller.toggleUserStatus('u1', { isActive: false })
    expect(result.isActive).toBe(false)
  })
})

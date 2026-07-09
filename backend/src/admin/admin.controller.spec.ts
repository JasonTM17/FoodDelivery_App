import { Test, TestingModule } from '@nestjs/testing'
import { AdminController } from './admin.controller'
import { AdminService } from './admin.service'

describe('AdminController', () => {
  let controller: AdminController

  const mockPromotion = {
    id: 'p1', code: 'WELCOME20', type: 'percentage', value: 20,
    minOrderAmount: 50000, maxDiscount: 50000, usageLimit: 1000, usageCount: 145,
    isActive: true, startsAt: '2026-01-01', expiresAt: '2026-12-31',
    createdAt: new Date().toISOString(),
  }

  const mockAdminService = {
    getDashboard: jest.fn().mockResolvedValue({
      totalOrders: 100, todayOrders: 10, todayRevenue: 5000000,
      activeDrivers: 5, totalUsers: 50, totalRestaurants: 20,
      orderByStatus: {}, recentOrders: [],
    }),
    getOrders: jest.fn().mockResolvedValue({ data: [], meta: { page: 1, limit: 20, total: 0 } }),
    getUsers: jest.fn().mockResolvedValue({ users: [], meta: { page: 1, limit: 20, total: 0 } }),
    toggleUserStatus: jest.fn().mockResolvedValue({ id: 'u1', isActive: false }),
    getRestaurants: jest.fn().mockResolvedValue({ restaurants: [], meta: { page: 1, limit: 20, total: 0 } }),
    toggleRestaurantStatus: jest.fn(),
    getSupportTickets: jest.fn().mockResolvedValue({ tickets: [], meta: { page: 1, limit: 20, total: 0 } }),
    updateSupportTicket: jest.fn(),
    getTopRestaurants: jest.fn().mockResolvedValue([]),
    getRevenueChart: jest.fn().mockResolvedValue([]),
    getPromotions: jest.fn().mockResolvedValue({ promotions: [mockPromotion], meta: { page: 1, limit: 20, total: 1, totalPages: 1 } }),
    createPromotion: jest.fn().mockResolvedValue(mockPromotion),
    updatePromotion: jest.fn().mockResolvedValue(mockPromotion),
    deletePromotion: jest.fn().mockResolvedValue({ deleted: true }),
    togglePromotionActive: jest.fn().mockResolvedValue({ ...mockPromotion, isActive: false }),
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

  it('getPromotions returns paginated promotions', async () => {
    const result = await controller.getPromotions({})
    expect(result.promotions).toHaveLength(1)
    expect(result.promotions[0].code).toBe('WELCOME20')
    expect(result.meta.total).toBe(1)
  })

  it('createPromotion returns created promotion', async () => {
    const dto = { code: 'NEW50', type: 'percentage' as const, value: 50, usageLimit: 100, startsAt: '2026-06-01', expiresAt: '2026-12-31' }
    const result = await controller.createPromotion(dto)
    expect(mockAdminService.createPromotion).toHaveBeenCalledWith(dto)
    expect(result.code).toBe('WELCOME20')
  })

  it('updatePromotion delegates to service', async () => {
    const dto = { isActive: false }
    const result = await controller.updatePromotion('p1', dto)
    expect(mockAdminService.updatePromotion).toHaveBeenCalledWith('p1', dto)
    expect(result.id).toBe('p1')
  })

  it('deletePromotion returns deleted confirmation', async () => {
    const result = await controller.deletePromotion('p1')
    expect(mockAdminService.deletePromotion).toHaveBeenCalledWith('p1')
    expect(result.deleted).toBe(true)
  })

  it('togglePromotionActive toggles the promotion', async () => {
    const result = await controller.togglePromotionActive('p1')
    expect(mockAdminService.togglePromotionActive).toHaveBeenCalledWith('p1')
    expect(result.isActive).toBe(false)
  })

  it('getRestaurants does not pass NaN page/limit when query is omitted', async () => {
    await controller.getRestaurants()
    expect(mockAdminService.getRestaurants).toHaveBeenCalledWith({
      page: undefined,
      limit: undefined,
    })
  })

  it('getSupportTickets coerces invalid page strings to undefined', async () => {
    await controller.getSupportTickets(undefined, 'not-a-number', '0')
    expect(mockAdminService.getSupportTickets).toHaveBeenCalledWith({
      status: undefined,
      page: undefined,
      limit: undefined,
    })
  })

  it('getRestaurants accepts positive page/limit query strings', async () => {
    await controller.getRestaurants('2', '10')
    expect(mockAdminService.getRestaurants).toHaveBeenCalledWith({ page: 2, limit: 10 })
  })

  it('toggleRestaurantStatus forwards status body for web client', async () => {
    mockAdminService.toggleRestaurantStatus.mockResolvedValue({ id: 'r1', isActive: false })
    await controller.toggleRestaurantStatus('r1', { status: 'disabled' })
    expect(mockAdminService.toggleRestaurantStatus).toHaveBeenCalledWith('r1', { status: 'disabled' })
  })
})

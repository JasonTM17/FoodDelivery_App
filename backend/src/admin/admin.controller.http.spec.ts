/**
 * HTTP-level tests for AdminController Zod pipe placement.
 * Method-level @UsePipes validates @Param/@CurrentUser too → 400 Validation failed.
 * These requests go through Nest pipes via supertest (not controller method calls).
 */
import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { AdminController } from './admin.controller'
import { AdminService } from './admin.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { RolesGuard } from '../auth/roles.guard'

// CJS interop: `import * as request` is not callable under ts-jest/esModuleInterop
// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest') as typeof import('supertest')

const ADMIN_USER = { sub: 'admin-jwt-sub-1', role: 'admin', email: 'admin@foodflow.vn' }

describe('AdminController HTTP (Zod body pipes)', () => {
  let app: INestApplication
  const adminService = {
    toggleUserStatus: jest.fn().mockResolvedValue({ id: 'u1', isActive: true }),
    toggleRestaurantStatus: jest.fn().mockResolvedValue({ id: 'r1', isActive: false }),
    updateSupportTicket: jest.fn().mockResolvedValue({ id: 't1', assignedAdminId: ADMIN_USER.sub }),
    updatePromotion: jest.fn().mockResolvedValue({ id: 'p1', isActive: false }),
    createPromotion: jest.fn().mockResolvedValue({ id: 'p1', code: 'HTTP10' }),
    getDashboard: jest.fn(),
    getUsers: jest.fn(),
    getRestaurants: jest.fn(),
    getSupportTickets: jest.fn(),
    getPromotions: jest.fn(),
    getOrders: jest.fn(),
    getTopRestaurants: jest.fn(),
    getRevenueChart: jest.fn(),
    deletePromotion: jest.fn(),
    togglePromotionActive: jest.fn(),
    getDispatchHeatmap: jest.fn(),
    getRestaurantKpi: jest.fn(),
  }

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [{ provide: AdminService, useValue: adminService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (ctx: { switchToHttp: () => { getRequest: () => Record<string, unknown> } }) => {
          const req = ctx.switchToHttp().getRequest()
          req.user = ADMIN_USER
          return true
        },
      })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile()

    app = module.createNestApplication()
    // Match production global prefix so paths mirror live API
    app.setGlobalPrefix('api')
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('PATCH /api/admin/users/:id/status accepts { status: active } without validating param id as body', async () => {
    const res = await request(app.getHttpServer())
      .patch('/api/admin/users/user-uuid-1/status')
      .send({ status: 'active' })
      .expect(200)

    expect(res.body).toMatchObject({ id: 'u1', isActive: true })
    expect(adminService.toggleUserStatus).toHaveBeenCalledWith('user-uuid-1', { status: 'active' })
  })

  it('PATCH /api/admin/users/:id/status accepts { status: banned }', async () => {
    adminService.toggleUserStatus.mockResolvedValueOnce({ id: 'u1', isActive: false })
    await request(app.getHttpServer())
      .patch('/api/admin/users/user-uuid-1/status')
      .send({ status: 'banned' })
      .expect(200)
    expect(adminService.toggleUserStatus).toHaveBeenCalledWith('user-uuid-1', { status: 'banned' })
  })

  it('PATCH /api/admin/restaurants/:id/status accepts { status: disabled }', async () => {
    await request(app.getHttpServer())
      .patch('/api/admin/restaurants/rest-uuid-1/status')
      .send({ status: 'disabled' })
      .expect(200)
    expect(adminService.toggleRestaurantStatus).toHaveBeenCalledWith('rest-uuid-1', {
      status: 'disabled',
    })
  })

  it('PATCH /api/admin/support-tickets/:id maps assignedTo self to JWT sub', async () => {
    await request(app.getHttpServer())
      .patch('/api/admin/support-tickets/ticket-uuid-1')
      .send({ assignedTo: 'self' })
      .expect(200)

    expect(adminService.updateSupportTicket).toHaveBeenCalledWith('ticket-uuid-1', {
      status: undefined,
      assignedAdminId: ADMIN_USER.sub,
      resolutionNotes: undefined,
    })
  })

  it('PATCH /api/admin/promotions/:id accepts body without treating param as body schema', async () => {
    await request(app.getHttpServer())
      .patch('/api/admin/promotions/promo-uuid-1')
      .send({ isActive: false })
      .expect(200)
    expect(adminService.updatePromotion).toHaveBeenCalledWith('promo-uuid-1', { isActive: false })
  })

  it('rejects empty toggle body with 400 (validation still works on body)', async () => {
    await request(app.getHttpServer())
      .patch('/api/admin/users/user-uuid-1/status')
      .send({})
      .expect(400)
    expect(adminService.toggleUserStatus).not.toHaveBeenCalled()
  })
})

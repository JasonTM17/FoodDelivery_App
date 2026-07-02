import { AdminService } from './admin.service'
import { PrismaService } from '../database/prisma.service'

describe('AdminService promotion contract', () => {
  const findUnique = jest.fn()
  const create = jest.fn()
  const update = jest.fn()
  const service = new AdminService({
    promotion: { findUnique, create, update },
  } as unknown as PrismaService)

  beforeEach(() => {
    jest.clearAllMocks()
    findUnique.mockResolvedValue(null)
    create.mockResolvedValue(makePromotion())
    update.mockResolvedValue(makePromotion())
  })

  it('persists canonical admin promotion fields', async () => {
    await service.createPromotion({
      code: 'WELCOME20',
      name: 'Welcome campaign',
      description: 'New customer offer',
      type: 'percentage',
      value: 20,
      minOrderAmount: 100_000,
      maxDiscount: 50_000,
      usageLimit: 100,
      maxPerUser: 2,
      targeting: { audience: 'new' },
      startsAt: '2026-07-01T00:00:00.000Z',
      expiresAt: '2026-07-31T23:59:59.000Z',
      isActive: true,
    })

    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: 'Welcome campaign',
        minOrderAmount: 100_000,
        maxPerUser: 2,
        targeting: { audience: 'new' },
        startsAt: new Date('2026-07-01T00:00:00.000Z'),
        expiresAt: new Date('2026-07-31T23:59:59.000Z'),
        isActive: true,
        status: 'active',
      }),
    })
  })

  it('keeps status synchronized when an admin pauses a promotion', async () => {
    findUnique.mockResolvedValue(makePromotion({ isActive: true, status: 'active' }))

    await service.togglePromotionActive('promotion-1')

    expect(update).toHaveBeenCalledWith({
      where: { id: 'promotion-1' },
      data: { isActive: false, status: 'paused' },
    })
  })

  it('updates canonical fields instead of legacy aliases', async () => {
    findUnique.mockResolvedValue(makePromotion())

    await service.updatePromotion('promotion-1', {
      minOrderAmount: 200_000,
      startsAt: '2026-08-01T00:00:00.000Z',
      isActive: false,
    })

    expect(update).toHaveBeenCalledWith({
      where: { id: 'promotion-1' },
      data: {
        minOrderAmount: 200_000,
        startsAt: new Date('2026-08-01T00:00:00.000Z'),
        isActive: false,
        status: 'paused',
      },
    })
  })
})

function makePromotion(overrides: Record<string, unknown> = {}) {
  return {
    id: 'promotion-1',
    code: 'WELCOME20',
    name: 'Welcome campaign',
    description: 'New customer offer',
    type: 'percentage',
    value: 20,
    minOrderAmount: 100_000,
    maxDiscount: 50_000,
    usageLimit: 100,
    usageCount: 0,
    maxPerUser: 2,
    targeting: { audience: 'new' },
    startsAt: new Date('2026-07-01T00:00:00.000Z'),
    expiresAt: new Date('2026-07-31T23:59:59.000Z'),
    isActive: true,
    status: 'active',
    ...overrides,
  }
}

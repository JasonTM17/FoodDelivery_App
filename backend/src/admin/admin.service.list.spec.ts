import { AdminService } from './admin.service'

describe('AdminService list endpoints', () => {
  const prisma = {
    restaurant: {
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    aiSupportTicket: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  }

  let service: AdminService

  beforeEach(() => {
    jest.clearAllMocks()
    service = new AdminService(prisma as never)
  })

  it('getRestaurants defaults pagination when page/limit are NaN', async () => {
    prisma.restaurant.findMany.mockResolvedValue([])
    prisma.restaurant.count.mockResolvedValue(0)

    await service.getRestaurants({ page: Number(undefined), limit: Number(undefined) })

    expect(prisma.restaurant.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 20 }),
    )
  })

  it('getRestaurants maps owner, cuisine, status, total for admin UI', async () => {
    prisma.restaurant.findMany.mockResolvedValue([
      {
        id: 'r1',
        name: 'Phở 24',
        slug: 'pho-24',
        cuisineTypes: ['pho', 'noodles'],
        priceRange: 'medium',
        rating: 4.5,
        totalReviews: 3,
        isActive: true,
        approvalStatus: 'approved',
        addressLine: '1 Nguyen Hue',
        city: 'HCM',
        phone: '0900000010',
        logoUrl: null,
        createdAt: new Date('2026-01-01T00:00:00Z'),
        profiles: [{ user: { fullName: 'Owner One', email: 'owner@foodflow.vn' } }],
        _count: { orders: 12 },
      },
    ])
    prisma.restaurant.count.mockResolvedValue(1)

    const result = await service.getRestaurants({})

    expect(result.total).toBe(1)
    expect(result.restaurants[0]).toMatchObject({
      id: 'r1',
      name: 'Phở 24',
      cuisine: 'pho',
      rating: 4.5,
      totalOrders: 12,
      status: 'active',
      owner: { name: 'Owner One', email: 'owner@foodflow.vn' },
    })
  })

  it('getSupportTickets returns empty list with meta when no tickets', async () => {
    prisma.aiSupportTicket.findMany.mockResolvedValue([])
    prisma.aiSupportTicket.count.mockResolvedValue(0)

    const result = await service.getSupportTickets({})

    expect(result.tickets).toEqual([])
    expect(result.meta).toMatchObject({ page: 1, limit: 20, total: 0 })
  })

  it('toggleRestaurantStatus accepts status string from web UI', async () => {
    prisma.restaurant.update.mockResolvedValue({ id: 'r1', isActive: false })
    await service.toggleRestaurantStatus('r1', { status: 'disabled' })
    expect(prisma.restaurant.update).toHaveBeenCalledWith({
      where: { id: 'r1' },
      data: { isActive: false },
    })
  })
})

import { NotFoundException } from '@nestjs/common'
import { OrderStatus, RestaurantApprovalStatus, SupportChannel, TicketPriority, TicketStatus } from '@prisma/client'
import { AiToolsService } from './ai-tools.service'

describe('AiToolsService', () => {
  const prisma = {
    order: { findFirst: jest.fn(), findMany: jest.fn() },
    aiSupportTicket: {
      findFirst: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
    },
    menuItem: { findMany: jest.fn() },
    orderItem: { findMany: jest.fn() },
    user: { findMany: jest.fn() },
    $queryRaw: jest.fn(),
  }
  const notifications = { create: jest.fn() }
  const service = new AiToolsService(prisma as never, notifications as never)

  beforeEach(() => {
    jest.clearAllMocks()
    prisma.user.findMany.mockResolvedValue([])
    notifications.create.mockResolvedValue({ id: 'notification-1' })
  })

  it('scopes order status lookups to the authenticated customer and order code', async () => {
    prisma.order.findFirst.mockResolvedValue({ id: 'order-1', orderCode: 'FD0000000001' })

    const result = await service.getOrderStatus('FD0000000001', 'customer-1')

    expect(prisma.order.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        customerId: 'customer-1',
        OR: [{ orderCode: { equals: 'FD0000000001', mode: 'insensitive' } }],
      },
    }))
    expect(result).toEqual({ id: 'order-1', orderCode: 'FD0000000001' })
  })

  it('allows UUID order references only after customer scoping is applied', async () => {
    prisma.order.findFirst.mockResolvedValue({ id: '4f3c1f92-6e5c-4b8f-8b24-7e9d6e3b2a10' })

    await service.getOrderStatus('4f3c1f92-6e5c-4b8f-8b24-7e9d6e3b2a10', 'customer-1')

    expect(prisma.order.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        customerId: 'customer-1',
        OR: [
          { orderCode: { equals: '4f3c1f92-6e5c-4b8f-8b24-7e9d6e3b2a10', mode: 'insensitive' } },
          { id: '4f3c1f92-6e5c-4b8f-8b24-7e9d6e3b2a10' },
        ],
      },
    }))
  })

  it('grounds driver tracking only for the customer active order without exposing coordinates to the LLM', async () => {
    prisma.order.findFirst.mockResolvedValue({
      id: 'order-1',
      driverId: 'driver-1',
      status: OrderStatus.delivering,
    })
    prisma.$queryRaw.mockResolvedValue([{ recorded_at: new Date('2026-07-11T06:00:00.000Z') }])

    const result = await service.getDriverLocation('FD0000000001', 'customer-1')

    expect(result).toEqual({
      available: true,
      orderStatus: OrderStatus.delivering,
      recordedAt: '2026-07-11T06:00:00.000Z',
    })
    expect(result).not.toHaveProperty('lat')
    expect(result).not.toHaveProperty('lng')
    const query = prisma.$queryRaw.mock.calls[0][0]
    expect(query.sql).toContain('order_id')
    expect(query.sql).toContain("INTERVAL '30 seconds'")
    expect(query.values).toEqual(['driver-1', 'order-1'])
  })

  it('does not retrieve a driver current location for a completed order', async () => {
    prisma.order.findFirst.mockResolvedValue({
      id: 'order-1',
      driverId: 'driver-1',
      status: OrderStatus.completed,
    })

    await expect(service.getDriverLocation('FD0000000001', 'customer-1')).resolves.toEqual({
      available: false,
      orderStatus: OrderStatus.completed,
    })
    expect(prisma.$queryRaw).not.toHaveBeenCalled()
  })

  it('deduplicates open support tickets for the same customer-owned order and issue', async () => {
    const existing = {
      id: 'ticket-1',
      issueType: 'driver_issue',
      summary: 'Driver is unreachable',
      status: TicketStatus.open,
      priority: TicketPriority.high,
      createdAt: new Date('2026-07-03T00:00:00.000Z'),
    }
    prisma.order.findFirst.mockResolvedValue({ id: 'order-1' })
    prisma.aiSupportTicket.findFirst.mockResolvedValue(existing)

    const result = await service.createSupportTicket(
      'customer-1',
      'FD0000000001',
      'driver_issue',
      'Driver is unreachable',
      TicketPriority.high,
    )

    expect(prisma.order.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        customerId: 'customer-1',
        OR: [{ orderCode: { equals: 'FD0000000001', mode: 'insensitive' } }],
      },
    }))
    expect(prisma.aiSupportTicket.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        userId: 'customer-1',
        orderId: 'order-1',
        issueType: 'driver_issue',
        status: { in: [TicketStatus.open, TicketStatus.in_progress, TicketStatus.waiting_customer] },
      }),
    }))
    expect(prisma.aiSupportTicket.create).not.toHaveBeenCalled()
    expect(result).toBe(existing)
  })

  it('creates AI chat support tickets with a session tag for monitor attribution', async () => {
    const created = {
      id: 'ticket-1',
      issueType: 'driver_issue',
      summary: 'Driver is unreachable',
      status: TicketStatus.open,
      priority: TicketPriority.high,
      createdAt: new Date('2026-07-03T00:00:00.000Z'),
    }
    prisma.order.findFirst.mockResolvedValue({ id: 'order-1' })
    prisma.aiSupportTicket.findFirst.mockResolvedValue(null)
    prisma.aiSupportTicket.create.mockResolvedValue(created)

    const result = await service.createSupportTicket(
      'customer-1',
      'FD0000000001',
      'driver_issue',
      'Driver is unreachable',
      TicketPriority.high,
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    )

    expect(prisma.aiSupportTicket.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        userId: 'customer-1',
        orderId: 'order-1',
        channel: SupportChannel.ai_chat,
        tags: ['ai_session:bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'],
      }),
    }))
    expect(result).toBe(created)
  })

  it('rejects support tickets for orders that do not belong to the authenticated customer', async () => {
    prisma.order.findFirst.mockResolvedValue(null)

    await expect(service.createSupportTicket(
      'customer-1',
      'FD0000000001',
      'driver_issue',
      'Driver is unreachable',
      TicketPriority.high,
    )).rejects.toThrow(NotFoundException)

    expect(prisma.aiSupportTicket.create).not.toHaveBeenCalled()
  })

  it('does not report admin notification success for another customer ticket', async () => {
    prisma.aiSupportTicket.updateMany.mockResolvedValue({ count: 0 })

    await expect(service.notifyAdmin('ticket-1', 'HIGH', 'customer-1')).rejects.toThrow(NotFoundException)

    expect(prisma.aiSupportTicket.updateMany).toHaveBeenCalledWith({
      where: { id: 'ticket-1', userId: 'customer-1' },
      data: { priority: TicketPriority.high },
    })
    expect(notifications.create).not.toHaveBeenCalled()
  })

  it('creates real admin notifications for high-severity AI escalations', async () => {
    prisma.aiSupportTicket.updateMany.mockResolvedValue({ count: 1 })
    prisma.user.findMany.mockResolvedValue([
      { id: 'admin-1' },
      { id: 'admin-2' },
    ])
    notifications.create
      .mockResolvedValueOnce({ id: 'notification-1' })
      .mockResolvedValueOnce({ id: 'notification-2' })

    const result = await service.notifyAdmin('ticket-1', 'HIGH', 'customer-1')

    expect(prisma.user.findMany).toHaveBeenCalledWith({
      where: { role: 'admin', isActive: true },
      select: { id: true },
    })
    expect(notifications.create).toHaveBeenCalledTimes(2)
    expect(notifications.create).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'admin-1',
      title: 'AI support escalation',
      type: 'support.escalation',
      payload: expect.objectContaining({
        ticketId: 'ticket-1',
        customerId: 'customer-1',
        severity: 'HIGH',
        source: 'ai_chat',
      }),
    }))
    expect(result).toMatchObject({
      notified: true,
      notifiedAdminCount: 2,
      ticketId: 'ticket-1',
      severity: 'HIGH',
    })
  })

  it('does not invent notification success when no active admin accounts exist', async () => {
    prisma.aiSupportTicket.updateMany.mockResolvedValue({ count: 1 })
    prisma.user.findMany.mockResolvedValue([])

    const result = await service.notifyAdmin('ticket-1', 'HIGH', 'customer-1')

    expect(notifications.create).not.toHaveBeenCalled()
    expect(result).toMatchObject({
      notified: false,
      notifiedAdminCount: 0,
      ticketId: 'ticket-1',
    })
  })

  it('grounds food recommendations with customer history and active menu data only', async () => {
    prisma.order.findMany.mockResolvedValue([
      {
        orderItems: [
          { menuItem: makeMenuItem({ id: 'item-recent', name: 'Chicken rice' }) },
          { menuItem: makeMenuItem({ id: 'item-hidden', category: { name: 'Secret', isVisible: false } }) },
        ],
      },
    ])
    prisma.menuItem.findMany.mockResolvedValue([
      makeMenuItem({ id: 'item-recent', name: 'Chicken rice' }),
      makeMenuItem({ id: 'item-popular', name: 'Beef pho', isPopular: true }),
    ])

    const result = await service.getRecommendedFoods('customer-1')

    expect(prisma.order.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { customerId: 'customer-1' },
      take: 8,
    }))
    expect(prisma.menuItem.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        isAvailable: true,
        restaurant: expect.objectContaining({ approvalStatus: RestaurantApprovalStatus.approved }),
      }),
      take: 10,
    }))
    expect(result).toMatchObject({
      source: 'mixed',
      items: [
        expect.objectContaining({
          menuItemId: 'item-recent',
          name: 'Chicken rice',
          restaurantName: 'FoodFlow Kitchen',
          reason: 'recent_order',
        }),
        expect.objectContaining({
          menuItemId: 'item-popular',
          name: 'Beef pho',
          reason: 'popular_available',
        }),
      ],
    })
    expect(result.items).toHaveLength(2)
  })

  it('returns an explicit empty recommendation set when no real menu data qualifies', async () => {
    prisma.order.findMany.mockResolvedValue([])
    prisma.menuItem.findMany.mockResolvedValue([])

    const result = await service.getRecommendedFoods('customer-1')

    expect(result).toMatchObject({
      source: 'available_catalog',
      items: [],
      generatedAt: expect.any(String),
    })
  })
})

function makeMenuItem(overrides: Record<string, unknown> = {}) {
  return {
    id: 'item-1',
    name: 'FoodFlow bowl',
    basePrice: '45000',
    isAvailable: true,
    isPopular: false,
    category: { name: 'Rice', isVisible: true },
    restaurant: {
      id: 'restaurant-1',
      name: 'FoodFlow Kitchen',
      rating: '4.8',
      cuisineTypes: ['vietnamese'],
      prepTimeAvgMinutes: 15,
      priceRange: 'medium',
      isActive: true,
      isOpen: true,
      approvalStatus: RestaurantApprovalStatus.approved,
    },
    ...overrides,
  }
}

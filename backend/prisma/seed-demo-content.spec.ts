import {
  DEMO_ORDER_CODE,
  DEMO_TICKET_TAG,
  buildDemoOrderInput,
  buildDemoSupportTicketInput,
  ensureDemoOrdersAndTickets,
  type SeedDemoPrisma,
} from './seed-demo-content'

describe('seed demo content builders', () => {
  it('builds a partner-visible restaurant_pending order with items', () => {
    const order = buildDemoOrderInput({
      customerId: 'c1',
      restaurantId: 'r1',
      deliveryAddressId: 'a1',
      menuItemId: 'm1',
      menuItemName: 'Phở bò tái',
      unitPrice: 65000,
    })
    expect(order.orderCode).toBe(DEMO_ORDER_CODE)
    expect(order.status).toBe('restaurant_pending')
    expect(order.restaurantId).toBe('r1')
    expect(order.items).toHaveLength(1)
    expect(order.total).toBe(65000 * 2 + 15000)
  })

  it('builds an open support ticket tagged for idempotent seed', () => {
    const ticket = buildDemoSupportTicketInput({ userId: 'c1', orderId: 'o1' })
    expect(ticket.status).toBe('open')
    expect(ticket.tags).toContain(DEMO_TICKET_TAG)
    expect(ticket.summary.length).toBeGreaterThan(10)
  })
})

describe('ensureDemoOrdersAndTickets', () => {
  it('creates order + ticket once when demo rows are missing', async () => {
    const prisma: SeedDemoPrisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({ id: 'c1' }),
      },
      restaurant: {
        findFirst: jest.fn().mockResolvedValue({ id: 'r1' }),
      },
      address: {
        findFirst: jest.fn().mockResolvedValue({ id: 'a1' }),
      },
      menuItem: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'm1',
          name: 'Phở bò tái',
          basePrice: 65000,
        }),
      },
      order: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'o1', orderCode: DEMO_ORDER_CODE }),
      },
      orderItem: {
        create: jest.fn().mockResolvedValue({}),
      },
      orderStatusHistory: {
        create: jest.fn().mockResolvedValue({}),
      },
      aiSupportTicket: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 't1' }),
      },
    }

    const result = await ensureDemoOrdersAndTickets(prisma)

    expect(result).toEqual({ orderId: 'o1', ticketId: 't1' })
    expect(prisma.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          orderCode: DEMO_ORDER_CODE,
          restaurantId: 'r1',
          status: 'restaurant_pending',
        }),
      }),
    )
    expect(prisma.orderItem.create).toHaveBeenCalled()
    expect(prisma.aiSupportTicket.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tags: expect.arrayContaining([DEMO_TICKET_TAG]),
          status: 'open',
        }),
      }),
    )
  })

  it('skips create when demo order and ticket already exist', async () => {
    const prisma: SeedDemoPrisma = {
      user: { findUnique: jest.fn().mockResolvedValue({ id: 'c1' }) },
      restaurant: { findFirst: jest.fn().mockResolvedValue({ id: 'r1' }) },
      address: { findFirst: jest.fn().mockResolvedValue({ id: 'a1' }) },
      menuItem: {
        findFirst: jest.fn().mockResolvedValue({ id: 'm1', name: 'X', basePrice: 1 }),
      },
      order: {
        findUnique: jest.fn().mockResolvedValue({ id: 'o-existing' }),
        create: jest.fn(),
      },
      orderItem: { create: jest.fn() },
      orderStatusHistory: { create: jest.fn() },
      aiSupportTicket: {
        findFirst: jest.fn().mockResolvedValue({ id: 't-existing' }),
        create: jest.fn(),
      },
    }

    const result = await ensureDemoOrdersAndTickets(prisma)
    expect(result).toEqual({ orderId: 'o-existing', ticketId: 't-existing' })
    expect(prisma.order.create).not.toHaveBeenCalled()
    expect(prisma.aiSupportTicket.create).not.toHaveBeenCalled()
  })
})

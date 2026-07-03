import { NotFoundException } from '@nestjs/common'
import { TicketPriority, TicketStatus } from '@prisma/client'
import { AiToolsService } from './ai-tools.service'

describe('AiToolsService', () => {
  const prisma = {
    order: { findFirst: jest.fn() },
    aiSupportTicket: {
      findFirst: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
    },
    orderItem: { findMany: jest.fn() },
    $queryRaw: jest.fn(),
  }
  const service = new AiToolsService(prisma as never)

  beforeEach(() => {
    jest.clearAllMocks()
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
  })
})

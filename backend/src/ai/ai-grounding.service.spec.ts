import { TicketPriority } from '@prisma/client'
import { AiGroundingService } from './ai-grounding.service'

describe('AiGroundingService', () => {
  const tools = {
    getOrderStatus: jest.fn(),
    getDriverLocation: jest.fn(),
    getRestaurantStatus: jest.fn(),
    getRefundEligibility: jest.fn(),
    getRecommendedFoods: jest.fn(),
    createSupportTicket: jest.fn(),
    notifyAdmin: jest.fn(),
  }
  const justification = { validate: jest.fn() }
  const service = new AiGroundingService(tools as never, justification as never)

  beforeEach(() => {
    jest.clearAllMocks()
    justification.validate.mockReturnValue(true)
    tools.getOrderStatus.mockResolvedValue({ status: 'preparing' })
    tools.getDriverLocation.mockResolvedValue({ available: true, lat: 10.77, lng: 106.7 })
    tools.getRestaurantStatus.mockResolvedValue({ isOpen: true })
    tools.getRefundEligibility.mockResolvedValue({ eligible: false })
    tools.getRecommendedFoods.mockResolvedValue([{ menuItemName: 'Pho' }])
    tools.createSupportTicket.mockResolvedValue({ id: 'ticket-1' })
    tools.notifyAdmin.mockResolvedValue({ notified: true, notifiedAdminCount: 1 })
  })

  it('collects customer-scoped order context and passes the authenticated user id to every tool', async () => {
    const result = await service.collect({
      message: 'Where is my order FD0000000001?',
      userId: 'customer-1',
      sentimentLabel: 'neutral',
    })

    expect(tools.getOrderStatus).toHaveBeenCalledWith('FD0000000001', 'customer-1')
    expect(tools.getDriverLocation).toHaveBeenCalledWith('FD0000000001', 'customer-1')
    expect(tools.getRestaurantStatus).toHaveBeenCalledWith('FD0000000001', 'customer-1')
    expect(tools.getRefundEligibility).toHaveBeenCalledWith('FD0000000001', 'customer-1')
    expect(result.toolCalls).toEqual(expect.arrayContaining([
      { name: 'getOrderStatus', args: { orderReference: 'FD0000000001' } },
      { name: 'getRecommendedFoods', args: {} },
    ]))
    expect(result.entries).toEqual(expect.arrayContaining([
      { tool: 'getOrderStatus', data: { status: 'preparing' } },
    ]))
  })

  it('creates and escalates high-severity tickets without inventing admin notifications', async () => {
    const result = await service.collect({
      message: 'Driver is unreachable and I was charged for FD0000000001, escalate to admin',
      userId: 'customer-1',
      sessionId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      sentimentLabel: 'angry',
    })

    expect(tools.createSupportTicket).toHaveBeenCalledWith(
      'customer-1',
      'FD0000000001',
      'driver_issue',
      'Driver is unreachable and I was charged for FD0000000001, escalate to admin',
      TicketPriority.high,
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    )
    expect(tools.notifyAdmin).toHaveBeenCalledWith('ticket-1', 'HIGH', 'customer-1')
    expect(result).toMatchObject({
      escalated: true,
      severity: 'HIGH',
      toolCalls: expect.arrayContaining([
        { name: 'createSupportTicket', args: { orderReference: 'FD0000000001' } },
        { name: 'notifyAdmin', args: { ticketId: 'ticket-1', severity: 'HIGH' } },
      ]),
      entries: expect.arrayContaining([
        { tool: 'notifyAdmin', data: { notified: true, notifiedAdminCount: 1 } },
      ]),
    })
  })

  it('does not run customer-account tools for authenticated restaurant actors', async () => {
    const result = await service.collect({
      message: 'Recommend food and check order FD0000000001',
      userId: 'restaurant-user-1',
      actorRole: 'restaurant',
      sentimentLabel: 'neutral',
    })

    expect(tools.getOrderStatus).not.toHaveBeenCalled()
    expect(tools.getDriverLocation).not.toHaveBeenCalled()
    expect(tools.getRestaurantStatus).not.toHaveBeenCalled()
    expect(tools.getRefundEligibility).not.toHaveBeenCalled()
    expect(tools.getRecommendedFoods).not.toHaveBeenCalled()
    expect(result.entries).toEqual([])
  })
})

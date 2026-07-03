import { BadRequestException, NotFoundException } from '@nestjs/common'
import { ChatSenderType, ChatSessionType } from '@prisma/client'
import { PrismaService } from '../database/prisma.service'
import { OrdersGateway } from './orders.gateway'
import { OrderChatService } from './order-chat.service'

describe('OrderChatService', () => {
  let service: OrderChatService
  let mockPrisma: {
    restaurantProfile: { findUnique: jest.Mock }
    order: { findFirst: jest.Mock }
    chatSession: { findFirst: jest.Mock }
    $transaction: jest.Mock
  }
  let mockTx: {
    $executeRaw: jest.Mock
    chatSession: { findFirst: jest.Mock; create: jest.Mock }
    chatMessage: { create: jest.Mock }
  }
  let mockGateway: { broadcastToRestaurantDriverChat: jest.Mock }

  const orderId = 'order-1'
  const restaurantUserId = 'restaurant-user-1'
  const restaurantId = 'restaurant-1'
  const createdAt = new Date('2026-07-02T10:00:00.000Z')

  beforeEach(() => {
    mockTx = {
      $executeRaw: jest.fn().mockResolvedValue(1),
      chatSession: {
        findFirst: jest.fn().mockResolvedValue({ id: 'session-1' }),
        create: jest.fn().mockResolvedValue({ id: 'session-1' }),
      },
      chatMessage: {
        create: jest.fn().mockResolvedValue({
          id: 'message-1',
          senderType: ChatSenderType.restaurant,
          senderId: restaurantUserId,
          content: 'Ready now',
          createdAt,
        }),
      },
    }
    mockPrisma = {
      restaurantProfile: { findUnique: jest.fn().mockResolvedValue({ restaurantId }) },
      order: { findFirst: jest.fn().mockResolvedValue({ id: orderId, driverId: 'driver-1' }) },
      chatSession: { findFirst: jest.fn().mockResolvedValue(null) },
      $transaction: jest.fn().mockImplementation((fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx)),
    }
    mockGateway = { broadcastToRestaurantDriverChat: jest.fn() }
    service = new OrderChatService(
      mockPrisma as unknown as PrismaService,
      mockGateway as unknown as OrdersGateway,
    )
  })

  it('returns messages only after verifying restaurant ownership', async () => {
    mockPrisma.chatSession.findFirst.mockResolvedValue({
      messages: [{
        id: 'message-1',
        senderType: ChatSenderType.driver,
        senderId: 'driver-1',
        content: 'Arrived',
        createdAt,
      }],
    })

    const result = await service.getRestaurantOrderMessages(orderId, restaurantUserId)

    expect(mockPrisma.order.findFirst).toHaveBeenCalledWith({
      where: { id: orderId, restaurantId },
      select: { id: true, driverId: true },
    })
    expect(result).toEqual({
      messages: [{
        id: 'message-1',
        senderType: ChatSenderType.driver,
        senderId: 'driver-1',
        content: 'Arrived',
        createdAt: createdAt.toISOString(),
      }],
      canReply: true,
    })
  })

  it('blocks cross-tenant access with the same not-found shape as order detail', async () => {
    mockPrisma.order.findFirst.mockResolvedValue(null)

    await expect(
      service.getRestaurantOrderMessages(orderId, restaurantUserId),
    ).rejects.toThrow(NotFoundException)
  })

  it('does not create a message before a driver is assigned', async () => {
    mockPrisma.order.findFirst.mockResolvedValue({ id: orderId, driverId: null })

    await expect(
      service.createRestaurantOrderMessage(orderId, restaurantUserId, { content: 'Ready' }),
    ).rejects.toThrow(BadRequestException)
    expect(mockPrisma.$transaction).not.toHaveBeenCalled()
  })

  it('creates a trimmed restaurant message and broadcasts the saved payload', async () => {
    const result = await service.createRestaurantOrderMessage(orderId, restaurantUserId, { content: '  Ready now  ' })

    expect(mockTx.$executeRaw).toHaveBeenCalledTimes(1)
    expect(mockTx.chatSession.findFirst).toHaveBeenCalledWith({
      where: {
        orderId,
        userId: restaurantUserId,
        type: ChatSessionType.restaurant_driver,
      },
      select: { id: true },
    })
    expect(mockTx.chatMessage.create).toHaveBeenCalledWith({
      data: {
        sessionId: 'session-1',
        senderType: ChatSenderType.restaurant,
        senderId: restaurantUserId,
        content: 'Ready now',
      },
    })
    expect(mockGateway.broadcastToRestaurantDriverChat).toHaveBeenCalledWith(
      orderId,
      'order:message_created',
      { orderId, ...result },
    )
    expect(result).toEqual({
      id: 'message-1',
      senderType: ChatSenderType.restaurant,
      senderId: restaurantUserId,
      content: 'Ready now',
      createdAt: createdAt.toISOString(),
    })
  })
})

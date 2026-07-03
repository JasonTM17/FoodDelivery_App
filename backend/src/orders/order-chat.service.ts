import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { ChatSenderType, ChatSessionType } from '@prisma/client'
import { PrismaService } from '../database/prisma.service'
import { OrdersGateway } from './orders.gateway'
import { CreateOrderChatMessageDto } from './orders.dto'

type RestaurantOrderForChat = {
  id: string
  driverId: string | null
}

type ChatMessageForApi = {
  id: string
  senderType: ChatSenderType
  senderId: string | null
  content: string
  createdAt: Date
}

export interface RestaurantOrderChatMessage {
  id: string
  senderType: ChatSenderType
  senderId: string | null
  content: string
  createdAt: string
}

@Injectable()
export class OrderChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ordersGateway: OrdersGateway,
  ) {}

  async getRestaurantOrderMessages(orderId: string, userId: string) {
    const order = await this.findRestaurantOrderForChat(orderId, userId)
    const session = await this.prisma.chatSession.findFirst({
      where: { orderId: order.id, type: ChatSessionType.restaurant_driver },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
      orderBy: { createdAt: 'asc' },
    })

    return {
      messages: session?.messages.map(serializeMessage) ?? [],
      canReply: Boolean(order.driverId),
    }
  }

  async createRestaurantOrderMessage(orderId: string, userId: string, dto: CreateOrderChatMessageDto) {
    const order = await this.findRestaurantOrderForChat(orderId, userId)
    if (!order.driverId) {
      throw new BadRequestException('ORDER_DRIVER_NOT_ASSIGNED')
    }

    const content = dto.content.trim()
    if (!content) {
      throw new BadRequestException('MESSAGE_CONTENT_REQUIRED')
    }

    const message = await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`order-chat:${order.id}:${userId}`}))`

      const existingSession = await tx.chatSession.findFirst({
        where: {
          orderId: order.id,
          userId,
          type: ChatSessionType.restaurant_driver,
        },
        select: { id: true },
      })

      const session = existingSession ?? await tx.chatSession.create({
        data: {
          orderId: order.id,
          userId,
          type: ChatSessionType.restaurant_driver,
        },
        select: { id: true },
      })

      return tx.chatMessage.create({
        data: {
          sessionId: session.id,
          senderType: ChatSenderType.restaurant,
          senderId: userId,
          content,
        },
      })
    })

    const serialized = serializeMessage(message)
    this.ordersGateway.broadcastToRestaurantDriverChat(
      order.id,
      'order:message_created',
      { orderId: order.id, ...serialized },
    )
    return serialized
  }

  private async findRestaurantOrderForChat(orderId: string, userId: string): Promise<RestaurantOrderForChat> {
    const profile = await this.prisma.restaurantProfile.findUnique({
      where: { userId },
      select: { restaurantId: true },
    })
    if (!profile) {
      throw new NotFoundException('ORDER_NOT_FOUND')
    }

    const order = await this.prisma.order.findFirst({
      where: { id: orderId, restaurantId: profile.restaurantId },
      select: { id: true, driverId: true },
    })
    if (!order) {
      throw new NotFoundException('ORDER_NOT_FOUND')
    }

    return order
  }
}

function serializeMessage(message: ChatMessageForApi): RestaurantOrderChatMessage {
  return {
    id: message.id,
    senderType: message.senderType,
    senderId: message.senderId,
    content: message.content,
    createdAt: message.createdAt.toISOString(),
  }
}

import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../database/prisma.service'
import { Prisma, TicketIssueType, TicketPriority, TicketStatus } from '@prisma/client'
import {
  availableRecommendationWhere,
  isAvailableRecommendedMenuItem,
  mergeFoodRecommendations,
  recommendedMenuItemSelect,
} from './ai-food-recommendations'

function maskPhone(phone: string | null | undefined): string | null {
  if (!phone) return null
  return `****${phone.slice(-4)}`
}

@Injectable()
export class AiToolsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrderStatus(orderReference: string, customerId: string) {
    const order = await this.prisma.order.findFirst({
      where: customerOrderWhere(orderReference, customerId),
      select: {
        id: true, orderCode: true, status: true, total: true,
        createdAt: true, updatedAt: true,
        orderItems: { select: { nameSnapshot: true, quantity: true, unitPrice: true } },
      },
    })
    if (!order) throw new NotFoundException('ORDER_NOT_FOUND')
    return order
  }

  async getDriverLocation(orderReference: string, customerId: string) {
    const order = await this.prisma.order.findFirst({
      where: customerOrderWhere(orderReference, customerId),
      select: { driverId: true },
    })
    if (!order) throw new NotFoundException('ORDER_NOT_FOUND')
    if (!order.driverId) return { available: false }

    const rows = await this.prisma.$queryRaw<Array<{ lat: number; lng: number; recorded_at: string }>>(Prisma.sql`
      SELECT ST_Y(location::geometry)::float8 AS lat,
             ST_X(location::geometry)::float8 AS lng,
             recorded_at
      FROM driver_location_history
      WHERE driver_id = CAST(${order.driverId} AS uuid)
      ORDER BY recorded_at DESC
      LIMIT 1
    `)
    if (!rows.length) return { available: false }
    return { available: true, lat: rows[0].lat, lng: rows[0].lng, recordedAt: rows[0].recorded_at }
  }

  async getRestaurantStatus(orderReference: string, customerId: string) {
    const order = await this.prisma.order.findFirst({
      where: customerOrderWhere(orderReference, customerId),
      select: {
        restaurant: {
          select: { id: true, name: true, isOpen: true, isActive: true, phone: true, prepTimeAvgMinutes: true },
        },
      },
    })
    if (!order) throw new NotFoundException('ORDER_NOT_FOUND')
    return { ...order.restaurant, phone: maskPhone(order.restaurant.phone) }
  }

  async getRefundEligibility(orderReference: string, customerId: string) {
    const order = await this.prisma.order.findFirst({
      where: customerOrderWhere(orderReference, customerId),
      select: { id: true, status: true, total: true, paymentMethod: true, createdAt: true },
    })
    if (!order) throw new NotFoundException('ORDER_NOT_FOUND')
    const refundableStatuses = ['created', 'confirmed', 'preparing'] as const
    const eligible = (refundableStatuses as readonly string[]).includes(order.status)
    return {
      orderId: order.id,
      eligible,
      status: order.status,
      amount: order.total,
      paymentMethod: order.paymentMethod,
    }
  }

  async createSupportTicket(
    userId: string,
    orderReference: string | undefined,
    issueType: string,
    summary: string,
    priority: TicketPriority,
  ) {
    const validTypes = Object.values(TicketIssueType)
    const resolvedType: TicketIssueType = validTypes.includes(issueType as TicketIssueType)
      ? (issueType as TicketIssueType)
      : TicketIssueType.other
    const order = orderReference
      ? await this.prisma.order.findFirst({
        where: customerOrderWhere(orderReference, userId),
        select: { id: true },
      })
      : null
    if (orderReference && !order) throw new NotFoundException('ORDER_NOT_FOUND')

    const normalizedSummary = summary.trim().slice(0, 1000)
    const existing = await this.prisma.aiSupportTicket.findFirst({
      where: {
        userId,
        orderId: order?.id ?? null,
        issueType: resolvedType,
        summary: normalizedSummary,
        status: { in: [TicketStatus.open, TicketStatus.in_progress, TicketStatus.waiting_customer] },
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true, issueType: true, summary: true, status: true, priority: true, createdAt: true },
    })
    if (existing) return existing

    return this.prisma.aiSupportTicket.create({
      data: {
        userId,
        orderId: order?.id,
        issueType: resolvedType,
        summary: normalizedSummary,
        priority,
      },
      select: { id: true, issueType: true, summary: true, status: true, priority: true, createdAt: true },
    })
  }

  async getRecommendedFoods(userId: string) {
    const [orders, popularItems] = await Promise.all([
      this.prisma.order.findMany({
        where: { customerId: userId },
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: { orderItems: { select: { menuItem: { select: recommendedMenuItemSelect } } } },
      }),
      this.prisma.menuItem.findMany({
        where: availableRecommendationWhere(),
        orderBy: [{ isPopular: 'desc' }, { updatedAt: 'desc' }],
        take: 10,
        select: recommendedMenuItemSelect,
      }),
    ])
    const recentItems = orders
      .flatMap(order => order.orderItems.map(item => item.menuItem))
      .filter(isAvailableRecommendedMenuItem)

    return mergeFoodRecommendations(recentItems, popularItems)
  }

  async notifyAdmin(ticketId: string, severity: string, userId: string) {
    const priorityMap: Record<string, TicketPriority> = {
      low: TicketPriority.low,
      medium: TicketPriority.medium,
      high: TicketPriority.high,
      critical: TicketPriority.critical,
    }
    const priority = priorityMap[severity] ?? TicketPriority.high
    const updated = await this.prisma.aiSupportTicket.updateMany({
      where: { id: ticketId, userId },
      data: { priority },
    })
    if (updated.count !== 1) throw new NotFoundException('SUPPORT_TICKET_NOT_FOUND')
    return { notified: true, ticketId, severity, timestamp: new Date().toISOString() }
  }
}

function customerOrderWhere(orderReference: string, customerId: string): Prisma.OrderWhereInput {
  const reference = orderReference.trim()
  const references: Prisma.OrderWhereInput[] = [
    { orderCode: { equals: reference, mode: 'insensitive' } },
  ]
  if (isUuid(reference)) references.push({ id: reference })
  return { customerId, OR: references }
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

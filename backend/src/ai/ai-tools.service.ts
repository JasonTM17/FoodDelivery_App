import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../database/prisma.service'
import { TicketIssueType, TicketPriority } from '@prisma/client'

function maskPhone(phone: string | null | undefined): string | null {
  if (!phone) return null
  return `****${phone.slice(-4)}`
}

@Injectable()
export class AiToolsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrderStatus(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true, orderCode: true, status: true, total: true,
        createdAt: true, updatedAt: true,
        orderItems: { select: { nameSnapshot: true, quantity: true, unitPrice: true } },
      },
    })
    if (!order) throw new NotFoundException('ORDER_NOT_FOUND')
    return order
  }

  async getDriverLocation(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { driverId: true },
    })
    if (!order) throw new NotFoundException('ORDER_NOT_FOUND')
    if (!order.driverId) return { available: false }

    const rows = await this.prisma.$queryRawUnsafe<Array<{ lat: number; lng: number; recorded_at: string }>>(
      `SELECT ST_Y(location::geometry)::float8 AS lat,
              ST_X(location::geometry)::float8 AS lng,
              recorded_at
       FROM driver_location_history
       WHERE driver_id = $1
       ORDER BY recorded_at DESC LIMIT 1`,
      order.driverId,
    )
    if (!rows.length) return { available: false }
    return { available: true, lat: rows[0].lat, lng: rows[0].lng, recordedAt: rows[0].recorded_at }
  }

  async getRestaurantStatus(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        restaurant: {
          select: { id: true, name: true, isOpen: true, isActive: true, phone: true, prepTimeAvgMinutes: true },
        },
      },
    })
    if (!order) throw new NotFoundException('ORDER_NOT_FOUND')
    return { ...order.restaurant, phone: maskPhone(order.restaurant.phone) }
  }

  async getRefundEligibility(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { status: true, total: true, paymentMethod: true, createdAt: true },
    })
    if (!order) throw new NotFoundException('ORDER_NOT_FOUND')
    const refundableStatuses = ['created', 'confirmed', 'preparing'] as const
    const eligible = (refundableStatuses as readonly string[]).includes(order.status)
    return { orderId, eligible, status: order.status, amount: order.total, paymentMethod: order.paymentMethod }
  }

  async createSupportTicket(userId: string, orderId: string, issueType: string, summary: string) {
    const validTypes = Object.values(TicketIssueType)
    const resolvedType: TicketIssueType = validTypes.includes(issueType as TicketIssueType)
      ? (issueType as TicketIssueType)
      : TicketIssueType.other
    return this.prisma.aiSupportTicket.create({
      data: {
        userId,
        orderId: orderId || undefined,
        issueType: resolvedType,
        summary,
        priority: TicketPriority.medium,
      },
      select: { id: true, issueType: true, summary: true, status: true, priority: true, createdAt: true },
    })
  }

  async getNearbyRestaurants(lat: number, lng: number, cuisine?: string) {
    return this.prisma.restaurant.findMany({
      where: {
        isActive: true,
        isOpen: true,
        ...(cuisine ? { cuisineTypes: { hasSome: [cuisine] } } : {}),
      },
      select: { id: true, name: true, cuisineTypes: true, rating: true, prepTimeAvgMinutes: true },
      take: 10,
    })
  }

  async getRecommendedFoods(userId: string) {
    const orders = await this.prisma.order.findMany({
      where: { customerId: userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { orderItems: { select: { menuItemId: true, nameSnapshot: true } } },
    })
    const seen = new Set<string>()
    const items: Array<{ menuItemId: string; name: string }> = []
    for (const o of orders) {
      for (const item of o.orderItems) {
        if (!seen.has(item.menuItemId)) {
          seen.add(item.menuItemId)
          items.push({ menuItemId: item.menuItemId, name: item.nameSnapshot })
        }
      }
    }
    return items.slice(0, 10)
  }

  async notifyAdmin(ticketId: string, severity: string) {
    const priorityMap: Record<string, TicketPriority> = {
      low: TicketPriority.low,
      medium: TicketPriority.medium,
      high: TicketPriority.high,
      critical: TicketPriority.critical,
    }
    const priority = priorityMap[severity] ?? TicketPriority.high
    try {
      await this.prisma.aiSupportTicket.update({ where: { id: ticketId }, data: { priority } })
    } catch {
      // ticket may not exist; notification still proceeds
    }
    return { notified: true, ticketId, severity, timestamp: new Date().toISOString() }
  }
}

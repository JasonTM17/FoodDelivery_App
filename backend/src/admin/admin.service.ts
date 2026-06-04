import { Injectable } from '@nestjs/common'
import { PrismaService } from '../database/prisma.service'
import { Prisma, UserRole, OrderStatus, TicketStatus } from '@prisma/client'

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard() {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const [totalOrders, todayOrders, revenueResult, activeDrivers, totalUsers,
           totalRestaurants, orderStatusCounts, recentOrders] = await Promise.all([
      this.prisma.order.count(),
      this.prisma.order.count({ where: { createdAt: { gte: today } } }),
      this.prisma.payment.aggregate({ where: { createdAt: { gte: today }, status: 'completed' }, _sum: { amount: true } }),
      this.prisma.driverProfile.count({ where: { isOnline: true } }),
      this.prisma.user.count(),
      this.prisma.restaurant.count({ where: { isActive: true } }),
      this.prisma.order.groupBy({ by: ['status'], _count: true }),
      this.prisma.order.findMany({
        take: 10, orderBy: { createdAt: 'desc' },
        include: { restaurant: { select: { name: true } }, customer: { select: { fullName: true } } },
      }),
    ])

    const orderByStatus: Record<string, number> = {}
    orderStatusCounts.forEach(o => { orderByStatus[o.status] = o._count })

    return {
      totalOrders, todayOrders, todayRevenue: revenueResult._sum.amount ?? 0,
      activeDrivers, totalUsers, totalRestaurants, orderByStatus,
      recentOrders: recentOrders.map(o => ({
        id: o.id, orderCode: o.orderCode, status: o.status,
        total: Number(o.total), restaurantName: o.restaurant.name,
        customerName: o.customer.fullName, createdAt: o.createdAt,
      })),
    }
  }

  async getOrders(params: { status?: string; page?: number; limit?: number }) {
    const page = params.page ?? 1; const limit = params.limit ?? 20
    const where: Prisma.OrderWhereInput = {}
    if (params.status) where.status = params.status as OrderStatus
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' },
        include: {
          restaurant: { select: { name: true } },
          customer: { select: { id: true, fullName: true, phone: true } },
          driver: { select: { id: true, fullName: true } },
          payment: true,
        },
      }),
      this.prisma.order.count({ where }),
    ])
    return { orders, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } }
  }

  async getUsers(params: { role?: string; page?: number; limit?: number }) {
    const page = params.page ?? 1; const limit = params.limit ?? 20
    const where: Prisma.UserWhereInput = {}
    if (params.role) where.role = params.role as UserRole
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' },
        select: { id: true, email: true, phone: true, fullName: true, role: true, isActive: true, createdAt: true },
      }),
      this.prisma.user.count({ where }),
    ])
    return { users, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } }
  }

  async toggleUserStatus(userId: string, isActive: boolean) {
    return this.prisma.user.update({ where: { id: userId }, data: { isActive } })
  }

  async getRestaurants(params: { page?: number; limit?: number }) {
    const page = params.page ?? 1; const limit = params.limit ?? 20
    const [restaurants, total] = await Promise.all([
      this.prisma.restaurant.findMany({
        skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' },
        include: { profiles: { select: { user: { select: { fullName: true, email: true } } } } },
      }),
      this.prisma.restaurant.count(),
    ])
    return { restaurants, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } }
  }

  async toggleRestaurantStatus(restaurantId: string, isActive: boolean) {
    return this.prisma.restaurant.update({ where: { id: restaurantId }, data: { isActive } })
  }

  async getSupportTickets(params: { status?: string; page?: number; limit?: number }) {
    const page = params.page ?? 1; const limit = params.limit ?? 20
    const where: Prisma.AiSupportTicketWhereInput = {}
    if (params.status) where.status = params.status as TicketStatus
    const [tickets, total] = await Promise.all([
      this.prisma.aiSupportTicket.findMany({
        where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' },
        include: { user: { select: { fullName: true } }, order: { select: { orderCode: true } } },
      }),
      this.prisma.aiSupportTicket.count({ where }),
    ])
    return { tickets, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } }
  }

  async updateSupportTicket(ticketId: string, updateData: { status?: string; assignedAdminId?: string; resolutionNotes?: string }) {
    const data: Prisma.AiSupportTicketUpdateInput = {}
    if (updateData.status) data.status = updateData.status as TicketStatus
    if (updateData.assignedAdminId) data.assignedAdminId = updateData.assignedAdminId
    if (updateData.resolutionNotes) data.resolutionNotes = updateData.resolutionNotes
    if (updateData.status === 'resolved' || updateData.status === 'closed') data.resolvedAt = new Date()
    return this.prisma.aiSupportTicket.update({ where: { id: ticketId }, data })
  }

  async getAuditLogs(params: { page?: number; limit?: number }) {
    const page = params.page ?? 1; const limit = params.limit ?? 50
    const [logs, total] = await Promise.all([
      this.prisma.adminAuditLog.findMany({ skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.adminAuditLog.count(),
    ])
    return { logs, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } }
  }

  async getTopRestaurants(days: number = 7) {
    const since = new Date(); since.setDate(since.getDate() - days)
    return this.prisma.$queryRawUnsafe<Array<{ name: string; orderCount: number; revenue: number }>>(
      `SELECT r.name, COUNT(o.id)::int AS "orderCount", COALESCE(SUM(p.amount)::float8, 0) AS "revenue"
       FROM restaurants r JOIN orders o ON o.restaurant_id = r.id
       JOIN payments p ON p.order_id = o.id AND p.status = 'completed'
       WHERE o.created_at >= $1 GROUP BY r.id, r.name ORDER BY "revenue" DESC LIMIT 10`,
      since,
    )
  }

  async getRevenueChart(days: number = 7) {
    const since = new Date(); since.setDate(since.getDate() - days)
    return this.prisma.$queryRawUnsafe<Array<{ date: string; revenue: number; orders: number }>>(
      `SELECT DATE(o.created_at)::text AS "date", COALESCE(SUM(p.amount)::float8, 0) AS "revenue", COUNT(o.id)::int AS "orders"
       FROM orders o JOIN payments p ON p.order_id = o.id AND p.status = 'completed'
       WHERE o.created_at >= $1 GROUP BY DATE(o.created_at) ORDER BY "date"`,
      since,
    )
  }
}

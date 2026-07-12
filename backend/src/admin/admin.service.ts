import { BadRequestException, Injectable, NotFoundException, ConflictException } from '@nestjs/common'
import { PrismaService } from '../database/prisma.service'
import { Prisma, UserRole, OrderStatus, TicketStatus } from '@prisma/client'
import { CreatePromotionDto, UpdatePromotionDto } from './dto/promotion.dto'
import { calculateSupportSlaDeadline, shiftDeadlineForWaiting } from './support-sla'

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  /** Coerce query page/limit; NaN must not reach Prisma take/skip. */
  private pagination(page?: number, limit?: number, defaultLimit = 20) {
    const safePage = Number.isFinite(page) && (page as number) > 0 ? Math.trunc(page as number) : 1
    const rawLimit = Number.isFinite(limit) && (limit as number) > 0 ? Math.trunc(limit as number) : defaultLimit
    const safeLimit = Math.min(Math.max(rawLimit, 1), 100)
    return { page: safePage, limit: safeLimit, skip: (safePage - 1) * safeLimit }
  }

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
    const { page, limit, skip } = this.pagination(params.page, params.limit)
    const where: Prisma.OrderWhereInput = {}
    if (params.status) where.status = params.status as OrderStatus
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where, skip, take: limit, orderBy: { createdAt: 'desc' },
        include: {
          restaurant: { select: { id: true, name: true, addressLine: true } },
          customer: { select: { id: true, fullName: true, phone: true } },
          driver: { select: { id: true, fullName: true, phone: true } },
          deliveryAddress: { select: { addressLine: true } },
          orderItems: { select: { nameSnapshot: true, quantity: true, unitPrice: true } },
        },
      }),
      this.prisma.order.count({ where }),
    ])
    return {
      data: orders.map(order => ({
        ...order,
        total: Number(order.total),
        deliveryFee: Number(order.deliveryFee),
        discount: Number(order.promotionDiscount),
        note: order.notes ?? '',
        deliveryAddress: order.deliveryAddress.addressLine,
        customer: {
          id: order.customer.id,
          name: order.customer.fullName,
          phone: order.customer.phone ?? '',
        },
        restaurant: {
          id: order.restaurant.id,
          name: order.restaurant.name,
          address: order.restaurant.addressLine,
        },
        driver: order.driver ? {
          id: order.driver.id,
          name: order.driver.fullName,
          phone: order.driver.phone ?? '',
        } : null,
        items: order.orderItems.map(item => ({
          name: item.nameSnapshot,
          quantity: item.quantity,
          price: Number(item.unitPrice),
        })),
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
  }

  async getUsers(params: { role?: string; page?: number; limit?: number }) {
    const { page, limit, skip } = this.pagination(params.page, params.limit)
    const where: Prisma.UserWhereInput = {}
    // Admin UI filter uses restaurant_owner; Prisma role is restaurant
    const roleFilter =
      params.role === 'restaurant_owner' ? UserRole.restaurant : (params.role as UserRole | undefined)
    if (roleFilter) where.role = roleFilter
    const [rows, total] = await Promise.all([
      this.prisma.user.findMany({
        where, skip, take: limit, orderBy: { createdAt: 'desc' },
        select: { id: true, email: true, phone: true, fullName: true, role: true, isActive: true, createdAt: true },
      }),
      this.prisma.user.count({ where }),
    ])
    const totalPages = Math.ceil(total / limit)
    // Shape expected by Admin users table UI
    const users = rows.map((u) => ({
      id: u.id,
      name: u.fullName,
      fullName: u.fullName,
      email: u.email,
      phone: u.phone ?? '',
      role: u.role === UserRole.restaurant ? 'restaurant_owner' : u.role,
      status: u.isActive ? 'active' : 'banned',
      isActive: u.isActive,
      createdAt: u.createdAt.toISOString(),
    }))
    return {
      users,
      total,
      page,
      limit,
      totalPages,
      meta: { page, limit, total, totalPages },
    }
  }

  async toggleUserStatus(
    userId: string,
    body: { isActive?: boolean; status?: string },
    actorId?: string,
  ) {
    let isActive = body.isActive
    if (typeof isActive !== 'boolean' && typeof body.status === 'string') {
      isActive = body.status === 'active'
    }
    if (typeof isActive !== 'boolean') {
      throw new BadRequestException('isActive or status is required')
    }
    if (actorId && userId === actorId && isActive === false) {
      throw new BadRequestException('Cannot deactivate your own admin account')
    }
    if (isActive === false) {
      const target = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      })
      if (target?.role === UserRole.admin) {
        const activeAdmins = await this.prisma.user.count({
          where: { role: UserRole.admin, isActive: true },
        })
        if (activeAdmins <= 1) {
          throw new BadRequestException('Cannot deactivate the last active admin')
        }
      }
    }
    // Never return passwordHash or other credential fields to the web client
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { isActive },
      select: {
        id: true,
        email: true,
        phone: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })
    return {
      id: user.id,
      email: user.email,
      phone: user.phone ?? '',
      name: user.fullName,
      fullName: user.fullName,
      role: user.role === UserRole.restaurant ? 'restaurant_owner' : user.role,
      status: user.isActive ? 'active' : 'banned',
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    }
  }

  async getRestaurants(params: { page?: number; limit?: number }) {
    const { page, limit, skip } = this.pagination(params.page, params.limit)
    const [rows, total] = await Promise.all([
      this.prisma.restaurant.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          profiles: {
            where: { staffRole: 'owner' },
            take: 1,
            select: { user: { select: { fullName: true, email: true } } },
          },
          _count: { select: { orders: true } },
        },
      }),
      this.prisma.restaurant.count(),
    ])
    // Shape expected by Admin web list UI
    const restaurants = rows.map((r) => {
      const ownerProfile = r.profiles[0]?.user
      return {
        id: r.id,
        name: r.name,
        slug: r.slug,
        cuisine: r.cuisineTypes?.[0] ?? r.priceRange ?? '—',
        cuisineTypes: r.cuisineTypes,
        rating: Number(r.rating),
        totalOrders: r._count.orders,
        totalReviews: r.totalReviews,
        status: r.isActive ? 'active' : 'disabled',
        isActive: r.isActive,
        approvalStatus: r.approvalStatus,
        addressLine: r.addressLine,
        city: r.city,
        phone: r.phone,
        logoUrl: r.logoUrl,
        owner: ownerProfile
          ? { name: ownerProfile.fullName, email: ownerProfile.email }
          : null,
        createdAt: r.createdAt,
      }
    })
    return {
      restaurants,
      total,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
  }

  async toggleRestaurantStatus(
    restaurantId: string,
    body: { isActive?: boolean; status?: string },
  ) {
    let isActive = body.isActive
    if (typeof isActive !== 'boolean' && typeof body.status === 'string') {
      isActive = body.status === 'active'
    }
    if (typeof isActive !== 'boolean') {
      throw new BadRequestException('isActive or status is required')
    }
    const restaurant = await this.prisma.restaurant.update({
      where: { id: restaurantId },
      data: { isActive },
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        approvalStatus: true,
        updatedAt: true,
      },
    })
    return {
      id: restaurant.id,
      name: restaurant.name,
      slug: restaurant.slug,
      status: restaurant.isActive ? 'active' : 'disabled',
      isActive: restaurant.isActive,
      approvalStatus: restaurant.approvalStatus,
      updatedAt: restaurant.updatedAt.toISOString(),
    }
  }

  async getSupportTickets(params: { status?: string; page?: number; limit?: number }) {
    const { page, limit, skip } = this.pagination(params.page, params.limit)
    const where: Prisma.AiSupportTicketWhereInput = {}
    if (params.status) where.status = params.status as TicketStatus
    const [tickets, total] = await Promise.all([
      this.prisma.aiSupportTicket.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, fullName: true, email: true } },
          assignedAdmin: { select: { id: true, fullName: true, email: true } },
          order: { select: { id: true, orderCode: true } },
        },
      }),
      this.prisma.aiSupportTicket.count({ where }),
    ])
    return {
      tickets: tickets.map((ticket) => ({
        id: ticket.id,
        issueType: ticket.issueType,
        orderId: ticket.orderId ?? '',
        userId: ticket.userId,
        userName: ticket.user?.fullName ?? ticket.user?.email ?? '—',
        priority: ticket.priority,
        status: ticket.status,
        description: ticket.summary,
        createdAt: ticket.createdAt.toISOString(),
        assignedTo: ticket.assignedAdmin?.fullName ?? null,
        resolutionNotes: ticket.resolutionNotes ?? '',
        slaDeadlineAt: ticket.slaDeadlineAt ?? calculateSupportSlaDeadline(ticket.createdAt, ticket.priority),
      })),
      total,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
  }

  async updateSupportTicket(ticketId: string, updateData: { status?: string; assignedAdminId?: string; resolutionNotes?: string }) {
    const existing = await this.prisma.aiSupportTicket.findUnique({ where: { id: ticketId } })
    if (!existing) throw new NotFoundException('SUPPORT_TICKET_NOT_FOUND')

    const data: Prisma.AiSupportTicketUpdateInput = {}
    if (updateData.status) {
      const nextStatus = updateData.status as TicketStatus
      data.status = nextStatus
      if (nextStatus === 'waiting_customer') {
        data.waitingStartedAt = existing.waitingStartedAt ?? new Date()
      } else if (existing.status === 'waiting_customer') {
        data.slaDeadlineAt = shiftDeadlineForWaiting(existing.slaDeadlineAt, existing.waitingStartedAt)
        data.waitingStartedAt = null
      }
    }
    if (updateData.assignedAdminId) data.assignedAdmin = { connect: { id: updateData.assignedAdminId } }
    if (updateData.resolutionNotes) data.resolutionNotes = updateData.resolutionNotes
    if (updateData.status === 'resolved' || updateData.status === 'closed') data.resolvedAt = new Date()
    return this.prisma.aiSupportTicket.update({ where: { id: ticketId }, data })
  }

  async getTopRestaurants(days: number = 7) {
    const since = new Date(); since.setDate(since.getDate() - days)
    return this.prisma.$queryRaw<Array<{ name: string; orderCount: number; revenue: number }>>(Prisma.sql`
      SELECT r.name, COUNT(o.id)::int AS "orderCount", COALESCE(SUM(p.amount)::float8, 0) AS "revenue"
       FROM restaurants r JOIN orders o ON o.restaurant_id = r.id
       JOIN payments p ON p.order_id = o.id AND p.status = 'completed'
       WHERE o.created_at >= ${since}
       GROUP BY r.id, r.name
       ORDER BY "revenue" DESC
       LIMIT 10
    `)
  }

  async getRevenueChart(days: number = 7) {
    const since = new Date(); since.setDate(since.getDate() - days)
    return this.prisma.$queryRaw<Array<{ date: string; revenue: number; orders: number }>>(Prisma.sql`
      SELECT DATE(o.created_at)::text AS "date", COALESCE(SUM(p.amount)::float8, 0) AS "revenue", COUNT(o.id)::int AS "orders"
       FROM orders o JOIN payments p ON p.order_id = o.id AND p.status = 'completed'
       WHERE o.created_at >= ${since}
       GROUP BY DATE(o.created_at)
       ORDER BY "date"
    `)
  }

  // ─── Promotions CRUD ───

  async getPromotions(params: { isActive?: boolean; page?: number; limit?: number }) {
    const page = params.page ?? 1
    const limit = params.limit ?? 20
    const where: Prisma.PromotionWhereInput = {}
    if (params.isActive !== undefined) where.isActive = params.isActive

    const [promotions, total] = await Promise.all([
      this.prisma.promotion.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.promotion.count({ where }),
    ])

    return {
      promotions: promotions.map(p => ({
        ...p,
        value: Number(p.value),
        minOrderAmount: Number(p.minOrderAmount),
        maxDiscount: p.maxDiscount !== null ? Number(p.maxDiscount) : null,
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
  }

  async createPromotion(dto: CreatePromotionDto) {
    const existing = await this.prisma.promotion.findUnique({ where: { code: dto.code } })
    if (existing) {
      throw new ConflictException(`Promotion code "${dto.code}" already exists`)
    }

    const promo = await this.prisma.promotion.create({
      data: {
        code: dto.code,
        name: dto.name ?? dto.code,
        description: dto.description,
        type: dto.type,
        value: dto.value,
        minOrderAmount: dto.minOrderAmount ?? 0,
        maxDiscount: dto.maxDiscount ?? null,
        usageLimit: dto.usageLimit,
        maxPerUser: dto.maxPerUser,
        targeting: dto.targeting as Prisma.InputJsonValue | undefined,
        startsAt: new Date(dto.startsAt),
        expiresAt: new Date(dto.expiresAt),
        isActive: dto.isActive ?? true,
        status: dto.isActive === false ? 'paused' : 'active',
      },
    })

    return {
      ...promo,
      value: Number(promo.value),
      minOrderAmount: Number(promo.minOrderAmount),
      maxDiscount: promo.maxDiscount !== null ? Number(promo.maxDiscount) : null,
    }
  }

  async updatePromotion(id: string, dto: UpdatePromotionDto) {
    const existing = await this.prisma.promotion.findUnique({ where: { id } })
    if (!existing) {
      throw new NotFoundException(`Promotion ${id} not found`)
    }

    if (dto.code && dto.code !== existing.code) {
      const duplicate = await this.prisma.promotion.findUnique({ where: { code: dto.code } })
      if (duplicate) {
        throw new ConflictException(`Promotion code "${dto.code}" already exists`)
      }
    }

    const data: Prisma.PromotionUpdateInput = {}
    if (dto.code !== undefined) data.code = dto.code
    if (dto.name !== undefined) data.name = dto.name
    if (dto.description !== undefined) data.description = dto.description
    if (dto.type !== undefined) data.type = dto.type
    if (dto.value !== undefined) data.value = dto.value
    if (dto.minOrderAmount !== undefined) data.minOrderAmount = dto.minOrderAmount
    if (dto.maxDiscount !== undefined) data.maxDiscount = dto.maxDiscount
    if (dto.usageLimit !== undefined) data.usageLimit = dto.usageLimit
    if (dto.maxPerUser !== undefined) data.maxPerUser = dto.maxPerUser
    if (dto.targeting !== undefined) data.targeting = dto.targeting as Prisma.InputJsonValue
    if (dto.startsAt !== undefined) data.startsAt = new Date(dto.startsAt)
    if (dto.expiresAt !== undefined) data.expiresAt = new Date(dto.expiresAt)
    if (dto.isActive !== undefined) {
      data.isActive = dto.isActive
      data.status = dto.isActive ? 'active' : 'paused'
    }

    const promo = await this.prisma.promotion.update({ where: { id }, data })

    return {
      ...promo,
      value: Number(promo.value),
      minOrderAmount: Number(promo.minOrderAmount),
      maxDiscount: promo.maxDiscount !== null ? Number(promo.maxDiscount) : null,
    }
  }

  async deletePromotion(id: string) {
    const existing = await this.prisma.promotion.findUnique({ where: { id } })
    if (!existing) {
      throw new NotFoundException(`Promotion ${id} not found`)
    }
    await this.prisma.promotion.delete({ where: { id } })
    return { deleted: true }
  }

  async togglePromotionActive(id: string) {
    const existing = await this.prisma.promotion.findUnique({ where: { id } })
    if (!existing) {
      throw new NotFoundException(`Promotion ${id} not found`)
    }
    const promo = await this.prisma.promotion.update({
      where: { id },
      data: {
        isActive: !existing.isActive,
        status: existing.isActive ? 'paused' : 'active',
      },
    })
    return {
      ...promo,
      value: Number(promo.value),
      minOrderAmount: Number(promo.minOrderAmount),
      maxDiscount: promo.maxDiscount !== null ? Number(promo.maxDiscount) : null,
    }
  }

  getDispatchHeatmap(since: unknown) {
    const sinceDate = parseRequiredIsoDateTime(since, 'ADMIN_DISPATCH_HEATMAP_SINCE_INVALID')

    return this.prisma.$queryRaw<Array<{
      districtCode: string
      lat: number
      lng: number
      orderCount: number
    }>>(Prisma.sql`
      SELECT
        COALESCE(NULLIF(r.district, ''), r.city, 'unknown') AS "districtCode",
        ST_Y(ST_Centroid(ST_Collect(r.location::geometry)))::float8 AS "lat",
        ST_X(ST_Centroid(ST_Collect(r.location::geometry)))::float8 AS "lng",
        COUNT(o.id)::int AS "orderCount"
      FROM orders o
      JOIN restaurants r ON r.id = o.restaurant_id
      WHERE o.created_at >= ${sinceDate}
      GROUP BY COALESCE(NULLIF(r.district, ''), r.city, 'unknown')
      ORDER BY "orderCount" DESC
    `)
  }

  async getRestaurantKpi(restaurantId: string, period: string) {
    const days = period === '30d' ? 30 : period === '14d' ? 14 : 7
    const since = new Date()
    since.setDate(since.getDate() - days)

    const [summary, fulfilled, ratingTrend, revenueByDay] = await Promise.all([
      this.prisma.order.aggregate({
        where: { restaurantId, createdAt: { gte: since } },
        _avg: { estimatedPrepTimeMinutes: true },
        _count: { _all: true },
      }),
      this.prisma.order.count({
        where: {
          restaurantId,
          createdAt: { gte: since },
          status: { in: ['delivered', 'completed'] },
        },
      }),
      this.prisma.$queryRaw<Array<{ date: string; rating: number }>>(Prisma.sql`
        SELECT DATE(created_at)::text AS "date", AVG(food_rating)::float8 AS "rating"
        FROM reviews
        WHERE restaurant_id = ${restaurantId}::uuid
          AND is_hidden = false
          AND created_at >= ${since}
        GROUP BY DATE(created_at)
        ORDER BY "date"
      `),
      this.prisma.$queryRaw<Array<{ date: string; revenue: number }>>(Prisma.sql`
        SELECT DATE(created_at)::text AS "date", COALESCE(SUM(total), 0)::float8 AS "revenue"
        FROM orders
        WHERE restaurant_id = ${restaurantId}::uuid
          AND status IN ('delivered', 'completed')
          AND created_at >= ${since}
        GROUP BY DATE(created_at)
        ORDER BY "date"
      `),
    ])

    return {
      avgPrepTimeMin: Math.round(summary._avg.estimatedPrepTimeMinutes ?? 0),
      fulfillmentRate: summary._count._all === 0 ? null : fulfilled / summary._count._all,
      ratingTrend,
      revenueByDay,
    }
  }
}

function parseRequiredIsoDateTime(value: unknown, errorCode: string): Date {
  if (typeof value !== 'string') {
    throw new BadRequestException(errorCode)
  }
  const trimmed = value.trim()
  const isoDateTimePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/
  if (!isoDateTimePattern.test(trimmed)) {
    throw new BadRequestException(errorCode)
  }
  const date = new Date(trimmed)
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException(errorCode)
  }
  return date
}

import { Injectable, NotFoundException } from '@nestjs/common'
import { KycStatus, RestaurantApprovalStatus } from '@prisma/client'
import { PrismaService } from '../database/prisma.service'
import { OrdersService } from '../orders/orders.service'

@Injectable()
export class AdminResourcesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orders: OrdersService,
  ) {}

  async getOrder(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, fullName: true, email: true, phone: true } },
        restaurant: { select: { id: true, name: true, phone: true, addressLine: true } },
        driver: { select: { id: true, fullName: true, phone: true } },
        deliveryAddress: true, orderItems: true, payment: true, deliveryTask: true,
        statusHistory: { orderBy: { createdAt: 'asc' } },
      },
    })
    if (!order) throw new NotFoundException('ORDER_NOT_FOUND')
    return serializeOrder(order)
  }

  updateOrder(id: string, status: string, adminId: string, note?: string) {
    return this.orders.updateOrderStatus(id, status, adminId, 'admin', note)
  }

  async getRestaurant(id: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id },
      include: {
        openingHours: { orderBy: { dayOfWeek: 'asc' } },
        profiles: { include: { user: { select: { id: true, fullName: true, email: true, phone: true } } } },
      },
    })
    if (!restaurant) throw new NotFoundException('RESTAURANT_NOT_FOUND')
    return {
      ...restaurant,
      rating: Number(restaurant.rating),
      minOrderAmount: Number(restaurant.minOrderAmount),
    }
  }

  async reviewRestaurant(id: string, adminId: string, status: RestaurantApprovalStatus, notes?: string) {
    if (!await this.prisma.restaurant.findUnique({ where: { id }, select: { id: true } })) {
      throw new NotFoundException('RESTAURANT_NOT_FOUND')
    }
    return this.prisma.restaurant.update({
      where: { id },
      data: {
        approvalStatus: status,
        approvalNotes: notes,
        approvedAt: status === 'approved' ? new Date() : null,
        approvedById: adminId,
        isActive: status === 'approved',
      },
    })
  }

  async getRestaurantOverview(id: string) {
    await this.assertRestaurant(id)
    const [orders, reviews, menuItems, staff] = await Promise.all([
      this.prisma.order.findMany({ where: { restaurantId: id }, select: { total: true, status: true } }),
      this.prisma.review.aggregate({ where: { restaurantId: id, isHidden: false }, _avg: { foodRating: true }, _count: true }),
      this.prisma.menuItem.count({ where: { restaurantId: id } }),
      this.prisma.restaurantProfile.count({ where: { restaurantId: id, isActive: true } }),
    ])
    const completed = orders.filter(order => ['delivered', 'completed'].includes(order.status))
    return {
      totalOrders: orders.length,
      completedOrders: completed.length,
      revenue: completed.reduce((sum, order) => sum + Number(order.total), 0),
      rating: Number(reviews._avg.foodRating ?? 0),
      reviewCount: reviews._count,
      menuItems,
      activeStaff: staff,
    }
  }

  async getRestaurantMenu(id: string) {
    await this.assertRestaurant(id)
    return this.prisma.category.findMany({
      where: { restaurantId: id }, orderBy: { sortOrder: 'asc' },
      include: { menuItems: { orderBy: { sortOrder: 'asc' }, include: { options: { include: { values: true } } } } },
    })
  }

  async toggleRestaurantMenuItem(id: string, itemId: string, available: boolean) {
    const item = await this.prisma.menuItem.findFirst({ where: { id: itemId, restaurantId: id } })
    if (!item) throw new NotFoundException('MENU_ITEM_NOT_FOUND')
    return this.prisma.menuItem.update({ where: { id: itemId }, data: { isAvailable: available } })
  }

  async getRestaurantOrders(id: string, page: number, limit: number) {
    await this.assertRestaurant(id)
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: { restaurantId: id }, skip: (page - 1) * limit, take: limit,
        orderBy: { createdAt: 'desc' }, include: { customer: { select: { fullName: true } } },
      }),
      this.prisma.order.count({ where: { restaurantId: id } }),
    ])
    return { orders: orders.map(serializeOrder), meta: { page, limit, total } }
  }

  async getRestaurantReviews(id: string, page: number, limit: number) {
    await this.assertRestaurant(id)
    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { restaurantId: id }, skip: (page - 1) * limit, take: limit,
        orderBy: { createdAt: 'desc' }, include: { customer: { select: { fullName: true } } },
      }),
      this.prisma.review.count({ where: { restaurantId: id } }),
    ])
    return { reviews, meta: { page, limit, total } }
  }

  async getRestaurantFinance(id: string) {
    await this.assertRestaurant(id)
    const orders = await this.prisma.order.findMany({
      where: { restaurantId: id, status: { in: ['delivered', 'completed'] } },
      select: { total: true, promotionDiscount: true, commissionRateAtOrderTime: true, createdAt: true },
    })
    const gross = orders.reduce((sum, order) => sum + Number(order.total), 0)
    const commission = orders.reduce((sum, order) => sum + Number(order.total) * Number(order.commissionRateAtOrderTime) / 100, 0)
    return { gross, commission: Math.round(commission), net: Math.round(gross - commission), orderCount: orders.length }
  }

  async getUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id }, include: { customerProfile: true, driverProfile: true, restaurantProfile: { include: { restaurant: true } } },
      omit: { passwordHash: true },
    })
    if (!user) throw new NotFoundException('USER_NOT_FOUND')
    return user
  }

  async getUserWallet(id: string) {
    await this.assertUser(id)
    const transactions = await this.prisma.walletTransaction.findMany({
      where: { userId: id }, orderBy: { createdAt: 'desc' }, take: 100,
    })
    return {
      balance: transactions.filter(transaction => transaction.status === 'CONFIRMED')
        .reduce((sum, transaction) => sum + transaction.amountDelta, 0),
      transactions,
    }
  }

  async getUserRefunds(id: string) {
    await this.assertUser(id)
    return this.prisma.payment.findMany({
      where: { order: { customerId: id }, status: 'refunded' },
      include: { order: { select: { orderCode: true, total: true } } }, orderBy: { createdAt: 'desc' },
    })
  }

  async getUserKyc(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id }, include: { driverProfile: true } })
    if (!user) throw new NotFoundException('USER_NOT_FOUND')
    if (!user.driverProfile) return { available: false, reason: 'NOT_A_DRIVER' }
    return {
      available: true,
      submissions: await this.prisma.driverKycSubmission.findMany({
        where: { driverProfileId: user.driverProfile.id }, orderBy: { createdAt: 'desc' },
      }),
    }
  }

  async reviewUserKyc(id: string, submissionId: string, status: KycStatus, adminId: string, reason?: string) {
    const user = await this.prisma.user.findUnique({ where: { id }, include: { driverProfile: true } })
    const submission = user?.driverProfile && await this.prisma.driverKycSubmission.findFirst({
      where: { id: submissionId, driverProfileId: user.driverProfile.id },
    })
    if (!submission) throw new NotFoundException('KYC_SUBMISSION_NOT_FOUND')
    return this.prisma.driverKycSubmission.update({
      where: { id: submissionId },
      data: { status, rejectionReason: reason, reviewedById: adminId, reviewedAt: new Date() },
    })
  }

  async getPromotion(id: string) {
    const promotion = await this.prisma.promotion.findUnique({ where: { id }, include: { items: true } })
    if (!promotion) throw new NotFoundException('PROMOTION_NOT_FOUND')
    return serializePromotion(promotion)
  }

  async getPromotionAnalytics(id: string) {
    await this.getPromotion(id)
    const usages = await this.prisma.promotionUsage.findMany({
      where: { promotionId: id }, select: { discountAmount: true, usedAt: true, order: { select: { total: true } } },
    })
    const gmv = usages.reduce((sum, usage) => sum + Number(usage.order.total), 0)
    const discountCost = usages.reduce((sum, usage) => sum + Number(usage.discountAmount), 0)
    return { redemptions: usages.length, gmv, discountCost, roi: discountCost ? (gmv - discountCost) / discountCost : null }
  }

  private async assertRestaurant(id: string) {
    if (!await this.prisma.restaurant.findUnique({ where: { id }, select: { id: true } })) throw new NotFoundException('RESTAURANT_NOT_FOUND')
  }
  private async assertUser(id: string) {
    if (!await this.prisma.user.findUnique({ where: { id }, select: { id: true } })) throw new NotFoundException('USER_NOT_FOUND')
  }
}

function serializeOrder<T extends object>(order: T) {
  const values = order as Record<string, unknown>
  const customer = values.customer as Record<string, unknown> | null | undefined
  const restaurant = values.restaurant as Record<string, unknown> | null | undefined
  const driver = values.driver as Record<string, unknown> | null | undefined
  const deliveryAddress = values.deliveryAddress as Record<string, unknown> | null | undefined
  const orderItems = Array.isArray(values.orderItems) ? values.orderItems as Array<Record<string, unknown>> : []
  const promotionDiscount = Number(values.promotionDiscount ?? 0)

  return {
    ...order,
    total: Number(values.total ?? 0),
    subtotal: Number(values.subtotal ?? 0),
    deliveryFee: Number(values.deliveryFee ?? 0),
    promotionDiscount,
    discount: promotionDiscount,
    note: values.notes ?? values.note ?? '',
    deliveryAddress: typeof values.deliveryAddress === 'string'
      ? values.deliveryAddress
      : String(deliveryAddress?.addressLine ?? ''),
    customer: customer && {
      id: String(customer.id ?? ''),
      name: String(customer.fullName ?? customer.name ?? ''),
      phone: String(customer.phone ?? ''),
    },
    restaurant: restaurant && {
      id: String(restaurant.id ?? ''),
      name: String(restaurant.name ?? ''),
      address: String(restaurant.addressLine ?? restaurant.address ?? ''),
    },
    driver: driver && {
      id: String(driver.id ?? ''),
      name: String(driver.fullName ?? driver.name ?? ''),
      phone: String(driver.phone ?? ''),
    },
    items: orderItems.map(item => ({
      name: String(item.nameSnapshot ?? item.name ?? ''),
      quantity: Number(item.quantity ?? 0),
      price: Number(item.unitPrice ?? item.price ?? 0),
    })),
  }
}
function serializePromotion<T extends { value: unknown; minOrderAmount: unknown; maxDiscount: unknown }>(promotion: T) {
  return { ...promotion, value: Number(promotion.value), minOrderAmount: Number(promotion.minOrderAmount), maxDiscount: promotion.maxDiscount == null ? null : Number(promotion.maxDiscount) }
}

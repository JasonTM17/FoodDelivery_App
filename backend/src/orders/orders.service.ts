import { Injectable, BadRequestException, NotFoundException, UnprocessableEntityException } from '@nestjs/common'
import { InjectQueue } from '@nestjs/bullmq'
import { Queue } from 'bullmq'
import { PrismaService } from '../database/prisma.service'
import { OrderStateMachine, OrderStatus } from './order-state-machine'
import { PaymentsService } from './payments.service'
import { OrdersGateway } from './orders.gateway'
import { CancellationService } from './cancellation.service'
import { PlaceOrderDto, CancelOrderDto, CreateReviewDto } from './orders.dto'
import { OrderStatus as PrismaOrderStatus, PaymentMethod as PrismaPaymentMethod, Prisma } from '@prisma/client'
import { nanoid } from 'nanoid'
import dayjs from 'dayjs'

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentsService: PaymentsService,
    private readonly ordersGateway: OrdersGateway,
    private readonly cancellationService: CancellationService,
    @InjectQueue('dispatch') private readonly dispatchQueue: Queue,
    @InjectQueue('refund') private readonly refundQueue: Queue,
    @InjectQueue('order-timeout') private readonly orderTimeoutQueue: Queue,
  ) {}

  async transition(
    orderId: string,
    toStatus: OrderStatus,
    actorId: string,
    role: string,
    reason?: string,
    ip?: string,
  ) {
    type SideEffects = { needsRefundJob: boolean; needsDispatch: boolean }

    const { order: result, fx } = await this.prisma.$transaction(async (tx) => {
      // Serialise concurrent transitions for the same order
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${orderId}))`

      const order = await tx.order.findUniqueOrThrow({ where: { id: orderId } })
      if (role === 'restaurant') {
        const profile = await tx.restaurantProfile.findUnique({ where: { userId: actorId } })
        if (!profile || profile.restaurantId !== order.restaurantId) {
          throw new NotFoundException('ORDER_NOT_FOUND')
        }
      }
      if (role === 'driver' && order.driverId !== actorId) {
        throw new NotFoundException('ORDER_NOT_FOUND')
      }
      OrderStateMachine.validate(order.status as OrderStatus, toStatus, role)

      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          status: toStatus as PrismaOrderStatus,
          ...(toStatus === 'cancelled' ? { cancelledReason: reason ?? 'Cancelled' } : {}),
        },
      })

      const noteText = [reason, ip ? `ip=${ip}` : null].filter(Boolean).join(' | ') || null
      await tx.orderStatusHistory.create({
        data: { orderId, status: toStatus, changedBy: actorId, note: noteText },
      })

      // Cancelled + payment completed → mark refunded inside txn
      let needsRefundJob = false
      if (toStatus === 'cancelled') {
        const payment = await tx.payment.findUnique({ where: { orderId } })
        if (payment?.status === 'completed') {
          await tx.payment.update({ where: { id: payment.id }, data: { status: 'refunded' } })
          needsRefundJob = true
        }
      }

      return {
        order: updated,
        fx: { needsRefundJob, needsDispatch: toStatus === 'restaurant_accepted' } as SideEffects,
      }
    })

    // Post-commit side effects
    this.ordersGateway.broadcastToOrder(orderId, 'order:status:changed', {
      orderId, status: toStatus, timestamp: new Date().toISOString(),
    })
    this.ordersGateway.notifyAdmins('admin:order_status_changed', {
      orderId, status: toStatus, timestamp: new Date().toISOString(),
    })

    if (fx.needsRefundJob) {
      const jobId = `refund-${orderId}`
      await this.refundQueue.add(
        'refund.order',
        { orderId, idempotencyKey: jobId },
        { attempts: 3, backoff: { type: 'exponential', delay: 1000 }, jobId },
      )
    }

    if (fx.needsDispatch) {
      await this.dispatchQueue.add('dispatch.driver', { orderId }, { delay: 0, jobId: `dispatch-${orderId}` })
    }

    return result
  }

  async placeOrder(userId: string, dto: PlaceOrderDto) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: { items: { include: { menuItem: true } } },
    })
    if (!cart || cart.items.length === 0) throw new BadRequestException('CART_EMPTY')
    if (!cart.restaurantId) throw new BadRequestException('CART_NO_RESTAURANT')

    const restaurant = await this.prisma.restaurant.findUniqueOrThrow({
      where: { id: cart.restaurantId },
    })
    if (!restaurant.isOpen || !restaurant.isActive) {
      throw new UnprocessableEntityException('RESTAURANT_CLOSED')
    }

    const address = await this.prisma.address.findFirst({
      where: { id: dto.addressId, userId },
    })
    if (!address) throw new NotFoundException('ADDRESS_NOT_FOUND')

    const subtotal = cart.items.reduce((sum, i) => sum + Number(i.unitPrice) * i.quantity, 0)
    const deliveryFee = 15000 // flat fee for MVP

    if (Number(subtotal) < Number(restaurant.minOrderAmount)) {
      throw new UnprocessableEntityException('MIN_ORDER_NOT_MET')
    }

    const orderCode = `FD-${dayjs().format('YYMMDD')}-${nanoid(4).toUpperCase()}`

    // Pre-fetch promotion outside txn (read-only, idempotent)
    const code = dto.promotionCode ?? cart.promotionCode
    let resolvedPromotion: { id: string; type: string; value: unknown; maxDiscount: unknown; minOrderAmount: unknown } | null = null
    let promotionDiscount = 0

    if (code) {
      const promo = await this.prisma.promotion.findUnique({ where: { code } })
      if (promo && promo.isActive && promo.usageCount < promo.usageLimit) {
        if (Number(subtotal) >= Number(promo.minOrderAmount)) {
          resolvedPromotion = promo
          promotionDiscount = promo.type === 'percentage'
            ? Math.min(Number(subtotal) * Number(promo.value) / 100, Number(promo.maxDiscount ?? Infinity))
            : Number(promo.value)
        }
      }
    }

    const total = subtotal + deliveryFee - promotionDiscount

    const order = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          orderCode,
          customerId: userId,
          restaurantId: cart.restaurantId!,
          deliveryAddressId: dto.addressId,
          status: 'created',
          subtotal,
          deliveryFee,
          promotionDiscount,
          total,
          paymentMethod: dto.paymentMethod as unknown as PrismaPaymentMethod,
          notes: dto.notes,
          estimatedPrepTimeMinutes: restaurant.prepTimeAvgMinutes,
          orderItems: {
            create: cart.items.map(item => ({
              menuItemId: item.menuItemId,
              nameSnapshot: item.menuItem.name,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              selectedOptions: item.selectedOptions as object[],
              notes: item.notes,
            })),
          },
        },
      })

      await tx.orderStatusHistory.create({
        data: { orderId: order.id, status: 'created', changedBy: userId },
      })

      // Record promotion usage + increment counter atomically
      if (resolvedPromotion) {
        await tx.promotion.update({
          where: { id: resolvedPromotion.id },
          data: { usageCount: { increment: 1 } },
        })
        await tx.promotionUsage.create({
          data: { promotionId: resolvedPromotion.id, userId, orderId: order.id, discountAmount: promotionDiscount },
        })
      }

      // Clean up cart atomically
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } })
      await tx.cart.delete({ where: { id: cart.id } })

      return order
    })

    // Process payment async — fire-and-forget outside txn
    this.paymentsService.processPayment(order.id, Number(total), dto.paymentMethod).catch(console.error)

    // Schedule auto-timeout: cancel if restaurant doesn't accept in 5 min
    await this.orderTimeoutQueue.add(
      'restaurant-accept-timeout',
      { orderId: order.id, expectedStatus: 'paid' },
      { delay: 5 * 60_000, jobId: `timeout:${order.id}:restaurant-accept`, removeOnComplete: true },
    )

    // Notify restaurant
    this.ordersGateway.notifyRestaurant(restaurant.id, {
      orderId: order.id,
      orderCode,
      total: Number(total),
      items: cart.items.map(i => ({ name: i.menuItem.name, quantity: i.quantity })),
    })
    this.ordersGateway.notifyAdmins('admin:new_order', {
      orderId: order.id, orderCode, restaurantId: restaurant.id,
      total: Number(total), createdAt: new Date().toISOString(),
    })

    return order
  }

  async getRestaurantOrders(userId: string, status?: string) {
    const profile = await this.prisma.restaurantProfile.findUnique({ where: { userId }, select: { restaurantId: true } })
    if (!profile) return { orders: [], meta: { page: 1, limit: 50, total: 0 } }

    const where: Prisma.OrderWhereInput = { restaurantId: profile.restaurantId }
    if (status) where.status = status as PrismaOrderStatus

    const orders = await this.prisma.order.findMany({
      where, orderBy: { createdAt: 'desc' }, take: 50,
      include: {
        restaurant: { select: { name: true } },
        orderItems: { select: { id: true, menuItemId: true, nameSnapshot: true, quantity: true, unitPrice: true, selectedOptions: true } },
        customer: { select: { fullName: true, phone: true } },
        deliveryAddress: { select: { addressLine: true } },
      },
    })
    return { orders: orders.map(serializeRestaurantOrder), meta: { page: 1, limit: 50, total: orders.length } }
  }

  async getRestaurantOrderDetail(orderId: string, userId: string) {
    const profile = await this.prisma.restaurantProfile.findUnique({ where: { userId } })
    if (!profile) throw new NotFoundException('ORDER_NOT_FOUND')
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, restaurantId: profile.restaurantId },
      include: {
        orderItems: true,
        customer: { select: { id: true, fullName: true, phone: true } },
        driver: { select: { id: true, fullName: true, phone: true } },
        deliveryAddress: true,
        statusHistory: { orderBy: { createdAt: 'asc' } },
        payment: true,
      },
    })
    if (!order) throw new NotFoundException('ORDER_NOT_FOUND')
    return serializeRestaurantOrder(order)
  }

  async getCustomerOrders(userId: string, page = 1, limit = 20, status?: string) {
    const where: Record<string, unknown> = { customerId: userId }
    if (status) where.status = status

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          restaurant: { select: { id: true, name: true, logoUrl: true } },
          orderItems: { select: { nameSnapshot: true, quantity: true } },
          driver: { select: { id: true, fullName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ])

    return { orders, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } }
  }

  async getOrderDetail(orderId: string, userId: string, role: string) {
    const order = await this.prisma.order.findUniqueOrThrow({
      where: { id: orderId },
      include: {
        orderItems: true,
        restaurant: true,
        driver: { select: { id: true, fullName: true, phone: true } },
        deliveryAddress: true,
        statusHistory: { orderBy: { createdAt: 'asc' } },
        payment: true,
        deliveryTask: true,
      },
    })

    if (role !== 'admin' && order.customerId !== userId && order.driverId !== userId) {
      throw new NotFoundException('ORDER_NOT_FOUND')
    }

    return order
  }

  async cancelOrder(orderId: string, userId: string, role: string, dto?: CancelOrderDto) {
    const order = await this.prisma.order.findUniqueOrThrow({ where: { id: orderId } })
    if (role !== 'admin' && order.customerId !== userId) throw new NotFoundException('ORDER_NOT_FOUND')
    this.cancellationService.assertCanCancel(role, order.status as OrderStatus, dto?.reason)
    return this.transition(orderId, 'cancelled', userId, role, dto?.reason ?? 'Cancelled by user')
  }

  async updateOrderStatus(orderId: string, newStatus: string, userId: string, role: string, note?: string) {
    return this.transition(orderId, newStatus as OrderStatus, userId, role, note)
  }

  async getTracking(orderId: string, userId: string) {
    const order = await this.prisma.order.findUniqueOrThrow({
      where: { id: orderId },
      include: { driver: { select: { id: true, fullName: true, phone: true } }, deliveryTask: true },
    })
    if (order.customerId !== userId) throw new NotFoundException('ORDER_NOT_FOUND')
    return {
      orderId: order.id,
      status: order.status,
      driver: order.driver,
      deliveryTask: order.deliveryTask,
      estimatedDeliveryTimeMinutes: order.estimatedDeliveryTimeMinutes,
    }
  }

  async submitReview(orderId: string, userId: string, dto: CreateReviewDto) {
    const order = await this.prisma.order.findUniqueOrThrow({ where: { id: orderId } })
    if (order.customerId !== userId) throw new NotFoundException('ORDER_NOT_FOUND')

    const existing = await this.prisma.review.findUnique({ where: { orderId } })
    if (existing) throw new BadRequestException('ALREADY_REVIEWED')

    return this.prisma.review.create({
      data: {
        orderId,
        customerId: userId,
        restaurantId: order.restaurantId,
        driverId: order.driverId,
        foodRating: dto.foodRating,
        deliveryRating: dto.deliveryRating,
        comment: dto.comment,
      },
    })
  }
}

type RestaurantOrderView = {
  id: string
  orderCode: string
  status: string
  total: Prisma.Decimal | number
  notes: string | null
  restaurantId: string
  createdAt: Date
  updatedAt: Date
  customer?: { fullName: string; phone?: string | null } | null
  deliveryAddress?: { addressLine: string } | null
  orderItems: Array<{
    id: string
    menuItemId: string
    nameSnapshot: string
    quantity: number
    unitPrice: Prisma.Decimal | number
    selectedOptions: Prisma.JsonValue
  }>
}

function serializeRestaurantOrder(order: RestaurantOrderView) {
  return {
    id: order.id,
    code: order.orderCode,
    status: order.status,
    items: order.orderItems.map(item => ({
      id: item.id,
      menuItemId: item.menuItemId,
      name: item.nameSnapshot,
      quantity: item.quantity,
      price: Number(item.unitPrice),
      options: serializeSelectedOptions(item.selectedOptions),
    })),
    total: Number(order.total),
    customerName: order.customer?.fullName ?? '',
    customerPhone: order.customer?.phone ?? '',
    customerAddress: order.deliveryAddress?.addressLine ?? '',
    tableNumber: null,
    note: order.notes ?? '',
    restaurantId: order.restaurantId,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  }
}

function serializeSelectedOptions(value: Prisma.JsonValue) {
  if (!Array.isArray(value)) return []
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return []
    const record = entry as Record<string, Prisma.JsonValue>
    return [{
      name: typeof record.name === 'string' ? record.name : '',
      value: typeof record.value === 'string' ? record.value : '',
      price: Number(record.price ?? record.priceModifier ?? 0),
    }]
  })
}

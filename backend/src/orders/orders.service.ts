import { Inject, Injectable, BadRequestException, NotFoundException, UnprocessableEntityException } from '@nestjs/common'
import { InjectQueue } from '@nestjs/bullmq'
import { Queue } from 'bullmq'
import type Redis from 'ioredis'
import { PrismaService } from '../database/prisma.service'
import { OrderStateMachine, OrderStatus } from './order-state-machine'
import { PaymentsService } from './payments.service'
import { OrdersGateway } from './orders.gateway'
import { CancellationService } from './cancellation.service'
import { PlaceOrderDto, CancelOrderDto, CreateReviewDto } from './orders.dto'
import { OrderStatus as PrismaOrderStatus, Prisma, UserRole, type Order } from '@prisma/client'
import { nanoid } from 'nanoid'
import dayjs from 'dayjs'
import { normalizeOrderPaymentMethod } from './payment-methods'
import { PromotionsService } from '../promotions/promotions.service'
import { routePhaseForStatus } from '../tracking/tracking.service'
import { PaymentRefundJobData } from '../payments/refund.processor'

const ORDER_CODE_CREATE_ATTEMPTS = 8

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentsService: PaymentsService,
    private readonly ordersGateway: OrdersGateway,
    private readonly cancellationService: CancellationService,
    private readonly promotionsService: PromotionsService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    @InjectQueue('dispatch') private readonly dispatchQueue: Queue,
    @InjectQueue('payment-refund') private readonly refundQueue: Queue,
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
    type SideEffects = {
      refundJob: PaymentRefundJobData | null
      needsDispatch: boolean
      releaseDriverId: string | null
    }

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
      const routePhaseChanged =
        routePhaseForStatus(order.status) !== routePhaseForStatus(toStatus)

      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          status: toStatus as PrismaOrderStatus,
          ...(toStatus === 'cancelled' ? { cancelledReason: reason ?? 'Cancelled' } : {}),
          ...(routePhaseChanged
            ? {
              estimatedDeliveryTimeMinutes: null,
              routePolyline: null,
              routeWaypoints: Prisma.DbNull,
            }
            : {}),
        },
      })

      const noteText = [reason, ip ? `ip=${ip}` : null].filter(Boolean).join(' | ') || null
      await tx.orderStatusHistory.create({
        data: { orderId, status: toStatus, changedBy: actorId, note: noteText },
      })

      let refundJob: PaymentRefundJobData | null = null
      if (toStatus === 'cancelled') {
        const payment = await tx.payment.findUnique({ where: { orderId } })
        if (payment?.status === 'completed') {
          refundJob = {
            refundId: `full-${orderId}`,
            orderId,
            transactionRef: payment.transactionId,
            amount: Math.trunc(Number(payment.amount)),
            reason: reason ?? 'Order cancelled',
            kind: 'full',
            attemptNo: 1,
          }
        }
      }

      return {
        order: updated,
        fx: {
          refundJob,
          needsDispatch: toStatus === 'restaurant_accepted',
          releaseDriverId: isDriverReleaseStatus(toStatus) ? order.driverId : null,
        } as SideEffects,
      }
    })

    // Post-commit side effects
    this.ordersGateway.broadcastToOrder(orderId, 'order:status:changed', {
      orderId, status: toStatus, timestamp: new Date().toISOString(),
    })
    this.ordersGateway.notifyAdmins('admin:order_status_changed', {
      orderId, status: toStatus, timestamp: new Date().toISOString(),
    })

    if (fx.releaseDriverId) {
      await this.releaseDriverAssignmentIfCurrent(fx.releaseDriverId, orderId)
    }

    if (fx.refundJob) {
      const jobId = `payment-refund-${fx.refundJob.refundId}`
      await this.refundQueue.add(
        'payment-refund.full',
        fx.refundJob,
        { attempts: 3, backoff: { type: 'exponential', delay: 1000 }, jobId },
      )
    }

    if (fx.needsDispatch) {
      await this.enqueueDispatch(orderId)
    }

    return result
  }

  private async releaseDriverAssignmentIfCurrent(driverId: string, orderId: string): Promise<void> {
    const currentOrderKey = `driver:${driverId}:current_order`
    const currentOrder = await this.redis.get(currentOrderKey)
    if (currentOrder === orderId) {
      await this.redis.del(currentOrderKey)

      const statusKey = `driver:${driverId}:status`
      const idleSinceKey = `driver:${driverId}:idle_since`
      const isAlive = await this.redis.get(`driver:${driverId}:alive`)
      if (isAlive) {
        await this.redis.set(statusKey, 'online')
        await this.redis.set(idleSinceKey, Date.now().toString())
      } else {
        await this.redis.del(statusKey)
        await this.redis.del(idleSinceKey)
      }
    }
  }

  private async enqueueDispatch(orderId: string): Promise<void> {
    const locations = await this.prisma.$queryRawUnsafe<Array<{ restaurantLat: number; restaurantLng: number }>>(
      `SELECT ST_Y(r.location::geometry)::float8 AS "restaurantLat",
              ST_X(r.location::geometry)::float8 AS "restaurantLng"
         FROM orders o
         JOIN restaurants r ON r.id = o.restaurant_id
        WHERE o.id = $1::uuid`,
      orderId,
    )
    const location = locations[0]
    if (
      !location ||
      !Number.isFinite(Number(location.restaurantLat)) ||
      !Number.isFinite(Number(location.restaurantLng))
    ) {
      throw new NotFoundException('ORDER_RESTAURANT_LOCATION_NOT_FOUND')
    }

    await this.dispatchQueue.add(
      'dispatch.driver',
      {
        orderId,
        restaurantLat: Number(location.restaurantLat),
        restaurantLng: Number(location.restaurantLng),
        attempt: 1,
      },
      { delay: 0, jobId: `dispatch-${orderId}` },
    )
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

    const code = (dto.promotionCode ?? cart.promotionCode)?.trim()
    const paymentMethod = normalizeOrderPaymentMethod(dto.paymentMethod)

    let order: Order | null = null
    for (let attempt = 1; attempt <= ORDER_CODE_CREATE_ATTEMPTS; attempt += 1) {
      const orderCode = generateOrderCode()
      try {
        order = await this.prisma.$transaction(async (tx) => {
          const baseTotal = subtotal + deliveryFee
          let createdOrder = await tx.order.create({
            data: {
              orderCode,
              customerId: userId,
              restaurantId: cart.restaurantId!,
              deliveryAddressId: dto.addressId,
              status: 'created',
              subtotal,
              deliveryFee,
              promotionDiscount: 0,
              total: baseTotal,
              paymentMethod,
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
            data: { orderId: createdOrder.id, status: 'created', changedBy: userId },
          })

          if (code) {
            const { discountAmount } = await this.promotionsService.claimInTransaction(
              tx,
              code,
              { subtotal, restaurantId: cart.restaurantId! },
              userId,
              createdOrder.id,
            )
            createdOrder = await tx.order.update({
              where: { id: createdOrder.id },
              data: {
                promotionDiscount: discountAmount,
                total: baseTotal - discountAmount,
              },
            })
          }

          // Clean up cart atomically
          await tx.cartItem.deleteMany({ where: { cartId: cart.id } })
          await tx.cart.delete({ where: { id: cart.id } })

          return createdOrder
        })
        break
      } catch (error) {
        if (attempt < ORDER_CODE_CREATE_ATTEMPTS && isOrderCodeCollision(error)) continue
        throw error
      }
    }
    if (!order) throw new Error('ORDER_CREATE_FAILED')
    const orderTotal = Number(order.total)

    // Payment must settle or create a real provider intent before side effects run.
    const paymentResult = await this.paymentsService.processPayment(
      order.id,
      orderTotal,
      paymentMethod,
    )

    const status = paymentResult.failureCode
      ? 'cancelled'
      : paymentResult.readyForRestaurant
        ? 'restaurant_pending'
        : 'pending_payment'

    // Schedule auto-timeout: cancel if restaurant doesn't accept in 5 min
    if (paymentResult.readyForRestaurant) {
      await this.orderTimeoutQueue.add(
        'restaurant-accept-timeout',
        {
          orderId: order.id,
          expectedStatus: 'restaurant_pending',
          targetStatus: 'cancelled',
          reason: 'Restaurant did not accept order in time',
        },
        { delay: 5 * 60_000, jobId: `timeout:${order.id}:restaurant-accept`, removeOnComplete: true },
      )

      this.ordersGateway.notifyRestaurant(restaurant.id, {
        orderId: order.id,
        orderCode: order.orderCode,
        total: orderTotal,
        items: cart.items.map(i => ({ name: i.menuItem.name, quantity: i.quantity })),
      })
    }
    this.ordersGateway.notifyAdmins(
      paymentResult.failureCode ? 'admin:order_payment_failed' : 'admin:new_order',
      {
        orderId: order.id,
        orderCode: order.orderCode,
        restaurantId: restaurant.id,
        total: orderTotal,
        status,
        ...(paymentResult.failureCode ? { failureCode: paymentResult.failureCode } : {}),
        createdAt: new Date().toISOString(),
      },
    )

    return paymentResult.paymentIntent
      ? { ...order, status, paymentIntent: paymentResult.paymentIntent }
      : { ...order, status }
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

  async getTracking(orderId: string, userId: string, role: string) {
    const select = {
      id: true,
      status: true,
      driverId: true,
      estimatedDeliveryTimeMinutes: true,
      routePolyline: true,
    } satisfies Prisma.OrderSelect

    let where: Prisma.OrderWhereInput
    if (role === UserRole.customer) {
      where = { id: orderId, customerId: userId }
    } else if (role === UserRole.driver) {
      where = { id: orderId, driverId: userId }
    } else if (role === UserRole.admin) {
      where = { id: orderId }
    } else if (role === UserRole.restaurant) {
      const profile = await this.prisma.restaurantProfile.findFirst({
        where: { userId, isActive: true },
        select: { restaurantId: true },
      })
      if (!profile) throw new NotFoundException('ORDER_NOT_FOUND')
      where = { id: orderId, restaurantId: profile.restaurantId }
    } else {
      throw new NotFoundException('ORDER_NOT_FOUND')
    }

    const order = await this.prisma.order.findFirst({
      where,
      select,
    })
    if (!order) throw new NotFoundException('ORDER_NOT_FOUND')
    return order
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

export function generateOrderCode(now = dayjs()) {
  const suffix = nanoid(4).toUpperCase().replace(/[^A-Z0-9]/g, '').padEnd(4, '0').slice(0, 4)
  return `FD${now.format('YYMMDD')}${suffix}`
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

function isDriverReleaseStatus(status: OrderStatus): boolean {
  return ['delivered', 'completed', 'cancelled', 'refunded'].includes(status)
}

function isOrderCodeCollision(error: unknown): boolean {
  const candidate = error as { code?: unknown; meta?: { target?: unknown } } | null | undefined
  if (candidate?.code !== 'P2002') return false

  const target = candidate.meta?.target
  if (Array.isArray(target)) {
    return target.some(entry => isOrderCodeConstraint(String(entry)))
  }
  return isOrderCodeConstraint(String(target ?? ''))
}

function isOrderCodeConstraint(target: string): boolean {
  return target.includes('orderCode') || target.includes('order_code') || target.includes('orders_order_code_key')
}

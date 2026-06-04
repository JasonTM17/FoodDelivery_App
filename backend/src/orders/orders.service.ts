import { Injectable, BadRequestException, NotFoundException, UnprocessableEntityException } from '@nestjs/common'
import { PrismaService } from '../database/prisma.service'
import { OrderStateMachine, OrderStatus } from './order-state-machine'
import { PaymentsService } from './payments.service'
import { OrdersGateway } from './orders.gateway'
import { PlaceOrderDto, CancelOrderDto, CreateReviewDto, PaymentMethodDto } from './orders.dto'
import { OrderStatus as PrismaOrderStatus, PaymentMethod as PrismaPaymentMethod, Prisma } from '@prisma/client'
import { nanoid } from 'nanoid'
import dayjs from 'dayjs'

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentsService: PaymentsService,
    private readonly ordersGateway: OrdersGateway,
  ) {}

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
    let promotionDiscount = 0

    if (dto.promotionCode || cart.promotionCode) {
      const code = dto.promotionCode ?? cart.promotionCode
      const promo = await this.prisma.promotion.findUnique({ where: { code: code! } })
      if (promo && promo.isActive && promo.usageCount < promo.usageLimit) {
        if (Number(subtotal) >= Number(promo.minOrderAmount)) {
          promotionDiscount = promo.type === 'percentage'
            ? Math.min(Number(subtotal) * Number(promo.value) / 100, Number(promo.maxDiscount ?? Infinity))
            : Number(promo.value)
          await this.prisma.promotion.update({
            where: { id: promo.id },
            data: { usageCount: { increment: 1 } },
          })
        }
      }
    }

    const total = subtotal + deliveryFee - promotionDiscount

    if (Number(subtotal) < Number(restaurant.minOrderAmount)) {
      throw new UnprocessableEntityException('MIN_ORDER_NOT_MET')
    }

    const orderCode = `FD-${dayjs().format('YYMMDD')}-${nanoid(4).toUpperCase()}`

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

      if (dto.promotionCode || cart.promotionCode) {
        const promo = await tx.promotion.findUnique({ where: { code: (dto.promotionCode ?? cart.promotionCode)! } })
        if (promo) {
          await tx.promotionUsage.create({
            data: { promotionId: promo.id, userId, orderId: order.id, discountAmount: promotionDiscount },
          })
        }
      }

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } })
      await tx.cart.delete({ where: { id: cart.id } })

      return order
    })

    // Process payment async
    this.paymentsService.processPayment(order.id, Number(total), dto.paymentMethod).catch(console.error)

    // Notify restaurant
    this.ordersGateway.notifyRestaurant(restaurant.id, {
      orderId: order.id,
      orderCode,
      total: Number(total),
      items: cart.items.map(i => ({ name: i.menuItem.name, quantity: i.quantity })),
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
        orderItems: { select: { nameSnapshot: true, quantity: true } },
        customer: { select: { fullName: true } },
      },
    })
    return { orders, meta: { page: 1, limit: 50, total: orders.length } }
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

    const currentStatus = order.status as OrderStatus
    OrderStateMachine.validate(currentStatus, 'cancelled', role)

    const updated = await this.prisma.$transaction(async (tx) => {
      const o = await tx.order.update({
        where: { id: orderId },
        data: { status: 'cancelled', cancelledReason: dto?.reason ?? 'Cancelled by user' },
      })
      await tx.orderStatusHistory.create({
        data: { orderId, status: 'cancelled', changedBy: userId, note: dto?.reason },
      })

      // If payment completed, mark for refund
      const payment = await tx.payment.findUnique({ where: { orderId } })
      if (payment && payment.status === 'completed') {
        await tx.payment.update({ where: { id: payment.id }, data: { status: 'refunded' } })
        await tx.orderStatusHistory.create({
          data: { orderId, status: 'refunded', changedBy: 'system', note: 'Auto-refund on cancellation' },
        })
        await tx.order.update({ where: { id: orderId }, data: { status: 'refunded' } })
      }

      return o
    })

    this.ordersGateway.broadcastToOrder(orderId, 'order:status_changed', {
      orderId, status: updated.status, timestamp: new Date().toISOString(),
    })

    return updated
  }

  async updateOrderStatus(orderId: string, newStatus: string, userId: string, role: string, note?: string) {
    const order = await this.prisma.order.findUniqueOrThrow({ where: { id: orderId } })
    const currentStatus = order.status as OrderStatus

    OrderStateMachine.validate(currentStatus, newStatus as OrderStatus, role)

    const updated = await this.prisma.$transaction(async (tx) => {
      const o = await tx.order.update({ where: { id: orderId }, data: { status: newStatus as PrismaOrderStatus } })
      await tx.orderStatusHistory.create({
        data: { orderId, status: newStatus, changedBy: userId, note },
      })
      return o
    })

    this.ordersGateway.broadcastToOrder(orderId, 'order:status_changed', {
      orderId, status: newStatus, timestamp: new Date().toISOString(),
    })

    return updated
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

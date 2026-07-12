import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../database/prisma.service'
import { InjectQueue } from '@nestjs/bullmq'
import { Queue } from 'bullmq'
import { PaymentRefundJobData } from '../payments/refund.processor'

export interface MarkUnavailableDto {
  unavailableItemIds: string[]
  reason?: string
}

@Injectable()
export class PartialFulfillmentService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('payment-refund') private readonly refundQueue: Queue,
  ) {}

  async markItemsUnavailable(
    orderId: string,
    restaurantUserId: string,
    dto: MarkUnavailableDto,
  ): Promise<{ newTotal: number; refundAmount: number }> {
    if (!dto.unavailableItemIds.length) {
      throw new BadRequestException('ITEMS_REQUIRED')
    }

    const profile = await this.prisma.restaurantProfile.findUnique({
      where: { userId: restaurantUserId },
      select: { restaurantId: true },
    })
    if (!profile) throw new NotFoundException('RESTAURANT_PROFILE_NOT_FOUND')

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { orderItems: true, payment: true },
    })
    if (!order) throw new NotFoundException('ORDER_NOT_FOUND')
    if (order.restaurantId !== profile.restaurantId) {
      throw new NotFoundException('ORDER_NOT_FOUND')
    }

    const allowed = ['restaurant_accepted', 'preparing']
    if (!allowed.includes(order.status)) {
      throw new BadRequestException('ORDER_NOT_IN_MODIFIABLE_STATE')
    }

    // Only items still on the order with qty > 0 (already-removed are not re-applied)
    const removedItems = order.orderItems.filter(
      (i) => dto.unavailableItemIds.includes(i.id) && i.quantity > 0,
    )
    if (!removedItems.length) throw new BadRequestException('NO_VALID_ITEMS_TO_REMOVE')

    const refundDelta = removedItems.reduce(
      (sum, i) => sum + Number(i.unitPrice) * i.quantity,
      0,
    )
    const newTotal = Math.max(0, Number(order.total) - refundDelta)

    await this.prisma.$transaction(async (tx) => {
      // Mark items removed so replay cannot subtract again
      await tx.orderItem.updateMany({
        where: {
          id: { in: removedItems.map((i) => i.id) },
          orderId,
        },
        data: {
          notes: `[UNAVAILABLE] ${dto.reason ?? 'n/a'}`.slice(0, 500),
          quantity: 0,
        },
      })

      await tx.order.update({
        where: { id: orderId },
        data: { total: newTotal },
      })

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: order.status,
          changedBy: restaurantUserId,
          note: `Partial fulfillment: removed items [${dto.unavailableItemIds.join(',')}]. Refund delta: ${refundDelta}. Reason: ${dto.reason ?? 'n/a'}`,
        },
      })
    })

    // Enqueue refund for the delta if payment was already captured
    if (refundDelta > 0 && order.payment?.status === 'completed') {
      const refundId = `partial-${orderId}-${dto.unavailableItemIds.sort().join('-')}`
      await this.refundQueue.add(
        'payment-refund.partial',
        {
          refundId,
          orderId,
          transactionRef: order.payment.transactionId,
          amount: Math.trunc(refundDelta),
          reason: dto.reason ?? 'Partial fulfillment adjustment',
          kind: 'partial',
          attemptNo: 1,
        } satisfies PaymentRefundJobData,
        { attempts: 3, backoff: { type: 'exponential', delay: 1000 }, jobId: `payment-refund-${refundId}` },
      )
    }

    return { newTotal, refundAmount: refundDelta }
  }
}

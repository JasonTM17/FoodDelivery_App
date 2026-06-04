import { Injectable } from '@nestjs/common'
import { PrismaService } from '../database/prisma.service'
import { OrderStateMachine, OrderStatus } from './order-state-machine'
import { InjectQueue } from '@nestjs/bullmq'
import { Queue } from 'bullmq'
import { PaymentMethod, PaymentStatus } from '@prisma/client'

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('dispatch') private readonly dispatchQueue: Queue,
  ) {}

  async processPayment(orderId: string, amount: number, method: PaymentMethod): Promise<void> {
    const order = await this.prisma.order.findUniqueOrThrow({ where: { id: orderId } })
    OrderStateMachine.validate(order.status as OrderStatus, 'pending_payment', 'system')

    const payment = await this.prisma.payment.create({
      data: {
        orderId,
        amount,
        method,
        status: PaymentStatus.pending,
        transactionId: `MOCK-${crypto.randomUUID()}`,
      },
    })

    await this.recordStatusChange(orderId, 'pending_payment', 'system')

    // Simulate payment processing
    await new Promise(r => setTimeout(r, 500 + Math.random() * 1000))
    const success = Math.random() > 0.05

    if (success) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'completed', paidAt: new Date() },
      })

      await this.recordStatusChange(orderId, 'paid', 'system')
      await this.recordStatusChange(orderId, 'restaurant_pending', 'system')

      await this.prisma.order.update({
        where: { id: orderId },
        data: { status: 'restaurant_pending' },
      })

      // Trigger dispatch (delayed — wait for restaurant to accept first)
      await this.dispatchQueue.add('dispatch.driver', { orderId }, { delay: 0 })
    } else {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'failed' },
      })
      await this.recordStatusChange(orderId, 'cancelled', 'system')
      await this.prisma.order.update({
        where: { id: orderId },
        data: { status: 'cancelled', cancelledReason: 'Payment failed' },
      })
    }
  }

  private async recordStatusChange(orderId: string, status: string, changedBy: string) {
    await this.prisma.orderStatusHistory.create({
      data: { orderId, status, changedBy },
    })
  }
}

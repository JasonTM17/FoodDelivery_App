import { Injectable } from '@nestjs/common'
import { PaymentStatus } from '@prisma/client'
import { PrismaService } from '../database/prisma.service'

export interface WalletPaymentOrder {
  id: string
  customerId: string
}

export interface WalletPaymentCaptureInput {
  order: WalletPaymentOrder
  paymentId: string
  amount: number
}

export type WalletPaymentCaptureResult =
  | { success: true }
  | { success: false; failureCode: 'INSUFFICIENT_WALLET_BALANCE' | 'WALLET_PAYMENT_FAILED' }

@Injectable()
export class WalletPaymentCaptureService {
  constructor(private readonly prisma: PrismaService) {}

  async capture(input: WalletPaymentCaptureInput): Promise<WalletPaymentCaptureResult> {
    const amountInVnd = Math.trunc(input.amount)

    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${input.order.customerId}))`

        const balance = await tx.walletTransaction.aggregate({
          where: { userId: input.order.customerId, status: 'CONFIRMED' },
          _sum: { amountDelta: true },
        })
        const available = balance._sum.amountDelta ?? 0
        if (available < amountInVnd) {
          throw new Error('INSUFFICIENT_WALLET_BALANCE')
        }

        await tx.walletTransaction.create({
          data: {
            userId: input.order.customerId,
            amountDelta: -amountInVnd,
            type: 'debit',
            reason: 'order_payment',
            refId: input.order.id,
            status: 'CONFIRMED',
          },
        })
        await tx.payment.update({
          where: { id: input.paymentId },
          data: { status: PaymentStatus.completed, paidAt: new Date() },
        })
        await tx.orderStatusHistory.createMany({
          data: [
            { orderId: input.order.id, status: 'paid', changedBy: 'system' },
            { orderId: input.order.id, status: 'restaurant_pending', changedBy: 'system' },
          ],
        })
        await tx.order.update({
          where: { id: input.order.id },
          data: { status: 'restaurant_pending' },
        })
      })

      return { success: true }
    } catch (error) {
      const failureCode = (error as Error).message === 'INSUFFICIENT_WALLET_BALANCE'
        ? 'INSUFFICIENT_WALLET_BALANCE'
        : 'WALLET_PAYMENT_FAILED'
      return { success: false, failureCode }
    }
  }
}

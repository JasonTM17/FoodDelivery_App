import { Injectable, Logger } from '@nestjs/common'
import { PaymentMethod, PaymentStatus } from '@prisma/client'
import { PrismaService } from '../database/prisma.service'
import { PaymentIntentResult, SepayProvider } from '../payments/providers/sepay.provider'
import { OrderStateMachine, OrderStatus } from './order-state-machine'
import { WalletPaymentCaptureService } from './wallet-payment-capture.service'
import { isWalletPaymentMethod, toPublicPaymentMethod } from './payment-methods'

interface OrderForPayment {
  id: string
  status: string
  customerId: string
}

export interface PaymentProcessingResult {
  readyForRestaurant: boolean
  paymentIntent?: PaymentIntentResult
  failureCode?: string
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly sepay: SepayProvider,
    private readonly walletCapture: WalletPaymentCaptureService,
  ) {}

  async processPayment(orderId: string, amount: number, method: PaymentMethod): Promise<PaymentProcessingResult> {
    const order = await this.prisma.order.findUniqueOrThrow({
      where: { id: orderId },
      select: { id: true, status: true, customerId: true },
    })
    OrderStateMachine.validate(order.status as OrderStatus, 'pending_payment', 'system')

    const payment = await this.prisma.payment.create({
      data: {
        orderId,
        amount,
        method,
        status: PaymentStatus.pending,
        transactionId: this.generateTransactionId(orderId, method),
      },
    })

    // Persist pending_payment so provider webhooks and state machine can advance
    await this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'pending_payment' },
    })
    await this.recordStatusChange(orderId, 'pending_payment', 'system')

    if (method === PaymentMethod.cash) {
      await this.releaseCashOnDeliveryOrder(orderId)
      return { readyForRestaurant: true }
    }

    if (isWalletPaymentMethod(method)) {
      return this.captureWalletPayment(order, payment.id, amount)
    }

    if (method === PaymentMethod.sepay) {
      return this.createSepayIntent(orderId, payment.id, amount)
    }

    return this.failPayment(orderId, payment.id, 'UNSUPPORTED_PAYMENT_METHOD')
  }

  async getPaymentByOrder(orderId: string) {
    return this.prisma.payment.findUnique({ where: { orderId } })
  }

  private async releaseCashOnDeliveryOrder(orderId: string): Promise<void> {
    await this.recordStatusChange(
      orderId,
      'restaurant_pending',
      'system',
      'Cash on delivery selected; payment will be collected after fulfillment',
    )
    await this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'restaurant_pending' },
    })
    this.logger.log(`Cash-on-delivery order ${orderId} released to restaurant`)
  }

  private async captureWalletPayment(
    order: OrderForPayment,
    paymentId: string,
    amount: number,
  ): Promise<PaymentProcessingResult> {
    const result = await this.walletCapture.capture({ order, paymentId, amount })
    if (result.success) {
      this.logger.log(`Wallet payment captured for order ${order.id}`)
      return { readyForRestaurant: true }
    }
    return this.failPayment(order.id, paymentId, result.failureCode)
  }

  private async createSepayIntent(
    orderId: string,
    paymentId: string,
    amount: number,
  ): Promise<PaymentProcessingResult> {
    try {
      const intent = await this.sepay.createPaymentIntent(orderId, amount)
      await this.prisma.$transaction([
        this.prisma.payment.update({
          where: { id: paymentId },
          data: { transactionId: intent.transaction_ref },
        }),
        this.prisma.paymentIntent.create({
          data: {
            orderId,
            provider: 'sepay',
            transactionRef: intent.transaction_ref,
            qrCodeUrl: intent.qr_code_url,
            amount: Math.trunc(amount),
            status: 'pending',
            expiresAt: intent.expires_at,
          },
        }),
      ])
      return { readyForRestaurant: false, paymentIntent: intent }
    } catch (error) {
      this.logger.warn(`SePay intent failed for order ${orderId}: ${(error as Error).message}`)
      return this.failPayment(orderId, paymentId, 'SEPAY_INTENT_UNAVAILABLE')
    }
  }

  private async failPayment(
    orderId: string,
    paymentId: string,
    errorCode: string,
  ): Promise<PaymentProcessingResult> {
    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: paymentId },
        data: { status: PaymentStatus.failed },
      })
      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: 'cancelled',
          changedBy: 'system',
          note: `Payment failed: ${errorCode}`,
        },
      })
      await tx.order.update({
        where: { id: orderId },
        data: { status: 'cancelled', cancelledReason: `Payment failed: ${errorCode}` },
      })

      // Release promo quota burned during order create (B-ORD-04 / B-PROMO-03)
      const usages = await tx.promotionUsage.findMany({ where: { orderId } })
      for (const usage of usages) {
        await tx.promotionUsage.delete({ where: { id: usage.id } })
        await tx.promotion.update({
          where: { id: usage.promotionId },
          data: {
            usageCount: { decrement: 1 },
            currentUsageCount: { decrement: 1 },
            usedBudget: { decrement: Number(usage.discountAmount) },
          },
        })
      }
    })
    this.logger.warn(`Payment failed for order ${orderId}: ${errorCode}`)
    return { readyForRestaurant: false, failureCode: errorCode }
  }

  private async recordStatusChange(
    orderId: string,
    status: string,
    changedBy: string,
    note?: string,
  ): Promise<void> {
    await this.prisma.orderStatusHistory.create({
      data: { orderId, status, changedBy, ...(note ? { note } : {}) },
    })
  }

  private generateTransactionId(orderId: string, method: PaymentMethod): string {
    const normalizedOrderId = orderId.trim().replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80)
    if (!normalizedOrderId) {
      throw new Error('PAYMENT_ORDER_ID_INVALID')
    }
    return `${toPublicPaymentMethod(method).toUpperCase()}-${normalizedOrderId}`
  }
}

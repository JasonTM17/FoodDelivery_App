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
        transactionId: this.generateTransactionId(method),
      },
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

  async refundPayment(orderId: string): Promise<void> {
    const payment = await this.prisma.payment.findUnique({ where: { orderId } })
    if (!payment) {
      throw new Error(`No payment found for order ${orderId}`)
    }
    if (payment.status !== PaymentStatus.completed) {
      throw new Error(`Cannot refund payment with status ${payment.status}`)
    }

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.refunded },
    })
    await this.recordStatusChange(orderId, 'refunded', 'system')

    this.logger.log(`Payment refunded for order ${orderId}`)
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
    await this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: PaymentStatus.failed },
    })
    await this.recordStatusChange(orderId, 'cancelled', 'system', `Payment failed: ${errorCode}`)
    await this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'cancelled', cancelledReason: `Payment failed: ${errorCode}` },
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

  private generateTransactionId(method: PaymentMethod): string {
    return `${toPublicPaymentMethod(method).toUpperCase()}-${crypto.randomUUID()}`
  }
}

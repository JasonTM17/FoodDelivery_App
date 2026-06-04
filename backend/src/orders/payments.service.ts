import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../database/prisma.service'
import { OrderStateMachine, OrderStatus } from './order-state-machine'
import { InjectQueue } from '@nestjs/bullmq'
import { Queue } from 'bullmq'
import { PaymentMethod, PaymentStatus } from '@prisma/client'

interface PaymentResult {
  success: boolean
  transactionId: string
  errorCode?: string
}

/**
 * Mock payment processor that simulates a payment gateway.
 *
 * Designed to be swapped out for a real payment gateway (Stripe, VNPay, etc.)
 * by implementing the same `processPayment` interface.
 *
 * Deterministic behavior controlled via environment variables:
 * - PAYMENT_MOCK_MODE=true        Enable mock mode (default: true in dev)
 * - PAYMENT_MOCK_SUCCESS_RATE=0.95  Probability of success (0-1)
 * - PAYMENT_MOCK_MIN_DELAY_MS=200   Minimum processing time in ms
 * - PAYMENT_MOCK_MAX_DELAY_MS=800   Maximum processing time in ms
 * - PAYMENT_MOCK_FAILURE_CODE=INSUFFICIENT_FUNDS  Error code returned on failure
 *
 * In production (PAYMENT_MOCK_MODE=false), this service should be replaced
 * with a real payment gateway adapter implementing the same interface.
 */
@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name)
  private readonly mockMode: boolean
  private readonly successRate: number
  private readonly minDelayMs: number
  private readonly maxDelayMs: number
  private readonly failureCode: string

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    @InjectQueue('dispatch') private readonly dispatchQueue: Queue,
  ) {
    this.mockMode = configService.get<string>('PAYMENT_MOCK_MODE', 'true') === 'true'
    this.successRate = parseFloat(configService.get<string>('PAYMENT_MOCK_SUCCESS_RATE', '0.95'))
    this.minDelayMs = parseInt(configService.get<string>('PAYMENT_MOCK_MIN_DELAY_MS', '200'), 10)
    this.maxDelayMs = parseInt(configService.get<string>('PAYMENT_MOCK_MAX_DELAY_MS', '800'), 10)
    this.failureCode = configService.get<string>('PAYMENT_MOCK_FAILURE_CODE', 'INSUFFICIENT_FUNDS')

    if (this.mockMode) {
      this.logger.warn(
        `Payments running in MOCK mode (successRate=${this.successRate}, delay=${this.minDelayMs}-${this.maxDelayMs}ms). ` +
        'Set PAYMENT_MOCK_MODE=false to use a real payment gateway.',
      )
    }
  }

  /**
   * Process a payment for an order.
   *
   * In mock mode: simulates a payment gateway with configurable success rate and delay.
   * In production: would delegate to a real payment gateway adapter.
   *
   * Always stores the payment record in the database for auditability.
   */
  async processPayment(orderId: string, amount: number, method: PaymentMethod): Promise<void> {
    const order = await this.prisma.order.findUniqueOrThrow({ where: { id: orderId } })
    OrderStateMachine.validate(order.status as OrderStatus, 'pending_payment', 'system')

    // Create a pending payment record — always stored in DB for audit trail
    const transactionId = this.generateTransactionId()
    const payment = await this.prisma.payment.create({
      data: {
        orderId,
        amount,
        method,
        status: PaymentStatus.pending,
        transactionId,
      },
    })

    await this.recordStatusChange(orderId, 'pending_payment', 'system')

    // Execute the payment (mock or real gateway)
    const result = await this.executePayment(orderId, amount, method, transactionId)

    if (result.success) {
      await this.handlePaymentSuccess(orderId, payment.id)
    } else {
      await this.handlePaymentFailure(orderId, payment.id, result.errorCode ?? 'UNKNOWN_ERROR')
    }
  }

  // ─── Private helpers ───

  /**
   * Execute payment via mock simulation or real gateway.
   * Override this method to integrate with a real payment provider.
   */
  private async executePayment(
    _orderId: string,
    _amount: number,
    _method: PaymentMethod,
    transactionId: string,
  ): Promise<PaymentResult> {
    if (!this.mockMode) {
      // In production, delegate to real payment gateway here.
      // e.g. stripe.paymentIntents.create({ amount, currency, ... })
      throw new Error('Real payment gateway not configured. Set PAYMENT_MOCK_MODE=true for development.')
    }

    return this.simulateMockPayment(transactionId)
  }

  /**
   * Simulates payment gateway processing with configurable behavior.
   *
   * Uses a deterministic seed derived from the transaction ID to ensure
   * reproducible results for testing while still appearing varied.
   */
  private async simulateMockPayment(transactionId: string): Promise<PaymentResult> {
    // Deterministic seed from transaction ID — makes results reproducible
    // for a given transaction while distributing across different transactions.
    const seed = this.hashToNumber(transactionId)

    // Deterministic delay within configured range
    const range = this.maxDelayMs - this.minDelayMs
    const delay = range > 0 ? this.minDelayMs + (seed % range) : this.minDelayMs
    await new Promise<void>(resolve => setTimeout(resolve, delay))

    // Deterministic success/failure based on the same seed
    const roll = (seed % 10000) / 10000
    const success = roll < this.successRate

    if (success) {
      return { success: true, transactionId }
    }

    return {
      success: false,
      transactionId,
      errorCode: this.failureCode,
    }
  }

  private async handlePaymentSuccess(orderId: string, paymentId: string): Promise<void> {
    await this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: PaymentStatus.completed, paidAt: new Date() },
    })

    await this.recordStatusChange(orderId, 'paid', 'system')
    await this.recordStatusChange(orderId, 'restaurant_pending', 'system')

    await this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'restaurant_pending' },
    })

    // Trigger dispatch assignment
    await this.dispatchQueue.add('dispatch.driver', { orderId }, { delay: 0 })

    this.logger.log(`Payment completed for order ${orderId}`)
  }

  private async handlePaymentFailure(orderId: string, paymentId: string, errorCode: string): Promise<void> {
    await this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: PaymentStatus.failed },
    })

    await this.recordStatusChange(orderId, 'cancelled', 'system')

    await this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'cancelled', cancelledReason: `Payment failed: ${errorCode}` },
    })

    this.logger.warn(`Payment failed for order ${orderId}: ${errorCode}`)
  }

  private async recordStatusChange(orderId: string, status: string, changedBy: string): Promise<void> {
    await this.prisma.orderStatusHistory.create({
      data: { orderId, status, changedBy },
    })
  }

  private generateTransactionId(): string {
    return `TXN-${crypto.randomUUID()}`
  }

  /**
   * Simple number hash from a UUID string for deterministic seeding.
   * Not cryptographically secure — only used for mock simulation determinism.
   */
  private hashToNumber(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }

  // ─── Public query helpers ───

  /**
   * Look up a payment by order ID for status checks.
   */
  async getPaymentByOrder(orderId: string) {
    return this.prisma.payment.findUnique({ where: { orderId } })
  }

  /**
   * Process a refund for a completed payment.
   */
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
}

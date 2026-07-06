import { Injectable, Logger, NotImplementedException, ServiceUnavailableException } from '@nestjs/common'
import { createHmac, timingSafeEqual } from 'crypto'

export interface PaymentIntentResult {
  qr_code_url: string
  transaction_ref: string
  expires_at: Date
}

@Injectable()
export class SepayProvider {
  private readonly logger = new Logger(SepayProvider.name)
  private readonly apiKey: string | undefined
  private readonly baseUrl: string
  private readonly accountNumber: string | undefined

  constructor() {
    this.apiKey = process.env.SEPAY_API_KEY
    this.accountNumber = process.env.SEPAY_ACCOUNT_NUMBER
    this.baseUrl = process.env.SEPAY_BASE_URL ?? 'https://my.sepay.vn/userapi'
    if (!this.apiKey || !this.accountNumber) {
      this.logger.warn('SEPAY_API_KEY or SEPAY_ACCOUNT_NUMBER not set -- SePay payment intents are unavailable')
    }
  }

  async createPaymentIntent(orderId: string, amount: number): Promise<PaymentIntentResult> {
    if (!this.apiKey || !this.accountNumber) {
      throw new ServiceUnavailableException('SEPAY_PROVIDER_NOT_CONFIGURED')
    }

    const transactionRef = this.buildTransactionRef(orderId)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

    try {
      const res = await fetch(`${this.baseUrl}/transactions/create`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          account_number: this.accountNumber,
          transaction_ref: transactionRef,
          amount_in: amount,
          description: `FoodFlow order ${orderId}`,
        }),
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(`SePay API ${res.status}: ${text}`)
      }

      const data = (await res.json()) as { qr_code_url?: string; transaction_ref?: string }
      if (!data.qr_code_url?.trim() || !data.transaction_ref?.trim()) {
        throw new Error('SEPAY_INVALID_INTENT_RESPONSE')
      }

      return {
        qr_code_url: data.qr_code_url,
        transaction_ref: data.transaction_ref,
        expires_at: expiresAt,
      }
    } catch (err) {
      this.logger.error(`createPaymentIntent failed: ${(err as Error).message}`)
      throw err
    }
  }

  verifyWebhookSignature(rawBody: string, signatureHeader: string): boolean {
    const secret = process.env.SEPAY_WEBHOOK_SECRET
    if (!secret) {
      this.logger.error('SEPAY_WEBHOOK_SECRET not set -- rejecting webhook')
      return false
    }
    const expected = createHmac('sha256', secret).update(rawBody).digest('hex')
    try {
      return timingSafeEqual(Buffer.from(signatureHeader), Buffer.from(expected))
    } catch {
      return false
    }
  }

  async refund(transactionRef: string, amount: number, _reason: string): Promise<void> {
    if (!this.apiKey) {
      throw new ServiceUnavailableException('SEPAY_PROVIDER_NOT_CONFIGURED')
    }

    this.logger.warn(
      `SePay refund requested for ${transactionRef} (${amount} VND) but bank-transfer refund confirmation is not modelled`,
    )
    throw new NotImplementedException('SEPAY_REFUND_NOT_MODELLED')
  }

  private buildTransactionRef(orderId: string): string {
    const normalizedOrderId = orderId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
    if (!normalizedOrderId) {
      throw new Error('SEPAY_ORDER_ID_INVALID')
    }
    return `FF-${normalizedOrderId.slice(0, 48)}`
  }
}

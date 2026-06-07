import { Injectable, Logger } from '@nestjs/common'
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

  constructor() {
    this.apiKey = process.env.SEPAY_API_KEY
    this.baseUrl = process.env.SEPAY_BASE_URL ?? 'https://my.sepay.vn/userapi'
    if (!this.apiKey) {
      this.logger.warn('SEPAY_API_KEY not set — provider running in mock mode')
    }
  }

  async createPaymentIntent(orderId: string, amount: number): Promise<PaymentIntentResult> {
    if (!this.apiKey) {
      return this.buildMockIntent(orderId)
    }

    const transactionRef = `FF-${orderId.slice(0, 8).toUpperCase()}-${Date.now()}`
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

    try {
      const res = await fetch(`${this.baseUrl}/transactions/create`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          account_number: process.env.SEPAY_ACCOUNT_NUMBER,
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
      return {
        qr_code_url: data.qr_code_url ?? `https://qr.sepay.vn/${transactionRef}`,
        transaction_ref: data.transaction_ref ?? transactionRef,
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
      this.logger.warn('SEPAY_WEBHOOK_SECRET not set — skipping signature verification')
      return true
    }
    const expected = createHmac('sha256', secret).update(rawBody).digest('hex')
    try {
      return timingSafeEqual(Buffer.from(signatureHeader), Buffer.from(expected))
    } catch {
      return false
    }
  }

  async refund(transactionRef: string, amount: number, reason: string): Promise<void> {
    if (!this.apiKey) {
      this.logger.log(`[MOCK] refund transactionRef=${transactionRef} amount=${amount} reason=${reason}`)
      return
    }

    const res = await fetch(`${this.baseUrl}/transactions/refund`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ transaction_ref: transactionRef, amount, reason }),
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`SePay refund ${res.status}: ${text}`)
    }
  }

  private buildMockIntent(_orderId: string): PaymentIntentResult {
    const ref = `MOCK-${crypto.randomUUID().slice(0, 12).toUpperCase()}`
    return {
      qr_code_url: `https://qr.sepay.vn/mock/${ref}`,
      transaction_ref: ref,
      expires_at: new Date(Date.now() + 15 * 60 * 1000),
    }
  }
}

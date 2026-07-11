import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common'
import { createHmac, timingSafeEqual } from 'crypto'

const VIET_QR_URL = 'https://vietqr.app/img'
const WEBHOOK_MAX_CLOCK_SKEW_SECONDS = 5 * 60

export interface PaymentIntentResult {
  qr_code_url: string
  transaction_ref: string
  expires_at: Date
}

@Injectable()
export class SepayProvider {
  private readonly logger = new Logger(SepayProvider.name)
  private readonly accountNumber: string | undefined
  private readonly bankName: string | undefined

  constructor() {
    this.accountNumber = process.env.SEPAY_ACCOUNT_NUMBER?.trim()
    this.bankName = process.env.SEPAY_BANK_NAME?.trim()
    if (!this.accountNumber || !this.bankName) {
      this.logger.warn('SEPAY_ACCOUNT_NUMBER or SEPAY_BANK_NAME not set -- SePay VietQR intents are unavailable')
    }
  }

  async createPaymentIntent(orderId: string, amount: number): Promise<PaymentIntentResult> {
    if (!this.accountNumber || !this.bankName) {
      throw new ServiceUnavailableException('SEPAY_PROVIDER_NOT_CONFIGURED')
    }
    if (!Number.isSafeInteger(amount) || amount <= 0 || amount > 9_999_999_999) {
      throw new Error('SEPAY_AMOUNT_INVALID')
    }
    const normalizedAmount = amount
    if (!/^[A-Za-z0-9]{4,34}$/.test(this.accountNumber)) {
      throw new Error('SEPAY_ACCOUNT_NUMBER_INVALID')
    }
    if (!/^[A-Za-z0-9_-]{2,32}$/.test(this.bankName)) {
      throw new Error('SEPAY_BANK_NAME_INVALID')
    }

    const transactionRef = this.buildTransactionRef(orderId)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)
    const qrUrl = new URL(VIET_QR_URL)
    qrUrl.searchParams.set('acc', this.accountNumber)
    qrUrl.searchParams.set('bank', this.bankName)
    qrUrl.searchParams.set('amount', String(normalizedAmount))
    qrUrl.searchParams.set('des', transactionRef)
    qrUrl.searchParams.set('template', 'compact')

    return {
      qr_code_url: qrUrl.toString(),
      transaction_ref: transactionRef,
      expires_at: expiresAt,
    }
  }

  verifyWebhookSignature(
    rawBody: string | Buffer,
    signatureHeader: string,
    timestampHeader: string,
    nowSeconds = Math.floor(Date.now() / 1000),
  ): boolean {
    const secret = process.env.SEPAY_WEBHOOK_SECRET
    if (!secret) {
      this.logger.error('SEPAY_WEBHOOK_SECRET not set -- rejecting webhook')
      return false
    }
    if (!/^\d{10}$/.test(timestampHeader)) return false
    const timestamp = Number(timestampHeader)
    if (!Number.isSafeInteger(timestamp) || Math.abs(nowSeconds - timestamp) > WEBHOOK_MAX_CLOCK_SKEW_SECONDS) {
      return false
    }
    if (!/^sha256=[a-f0-9]{64}$/i.test(signatureHeader)) return false

    const body = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody)
    const expected = `sha256=${createHmac('sha256', secret)
      .update(Buffer.concat([Buffer.from(`${timestamp}.`), body]))
      .digest('hex')}`
    try {
      return timingSafeEqual(Buffer.from(signatureHeader), Buffer.from(expected))
    } catch {
      return false
    }
  }

  matchesPaymentAccount(accountNumber: string, subAccount?: string): boolean {
    if (!this.accountNumber) return false
    return [accountNumber, subAccount]
      .filter((value): value is string => typeof value === 'string')
      .some(value => value.trim() === this.accountNumber)
  }

  async refund(transactionRef: string, amount: number, _reason: string): Promise<void> {
    this.logger.warn(
      `SePay bank-transfer refund for ${transactionRef} (${amount} VND) requires audited manual review`,
    )
    throw new ServiceUnavailableException('SEPAY_BANK_TRANSFER_REFUND_REQUIRES_MANUAL_REVIEW')
  }

  private buildTransactionRef(orderId: string): string {
    const normalizedOrderId = orderId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
    if (!normalizedOrderId) {
      throw new Error('SEPAY_ORDER_ID_INVALID')
    }
    return `FF-${normalizedOrderId.slice(0, 48)}`
  }
}

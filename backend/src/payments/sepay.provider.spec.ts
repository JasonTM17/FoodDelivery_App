import { ServiceUnavailableException } from '@nestjs/common'
import { createHmac } from 'crypto'
import { SepayProvider } from './providers/sepay.provider'

describe('SepayProvider', () => {
  let provider: SepayProvider

  beforeEach(() => {
    delete process.env.SEPAY_API_KEY
    delete process.env.SEPAY_WEBHOOK_SECRET
    delete process.env.SEPAY_ACCOUNT_NUMBER
    delete process.env.SEPAY_BANK_NAME
    jest.restoreAllMocks()
    provider = new SepayProvider()
  })

  describe('createPaymentIntent', () => {
    it('fails closed when the beneficiary account is missing', async () => {
      process.env.SEPAY_BANK_NAME = 'Vietcombank'
      provider = new SepayProvider()

      await expect(provider.createPaymentIntent('order-abc-123', 100_000))
        .rejects.toThrow(ServiceUnavailableException)
    })

    it('fails closed when the beneficiary bank name is missing', async () => {
      process.env.SEPAY_ACCOUNT_NUMBER = '123456789'
      provider = new SepayProvider()

      await expect(provider.createPaymentIntent('order-abc-123', 100_000))
        .rejects.toThrow(ServiceUnavailableException)
    })

    it('builds the documented VietQR URL without calling an invented intent API', async () => {
      process.env.SEPAY_ACCOUNT_NUMBER = '123456789'
      process.env.SEPAY_BANK_NAME = 'Vietcombank'
      provider = new SepayProvider()
      global.fetch = jest.fn() as typeof fetch

      const result = await provider.createPaymentIntent('order-xyz', 80_000)

      const qrUrl = new URL(result.qr_code_url)
      expect(`${qrUrl.origin}${qrUrl.pathname}`).toBe('https://vietqr.app/img')
      expect(qrUrl.searchParams.get('acc')).toBe('123456789')
      expect(qrUrl.searchParams.get('bank')).toBe('Vietcombank')
      expect(qrUrl.searchParams.get('amount')).toBe('80000')
      expect(qrUrl.searchParams.get('des')).toBe('FF-ORDERXYZ')
      expect(qrUrl.searchParams.get('template')).toBe('compact')
      expect(result.transaction_ref).toBe('FF-ORDERXYZ')
      expect(result.expires_at.getTime()).toBeGreaterThan(Date.now())
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it.each([0, -1, 1.5, 10_000_000_000, Number.NaN, Number.POSITIVE_INFINITY])(
      'rejects invalid amount %s',
      async amount => {
        process.env.SEPAY_ACCOUNT_NUMBER = '123456789'
        process.env.SEPAY_BANK_NAME = 'Vietcombank'
        provider = new SepayProvider()

        await expect(provider.createPaymentIntent('order-1', amount))
          .rejects.toThrow('SEPAY_AMOUNT_INVALID')
      },
    )

    it('rejects invalid beneficiary configuration instead of emitting a malformed QR', async () => {
      process.env.SEPAY_ACCOUNT_NUMBER = '123 456'
      process.env.SEPAY_BANK_NAME = 'Vietcombank<script>'
      provider = new SepayProvider()

      await expect(provider.createPaymentIntent('order-1', 50_000))
        .rejects.toThrow('SEPAY_ACCOUNT_NUMBER_INVALID')
    })

    it('rejects an order id that cannot produce a payment code', async () => {
      process.env.SEPAY_ACCOUNT_NUMBER = '123456789'
      process.env.SEPAY_BANK_NAME = 'Vietcombank'
      provider = new SepayProvider()

      await expect(provider.createPaymentIntent('---', 50_000))
        .rejects.toThrow('SEPAY_ORDER_ID_INVALID')
    })
  })

  describe('verifyWebhookSignature', () => {
    const timestamp = '1750000000'
    const body = '{"id":92704,"code":"FF-ORDER1"}'

    it('returns false when SEPAY_WEBHOOK_SECRET is not set', () => {
      expect(provider.verifyWebhookSignature(body, `sha256=${'a'.repeat(64)}`, timestamp, 1_750_000_000))
        .toBe(false)
    })

    it('verifies the documented timestamp.raw-body HMAC contract', () => {
      process.env.SEPAY_WEBHOOK_SECRET = 'test-secret-123'
      provider = new SepayProvider()
      const signature = `sha256=${createHmac('sha256', 'test-secret-123')
        .update(`${timestamp}.${body}`)
        .digest('hex')}`

      expect(provider.verifyWebhookSignature(Buffer.from(body), signature, timestamp, 1_750_000_000))
        .toBe(true)
      expect(provider.verifyWebhookSignature(`${body} `, signature, timestamp, 1_750_000_000))
        .toBe(false)
    })

    it('rejects stale timestamps to prevent webhook replay', () => {
      process.env.SEPAY_WEBHOOK_SECRET = 'test-secret-123'
      provider = new SepayProvider()
      const signature = `sha256=${createHmac('sha256', 'test-secret-123')
        .update(`${timestamp}.${body}`)
        .digest('hex')}`

      expect(provider.verifyWebhookSignature(body, signature, timestamp, 1_750_000_301))
        .toBe(false)
    })

    it.each(['deadbeef', `sha256=${'z'.repeat(64)}`, ''])('rejects malformed signature %s', signature => {
      process.env.SEPAY_WEBHOOK_SECRET = 'test-secret-123'
      provider = new SepayProvider()

      expect(provider.verifyWebhookSignature(body, signature, timestamp, 1_750_000_000))
        .toBe(false)
    })
  })

  describe('matchesPaymentAccount', () => {
    it('accepts the configured account as either accountNumber or matched VA', () => {
      process.env.SEPAY_ACCOUNT_NUMBER = '123456789'
      process.env.SEPAY_BANK_NAME = 'Vietcombank'
      provider = new SepayProvider()

      expect(provider.matchesPaymentAccount('123456789')).toBe(true)
      expect(provider.matchesPaymentAccount('source-account', '123456789')).toBe(true)
      expect(provider.matchesPaymentAccount('attacker-account', 'other-va')).toBe(false)
    })
  })

  describe('refund', () => {
    it('routes bank-transfer refunds to audited manual review instead of a fake provider API', async () => {
      global.fetch = jest.fn() as typeof fetch

      await expect(provider.refund('TXN-001', 50_000, 'test reason'))
        .rejects.toThrow('SEPAY_BANK_TRANSFER_REFUND_REQUIRES_MANUAL_REVIEW')
      expect(global.fetch).not.toHaveBeenCalled()
    })
  })
})

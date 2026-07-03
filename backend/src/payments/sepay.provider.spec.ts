import { ServiceUnavailableException } from '@nestjs/common'
import { createHmac } from 'crypto'
import { SepayProvider } from './providers/sepay.provider'

describe('SepayProvider', () => {
  let provider: SepayProvider

  beforeEach(() => {
    delete process.env.SEPAY_API_KEY
    delete process.env.SEPAY_WEBHOOK_SECRET
    delete process.env.SEPAY_BASE_URL
    delete process.env.SEPAY_ACCOUNT_NUMBER
    jest.restoreAllMocks()
    provider = new SepayProvider()
  })

  describe('createPaymentIntent', () => {
    it('throws explicit unavailable error when SEPAY_API_KEY is not set', async () => {
      await expect(provider.createPaymentIntent('order-abc-123', 100_000))
        .rejects.toThrow(ServiceUnavailableException)
    })

    it('throws explicit unavailable error when SEPAY_ACCOUNT_NUMBER is not set', async () => {
      process.env.SEPAY_API_KEY = 'test-key-123'
      provider = new SepayProvider()

      await expect(provider.createPaymentIntent('order-abc-123', 100_000))
        .rejects.toThrow(ServiceUnavailableException)
    })

    it('calls SePay API and returns parsed response', async () => {
      process.env.SEPAY_API_KEY = 'test-key-123'
      process.env.SEPAY_ACCOUNT_NUMBER = '123456789'
      provider = new SepayProvider()

      const mockFetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          qr_code_url: 'https://qr.sepay.vn/real-ref',
          transaction_ref: 'REAL-REF-001',
        }),
      })
      global.fetch = mockFetch as typeof fetch

      const result = await provider.createPaymentIntent('order-xyz', 80_000)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/transactions/create'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ Authorization: 'Bearer test-key-123' }),
        }),
      )
      expect(result.transaction_ref).toBe('REAL-REF-001')
      expect(result.qr_code_url).toBe('https://qr.sepay.vn/real-ref')
      expect(result.expires_at.getTime()).toBeGreaterThan(Date.now())
    })

    it('throws instead of creating a fallback intent when API omits QR fields', async () => {
      process.env.SEPAY_API_KEY = 'test-key'
      process.env.SEPAY_ACCOUNT_NUMBER = '123456789'
      provider = new SepayProvider()

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      }) as typeof fetch

      await expect(provider.createPaymentIntent('order-1', 50_000))
        .rejects.toThrow('SEPAY_INVALID_INTENT_RESPONSE')
    })

    it('throws when API returns non-ok status', async () => {
      process.env.SEPAY_API_KEY = 'test-key'
      process.env.SEPAY_ACCOUNT_NUMBER = '123456789'
      provider = new SepayProvider()

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 422,
        text: async () => 'Unprocessable Entity',
      }) as typeof fetch

      await expect(provider.createPaymentIntent('order-1', 50_000)).rejects.toThrow('422')
    })
  })

  describe('verifyWebhookSignature', () => {
    it('returns false when SEPAY_WEBHOOK_SECRET is not set', () => {
      expect(provider.verifyWebhookSignature('{"foo":"bar"}', 'any-sig')).toBe(false)
    })

    it('returns true for correct HMAC signature', () => {
      process.env.SEPAY_WEBHOOK_SECRET = 'test-secret-123'
      provider = new SepayProvider()

      const body = '{"transaction_ref":"TXN-001","amount":100000}'
      const sig = createHmac('sha256', 'test-secret-123').update(body).digest('hex')

      expect(provider.verifyWebhookSignature(body, sig)).toBe(true)
    })

    it('returns false for wrong signature', () => {
      process.env.SEPAY_WEBHOOK_SECRET = 'test-secret-123'
      provider = new SepayProvider()

      expect(provider.verifyWebhookSignature('{"foo":"bar"}', 'deadbeef')).toBe(false)
    })

    it('returns false when signature length differs', () => {
      process.env.SEPAY_WEBHOOK_SECRET = 'test-secret-123'
      provider = new SepayProvider()

      expect(provider.verifyWebhookSignature('body', 'short')).toBe(false)
    })
  })

  describe('refund', () => {
    it('throws explicit unavailable error when SEPAY_API_KEY is not set', async () => {
      await expect(provider.refund('TXN-MISSING-CONFIG', 50_000, 'customer request'))
        .rejects.toThrow(ServiceUnavailableException)
    })

    it('calls SePay refund endpoint successfully', async () => {
      process.env.SEPAY_API_KEY = 'test-key'
      provider = new SepayProvider()

      global.fetch = jest.fn().mockResolvedValueOnce({ ok: true }) as typeof fetch

      await expect(provider.refund('TXN-001', 50_000, 'test reason')).resolves.toBeUndefined()
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/transactions/refund'),
        expect.objectContaining({ method: 'POST' }),
      )
    })

    it('throws when refund API returns error', async () => {
      process.env.SEPAY_API_KEY = 'test-key'
      provider = new SepayProvider()

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      }) as typeof fetch

      await expect(provider.refund('TXN-001', 50_000, 'reason')).rejects.toThrow('500')
    })
  })
})

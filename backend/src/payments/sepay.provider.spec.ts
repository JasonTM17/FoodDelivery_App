import { SepayProvider } from './providers/sepay.provider'
import { createHmac } from 'crypto'

describe('SepayProvider', () => {
  let provider: SepayProvider

  beforeEach(() => {
    delete process.env.SEPAY_API_KEY
    delete process.env.SEPAY_WEBHOOK_SECRET
    delete process.env.SEPAY_BASE_URL
    delete process.env.SEPAY_ACCOUNT_NUMBER
    provider = new SepayProvider()
    jest.restoreAllMocks()
  })

  describe('createPaymentIntent — mock mode (no API key)', () => {
    it('returns mock intent with MOCK- prefix when SEPAY_API_KEY not set', async () => {
      const result = await provider.createPaymentIntent('order-abc-123', 100_000)

      expect(result.transaction_ref).toMatch(/^MOCK-/)
      expect(result.qr_code_url).toContain('mock')
      expect(result.expires_at).toBeInstanceOf(Date)
      expect(result.expires_at.getTime()).toBeGreaterThan(Date.now())
    })

    it('expires_at is ~15 minutes from now', async () => {
      const before = Date.now()
      const result = await provider.createPaymentIntent('order-1', 50_000)
      const expectedMs = 15 * 60 * 1000

      expect(result.expires_at.getTime() - before).toBeGreaterThan(expectedMs - 2000)
      expect(result.expires_at.getTime() - before).toBeLessThan(expectedMs + 2000)
    })
  })

  describe('createPaymentIntent — real API (with API key)', () => {
    it('calls SePay API and returns parsed response', async () => {
      process.env.SEPAY_API_KEY = 'test-key-123'
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
    })

    it('falls back to generated ref when API omits transaction_ref', async () => {
      process.env.SEPAY_API_KEY = 'test-key'
      provider = new SepayProvider()

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      }) as typeof fetch

      const result = await provider.createPaymentIntent('order-1', 50_000)
      expect(result.transaction_ref).toMatch(/^FF-/)
    })

    it('throws when API returns non-ok status', async () => {
      process.env.SEPAY_API_KEY = 'test-key'
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
    it('returns true when SEPAY_WEBHOOK_SECRET is not set', () => {
      expect(provider.verifyWebhookSignature('{"foo":"bar"}', 'any-sig')).toBe(true)
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

  describe('refund — mock mode', () => {
    it('resolves immediately without hitting network when no API key', async () => {
      await expect(provider.refund('TXN-MOCK-001', 50_000, 'customer request')).resolves.toBeUndefined()
    })
  })

  describe('refund — real API', () => {
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

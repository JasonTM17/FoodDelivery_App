import { WebhooksService } from './webhooks.service'

describe('WebhooksService', () => {
  let service: WebhooksService
  const originalSecret = process.env.WEBHOOK_SECRET

  beforeEach(() => {
    service = new WebhooksService()
  })

  afterEach(() => {
    if (originalSecret === undefined) {
      delete process.env.WEBHOOK_SECRET
    } else {
      process.env.WEBHOOK_SECRET = originalSecret
    }
    jest.restoreAllMocks()
  })

  describe('signPayload', () => {
    it('returns empty string when WEBHOOK_SECRET is not set', () => {
      delete process.env.WEBHOOK_SECRET
      expect(service.signPayload('any-payload')).toBe('')
    })

    it('returns a 64-char hex HMAC-SHA256 when secret is set', () => {
      process.env.WEBHOOK_SECRET = 'test-secret'
      const sig = service.signPayload('{"event":"test"}')
      expect(sig).toMatch(/^[0-9a-f]{64}$/)
    })

    it('produces a deterministic signature for the same payload', () => {
      process.env.WEBHOOK_SECRET = 'test-secret'
      expect(service.signPayload('data')).toBe(service.signPayload('data'))
    })

    it('produces different signatures for different payloads', () => {
      process.env.WEBHOOK_SECRET = 'test-secret'
      expect(service.signPayload('payload-a')).not.toBe(service.signPayload('payload-b'))
    })

    it('produces different signatures for different secrets', () => {
      process.env.WEBHOOK_SECRET = 'secret-1'
      const sig1 = service.signPayload('data')
      process.env.WEBHOOK_SECRET = 'secret-2'
      const sig2 = service.signPayload('data')
      expect(sig1).not.toBe(sig2)
    })
  })

  describe('verifySignature', () => {
    it('returns true (passthrough) when WEBHOOK_SECRET is not configured', () => {
      delete process.env.WEBHOOK_SECRET
      expect(service.verifySignature('payload', 'any-signature')).toBe(true)
    })

    it('returns true for a valid matching signature', () => {
      process.env.WEBHOOK_SECRET = 'my-secret'
      const payload = '{"order":"123"}'
      const sig = service.signPayload(payload)
      expect(service.verifySignature(payload, sig)).toBe(true)
    })

    it('returns false when payload is tampered after signing', () => {
      process.env.WEBHOOK_SECRET = 'my-secret'
      const sig = service.signPayload('{"order":"123"}')
      expect(service.verifySignature('{"order":"999"}', sig)).toBe(false)
    })

    it('returns false for a completely wrong signature', () => {
      process.env.WEBHOOK_SECRET = 'my-secret'
      expect(service.verifySignature('payload', 'a'.repeat(64))).toBe(false)
    })

    it('returns false for a signature of wrong length (timingSafeEqual throws)', () => {
      process.env.WEBHOOK_SECRET = 'my-secret'
      expect(service.verifySignature('payload', 'short-sig')).toBe(false)
    })

    it('returns false for empty signature string', () => {
      process.env.WEBHOOK_SECRET = 'my-secret'
      expect(service.verifySignature('payload', '')).toBe(false)
    })
  })

  describe('post', () => {
    beforeEach(() => {
      process.env.WEBHOOK_SECRET = 'test-secret'
      global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200 }) as jest.Mock
    })

    it('sends a POST request to the given URL', async () => {
      await service.post('http://example.com/hook', { event: 'order.placed' })
      expect(global.fetch).toHaveBeenCalledWith(
        'http://example.com/hook',
        expect.objectContaining({ method: 'POST' }),
      )
    })

    it('sets Content-Type: application/json header', async () => {
      await service.post('http://example.com/hook', { x: 1 })
      const opts = (global.fetch as jest.Mock).mock.calls[0][1]
      expect(opts.headers['Content-Type']).toBe('application/json')
    })

    it('includes X-Signature-SHA256 header when secret is set', async () => {
      await service.post('http://example.com/hook', { event: 'test' })
      const opts = (global.fetch as jest.Mock).mock.calls[0][1]
      expect(opts.headers['X-Signature-SHA256']).toMatch(/^[0-9a-f]{64}$/)
    })

    it('does not include X-Signature-SHA256 when no secret configured', async () => {
      delete process.env.WEBHOOK_SECRET
      await service.post('http://example.com/hook', { event: 'test' })
      const opts = (global.fetch as jest.Mock).mock.calls[0][1]
      expect(opts.headers['X-Signature-SHA256']).toBeUndefined()
    })

    it('resolves without throwing when fetch rejects (network error)', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error')) as jest.Mock
      await expect(service.post('http://fail.com', {})).resolves.toBeUndefined()
    })

    it('resolves without throwing on non-2xx HTTP response', async () => {
      global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 }) as jest.Mock
      await expect(service.post('http://example.com', {})).resolves.toBeUndefined()
    })

    it('serialises the body as JSON in the request', async () => {
      const body = { orderId: 'abc-123', event: 'created' }
      await service.post('http://example.com/hook', body)
      const opts = (global.fetch as jest.Mock).mock.calls[0][1]
      expect(JSON.parse(opts.body as string)).toEqual(body)
    })
  })
})

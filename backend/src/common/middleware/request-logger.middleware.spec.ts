import { redactSensitiveRequestPath } from './request-logger.middleware'

describe('redactSensitiveRequestPath', () => {
  it('redacts a legacy FCM token path segment and removes the query', () => {
    const token = 'sensitive-fcm-token-with-at-least-twenty-characters'

    const redacted = redactSensitiveRequestPath(
      `/api/notifications/fcm-token/${token}?source=legacy`,
    )

    expect(redacted).toBe('/api/notifications/fcm-token/[REDACTED]')
    expect(redacted).not.toContain(token)
  })

  it('removes query data from every logged request path', () => {
    expect(
      redactSensitiveRequestPath(
        '/api/tracking/location?latitude=10.762622&longitude=106.660172&token=secret',
      ),
    ).toBe('/api/tracking/location')
  })

  it('leaves non-sensitive request paths unchanged', () => {
    expect(redactSensitiveRequestPath('/api/notifications/fcm-token')).toBe(
      '/api/notifications/fcm-token',
    )
    expect(redactSensitiveRequestPath('/api/orders/order-1')).toBe(
      '/api/orders/order-1',
    )
  })
})

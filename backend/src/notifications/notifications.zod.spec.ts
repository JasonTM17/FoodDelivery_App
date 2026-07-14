import {
  compatibleRegisterFcmTokenSchema,
  registerFcmTokenSchema,
  unregisterFcmTokenSchema,
} from './notifications.zod'

describe('registerFcmTokenSchema', () => {
  const token = 'fcm-token-with-at-least-twenty-characters'
  const registrationId = '9165a90e-1e23-4f7a-8df6-5c7b1a5c4f10'

  it('accepts and normalizes a supported device registration', () => {
    expect(registerFcmTokenSchema.parse({
      token: ` ${token} `,
      platform: 'android',
      deviceId: ' customer-device ',
      registrationId,
    })).toEqual({
      token,
      platform: 'android',
      deviceId: 'customer-device',
      registrationId,
    })
  })

  it.each([
    [{ token: 'too-short', platform: 'android', registrationId }],
    [{ token: 'x'.repeat(501), platform: 'android', registrationId }],
    [{ token, platform: 'windows-phone', registrationId }],
    [{ token, platform: 'ios', deviceId: ' ', registrationId }],
    [{ token, platform: 'web', deviceId: 'x'.repeat(201), registrationId }],
    [{ token, platform: 'android', registrationId: 'invalid' }],
  ])('rejects invalid external token input: %o', (input) => {
    expect(() => registerFcmTokenSchema.parse(input)).toThrow()
  })

  it('validates the token in an unregister body', () => {
    expect(unregisterFcmTokenSchema.parse({
      token: ` ${token} `,
      registrationId,
    })).toEqual({ token, registrationId })
    expect(() => unregisterFcmTokenSchema.parse({
      token: 'too-short',
      registrationId,
    })).toThrow()
  })

  it('accepts the temporary legacy registration body during a rolling upgrade', () => {
    expect(compatibleRegisterFcmTokenSchema.parse({
      token,
      platform: 'android',
    })).toEqual({ token, platform: 'android' })
  })

  it('does not treat an invalid registration ID as a legacy request', () => {
    expect(() => compatibleRegisterFcmTokenSchema.parse({
      token,
      platform: 'android',
      registrationId: 'invalid',
    })).toThrow()
  })
})

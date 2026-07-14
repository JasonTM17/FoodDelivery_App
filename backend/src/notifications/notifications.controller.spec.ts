import { IS_PUBLIC_KEY } from '../auth/public.decorator'
import { NotificationsController } from './notifications.controller'
import type { NotificationsService } from './notifications.service'

const user = { sub: 'user-1', role: 'customer' }
const token = 'fcm-token-with-at-least-twenty-characters'
const registrationId = '9165a90e-1e23-4f7a-8df6-5c7b1a5c4f10'

describe('NotificationsController FCM lifecycle', () => {
  const notificationsService = {
    registerFcmToken: jest.fn().mockResolvedValue({ success: true }),
    registerLegacyFcmToken: jest.fn().mockResolvedValue({ success: true }),
    unregisterFcmToken: jest.fn().mockResolvedValue({ success: true }),
    unregisterLegacyFcmToken: jest.fn().mockResolvedValue({ success: true }),
  }
  const controller = new NotificationsController(
    notificationsService as unknown as NotificationsService,
  )

  beforeEach(() => jest.clearAllMocks())

  it('uses the UUID protocol for a current registration request', async () => {
    await controller.registerFcmToken(user, {
      token,
      platform: 'android',
      registrationId,
    })

    expect(notificationsService.registerFcmToken).toHaveBeenCalledWith(
      user.sub,
      { token, platform: 'android', registrationId },
    )
  })

  it('keeps legacy registration compatible during the rolling upgrade', async () => {
    await controller.registerFcmToken(user, { token, platform: 'android' })

    expect(notificationsService.registerLegacyFcmToken).toHaveBeenCalledWith(
      user.sub,
      { token, platform: 'android' },
    )
  })

  it('revokes one exact registration capability', async () => {
    await controller.unregisterFcmToken({ token, registrationId })

    expect(notificationsService.unregisterFcmToken).toHaveBeenCalledWith({
      token,
      registrationId,
    })
    expect(
      Reflect.getMetadata(
        IS_PUBLIC_KEY,
        NotificationsController.prototype.unregisterFcmToken,
      ),
    ).toBe(true)
  })

  it('keeps authenticated legacy cleanup compatible', async () => {
    await controller.unregisterLegacyFcmToken(user, token)

    expect(notificationsService.unregisterLegacyFcmToken).toHaveBeenCalledWith(
      user.sub,
      token,
    )
  })
})

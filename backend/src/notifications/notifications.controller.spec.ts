import { NotificationsController } from './notifications.controller'
import type { NotificationsService } from './notifications.service'

const user = { sub: 'user-1', role: 'customer' }
const token = 'fcm-token-with-at-least-twenty-characters'
const registrationId = '9165a90e-1e23-4f7a-8df6-5c7b1a5c4f10'

describe('NotificationsController FCM compatibility', () => {
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

  it('routes a legacy registration body through the compatibility adapter', async () => {
    await controller.registerFcmToken(user, { token, platform: 'android' })

    expect(notificationsService.registerLegacyFcmToken).toHaveBeenCalledWith(
      user.sub,
      { token, platform: 'android' },
    )
  })

  it('keeps current and legacy cleanup routes distinct', async () => {
    await controller.unregisterFcmToken(user, { token, registrationId })
    await controller.unregisterLegacyFcmToken(user, token)

    expect(notificationsService.unregisterFcmToken).toHaveBeenCalledWith(
      user.sub,
      { token, registrationId },
    )
    expect(notificationsService.unregisterLegacyFcmToken).toHaveBeenCalledWith(
      user.sub,
      token,
    )
  })
})

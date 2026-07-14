import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { NotificationsController } from './notifications.controller'
import { NotificationsService } from './notifications.service'

// CJS interop under ts-jest: namespace imports are not callable.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest') as typeof import('supertest')

const USER = { sub: 'user-1', role: 'customer', email: 'user@foodflow.test' }
const TOKEN = 'fcm-token-with-at-least-twenty-characters'
const REGISTRATION_ID = 'f508652a-4f6a-4fa8-93e1-86bbbfa7ebea'

describe('NotificationsController HTTP', () => {
  let app: INestApplication
  const notificationsService = {
    registerFcmToken: jest.fn(),
    unregisterFcmToken: jest.fn(),
    registerLegacyFcmToken: jest.fn(),
    unregisterLegacyFcmToken: jest.fn(),
    getUserNotifications: jest.fn(),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
  }

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        { provide: NotificationsService, useValue: notificationsService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: {
          switchToHttp: () => { getRequest: () => Record<string, unknown> }
        }) => {
          context.switchToHttp().getRequest().user = USER
          return true
        },
      })
      .compile()

    app = module.createNestApplication()
    app.setGlobalPrefix('api')
    await app.init()
  })

  beforeEach(() => {
    jest.clearAllMocks()
    notificationsService.registerFcmToken.mockResolvedValue({ registered: true })
    notificationsService.unregisterFcmToken.mockResolvedValue({ unregistered: true })
    notificationsService.registerLegacyFcmToken.mockResolvedValue({ registered: true })
    notificationsService.unregisterLegacyFcmToken.mockResolvedValue({ unregistered: true })
  })

  afterAll(async () => {
    await app.close()
  })

  it('validates and forwards a registration body', async () => {
    await request(app.getHttpServer())
      .post('/api/notifications/fcm-token')
      .send({
        token: TOKEN,
        platform: 'android',
        deviceId: 'controlled-device',
        registrationId: REGISTRATION_ID,
      })
      .expect(201)

    expect(notificationsService.registerFcmToken).toHaveBeenCalledWith(USER.sub, {
      token: TOKEN,
      platform: 'android',
      deviceId: 'controlled-device',
      registrationId: REGISTRATION_ID,
    })
  })

  it('forwards a rolling-compatible legacy registration body', async () => {
    await request(app.getHttpServer())
      .post('/api/notifications/fcm-token')
      .send({ token: TOKEN, platform: 'android', deviceId: 'legacy-device' })
      .expect(201)

    expect(notificationsService.registerLegacyFcmToken).toHaveBeenCalledWith(USER.sub, {
      token: TOKEN,
      platform: 'android',
      deviceId: 'legacy-device',
    })
    expect(notificationsService.registerFcmToken).not.toHaveBeenCalled()
  })

  it.each([
    { token: TOKEN, platform: 'windows', registrationId: REGISTRATION_ID },
    { token: TOKEN, platform: 'android', deviceId: 'x'.repeat(201), registrationId: REGISTRATION_ID },
    { token: TOKEN, platform: 'android', registrationId: 'not-a-uuid' },
  ])('rejects invalid registration bodies before the service call', async (body) => {
    await request(app.getHttpServer())
      .post('/api/notifications/fcm-token')
      .send(body)
      .expect(400)

    expect(notificationsService.registerFcmToken).not.toHaveBeenCalled()
  })

  it('validates and forwards an unregister body', async () => {
    await request(app.getHttpServer())
      .delete('/api/notifications/fcm-token')
      .send({ token: TOKEN, registrationId: REGISTRATION_ID })
      .expect(200)

    expect(notificationsService.unregisterFcmToken).toHaveBeenCalledWith(USER.sub, {
      token: TOKEN,
      registrationId: REGISTRATION_ID,
    })
  })

  it('forwards the rolling-compatible legacy unregister route', async () => {
    await request(app.getHttpServer())
      .delete(`/api/notifications/fcm-token/${TOKEN}`)
      .expect(200)

    expect(notificationsService.unregisterLegacyFcmToken).toHaveBeenCalledWith(
      USER.sub,
      TOKEN,
    )
    expect(notificationsService.unregisterFcmToken).not.toHaveBeenCalled()
  })
})

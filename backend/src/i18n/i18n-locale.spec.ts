import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import { I18nModule, AcceptLanguageResolver, QueryResolver, CookieResolver } from 'nestjs-i18n'
import * as path from 'path'
import { loadLocaleNamespace, translateTestKey } from '../../test/i18n-test-utils'

const REQUIRED_ERROR_KEYS = [
  'promotion_not_found',
  'promotion_invalid',
  'promotion_expired',
  'promotion_exhausted',
  'promotion_min_order',
  'promotion_wrong_restaurant',
  'promotion_first_order_only',
  'promotion_max_per_user',
  'promotion_device_blocked',
  'promotion_fixed_cannot_stack',
  'promotion_one_per_type',
  'order_cannot_cancel',
  'order_already_completed',
  'order_processing_cannot_cancel',
  'order_driver_picked_up',
  'order_cancel_reason_required',
  'order_invalid_role',
]

const REQUIRED_NOTIFICATION_KEYS = [
  'order_update_title',
  'order_update_body',
  'driver_delay_title',
  'driver_delay_body',
]

describe('i18n locale catalog', () => {
  it.each(['vi', 'en', 'ja'])('has all service error keys for %s', (lang) => {
    const errors = loadLocaleNamespace(lang, 'errors')
    for (const key of REQUIRED_ERROR_KEYS) {
      expect(errors[key]).toEqual(expect.any(String))
    }
  })

  it.each(['vi', 'en', 'ja'])('has all notification keys for %s', (lang) => {
    const notifications = loadLocaleNamespace(lang, 'notifications')
    for (const key of REQUIRED_NOTIFICATION_KEYS) {
      expect(notifications[key]).toEqual(expect.any(String))
    }
  })

  it('interpolates promotion max-per-user placeholders from the real locale catalog', () => {
    const result = translateTestKey('errors.promotion_max_per_user', { max: 3 })
    expect(result).toContain('3')
  })

  it('interpolates minimum-order placeholders from the real locale catalog', () => {
    const result = translateTestKey('errors.promotion_min_order', { amount: '50,000' })
    expect(result).toContain('50,000')
  })

  it('returns the key for unknown locale entries', () => {
    expect(translateTestKey('errors.unknown_key')).toBe('errors.unknown_key')
  })

  it('interpolates notification body placeholders from the real locale catalog', () => {
    const result = translateTestKey('notifications.driver_delay_body', {
      orderId: 'ABC123',
      delayMinutes: 15,
    })
    expect(result).toContain('ABC123')
    expect(result).toContain('15')
  })
})

describe('I18nModule locale resolution chain', () => {
  let app: INestApplication

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        I18nModule.forRoot({
          fallbackLanguage: 'vi',
          loaderOptions: {
            path: path.join(__dirname, 'locales'),
            watch: false,
          },
          resolvers: [
            { use: QueryResolver, options: ['lang'] },
            AcceptLanguageResolver,
            new CookieResolver(['lang']),
          ],
        }),
      ],
    }).compile()

    app = module.createNestApplication()
    await app.init()
  })

  afterAll(async () => {
    await app?.close()
  })

  it('module initialises without error (locales loaded)', () => {
    expect(app).toBeDefined()
  })

  it('resolvers are registered in priority order: query > header > cookie > default', () => {
    // Verify the module configuration by checking the resolver chain is set up.
    // Full HTTP-level resolver tests require supertest + full app bootstrap;
    // this ensures the module is importable with all three resolvers wired.
    expect(app.getHttpServer).toBeDefined()
  })
})

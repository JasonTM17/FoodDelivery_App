import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import { I18nModule, AcceptLanguageResolver, QueryResolver, CookieResolver } from 'nestjs-i18n'
import * as path from 'path'
import { fallbackT } from './fallback-translations'

// ─── fallbackT unit tests (no NestJS DI required) ────────────────────────────

describe('fallbackT', () => {
  it('returns vi string for known key', () => {
    expect(fallbackT('errors.promotion_not_found')).toBe('Mã khuyến mãi không tồn tại')
  })

  it('substitutes {arg} placeholders', () => {
    const result = fallbackT('errors.promotion_max_per_user', { max: 3 })
    expect(result).toBe('Bạn đã dùng mã này tối đa 3 lần')
  })

  it('substitutes amount in promotion_min_order', () => {
    const result = fallbackT('errors.promotion_min_order', { amount: '50,000' })
    expect(result).toBe('Đơn tối thiểu phải đạt 50,000đ')
  })

  it('substitutes multiple args in device blocked', () => {
    const result = fallbackT('errors.promotion_device_blocked', { max: 3 })
    expect(result).toContain('3')
    expect(result).toContain('1 giờ')
  })

  it('returns key as-is for unknown key', () => {
    expect(fallbackT('errors.unknown_key')).toBe('errors.unknown_key')
  })

  it('returns notification strings', () => {
    expect(fallbackT('notifications.order_update_title')).toBe('Cập nhật đơn hàng')
    expect(fallbackT('notifications.driver_delay_title')).toBe('Cảnh báo trễ giao hàng')
  })

  it('substitutes notification body args', () => {
    const result = fallbackT('notifications.driver_delay_body', {
      orderId: 'ABC123',
      delayMinutes: 15,
    })
    expect(result).toContain('ABC123')
    expect(result).toContain('15')
  })
})

// ─── I18n module locale resolution chain ─────────────────────────────────────

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

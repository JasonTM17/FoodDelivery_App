import { validateEnv } from './env.validation'

const productionEnv = {
  NODE_ENV: 'production',
  DATABASE_URL: 'postgresql://foodflow:secret@db.foodflow.vn:5432/foodflow',
  DIRECT_URL: 'postgresql://foodflow:secret@db-direct.foodflow.vn:5432/foodflow',
  REDIS_URL: 'rediss://:secret@redis.foodflow.vn:6380',
  JWT_SECRET: 'a'.repeat(64),
  JWT_REFRESH_SECRET: 'b'.repeat(64),
  PASSWORD_RESET_URL_BASE: 'https://admin.foodflow.vn/reset-password',
  CORS_ORIGINS: 'https://admin.foodflow.vn,https://restaurant.foodflow.vn',
  DELIVERY_BASE_FEE_VND: '15000',
  MINIO_ENDPOINT: 's3.foodflow.vn',
  MINIO_ACCESS_KEY: 'foodflow-production-access-key',
  MINIO_SECRET_KEY: 'c'.repeat(64),
  MINIO_PUBLIC_URL: 'https://cdn.foodflow.vn',
  THROTTLER_MEMORY_FALLBACK: 'false',
  GOOGLE_MAPS_API_KEY: 'prod-google-maps-browser-key',
  OSRM_URL: 'https://osrm.foodflow.vn',
  DEEPSEEK_API_KEY: 'prod-deepseek-api-key',
  SEPAY_API_KEY: 'prod-sepay-api-key',
  SEPAY_ACCOUNT_NUMBER: '1234567890',
  SEPAY_WEBHOOK_SECRET: 'prod-sepay-webhook-secret',
  WEBHOOK_SECRET: 'prod-generic-webhook-secret',
  SMTP_HOST: 'smtp.foodflow.vn',
  SMTP_USER: 'smtp-foodflow-user',
  SMTP_PASS: 'smtp-foodflow-password',
  SMTP_FROM: 'noreply@foodflow.vn',
  FCM_SERVER_KEY: 'prod-fcm-server-key',
  TWILIO_ACCOUNT_SID: 'prod-twilio-account-sid',
  TWILIO_AUTH_TOKEN: 'prod-twilio-auth-token',
  TWILIO_FROM_NUMBER: '+84900000000',
  SUPABASE_URL: 'https://lvanszgszzfopusboich.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'prod-supabase-service-role-key',
  SUPABASE_JWT_SECRET: 'd'.repeat(64),
  SUPABASE_STORAGE_BUCKET: 'foodflow-production',
}

describe('validateEnv', () => {
  it('keeps local defaults for development and test environments only', () => {
    const env = validateEnv({ NODE_ENV: 'test', DELIVERY_BASE_FEE_VND: '15000' })

    expect(env.DATABASE_URL).toBe('postgresql://foodflow:foodflow_dev@localhost:5432/foodflow')
    expect(env.DIRECT_URL).toBe('postgresql://foodflow:foodflow_dev@localhost:5432/foodflow')
    expect(env.REDIS_URL).toBe('redis://localhost:6379')
    expect(env.JWT_SECRET.length).toBeGreaterThanOrEqual(64)
    expect(env.JWT_REFRESH_SECRET.length).toBeGreaterThanOrEqual(64)
    expect(env.THROTTLER_MEMORY_FALLBACK).toBe('false')
    expect(env.THROTTLER_TTL_MS).toBe(60_000)
    expect(env.THROTTLER_LIMIT).toBe(100)
    expect(env.DELIVERY_BASE_FEE_VND).toBe(15_000)
  })

  it('accepts bounded non-production throttle overrides for load-test runs', () => {
    const env = validateEnv({
      NODE_ENV: 'test',
      DELIVERY_BASE_FEE_VND: '15000',
      THROTTLER_TTL_MS: '60000',
      THROTTLER_LIMIT: '50000',
    })

    expect(env.THROTTLER_TTL_MS).toBe(60_000)
    expect(env.THROTTLER_LIMIT).toBe(50_000)
  })

  it('accepts a complete production configuration without local fallbacks', () => {
    expect(validateEnv(productionEnv)).toMatchObject({
      NODE_ENV: 'production',
      DATABASE_URL: productionEnv.DATABASE_URL,
      DIRECT_URL: productionEnv.DIRECT_URL,
      REDIS_URL: productionEnv.REDIS_URL,
      PASSWORD_RESET_URL_BASE: productionEnv.PASSWORD_RESET_URL_BASE,
    })
  })

  it('requires Supabase secrets when production providers use Supabase', () => {
    expect(() => validateEnv({
      ...productionEnv,
      REALTIME_PROVIDER: 'supabase',
      STORAGE_PROVIDER: 'supabase',
      SUPABASE_URL: undefined,
      SUPABASE_SERVICE_ROLE_KEY: undefined,
      SUPABASE_JWT_SECRET: undefined,
      SUPABASE_STORAGE_BUCKET: undefined,
    })).toThrow(/SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY|SUPABASE_JWT_SECRET|SUPABASE_STORAGE_BUCKET/)

    expect(validateEnv({
      ...productionEnv,
      REALTIME_PROVIDER: 'supabase',
      STORAGE_PROVIDER: 'supabase',
    })).toMatchObject({
      REALTIME_PROVIDER: 'supabase',
      STORAGE_PROVIDER: 'supabase',
      SUPABASE_URL: productionEnv.SUPABASE_URL,
    })
  })

  it('fails closed in production when required values are missing', () => {
    expect(() => validateEnv({ NODE_ENV: 'production' })).toThrow(/DATABASE_URL: is required/)
  })

  it('rejects local fallback values in production', () => {
    expect(() =>
      validateEnv({
        ...productionEnv,
        DATABASE_URL: 'postgresql://foodflow:foodflow_dev@localhost:5432/foodflow',
        JWT_SECRET: 'dev-secret',
        OSRM_URL: 'https://router.project-osrm.org',
        DEEPSEEK_API_KEY: 'your-deepseek-api-key',
        SEPAY_WEBHOOK_SECRET: 'your-sepay-webhook-secret',
        THROTTLER_MEMORY_FALLBACK: 'true',
      }),
    ).toThrow(/local development default|router\.project-osrm\.org|your-deepseek-api-key|your-sepay-webhook-secret|THROTTLER_MEMORY_FALLBACK/)
  })
})

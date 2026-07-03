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
  MINIO_ENDPOINT: 's3.foodflow.vn',
  MINIO_ACCESS_KEY: 'foodflow-production-access-key',
  MINIO_SECRET_KEY: 'c'.repeat(64),
  MINIO_PUBLIC_URL: 'https://cdn.foodflow.vn',
  THROTTLER_MEMORY_FALLBACK: 'false',
  GOOGLE_MAPS_API_KEY: 'prod-google-maps-browser-key',
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
}

describe('validateEnv', () => {
  it('keeps local defaults for development and test environments only', () => {
    const env = validateEnv({ NODE_ENV: 'test' })

    expect(env.DATABASE_URL).toBe('postgresql://foodflow:foodflow_dev@localhost:5432/foodflow')
    expect(env.DIRECT_URL).toBe('postgresql://foodflow:foodflow_dev@localhost:5432/foodflow')
    expect(env.REDIS_URL).toBe('redis://localhost:6379')
    expect(env.JWT_SECRET.length).toBeGreaterThanOrEqual(64)
    expect(env.JWT_REFRESH_SECRET.length).toBeGreaterThanOrEqual(64)
    expect(env.THROTTLER_MEMORY_FALLBACK).toBe('false')
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

  it('fails closed in production when required values are missing', () => {
    expect(() => validateEnv({ NODE_ENV: 'production' })).toThrow(/DATABASE_URL: is required/)
  })

  it('rejects local fallback values in production', () => {
    expect(() =>
      validateEnv({
        ...productionEnv,
        DATABASE_URL: 'postgresql://foodflow:foodflow_dev@localhost:5432/foodflow',
        JWT_SECRET: 'dev-secret',
        DEEPSEEK_API_KEY: 'your-deepseek-api-key',
        SEPAY_WEBHOOK_SECRET: 'your-sepay-webhook-secret',
        THROTTLER_MEMORY_FALLBACK: 'true',
      }),
    ).toThrow(/local development default|your-deepseek-api-key|your-sepay-webhook-secret|THROTTLER_MEMORY_FALLBACK/)
  })
})

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
  MINIO_KYC_BUCKET: 'foodflow-kyc',
  MINIO_PUBLIC_URL: 'https://cdn.foodflow.vn',
  THROTTLER_MEMORY_FALLBACK: 'false',
  GOOGLE_MAPS_API_KEY: 'prod-google-maps-browser-key',
  OSRM_URL: 'https://osrm.foodflow.vn',
  DEEPSEEK_API_KEY: 'prod-deepseek-api-key',
  SEPAY_API_KEY: 'prod-sepay-api-key',
  SEPAY_ACCOUNT_NUMBER: '1234567890',
  SEPAY_BANK_NAME: 'Vietcombank',
  SEPAY_WEBHOOK_SECRET: 's'.repeat(64),
  WEBHOOK_SECRET: 'prod-generic-webhook-secret',
  SMTP_HOST: 'smtp.foodflow.vn',
  SMTP_USER: 'smtp-foodflow-user',
  SMTP_PASS: 'smtp-foodflow-password',
  SMTP_FROM: 'noreply@foodflow.vn',
  FCM_PROJECT_ID: 'foodflow-production',
  TWILIO_ACCOUNT_SID: 'prod-twilio-account-sid',
  TWILIO_AUTH_TOKEN: 'prod-twilio-auth-token',
  TWILIO_FROM_NUMBER: '+84900000000',
  SUPABASE_URL: 'https://lvanszgszzfopusboich.supabase.co',
  SUPABASE_SECRET_KEY: 'sb_secret_foodflow_production',
  SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_foodflow_production',
  SUPABASE_REALTIME_JWT_PRIVATE_KEY: 'test-es256-private-key',
  SUPABASE_REALTIME_JWT_KEY_ID: 'foodflow-es256-2026-07',
  SUPABASE_STORAGE_BUCKET: 'foodflow-public',
  SUPABASE_KYC_BUCKET: 'foodflow-private',
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
    expect(env.DEEPSEEK_BASE_URL).toBe('https://api.deepseek.com')
    expect(env.DEEPSEEK_MODEL).toBe('deepseek-v4-flash')
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

  it('requires a Firebase project ID while allowing ADC or a secret-managed service account', () => {
    expect(() => validateEnv({
      ...productionEnv,
      FCM_PROJECT_ID: undefined,
    })).toThrow(/FCM_PROJECT_ID/)

    expect(validateEnv({
      ...productionEnv,
      FCM_SERVICE_ACCOUNT_JSON: JSON.stringify({ project_id: 'foodflow-production' }),
    })).toMatchObject({
      FCM_PROJECT_ID: 'foodflow-production',
    })
  })

  it('rejects malformed Firebase service account JSON without exposing its value', () => {
    expect(() => validateEnv({
      NODE_ENV: 'test',
      DELIVERY_BASE_FEE_VND: '15000',
      FCM_SERVICE_ACCOUNT_JSON: '{not-json}',
    })).toThrow(/FCM_SERVICE_ACCOUNT_JSON: Must be a JSON object/)
  })

  it('treats a blank optional service account value as ADC configuration', () => {
    expect(validateEnv({
      NODE_ENV: 'test',
      DELIVERY_BASE_FEE_VND: '15000',
      FCM_SERVICE_ACCOUNT_JSON: '   ',
    }).FCM_SERVICE_ACCOUNT_JSON).toBeUndefined()
  })

  it('requires Supabase secrets when production providers use Supabase', () => {
    expect(() => validateEnv({
      ...productionEnv,
      REALTIME_PROVIDER: 'supabase',
      STORAGE_PROVIDER: 'supabase',
      SUPABASE_URL: undefined,
      SUPABASE_SECRET_KEY: undefined,
      SUPABASE_PUBLISHABLE_KEY: undefined,
      SUPABASE_REALTIME_JWT_PRIVATE_KEY: undefined,
      SUPABASE_REALTIME_JWT_KEY_ID: undefined,
      SUPABASE_STORAGE_BUCKET: undefined,
      SUPABASE_KYC_BUCKET: undefined,
    })).toThrow(/SUPABASE_URL|SUPABASE_SECRET_KEY|SUPABASE_PUBLISHABLE_KEY|SUPABASE_REALTIME_JWT_PRIVATE_KEY|SUPABASE_REALTIME_JWT_KEY_ID|SUPABASE_STORAGE_BUCKET|SUPABASE_KYC_BUCKET/)

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

  it('does not require MinIO production secrets when storage uses Supabase', () => {
    const supabaseStorageEnv: Record<string, unknown> = {
      ...productionEnv,
      STORAGE_PROVIDER: 'supabase',
    }
    delete supabaseStorageEnv.MINIO_ENDPOINT
    delete supabaseStorageEnv.MINIO_ACCESS_KEY
    delete supabaseStorageEnv.MINIO_SECRET_KEY
    delete supabaseStorageEnv.MINIO_PUBLIC_URL
    delete supabaseStorageEnv.MINIO_KYC_BUCKET

    expect(validateEnv(supabaseStorageEnv)).toMatchObject({
      STORAGE_PROVIDER: 'supabase',
      SUPABASE_STORAGE_BUCKET: productionEnv.SUPABASE_STORAGE_BUCKET,
    })
  })

  it('keeps the KYC upload limit and managed private bucket aligned with migrations', () => {
    expect(() => validateEnv({
      NODE_ENV: 'test',
      DELIVERY_BASE_FEE_VND: '15000',
      DRIVER_KYC_MAX_UPLOAD_MB: '5',
    })).toThrow(/DRIVER_KYC_MAX_UPLOAD_MB/)

    expect(() => validateEnv({
      ...productionEnv,
      STORAGE_PROVIDER: 'supabase',
      SUPABASE_KYC_BUCKET: 'public-assets',
    })).toThrow(/SUPABASE_KYC_BUCKET/)
  })

  it('requires a strong cron secret when production queues use Supabase/Postgres', () => {
    expect(() => validateEnv({
      ...productionEnv,
      QUEUE_PROVIDER: 'supabase-postgres',
      CRON_SECRET: 'short',
    })).toThrow(/CRON_SECRET/)

    expect(validateEnv({
      ...productionEnv,
      QUEUE_PROVIDER: 'supabase-postgres',
      CRON_SECRET: 'e'.repeat(64),
    })).toMatchObject({
      QUEUE_PROVIDER: 'supabase-postgres',
      CRON_SECRET: 'e'.repeat(64),
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

  it('rejects DeepSeek credential exfiltration endpoints and unsupported models', () => {
    expect(() => validateEnv({
      NODE_ENV: 'test',
      DELIVERY_BASE_FEE_VND: '15000',
      DEEPSEEK_BASE_URL: 'https://attacker.example/api',
    })).toThrow(/official DeepSeek API origin/)

    expect(() => validateEnv({
      NODE_ENV: 'test',
      DELIVERY_BASE_FEE_VND: '15000',
      DEEPSEEK_MODEL: 'deepseek-v4-pro',
    })).toThrow(/deepseek-v4-flash/)
  })
})

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
  SUPABASE_SERVICE_ROLE_KEY: `eyJ${'x'.repeat(64)}`,
  SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_foodflow_production',
  SUPABASE_REALTIME_JWT_PRIVATE_KEY: 'test-es256-private-key',
  SUPABASE_REALTIME_JWT_KEY_ID: 'foodflow-es256-2026-07',
  SUPABASE_STORAGE_BUCKET: 'foodflow-public',
  SUPABASE_KYC_BUCKET: 'foodflow-private',
}

const optionalProviderKeys = [
  'GOOGLE_MAPS_API_KEY',
  'OSRM_URL',
  'DEEPSEEK_API_KEY',
  'SEPAY_ACCOUNT_NUMBER',
  'SEPAY_BANK_NAME',
  'SEPAY_WEBHOOK_SECRET',
  'WEBHOOK_SECRET',
  'SMTP_HOST',
  'SMTP_USER',
  'SMTP_PASS',
  'SMTP_FROM',
  'FCM_PROJECT_ID',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_FROM_NUMBER',
] as const

function withoutOptionalProviders(config: Record<string, unknown>): Record<string, unknown> {
  const result = { ...config }
  for (const key of optionalProviderKeys) delete result[key]
  return result
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
    expect(env.RAG_ENABLED).toBe('true')
    expect(env.RAG_SYNC_INTERVAL_MS).toBe(300_000)
    expect(env.RAG_SYNC_BATCH_SIZE).toBe(100)
    expect(env.RAG_SYNC_CONCURRENCY).toBe(4)
    expect(env.RAG_TOP_K).toBe(3)
    expect(env.RAG_MIN_SIMILARITY).toBe(0.7)
    expect(env.DEEPSEEK_EMBEDDING_MODEL).toBe('text-embedding-v3')
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

  it('rejects unsafe RAG sync frequency, batch size, and concurrency values', () => {
    expect(() => validateEnv({
      NODE_ENV: 'test',
      DELIVERY_BASE_FEE_VND: '15000',
      RAG_SYNC_INTERVAL_MS: '1000',
      RAG_SYNC_BATCH_SIZE: '5000',
      RAG_SYNC_CONCURRENCY: '50',
      RAG_TOP_K: '20',
      RAG_MIN_SIMILARITY: '1.5',
    })).toThrow(/RAG_SYNC_INTERVAL_MS|RAG_SYNC_BATCH_SIZE|RAG_SYNC_CONCURRENCY/)
  })

  it('allows FCM to remain disabled while validating configured Firebase settings', () => {
    expect(validateEnv(withoutOptionalProviders(productionEnv)).FCM_PROJECT_ID).toBeUndefined()

    expect(validateEnv({
      ...productionEnv,
      FCM_SERVICE_ACCOUNT_JSON: JSON.stringify({ project_id: 'foodflow-production' }),
    })).toMatchObject({
      FCM_PROJECT_ID: 'foodflow-production',
    })
  })

  it('boots managed production without credentials for disabled optional providers', () => {
    const managedEnv = withoutOptionalProviders({
      ...productionEnv,
      REALTIME_PROVIDER: 'supabase',
      STORAGE_PROVIDER: 'supabase',
      QUEUE_PROVIDER: 'supabase-postgres',
      CRON_SECRET: 'e'.repeat(64),
    })

    expect(validateEnv(managedEnv)).toMatchObject({
      NODE_ENV: 'production',
      REALTIME_PROVIDER: 'supabase',
      STORAGE_PROVIDER: 'supabase',
      QUEUE_PROVIDER: 'supabase-postgres',
    })
  })

  it('rejects partially configured optional provider credential groups', () => {
    const providersDisabledEnv = withoutOptionalProviders(productionEnv)

    expect(() => validateEnv({
      ...providersDisabledEnv,
      SEPAY_ACCOUNT_NUMBER: '1234567890',
    })).toThrow(/missing SEPAY_BANK_NAME/)

    expect(() => validateEnv({
      ...providersDisabledEnv,
      SMTP_HOST: 'smtp.foodflow.vn',
    })).toThrow(/missing SMTP_USER, SMTP_PASS/)

    expect(() => validateEnv({
      ...providersDisabledEnv,
      TWILIO_ACCOUNT_SID: 'prod-twilio-account-sid',
    })).toThrow(/missing TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER/)

    expect(() => validateEnv({
      ...providersDisabledEnv,
      FCM_SERVICE_ACCOUNT_JSON: JSON.stringify({ project_id: 'foodflow-prod' }),
    })).toThrow(/missing FCM_PROJECT_ID/)
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
      SUPABASE_SERVICE_ROLE_KEY: undefined,
      SUPABASE_PUBLISHABLE_KEY: undefined,
      SUPABASE_REALTIME_JWT_PRIVATE_KEY: undefined,
      SUPABASE_REALTIME_JWT_KEY_ID: undefined,
      SUPABASE_STORAGE_BUCKET: undefined,
      SUPABASE_KYC_BUCKET: undefined,
    })).toThrow(/SUPABASE_URL|SUPABASE_SECRET_KEY|SUPABASE_SERVICE_ROLE_KEY|SUPABASE_PUBLISHABLE_KEY|SUPABASE_REALTIME_JWT_PRIVATE_KEY|SUPABASE_REALTIME_JWT_KEY_ID|SUPABASE_STORAGE_BUCKET|SUPABASE_KYC_BUCKET/)

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

  it('requires a legacy JWT service-role key for Supabase Storage', () => {
    expect(() => validateEnv({
      ...productionEnv,
      STORAGE_PROVIDER: 'supabase',
      SUPABASE_SERVICE_ROLE_KEY: undefined,
    })).toThrow(/SUPABASE_SERVICE_ROLE_KEY.*Storage authorization requires a JWT/)
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

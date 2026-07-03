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
        THROTTLER_MEMORY_FALLBACK: 'true',
      }),
    ).toThrow(/local development default|THROTTLER_MEMORY_FALLBACK/)
  })
})

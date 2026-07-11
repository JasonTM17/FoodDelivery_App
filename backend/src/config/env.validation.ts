import { z } from 'zod'

const LOCAL_DEFAULTS = {
  DATABASE_URL: 'postgresql://foodflow:foodflow_dev@localhost:5432/foodflow',
  DIRECT_URL: 'postgresql://foodflow:foodflow_dev@localhost:5432/foodflow',
  REDIS_URL: 'redis://localhost:6379',
  JWT_SECRET: 'local-development-jwt-secret-change-me-000000000000000000000000000000',
  JWT_REFRESH_SECRET: 'local-development-refresh-secret-change-me-0000000000000000000000',
  MINIO_ACCESS_KEY: 'minioadmin',
  MINIO_SECRET_KEY: 'minioadmin',
} as const

const productionRequiredKeys = [
  'DATABASE_URL',
  'DIRECT_URL',
  'REDIS_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'PASSWORD_RESET_URL_BASE',
  'CORS_ORIGINS',
  'DELIVERY_BASE_FEE_VND',
  'GOOGLE_MAPS_API_KEY',
  'OSRM_URL',
  'DEEPSEEK_API_KEY',
  'SEPAY_API_KEY',
  'SEPAY_ACCOUNT_NUMBER',
  'SEPAY_WEBHOOK_SECRET',
  'WEBHOOK_SECRET',
  'SMTP_HOST',
  'SMTP_USER',
  'SMTP_PASS',
  'SMTP_FROM',
  'FCM_SERVER_KEY',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_FROM_NUMBER',
] as const

const minioProductionRequiredKeys = [
  'MINIO_ENDPOINT',
  'MINIO_ACCESS_KEY',
  'MINIO_SECRET_KEY',
  'MINIO_PUBLIC_URL',
  'MINIO_KYC_BUCKET',
] as const

type ProductionRequiredKey =
  | (typeof productionRequiredKeys)[number]
  | (typeof minioProductionRequiredKeys)[number]
  | 'CRON_SECRET'

const productionForbiddenValues: Partial<Record<ProductionRequiredKey, readonly string[]>> = {
  DATABASE_URL: [LOCAL_DEFAULTS.DATABASE_URL],
  DIRECT_URL: [LOCAL_DEFAULTS.DIRECT_URL],
  REDIS_URL: [LOCAL_DEFAULTS.REDIS_URL],
  JWT_SECRET: [LOCAL_DEFAULTS.JWT_SECRET, 'dev-secret'],
  JWT_REFRESH_SECRET: [LOCAL_DEFAULTS.JWT_REFRESH_SECRET, 'dev-refresh-secret'],
  PASSWORD_RESET_URL_BASE: ['http://localhost:3000/reset-password'],
  CORS_ORIGINS: ['http://localhost:3000'],
  MINIO_ENDPOINT: ['localhost'],
  MINIO_ACCESS_KEY: ['minioadmin'],
  MINIO_SECRET_KEY: ['minioadmin'],
  MINIO_PUBLIC_URL: ['http://localhost:9000'],
  GOOGLE_MAPS_API_KEY: ['your-google-maps-api-key'],
  OSRM_URL: ['https://router.project-osrm.org'],
  DEEPSEEK_API_KEY: ['your-deepseek-api-key'],
  SEPAY_API_KEY: ['your-sepay-api-key'],
  SEPAY_ACCOUNT_NUMBER: ['your-sepay-account-number'],
  SEPAY_WEBHOOK_SECRET: ['your-sepay-webhook-secret'],
  WEBHOOK_SECRET: ['your-webhook-secret'],
  SMTP_HOST: ['smtp.example.com'],
  SMTP_USER: ['your-smtp-user'],
  SMTP_PASS: ['your-smtp-password'],
  FCM_SERVER_KEY: ['your-fcm-server-key'],
  TWILIO_ACCOUNT_SID: ['your-twilio-account-sid'],
  TWILIO_AUTH_TOKEN: ['your-twilio-auth-token'],
  TWILIO_FROM_NUMBER: ['your-twilio-from-number'],
  CRON_SECRET: ['your-cron-secret'],
}

const supabaseForbiddenValues = {
  SUPABASE_URL: ['https://your-project.supabase.co'],
  SUPABASE_SERVICE_ROLE_KEY: ['your-supabase-service-role-key'],
  SUPABASE_JWT_SECRET: ['your-supabase-jwt-secret'],
} satisfies Record<string, readonly string[]>

const postgresUrl = z.string().url().startsWith('postgresql://')
const redisUrl = z
  .string()
  .url()
  .refine(
    (value) => value.startsWith('redis://') || value.startsWith('rediss://'),
    'Must start with redis:// or rediss://',
  )

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  REALTIME_PROVIDER: z.enum(['socketio', 'supabase']).default('socketio'),
  STORAGE_PROVIDER: z.enum(['minio', 'supabase']).default('minio'),
  QUEUE_PROVIDER: z.enum(['bullmq', 'supabase-postgres']).default('bullmq'),
  DATABASE_URL: postgresUrl,
  DIRECT_URL: postgresUrl,
  REDIS_URL: redisUrl,
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  PASSWORD_RESET_URL_BASE: z.string().url().optional(),
  PASSWORD_RESET_TOKEN_TTL_MINUTES: z.coerce.number().int().positive().max(1440).default(60),
  CORS_ORIGINS: z.string().default('http://localhost:3000'),
  DELIVERY_BASE_FEE_VND: z.coerce.number().int().nonnegative().max(1_000_000),
  MINIO_ENDPOINT: z.string().default('localhost'),
  MINIO_PORT: z.coerce.number().int().positive().default(9000),
  MINIO_ACCESS_KEY: z.string().min(3).optional(),
  MINIO_SECRET_KEY: z.string().min(8).optional(),
  MINIO_BUCKET: z.string().default('foodflow'),
  MINIO_KYC_BUCKET: z.string().default('foodflow-kyc'),
  MINIO_PUBLIC_URL: z.string().url().default('http://localhost:9000'),
  STORAGE_MAX_UPLOAD_MB: z.coerce.number().int().positive().max(50).default(5),
  DRIVER_KYC_MAX_UPLOAD_MB: z.coerce.number().int().positive().max(4).default(4),
  DRIVER_KYC_RETRY_LIMIT: z.coerce.number().int().positive().max(10).default(3),
  THROTTLER_MEMORY_FALLBACK: z.enum(['true', 'false']).default('false'),
  THROTTLER_TTL_MS: z.coerce.number().int().positive().max(600_000).default(60_000),
  THROTTLER_LIMIT: z.coerce.number().int().positive().max(100_000).default(100),
  DEEPSEEK_API_KEY: z.string().optional(),
  DEEPSEEK_BASE_URL: z.string().url().optional(),
  DEEPSEEK_MODEL: z.string().min(1).optional(),
  DEEPSEEK_TIMEOUT_MS: z.coerce.number().int().positive().max(60000).optional(),
  DEEPSEEK_MAX_OUTPUT_TOKENS: z.coerce.number().int().positive().max(8000).optional(),
  DEEPSEEK_THINKING: z.enum(['enabled', 'disabled']).default('disabled'),
  DEEPSEEK_REASONING_EFFORT: z.enum(['high', 'max']).default('high'),
  DEEPSEEK_DAILY_BUDGET_USD: z.coerce.number().nonnegative().optional(),
  GOOGLE_MAPS_API_KEY: z.string().optional(),
  OSRM_URL: z.string().url().optional(),
  SEPAY_API_KEY: z.string().optional(),
  SEPAY_ACCOUNT_NUMBER: z.string().optional(),
  SEPAY_WEBHOOK_SECRET: z.string().optional(),
  WEBHOOK_SECRET: z.string().optional(),
  CRON_SECRET: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_SECURE: z.enum(['true', 'false']).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().email().optional(),
  FCM_SERVER_KEY: z.string().optional(),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_FROM_NUMBER: z.string().optional(),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_JWT_SECRET: z.string().optional(),
  SUPABASE_STORAGE_BUCKET: z.string().optional(),
  SUPABASE_KYC_BUCKET: z.literal('foodflow-kyc').optional(),
  // Ed25519 dual-verify (Phase 1 cutover — Phase 2 will flip signing)
  JWT_ED25519_PRIVATE_KEY: z.string().optional(),
  JWT_ED25519_PUBLIC_KEY: z.string().optional(),
  LEGACY_HS256_FALLBACK: z.enum(['true', 'false']).default('true'),
})

export type EnvConfig = z.infer<typeof envSchema>

function resolveNodeEnv(config: Record<string, unknown>): string {
  return typeof config.NODE_ENV === 'string' ? config.NODE_ENV : process.env.NODE_ENV ?? 'development'
}

function withNonProductionDefaults(config: Record<string, unknown>): Record<string, unknown> {
  if (resolveNodeEnv(config) === 'production') return { ...config }
  return { ...LOCAL_DEFAULTS, ...config }
}

function isBlank(value: unknown): boolean {
  return typeof value !== 'string' || value.trim().length === 0
}

function collectProductionIssues(config: Record<string, unknown>): string[] {
  if (resolveNodeEnv(config) !== 'production') return []

  const issues: string[] = []
  for (const key of productionRequiredKeys) {
    const value = config[key]
    if (isBlank(value)) {
      issues.push(`${key}: is required in production`)
      continue
    }

    const normalizedValue = String(value).trim()
    if (productionForbiddenValues[key]?.includes(normalizedValue)) {
      issues.push(`${key}: must not use the local development default in production`)
    }
  }

  const jwtSecret = String(config.JWT_SECRET ?? '')
  if (jwtSecret && jwtSecret.length < 64) {
    issues.push('JWT_SECRET: must be at least 64 characters in production')
  }

  const refreshSecret = String(config.JWT_REFRESH_SECRET ?? '')
  if (refreshSecret && refreshSecret.length < 64) {
    issues.push('JWT_REFRESH_SECRET: must be at least 64 characters in production')
  }

  const corsOrigins = String(config.CORS_ORIGINS ?? '')
  if (corsOrigins.includes('*') || corsOrigins.includes('localhost')) {
    issues.push('CORS_ORIGINS: must list exact production origins only')
  }

  const passwordResetBase = String(config.PASSWORD_RESET_URL_BASE ?? '')
  if (passwordResetBase.includes('localhost')) {
    issues.push('PASSWORD_RESET_URL_BASE: must not point to localhost in production')
  }

  if (config.THROTTLER_MEMORY_FALLBACK === 'true') {
    issues.push('THROTTLER_MEMORY_FALLBACK: must remain false in production')
  }

  const realtimeProvider = String(config.REALTIME_PROVIDER ?? 'socketio')
  const storageProvider = String(config.STORAGE_PROVIDER ?? 'minio')
  const queueProvider = String(config.QUEUE_PROVIDER ?? 'bullmq')
  const needsSupabase =
    realtimeProvider === 'supabase' ||
    storageProvider === 'supabase' ||
    queueProvider === 'supabase-postgres'

  if (needsSupabase) {
    for (const key of ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'] as const) {
      const value = config[key]
      if (isBlank(value)) {
        issues.push(`${key}: is required when a Supabase provider is enabled`)
        continue
      }
      if (supabaseForbiddenValues[key].includes(String(value).trim())) {
        issues.push(`${key}: must not use the example Supabase value in production`)
      }
    }
  }

  if (storageProvider === 'minio') {
    for (const key of minioProductionRequiredKeys) {
      const value = config[key]
      if (isBlank(value)) {
        issues.push(`${key}: is required in production when STORAGE_PROVIDER=minio`)
        continue
      }
      if (productionForbiddenValues[key]?.includes(String(value).trim())) {
        issues.push(`${key}: must not use the local development default in production`)
      }
    }
  }

  if (realtimeProvider === 'supabase') {
    const value = config.SUPABASE_JWT_SECRET
    if (isBlank(value)) {
      issues.push('SUPABASE_JWT_SECRET: is required when REALTIME_PROVIDER=supabase')
    } else if (supabaseForbiddenValues.SUPABASE_JWT_SECRET.includes(String(value).trim())) {
      issues.push('SUPABASE_JWT_SECRET: must not use the example Supabase value in production')
    } else if (String(value).trim().length < 32) {
      issues.push('SUPABASE_JWT_SECRET: must be at least 32 characters')
    }
  }

  if (storageProvider === 'supabase' && isBlank(config.SUPABASE_STORAGE_BUCKET)) {
    issues.push('SUPABASE_STORAGE_BUCKET: is required when STORAGE_PROVIDER=supabase')
  }
  if (storageProvider === 'supabase' && isBlank(config.SUPABASE_KYC_BUCKET)) {
    issues.push('SUPABASE_KYC_BUCKET: is required when STORAGE_PROVIDER=supabase')
  }

  if (queueProvider === 'supabase-postgres') {
    const cronSecret = config.CRON_SECRET
    if (isBlank(cronSecret)) {
      issues.push('CRON_SECRET: is required when QUEUE_PROVIDER=supabase-postgres')
    } else if (productionForbiddenValues.CRON_SECRET?.includes(String(cronSecret).trim())) {
      issues.push('CRON_SECRET: must not use the example value in production')
    } else if (String(cronSecret).trim().length < 32) {
      issues.push('CRON_SECRET: must be at least 32 characters')
    }
  }

  return issues
}

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const result = envSchema.safeParse(withNonProductionDefaults(config))
  const parseIssues = result.success
    ? []
    : result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`)
  const productionIssues = collectProductionIssues(config)
  const issues = [...parseIssues, ...productionIssues]

  if (!result.success || productionIssues.length > 0) {
    throw new Error(`Invalid environment variables:\n${issues.map((issue) => `  - ${issue}`).join('\n')}`)
  }

  return result.data
}

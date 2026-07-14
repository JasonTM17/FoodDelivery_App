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
  'FOODFLOW_PROCESS_ROLE',
  'DATABASE_URL',
  'DIRECT_URL',
  'REDIS_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'PASSWORD_RESET_URL_BASE',
  'CORS_ORIGINS',
  'DELIVERY_BASE_FEE_VND',
] as const

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

const minioProductionRequiredKeys = [
  'MINIO_ENDPOINT',
  'MINIO_ACCESS_KEY',
  'MINIO_SECRET_KEY',
  'MINIO_PUBLIC_URL',
  'MINIO_KYC_BUCKET',
] as const

const productionGuardedKeys = [
  ...productionRequiredKeys,
  ...minioProductionRequiredKeys,
  ...optionalProviderKeys,
  'CRON_SECRET',
] as const

type ProductionRequiredKey = (typeof productionGuardedKeys)[number]

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
  SEPAY_ACCOUNT_NUMBER: ['your-sepay-account-number', '0000000000'],
  SEPAY_BANK_NAME: ['your-sepay-bank-name'],
  SEPAY_WEBHOOK_SECRET: [
    'your-sepay-webhook-secret',
    'your-sepay-webhook-secret-at-least-32-characters',
    'replace-with-rotated-sepay-hmac-secret-32-plus',
  ],
  WEBHOOK_SECRET: ['your-webhook-secret'],
  SMTP_HOST: ['smtp.example.com'],
  SMTP_USER: ['your-smtp-user'],
  SMTP_PASS: ['your-smtp-password'],
  FCM_PROJECT_ID: ['your-firebase-project-id'],
  TWILIO_ACCOUNT_SID: ['your-twilio-account-sid'],
  TWILIO_AUTH_TOKEN: ['your-twilio-auth-token'],
  TWILIO_FROM_NUMBER: ['your-twilio-from-number'],
  CRON_SECRET: ['your-cron-secret'],
}

const supabaseForbiddenValues = {
  SUPABASE_URL: ['https://your-project.supabase.co'],
  SUPABASE_SECRET_KEY: ['your-supabase-secret-key'],
  SUPABASE_PUBLISHABLE_KEY: ['your-supabase-publishable-key'],
  SUPABASE_SERVICE_ROLE_KEY: ['your-supabase-service-role-key'],
  SUPABASE_REALTIME_JWT_PRIVATE_KEY: ['your-es256-private-key'],
  SUPABASE_REALTIME_JWT_KEY_ID: ['your-supabase-signing-key-id'],
} satisfies Record<string, readonly string[]>

const postgresUrl = z.string().url().startsWith('postgresql://')
const redisUrl = z
  .string()
  .url()
  .refine(
    (value) => value.startsWith('redis://') || value.startsWith('rediss://'),
    'Must start with redis:// or rediss://',
  )
const deepSeekBaseUrl = z
  .string()
  .url()
  .transform(value => value.replace(/\/+$/, ''))
  .refine(value => value === 'https://api.deepseek.com', 'Must use the official DeepSeek API origin')

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  FOODFLOW_PROCESS_ROLE: z.enum(['api', 'worker']).optional(),
  REALTIME_PROVIDER: z.enum(['socketio', 'supabase']).default('socketio'),
  STORAGE_PROVIDER: z.enum(['minio', 'supabase']).default('minio'),
  QUEUE_PROVIDER: z.enum(['bullmq', 'supabase-postgres']).default('bullmq'),
  JOB_OUTBOX_POLL_INTERVAL_MS: z.coerce.number().int().min(100).max(60_000).default(1_000),
  JOB_OUTBOX_DRAIN_LIMIT: z.coerce.number().int().min(1).max(100).default(25),
  RAG_ENABLED: z.enum(['true', 'false']).default('true'),
  RAG_SYNC_INTERVAL_MS: z.coerce.number().int().min(60_000).max(86_400_000).default(300_000),
  RAG_SYNC_BATCH_SIZE: z.coerce.number().int().min(10).max(1_000).default(100),
  RAG_SYNC_CONCURRENCY: z.coerce.number().int().min(1).max(16).default(4),
  RAG_TOP_K: z.coerce.number().int().min(1).max(10).default(3),
  RAG_MIN_SIMILARITY: z.coerce.number().min(0).max(1).default(0.7),
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
  DEEPSEEK_BASE_URL: deepSeekBaseUrl.default('https://api.deepseek.com'),
  DEEPSEEK_MODEL: z.literal('deepseek-v4-flash').default('deepseek-v4-flash'),
  DEEPSEEK_EMBEDDING_MODEL: z.literal('text-embedding-v3').default('text-embedding-v3'),
  DEEPSEEK_TIMEOUT_MS: z.coerce.number().int().positive().max(60000).optional(),
  DEEPSEEK_MAX_OUTPUT_TOKENS: z.coerce.number().int().positive().max(8000).optional(),
  DEEPSEEK_THINKING: z.enum(['enabled', 'disabled']).default('disabled'),
  DEEPSEEK_REASONING_EFFORT: z.enum(['high', 'max']).default('high'),
  DEEPSEEK_DAILY_BUDGET_USD: z.coerce.number().nonnegative().optional(),
  GOOGLE_MAPS_API_KEY: z.string().optional(),
  OSRM_URL: z.string().url().optional(),
  SEPAY_API_KEY: z.string().optional(),
  SEPAY_ACCOUNT_NUMBER: z.string().regex(/^[A-Za-z0-9]{4,34}$/).optional(),
  SEPAY_BANK_NAME: z.string().regex(/^[A-Za-z0-9_-]{2,32}$/).optional(),
  SEPAY_WEBHOOK_SECRET: z.string().min(32).optional(),
  WEBHOOK_SECRET: z.string().optional(),
  CRON_SECRET: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_SECURE: z.enum(['true', 'false']).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().email().optional(),
  FCM_PROJECT_ID: z.string().min(1).optional(),
  FCM_SERVICE_ACCOUNT_JSON: z
    .string()
    .trim()
    .optional()
    .refine(value => value === undefined || value.length === 0 || isJsonObject(value), 'Must be a JSON object')
    .transform(value => value || undefined),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_FROM_NUMBER: z.string().optional(),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SECRET_KEY: z.string().optional(),
  SUPABASE_PUBLISHABLE_KEY: z.string().optional(),
  SUPABASE_REALTIME_JWT_PRIVATE_KEY: z.string().optional(),
  SUPABASE_REALTIME_JWT_KEY_ID: z.string().optional(),
  // Allows the legacy JWT to replace a missing opaque secret for the general
  // Supabase provider contract. Storage still requires its JWT separately.
  SUPABASE_ALLOW_LEGACY_KEYS: z.enum(['true', 'false']).default('false'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_STORAGE_BUCKET: z.string().optional(),
  SUPABASE_KYC_BUCKET: z.literal('foodflow-private').optional(),
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

function isJsonObject(value: string): boolean {
  try {
    const parsed: unknown = JSON.parse(value)
    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
  } catch {
    return false
  }
}

function collectProductionIssues(config: Record<string, unknown>): string[] {
  if (resolveNodeEnv(config) !== 'production') return []

  const issues: string[] = []
  for (const key of productionRequiredKeys) {
    const value = config[key]
    if (isBlank(value)) {
      issues.push(`${key}: is required in production`)
    }
  }

  // Optional providers do not block process startup. When configured, their
  // values must still pass the same production placeholder/default guards.
  for (const key of productionGuardedKeys) {
    const forbiddenValues = productionForbiddenValues[key]
    const value = config[key]
    if (!isBlank(value) && forbiddenValues?.includes(String(value).trim())) {
      issues.push(`${key}: must not use the local development default in production`)
    }
  }

  for (const group of [
    ['SEPAY_ACCOUNT_NUMBER', 'SEPAY_BANK_NAME', 'SEPAY_WEBHOOK_SECRET'],
    ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'],
    ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_FROM_NUMBER'],
  ] as const) {
    const configuredKeys = group.filter(key => !isBlank(config[key]))
    if (configuredKeys.length > 0 && configuredKeys.length < group.length) {
      const missingKeys = group.filter(key => isBlank(config[key]))
      issues.push(`Incomplete provider configuration; missing ${missingKeys.join(', ')}`)
    }
  }

  if (isBlank(config.FCM_PROJECT_ID) && !isBlank(config.FCM_SERVICE_ACCOUNT_JSON)) {
    issues.push('Incomplete provider configuration; missing FCM_PROJECT_ID')
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
    for (const key of ['SUPABASE_URL'] as const) {
      const value = config[key]
      if (isBlank(value)) {
        issues.push(`${key}: is required when a Supabase provider is enabled`)
        continue
      }
      if (supabaseForbiddenValues[key].includes(String(value).trim())) {
        issues.push(`${key}: must not use the example Supabase value in production`)
      }
    }
    const secretKey = config.SUPABASE_SECRET_KEY
    const legacyKey = config.SUPABASE_SERVICE_ROLE_KEY
    if (isBlank(secretKey)) {
      if (config.SUPABASE_ALLOW_LEGACY_KEYS !== 'true' || isBlank(legacyKey)) {
        issues.push('SUPABASE_SECRET_KEY: is required when a Supabase provider is enabled')
      }
    } else if (supabaseForbiddenValues.SUPABASE_SECRET_KEY.includes(String(secretKey).trim())) {
      issues.push('SUPABASE_SECRET_KEY: must not use the example Supabase value in production')
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
    for (const key of [
      'SUPABASE_PUBLISHABLE_KEY',
      'SUPABASE_REALTIME_JWT_PRIVATE_KEY',
      'SUPABASE_REALTIME_JWT_KEY_ID',
    ] as const) {
      const value = config[key]
      if (isBlank(value)) {
        issues.push(`${key}: is required when REALTIME_PROVIDER=supabase`)
      } else if (supabaseForbiddenValues[key].includes(String(value).trim())) {
        issues.push(`${key}: must not use the example Supabase value in production`)
      }
    }
  }

  if (storageProvider === 'supabase' && isBlank(config.SUPABASE_STORAGE_BUCKET)) {
    issues.push('SUPABASE_STORAGE_BUCKET: is required when STORAGE_PROVIDER=supabase')
  }
  if (storageProvider === 'supabase' && isBlank(config.SUPABASE_KYC_BUCKET)) {
    issues.push('SUPABASE_KYC_BUCKET: is required when STORAGE_PROVIDER=supabase')
  }
  if (storageProvider === 'supabase') {
    const serviceRoleKey = config.SUPABASE_SERVICE_ROLE_KEY
    if (isBlank(serviceRoleKey)) {
      issues.push(
        'SUPABASE_SERVICE_ROLE_KEY: is required when STORAGE_PROVIDER=supabase because Storage authorization requires a JWT',
      )
    } else if (
      supabaseForbiddenValues.SUPABASE_SERVICE_ROLE_KEY.includes(
        String(serviceRoleKey).trim(),
      )
    ) {
      issues.push(
        'SUPABASE_SERVICE_ROLE_KEY: must not use the example Supabase value in production',
      )
    }
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

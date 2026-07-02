import { z } from 'zod'

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  DATABASE_URL: z.string().url().startsWith('postgresql://'),
  REDIS_URL: z.string().url().startsWith('redis://'),
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  CORS_ORIGINS: z.string().default('http://localhost:3000'),
  MINIO_ENDPOINT: z.string().default('localhost'),
  MINIO_PORT: z.coerce.number().int().positive().default(9000),
  MINIO_ACCESS_KEY: z.string().min(3),
  MINIO_SECRET_KEY: z.string().min(8),
  MINIO_BUCKET: z.string().default('foodflow'),
  MINIO_PUBLIC_URL: z.string().url().default('http://localhost:9000'),
  N8N_WEBHOOK_URL: z.string().optional(),
  N8N_API_KEY: z.string().optional(),
  AI_CHAT_PROVIDER: z.enum(['n8n', 'deepseek']).optional(),
  DEEPSEEK_API_KEY: z.string().optional(),
  DEEPSEEK_BASE_URL: z.string().url().optional(),
  DEEPSEEK_MODEL: z.string().min(1).optional(),
  DEEPSEEK_TIMEOUT_MS: z.coerce.number().int().positive().max(60000).optional(),
  DEEPSEEK_MAX_OUTPUT_TOKENS: z.coerce.number().int().positive().max(8000).optional(),
  DEEPSEEK_THINKING: z.enum(['enabled', 'disabled']).default('disabled'),
  DEEPSEEK_REASONING_EFFORT: z.enum(['high', 'max']).default('high'),
  DEEPSEEK_DAILY_BUDGET_USD: z.coerce.number().nonnegative().optional(),
  GOOGLE_MAPS_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  // Ed25519 dual-verify (Phase 1 cutover — Phase 2 will flip signing)
  JWT_ED25519_PRIVATE_KEY: z.string().optional(),
  JWT_ED25519_PUBLIC_KEY: z.string().optional(),
  LEGACY_HS256_FALLBACK: z.enum(['true', 'false']).default('true'),
})

export type EnvConfig = z.infer<typeof envSchema>

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const result = envSchema.safeParse(config)
  if (!result.success) {
    console.error('❌ Invalid environment variables:')
    for (const issue of result.error.issues) {
      console.error(`  - ${issue.path.join('.')}: ${issue.message}`)
    }
    process.exit(1)
  }
  return result.data
}

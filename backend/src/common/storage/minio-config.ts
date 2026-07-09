import { ConfigService } from '@nestjs/config'

export interface MinioRuntimeConfig {
  client: {
    endPoint: string
    port: number
    useSSL: boolean
    accessKey: string
    secretKey: string
  }
  bucket: string
  publicUrl?: string
}

interface ResolveMinioConfigOptions {
  requirePublicUrl?: boolean
}

const LOCAL_MINIO_DEFAULTS = {
  endpoint: 'localhost',
  port: 9000,
  accessKey: 'minioadmin',
  secretKey: 'minioadmin',
  bucket: 'foodflow',
  publicUrl: 'http://localhost:9000',
} as const

export function resolveMinioRuntimeConfig(
  config: ConfigService,
  options: ResolveMinioConfigOptions = {},
): MinioRuntimeConfig {
  const isProduction = resolveNodeEnv(config) === 'production'
  const endpoint = requireStringConfig(config, 'MINIO_ENDPOINT', {
    fallback: LOCAL_MINIO_DEFAULTS.endpoint,
    isProduction,
  })
  const accessKey = requireStringConfig(config, 'MINIO_ACCESS_KEY', {
    fallback: LOCAL_MINIO_DEFAULTS.accessKey,
    isProduction,
  })
  const secretKey = requireStringConfig(config, 'MINIO_SECRET_KEY', {
    fallback: LOCAL_MINIO_DEFAULTS.secretKey,
    isProduction,
  })
  const publicUrl = options.requirePublicUrl
    ? requireStringConfig(config, 'MINIO_PUBLIC_URL', {
        fallback: LOCAL_MINIO_DEFAULTS.publicUrl,
        isProduction,
      })
    : optionalStringConfig(config, 'MINIO_PUBLIC_URL')

  // Client TLS is independent of public CDN URL (often HTTPS edge, HTTP in-cluster).
  const useSslRaw = optionalStringConfig(config, 'MINIO_USE_SSL')
  const useSSL =
    useSslRaw === 'true'
      ? true
      : useSslRaw === 'false'
        ? false
        : endpoint !== 'localhost' && endpoint !== 'minio' && endpoint !== '127.0.0.1'
          ? Boolean(publicUrl?.startsWith('https://'))
          : false

  return {
    client: {
      endPoint: endpoint,
      port: positiveIntegerConfig(config, 'MINIO_PORT', LOCAL_MINIO_DEFAULTS.port),
      useSSL,
      accessKey,
      secretKey,
    },
    bucket: optionalStringConfig(config, 'MINIO_BUCKET') ?? LOCAL_MINIO_DEFAULTS.bucket,
    publicUrl,
  }
}

function resolveNodeEnv(config: ConfigService): string {
  return optionalStringConfig(config, 'NODE_ENV') ?? process.env.NODE_ENV ?? 'development'
}

function requireStringConfig(
  config: ConfigService,
  key: string,
  {
    fallback,
    isProduction,
  }: {
    fallback: string
    isProduction: boolean
  },
): string {
  const configured = optionalStringConfig(config, key)
  if (configured) return configured
  if (!isProduction) return fallback
  throw new Error(`${key} is required in production`)
}

function optionalStringConfig(config: ConfigService, key: string): string | undefined {
  const value = config.get<string | number>(key)
  if (value === undefined || value === null) return undefined
  const stringValue = String(value).trim()
  return stringValue.length > 0 ? stringValue : undefined
}

function positiveIntegerConfig(config: ConfigService, key: string, fallback: number): number {
  const value = config.get<string | number>(key)
  const parsed = value === undefined || value === null || value === ''
    ? fallback
    : Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : fallback
}

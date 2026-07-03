const LOCAL_DEV_CORS_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3002',
  'http://localhost:3003',
] as const

export function parseCorsOrigins(configuredOrigins: string): string[] {
  const origins = configuredOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

  if (origins.length === 0) {
    throw new Error('CORS_ORIGINS must include at least one origin')
  }

  return origins
}

export function resolveCorsOrigins(
  configuredOrigins: string | undefined,
  nodeEnv = process.env.NODE_ENV,
): string[] {
  const trimmedOrigins = configuredOrigins?.trim()
  if (trimmedOrigins) return parseCorsOrigins(trimmedOrigins)

  if (nodeEnv === 'production') {
    throw new Error('CORS_ORIGINS is required in production')
  }

  return [...LOCAL_DEV_CORS_ORIGINS]
}

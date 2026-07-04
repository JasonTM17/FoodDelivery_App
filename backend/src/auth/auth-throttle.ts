const AUTH_THROTTLE_TTL_MS = 60_000
const MAX_NON_PRODUCTION_AUTH_LIMIT = 1_000

type EnvLike = Partial<Record<'AUTH_PUBLIC_THROTTLE_LIMIT' | 'NODE_ENV', string>>

export function resolvePublicAuthThrottleLimit(defaultLimit: number, env: EnvLike = process.env): number {
  if (env.NODE_ENV === 'production') return defaultLimit

  const rawLimit = env.AUTH_PUBLIC_THROTTLE_LIMIT
  if (!rawLimit) return defaultLimit

  const parsedLimit = Number(rawLimit)
  if (
    !Number.isInteger(parsedLimit) ||
    parsedLimit < defaultLimit ||
    parsedLimit > MAX_NON_PRODUCTION_AUTH_LIMIT
  ) {
    return defaultLimit
  }

  return parsedLimit
}

export function publicAuthThrottle(defaultLimit: number): { default: { limit: number; ttl: number } } {
  return {
    default: {
      limit: resolvePublicAuthThrottleLimit(defaultLimit),
      ttl: AUTH_THROTTLE_TTL_MS,
    },
  }
}

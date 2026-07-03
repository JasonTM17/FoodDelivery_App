import { resolveCorsOrigins } from '../config/cors-origins'

type CorsEnv = {
  CORS_ORIGINS?: string
  NODE_ENV?: string
}

export function websocketCorsOrigins(
  env: CorsEnv = process.env,
): string[] {
  return resolveCorsOrigins(env.CORS_ORIGINS, env.NODE_ENV)
}

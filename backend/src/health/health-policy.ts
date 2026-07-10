export type ComponentStatus = {
  status: 'up' | 'down'
  latencyMs: number
}

export type StorageComponentStatus = ComponentStatus & {
  provider: 'minio' | 'supabase'
}

export type HealthComponents = {
  db: ComponentStatus
  redis: ComponentStatus
  storage: StorageComponentStatus
}

/**
 * Database and Redis are required for API liveness. Storage is reported
 * honestly, but a transient outage must not make otherwise healthy API
 * instances fail the platform liveness probe.
 */
export function resolveHealthOutcome(components: HealthComponents): {
  status: 'ok' | 'degraded'
  httpStatus: number
  requiredOk: boolean
} {
  const requiredOk =
    components.db.status === 'up' && components.redis.status === 'up'
  const allUp = requiredOk && components.storage.status === 'up'

  if (allUp) {
    return { status: 'ok', httpStatus: 200, requiredOk: true }
  }
  if (requiredOk) {
    return { status: 'degraded', httpStatus: 200, requiredOk: true }
  }
  return { status: 'degraded', httpStatus: 503, requiredOk: false }
}

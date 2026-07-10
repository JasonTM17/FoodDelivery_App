export type ComponentStatus = {
  status: 'up' | 'down'
  latencyMs: number
}

export type HealthComponents = {
  db: ComponentStatus
  redis: ComponentStatus
  minio: ComponentStatus
}

/**
 * Required: DB + Redis. MinIO is optional storage — report honestly as a
 * component but do not take the process liveness offline solely for MinIO.
 */
export function resolveHealthOutcome(components: HealthComponents): {
  status: 'ok' | 'degraded'
  httpStatus: number
  requiredOk: boolean
} {
  const requiredOk =
    components.db.status === 'up' && components.redis.status === 'up'
  const allUp = requiredOk && components.minio.status === 'up'

  if (allUp) {
    return { status: 'ok', httpStatus: 200, requiredOk: true }
  }
  if (requiredOk) {
    // Critical path live; optional storage degraded
    return { status: 'degraded', httpStatus: 200, requiredOk: true }
  }
  return { status: 'degraded', httpStatus: 503, requiredOk: false }
}

import { resolveHealthOutcome } from './health-policy'

const up = { status: 'up' as const, latencyMs: 1 }
const down = { status: 'down' as const, latencyMs: 5 }

describe('resolveHealthOutcome', () => {
  it('returns 200 ok when db, redis, and minio are up', () => {
    const result = resolveHealthOutcome({ db: up, redis: up, minio: up })
    expect(result).toEqual({ status: 'ok', httpStatus: 200, requiredOk: true })
  })

  it('returns 200 degraded when only MinIO is down (optional storage)', () => {
    const result = resolveHealthOutcome({ db: up, redis: up, minio: down })
    expect(result.httpStatus).toBe(200)
    expect(result.status).toBe('degraded')
    expect(result.requiredOk).toBe(true)
  })

  it('returns 503 when database is down even if MinIO is up', () => {
    const result = resolveHealthOutcome({ db: down, redis: up, minio: up })
    expect(result.httpStatus).toBe(503)
    expect(result.status).toBe('degraded')
    expect(result.requiredOk).toBe(false)
  })

  it('returns 503 when redis is down', () => {
    const result = resolveHealthOutcome({ db: up, redis: down, minio: up })
    expect(result.httpStatus).toBe(503)
    expect(result.requiredOk).toBe(false)
  })
})

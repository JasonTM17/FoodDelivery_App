import { resolveHealthOutcome } from './health-policy'

const up = { status: 'up' as const, latencyMs: 1 }
const down = { status: 'down' as const, latencyMs: 5 }
const storageUp = { ...up, provider: 'minio' as const }
const storageDown = { ...down, provider: 'minio' as const }

describe('resolveHealthOutcome', () => {
  it('returns 200 ok when database, Redis, and storage are up', () => {
    const result = resolveHealthOutcome({
      db: up,
      redis: up,
      storage: storageUp,
    })
    expect(result).toEqual({ status: 'ok', httpStatus: 200, requiredOk: true })
  })

  it('returns 200 degraded when only storage is down', () => {
    const result = resolveHealthOutcome({
      db: up,
      redis: up,
      storage: storageDown,
    })
    expect(result.httpStatus).toBe(200)
    expect(result.status).toBe('degraded')
    expect(result.requiredOk).toBe(true)
  })

  it('returns 503 when database is down even if storage is up', () => {
    const result = resolveHealthOutcome({
      db: down,
      redis: up,
      storage: storageUp,
    })
    expect(result.httpStatus).toBe(503)
    expect(result.status).toBe('degraded')
    expect(result.requiredOk).toBe(false)
  })

  it('returns 503 when Redis is down', () => {
    const result = resolveHealthOutcome({
      db: up,
      redis: down,
      storage: storageUp,
    })
    expect(result.httpStatus).toBe(503)
    expect(result.requiredOk).toBe(false)
  })
})

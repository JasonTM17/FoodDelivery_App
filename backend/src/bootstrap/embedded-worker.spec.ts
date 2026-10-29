import type { INestApplication } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JobOutboxService } from '../common/queue/job-outbox.service'
import { createRuntimeShutdown, listenWithEmbeddedWorker, startEmbeddedWorker } from './embedded-worker'
import type { PostgresJobOutboxWorkerService } from '../workers/postgres-job-outbox-worker.service'

describe('embedded free-demo worker lifecycle', () => {
  afterEach(() => { jest.useRealTimers(); delete process.env.VERCEL })
  function fixture(overrides: Record<string, string | undefined> = {}) {
    const values: Record<string, string | undefined> = { FOODFLOW_EMBEDDED_WORKER: 'true', FOODFLOW_PROCESS_ROLE: 'api', QUEUE_PROVIDER: 'supabase-postgres', ...overrides }
    const drain = jest.fn().mockResolvedValue({ claimed: 0 })
    const config = { get: (key: string, fallback?: unknown) => values[key] ?? fallback }
    const app = { get: jest.fn(token => token === ConfigService ? config : token === JobOutboxService ? { drain } : undefined), close: jest.fn().mockResolvedValue(undefined) } as unknown as INestApplication
    return { app, drain }
  }
  it('does not start unless explicitly enabled', () => {
    const { app, drain } = fixture({ FOODFLOW_EMBEDDED_WORKER: 'false' })
    expect(startEmbeddedWorker(app)).toBeUndefined()
    expect(drain).not.toHaveBeenCalled()
  })
  it.each([{ FOODFLOW_PROCESS_ROLE: 'worker' }, { QUEUE_PROVIDER: 'bullmq' }])('rejects incompatible configuration %p', overrides => {
    expect(() => startEmbeddedWorker(fixture(overrides).app)).toThrow(/persistent API/)
  })
  it('rejects Vercel Functions', () => {
    process.env.VERCEL = '1'
    expect(() => startEmbeddedWorker(fixture().app)).toThrow(/persistent API/)
  })
  it('starts one loop, prevents overlap and drains before closing dependencies once', async () => {
    jest.useFakeTimers()
    const { app, drain } = fixture()
    let release!: (value: unknown) => void
    drain.mockImplementationOnce(() => new Promise(resolve => { release = resolve }))
    const worker = startEmbeddedWorker(app)
    await jest.advanceTimersByTimeAsync(3000)
    expect(drain).toHaveBeenCalledTimes(1)
    const shutdown = createRuntimeShutdown(app, worker)
    const first = shutdown()
    expect(shutdown()).toBe(first)
    expect(app.close).not.toHaveBeenCalled()
    release({ claimed: 0 })
    await first
    expect(app.close).toHaveBeenCalledTimes(1)
    await jest.advanceTimersByTimeAsync(3000)
    expect(drain).toHaveBeenCalledTimes(1)
  })
  it('still closes the app exactly once when an in-flight drain rejects', async () => {
    const { app } = fixture()
    const worker = { onApplicationShutdown: jest.fn().mockRejectedValue(new Error('database unavailable')) } as unknown as PostgresJobOutboxWorkerService
    const shutdown = createRuntimeShutdown(app, worker)
    const first = shutdown()
    expect(shutdown()).toBe(first)
    await expect(first).rejects.toThrow('database unavailable')
    expect(app.close).toHaveBeenCalledTimes(1)
  })
  it.each(['init', 'listen'] as const)('cleans up after %s failure', async stage => {
    jest.useFakeTimers()
    const { app, drain } = fixture()
    app.init = jest.fn().mockResolvedValue(app)
    app.listen = jest.fn().mockResolvedValue(undefined)
    ;(app[stage] as jest.Mock).mockRejectedValueOnce(new Error(stage+' failure'))
    await expect(listenWithEmbeddedWorker(app, 3001)).rejects.toThrow(stage+' failure')
    expect(app.close).toHaveBeenCalledTimes(1)
    const calls = drain.mock.calls.length
    await jest.advanceTimersByTimeAsync(3000)
    expect(drain).toHaveBeenCalledTimes(calls)
  })
})

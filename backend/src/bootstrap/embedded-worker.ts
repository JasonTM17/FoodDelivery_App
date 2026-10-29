import type { INestApplication } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JobOutboxService } from '../common/queue/job-outbox.service'
import { PostgresJobOutboxWorkerService } from '../workers/postgres-job-outbox-worker.service'

/** Explicit free-demo mode: one API graph and one durable queue poller. */
export function startEmbeddedWorker(app: INestApplication): PostgresJobOutboxWorkerService | undefined {
  const config = app.get(ConfigService)
  if (config.get<string>('FOODFLOW_EMBEDDED_WORKER') !== 'true') return
  if (config.get<string>('FOODFLOW_PROCESS_ROLE') !== 'api'
    || config.get<string>('QUEUE_PROVIDER') !== 'supabase-postgres'
    || process.env.VERCEL === '1') {
    throw new Error('Embedded worker requires a persistent API with the Postgres queue')
  }
  const worker = new PostgresJobOutboxWorkerService(config, app.get(JobOutboxService))
  worker.onModuleInit()
  return worker
}

export function createRuntimeShutdown(app: INestApplication, worker?: PostgresJobOutboxWorkerService): () => Promise<void> {
  let shutdown: Promise<void> | undefined
  return () => shutdown ??= (async () => {
    // Prisma/Redis must remain connected until the in-flight drain finishes.
    try {
      await worker?.onApplicationShutdown()
    } finally {
      await app.close()
    }
  })()
}

export async function listenWithEmbeddedWorker(app: INestApplication, port: number): Promise<() => Promise<void>> {
  let shutdown = createRuntimeShutdown(app)
  try {
    await app.init()
    shutdown = createRuntimeShutdown(app, startEmbeddedWorker(app))
    await app.listen(port)
    return shutdown
  } catch (error) {
    await shutdown()
    throw error
  }
}

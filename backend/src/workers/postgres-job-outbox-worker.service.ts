import { Injectable, Logger, OnApplicationShutdown, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JobOutboxService } from '../common/queue/job-outbox.service'

const DEFAULT_DRAIN_LIMIT = 25
const DEFAULT_POLL_INTERVAL_MS = 1_000

type JobDrainStats = {
  claimed: number
  completed: number
  failed: number
  retried: number
}

@Injectable()
export class PostgresJobOutboxWorkerService implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(PostgresJobOutboxWorkerService.name)
  private readonly drainLimit: number
  private readonly pollIntervalMs: number
  private interval: ReturnType<typeof setInterval> | null = null
  private inFlightDrain: Promise<void> | null = null
  private stopping = false

  constructor(
    private readonly config: ConfigService,
    private readonly jobs: JobOutboxService,
  ) {
    this.drainLimit = config.get<number>('JOB_OUTBOX_DRAIN_LIMIT', DEFAULT_DRAIN_LIMIT)
    this.pollIntervalMs = config.get<number>('JOB_OUTBOX_POLL_INTERVAL_MS', DEFAULT_POLL_INTERVAL_MS)
  }

  onModuleInit(): void {
    if (this.config.get<string>('QUEUE_PROVIDER') !== 'supabase-postgres') {
      this.logger.log('Postgres job outbox worker disabled because QUEUE_PROVIDER is not supabase-postgres')
      return
    }

    this.scheduleDrain()
    this.interval = setInterval(() => this.scheduleDrain(), this.pollIntervalMs)
    this.logger.log(`Postgres job outbox worker polling every ${this.pollIntervalMs}ms`)
  }

  async onApplicationShutdown(): Promise<void> {
    this.stopping = true
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
    await this.inFlightDrain
  }

  private scheduleDrain(): void {
    if (this.stopping || this.inFlightDrain) return

    const drain = this.drainUntilCaughtUp()
    this.inFlightDrain = drain
    void drain
      .catch(() => this.logger.error('Postgres job outbox drain failed'))
      .finally(() => {
        if (this.inFlightDrain === drain) this.inFlightDrain = null
      })
  }

  private async drainUntilCaughtUp(): Promise<void> {
    while (!this.stopping) {
      const stats = await this.jobs.drain(this.drainLimit) as JobDrainStats
      if (stats.claimed < this.drainLimit) return
    }
  }
}

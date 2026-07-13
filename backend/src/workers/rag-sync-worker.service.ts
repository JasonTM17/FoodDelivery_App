import { Injectable, Logger, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { RagIndexerService } from '../ai/rag/rag-indexer.service'

const DEFAULT_SYNC_INTERVAL_MS = 300_000

@Injectable()
export class RagSyncWorkerService implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(RagSyncWorkerService.name)
  private readonly enabled: boolean
  private readonly intervalMs: number
  private interval: ReturnType<typeof setInterval> | null = null
  private running = false

  constructor(
    private readonly indexer: RagIndexerService,
    config: ConfigService,
  ) {
    this.enabled = config.get<string>('RAG_ENABLED', 'true') === 'true'
    this.intervalMs = config.get<number>('RAG_SYNC_INTERVAL_MS', DEFAULT_SYNC_INTERVAL_MS)
  }

  onApplicationBootstrap(): void {
    if (!this.enabled) {
      this.logger.log('RAG sync disabled')
      return
    }

    this.scheduleSync()
    this.interval = setInterval(() => this.scheduleSync(), this.intervalMs)
    this.interval.unref?.()
    this.logger.log(`RAG sync scheduled every ${this.intervalMs}ms`)
  }

  onApplicationShutdown(): void {
    if (this.interval) clearInterval(this.interval)
    this.interval = null
  }

  private scheduleSync(): void {
    if (this.running) {
      this.logger.warn('Skipping overlapping RAG sync')
      return
    }

    this.running = true
    void this.indexer.syncDynamicData()
      .catch(error => {
        this.logger.error(`RAG sync failed: ${error instanceof Error ? error.message : 'UNKNOWN'}`)
      })
      .finally(() => {
        this.running = false
      })
  }
}

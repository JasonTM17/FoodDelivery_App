import { ConfigService } from '@nestjs/config'
import { RagIndexerService } from '../ai/rag/rag-indexer.service'
import { RagSyncWorkerService } from './rag-sync-worker.service'

describe('RagSyncWorkerService', () => {
  beforeEach(() => jest.useFakeTimers())
  afterEach(() => jest.useRealTimers())

  it('runs immediately, prevents overlap, and stops its interval on shutdown', async () => {
    let finishFirstSync: (() => void) | undefined
    const firstSync = new Promise<void>(resolve => {
      finishFirstSync = resolve
    })
    const indexer = {
      syncDynamicData: jest.fn()
        .mockReturnValueOnce(firstSync)
        .mockResolvedValue({ indexed: 0, unchanged: 0, failed: 0, deactivated: 0 }),
    } as unknown as RagIndexerService
    const config = {
      get: jest.fn((key: string, fallback: string | number) => ({
        RAG_ENABLED: 'true',
        RAG_SYNC_INTERVAL_MS: 60_000,
      })[key] ?? fallback),
    } as unknown as ConfigService
    const worker = new RagSyncWorkerService(indexer, config)

    worker.onApplicationBootstrap()
    expect(indexer.syncDynamicData).toHaveBeenCalledTimes(1)

    jest.advanceTimersByTime(60_000)
    expect(indexer.syncDynamicData).toHaveBeenCalledTimes(1)

    finishFirstSync?.()
    await Promise.resolve()
    await Promise.resolve()
    jest.advanceTimersByTime(60_000)
    expect(indexer.syncDynamicData).toHaveBeenCalledTimes(2)

    worker.onApplicationShutdown()
    jest.advanceTimersByTime(60_000)
    expect(indexer.syncDynamicData).toHaveBeenCalledTimes(2)
  })
})

import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../../database/prisma.service'
import type { KnowledgeEntry } from './rag-document.types'
import { RagDocumentRepository } from './rag-document.repository'
import {
  mapMenuItemToKnowledgeEntry,
  mapRestaurantToKnowledgeEntry,
  ragMenuItemSelect,
  ragRestaurantSelect,
} from './rag-source-entry.mapper'

const DEFAULT_BATCH_SIZE = 100
const DEFAULT_CONCURRENCY = 4

export interface RagSyncResult {
  indexed: number
  unchanged: number
  failed: number
  deactivated: number
}

@Injectable()
export class RagIndexerService {
  private readonly logger = new Logger(RagIndexerService.name)
  private readonly batchSize: number
  private readonly concurrency: number

  constructor(
    private readonly prisma: PrismaService,
    private readonly documents: RagDocumentRepository,
    config: ConfigService,
  ) {
    this.batchSize = config.get<number>('RAG_SYNC_BATCH_SIZE', DEFAULT_BATCH_SIZE)
    this.concurrency = config.get<number>('RAG_SYNC_CONCURRENCY', DEFAULT_CONCURRENCY)
  }

  /** Synchronize searchable documents from live business tables without demo fixtures. */
  async syncDynamicData(): Promise<RagSyncResult> {
    const menuResult = await this.syncMenuItems()
    const restaurantResult = await this.syncRestaurants()
    const result = this.combineResults(menuResult, restaurantResult)

    this.logger.log(
      `RAG sync complete — indexed: ${result.indexed}, unchanged: ${result.unchanged}, failed: ${result.failed}, deactivated: ${result.deactivated}`,
    )
    return result
  }

  /** Backwards-compatible entry point used by operational tooling. */
  async reindexAll(): Promise<RagSyncResult> {
    return this.syncDynamicData()
  }

  async indexMenuItems(): Promise<number> {
    const result = await this.syncMenuItems()
    this.logger.log(
      `Menu RAG sync complete — indexed: ${result.indexed}, unchanged: ${result.unchanged}, failed: ${result.failed}, deactivated: ${result.deactivated}`,
    )
    return result.indexed
  }

  private async syncMenuItems(): Promise<RagSyncResult> {
    const result = await this.readPages(async cursor => {
      return this.prisma.menuItem.findMany({
        where: { isAvailable: true, category: { isVisible: true } },
        orderBy: { id: 'asc' },
        take: this.batchSize,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        select: ragMenuItemSelect,
      })
    }, mapMenuItemToKnowledgeEntry)

    if (result.failed === 0) {
      result.deactivated = await this.documents.deactivateMissingMenuItems()
    }

    return result
  }

  private async syncRestaurants(): Promise<RagSyncResult> {
    const result = await this.readPages(async cursor => {
      return this.prisma.restaurant.findMany({
        where: { isActive: true, isOpen: true, approvalStatus: 'approved' },
        orderBy: { id: 'asc' },
        take: this.batchSize,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        select: ragRestaurantSelect,
      })
    }, mapRestaurantToKnowledgeEntry)

    if (result.failed === 0) {
      result.deactivated = await this.documents.deactivateMissingRestaurants()
    }

    return result
  }

  private async readPages<T extends { id: string }>(
    readPage: (cursor?: string) => Promise<T[]>,
    toEntry: (source: T) => KnowledgeEntry,
  ): Promise<RagSyncResult> {
    const result: RagSyncResult = { indexed: 0, unchanged: 0, failed: 0, deactivated: 0 }
    let cursor: string | undefined

    while (true) {
      const sources = await readPage(cursor)
      if (sources.length === 0) break

      const pageResult = await this.indexEntries(sources.map(toEntry))
      result.indexed += pageResult.indexed
      result.unchanged += pageResult.unchanged
      result.failed += pageResult.failed

      if (sources.length < this.batchSize) break
      cursor = sources[sources.length - 1]?.id
      if (!cursor) break
    }

    return result
  }

  private async indexEntries(
    entries: KnowledgeEntry[],
  ): Promise<Pick<RagSyncResult, 'indexed' | 'unchanged' | 'failed'>> {
    let indexed = 0
    let failed = 0
    const prepared = await this.documents.prepareChanged(entries)

    for (let offset = 0; offset < prepared.changed.length; offset += this.concurrency) {
      const chunk = prepared.changed.slice(offset, offset + this.concurrency)
      const outcomes = await Promise.all(chunk.map(async document => {
        try {
          await this.documents.upsert(document.entry, document.contentHash)
          return true
        } catch (error) {
          this.logger.warn(
            `Failed to index source ${document.entry.sourceId}: ${error instanceof Error ? error.message : 'UNKNOWN'}`,
          )
          return false
        }
      }))

      indexed += outcomes.filter(Boolean).length
      failed += outcomes.filter(outcome => !outcome).length
    }

    return { indexed, unchanged: prepared.unchanged, failed }
  }

  private combineResults(...results: RagSyncResult[]): RagSyncResult {
    return results.reduce((combined, result) => ({
      indexed: combined.indexed + result.indexed,
      unchanged: combined.unchanged + result.unchanged,
      failed: combined.failed + result.failed,
      deactivated: combined.deactivated + result.deactivated,
    }), { indexed: 0, unchanged: 0, failed: 0, deactivated: 0 })
  }
}

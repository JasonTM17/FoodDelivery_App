import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../../database/prisma.service'
import { RagEmbeddingService } from './rag-embedding.service'
import type { KnowledgeEntry } from './rag-document.types'
import { FAQ_VI } from '../knowledge/faq.vi'
import { FAQ_EN } from '../knowledge/faq.en'
import { POLICIES } from '../knowledge/policies'

const STATIC_KNOWLEDGE: KnowledgeEntry[] = [...FAQ_VI, ...FAQ_EN, ...POLICIES]

@Injectable()
export class RagIndexerService implements OnApplicationBootstrap {
  private readonly logger = new Logger(RagIndexerService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly embedding: RagEmbeddingService,
    private readonly config: ConfigService,
  ) {}

  /** Called once at startup. Only indexes if the collection is empty. */
  async onApplicationBootstrap(): Promise<void> {
    if (!this.ragEnabled()) {
      this.logger.log('RAG disabled — skipping indexing')
      return
    }

    try {
      const count = await this.prisma.ragDocument.count({ where: { isActive: true } })
      if (count > 0) {
        this.logger.log(`RAG index already has ${count} documents — skipping bootstrap indexing`)
        return
      }
      this.logger.log('RAG index empty — running initial indexing…')
      await this.reindexAll()
    } catch (err) {
      // pgvector or table might not exist yet — non-fatal
      this.logger.warn(`RAG bootstrap indexing skipped: ${err instanceof Error ? err.message : 'UNKNOWN'}`)
    }
  }

  /**
   * Delete all documents and re-index everything from scratch.
   * Includes static FAQ/policies + dynamic menu and restaurant data.
   */
  async reindexAll(): Promise<{ indexed: number; failed: number }> {
    let indexed = 0
    let failed = 0

    // Wipe existing docs
    try {
      await this.prisma.ragDocument.deleteMany({})
    } catch {
      // table may not exist yet
    }

    const dynamicEntries = await this.buildDynamicEntries()
    const allEntries: KnowledgeEntry[] = [...STATIC_KNOWLEDGE, ...dynamicEntries]

    this.logger.log(`Indexing ${allEntries.length} RAG documents…`)

    for (const entry of allEntries) {
      try {
        await this.upsertDocument(entry)
        indexed++
      } catch (err) {
        this.logger.warn(`Failed to index "${entry.title}": ${err instanceof Error ? err.message : 'UNKNOWN'}`)
        failed++
      }
    }

    this.logger.log(`RAG indexing complete — indexed: ${indexed}, failed: ${failed}`)
    return { indexed, failed }
  }

  /**
   * Index (or re-index) all available menu items from the database.
   * Useful for periodic refresh without rebuilding everything.
   */
  async indexMenuItems(): Promise<number> {
    const entries = await this.buildMenuEntries()
    let count = 0

    for (const entry of entries) {
      try {
        await this.upsertDocument(entry)
        count++
      } catch {
        // skip individual failures
      }
    }

    this.logger.log(`Re-indexed ${count} menu item RAG documents`)
    return count
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private async upsertDocument(entry: KnowledgeEntry): Promise<void> {
    const embeddingText = `${entry.title}\n${entry.content}`
    const vector = await this.embedding.embed(embeddingText)

    if (vector) {
      const literal = this.embedding.vectorLiteral(vector)
      // Use raw query to set the vector column (Unsupported type in Prisma)
      await this.prisma.$executeRaw`
        INSERT INTO rag_documents (id, doc_type, locale, title, content, source_id, embedding, is_active, created_at, updated_at)
        VALUES (
          gen_random_uuid(),
          ${entry.docType},
          ${entry.locale},
          ${entry.title},
          ${entry.content},
          ${entry.sourceId ?? null},
          ${literal}::vector,
          true,
          NOW(),
          NOW()
        )
        ON CONFLICT DO NOTHING
      `
    } else {
      // Store without embedding — retrieval will skip this doc but it's preserved
      await this.prisma.$executeRaw`
        INSERT INTO rag_documents (id, doc_type, locale, title, content, source_id, is_active, created_at, updated_at)
        VALUES (
          gen_random_uuid(),
          ${entry.docType},
          ${entry.locale},
          ${entry.title},
          ${entry.content},
          ${entry.sourceId ?? null},
          true,
          NOW(),
          NOW()
        )
        ON CONFLICT DO NOTHING
      `
    }
  }

  private async buildDynamicEntries(): Promise<KnowledgeEntry[]> {
    const [menuEntries, restaurantEntries] = await Promise.all([
      this.buildMenuEntries(),
      this.buildRestaurantEntries(),
    ])
    return [...menuEntries, ...restaurantEntries]
  }

  private async buildMenuEntries(): Promise<KnowledgeEntry[]> {
    try {
      const items = await this.prisma.menuItem.findMany({
        where: { isAvailable: true, category: { isVisible: true } },
        take: 200,
        select: {
          id: true,
          name: true,
          description: true,
          basePrice: true,
          isPopular: true,
          category: { select: { name: true } },
          restaurant: { select: { name: true, cuisineTypes: true, city: true } },
        },
        orderBy: [{ isPopular: 'desc' }, { updatedAt: 'desc' }],
      })

      return items.map(item => ({
        docType: 'menu' as const,
        locale: 'vi',
        title: `Món ${item.name} — ${item.restaurant.name}`,
        content: [
          `Tên món: ${item.name}`,
          item.description ? `Mô tả: ${item.description}` : null,
          `Giá: ${Number(item.basePrice).toLocaleString('vi-VN')}đ`,
          `Danh mục: ${item.category.name}`,
          `Nhà hàng: ${item.restaurant.name}`,
          item.restaurant.cuisineTypes.length ? `Ẩm thực: ${item.restaurant.cuisineTypes.join(', ')}` : null,
          `Khu vực: ${item.restaurant.city}`,
          item.isPopular ? 'Đây là món phổ biến được nhiều khách đặt.' : null,
        ].filter(Boolean).join('\n'),
        sourceId: item.id,
      }))
    } catch {
      return []
    }
  }

  private async buildRestaurantEntries(): Promise<KnowledgeEntry[]> {
    try {
      const restaurants = await this.prisma.restaurant.findMany({
        where: { isActive: true, isOpen: true, approvalStatus: 'approved' },
        take: 100,
        select: {
          id: true,
          name: true,
          description: true,
          cuisineTypes: true,
          priceRange: true,
          rating: true,
          city: true,
          prepTimeAvgMinutes: true,
          addressLine: true,
        },
        orderBy: { rating: 'desc' },
      })

      return restaurants.map(r => ({
        docType: 'restaurant' as const,
        locale: 'vi',
        title: `Nhà hàng ${r.name}`,
        content: [
          `Tên: ${r.name}`,
          r.description ? `Giới thiệu: ${r.description}` : null,
          r.cuisineTypes.length ? `Ẩm thực: ${r.cuisineTypes.join(', ')}` : null,
          `Phân khúc giá: ${r.priceRange}`,
          `Đánh giá: ${Number(r.rating).toFixed(1)}/5`,
          `Thời gian chuẩn bị trung bình: ${r.prepTimeAvgMinutes} phút`,
          `Địa chỉ: ${r.addressLine}, ${r.city}`,
        ].filter(Boolean).join('\n'),
        sourceId: r.id,
      }))
    } catch {
      return []
    }
  }

  private ragEnabled(): boolean {
    return this.config.get<string>('RAG_ENABLED') !== 'false'
  }
}

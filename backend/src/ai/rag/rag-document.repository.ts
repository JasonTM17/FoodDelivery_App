import { Injectable } from '@nestjs/common'
import { createHash } from 'node:crypto'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../database/prisma.service'
import { RagEmbeddingService } from './rag-embedding.service'
import type { KnowledgeEntry } from './rag-document.types'

@Injectable()
export class RagDocumentRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly embedding: RagEmbeddingService,
  ) {}

  async prepareChanged(entries: KnowledgeEntry[]): Promise<{
    changed: Array<{ entry: KnowledgeEntry; contentHash: string }>
    unchanged: number
  }> {
    if (entries.length === 0) return { changed: [], unchanged: 0 }

    const docType = entries[0]?.docType
    const locale = entries[0]?.locale
    if (!docType || !locale || entries.some(entry => entry.docType !== docType || entry.locale !== locale)) {
      throw new Error('RAG_BATCH_SCOPE_INVALID')
    }

    const sourceIds = entries.map(entry => entry.sourceId)
    const rows = await this.prisma.$queryRaw<Array<{
      sourceId: string
      contentHash: string | null
      hasEmbedding: boolean
    }>>`
      SELECT
        source_id AS "sourceId",
        content_hash AS "contentHash",
        embedding IS NOT NULL AS "hasEmbedding"
      FROM rag_documents
      WHERE doc_type = ${docType}
        AND locale = ${locale}
        AND source_id IN (${Prisma.join(sourceIds.map(sourceId => Prisma.sql`${sourceId}`))})
    `
    const existing = new Map(rows.map(row => [row.sourceId, row]))
    const prepared = entries.map(entry => ({ entry, contentHash: this.hash(entry) }))
    const changed = prepared.filter(document => {
      const current = existing.get(document.entry.sourceId)
      return current?.contentHash !== document.contentHash || !current.hasEmbedding
    })
    return { changed, unchanged: prepared.length - changed.length }
  }

  async upsert(entry: KnowledgeEntry, contentHash = this.hash(entry)): Promise<void> {
    if (!entry.sourceId) throw new Error('RAG_SOURCE_ID_REQUIRED')

    const vector = await this.embedding.embed(`${entry.title}\n${entry.content}`)
    if (vector) {
      const literal = this.embedding.vectorLiteral(vector)
      await this.prisma.$executeRaw`
        INSERT INTO rag_documents
          (id, doc_type, locale, title, content, source_id, content_hash, embedding, is_active, created_at, updated_at)
        VALUES
          (gen_random_uuid(), ${entry.docType}, ${entry.locale}, ${entry.title}, ${entry.content},
           ${entry.sourceId}, ${contentHash}, ${literal}::vector, true, NOW(), NOW())
        ON CONFLICT (doc_type, locale, source_id) WHERE source_id IS NOT NULL
        DO UPDATE SET
          title = EXCLUDED.title,
          content = EXCLUDED.content,
          content_hash = EXCLUDED.content_hash,
          embedding = EXCLUDED.embedding,
          is_active = true,
          updated_at = NOW()
      `
      return
    }

    await this.prisma.$executeRaw`
      INSERT INTO rag_documents
        (id, doc_type, locale, title, content, source_id, content_hash, embedding, is_active, created_at, updated_at)
      VALUES
        (gen_random_uuid(), ${entry.docType}, ${entry.locale}, ${entry.title}, ${entry.content},
         ${entry.sourceId}, ${contentHash}, NULL, true, NOW(), NOW())
      ON CONFLICT (doc_type, locale, source_id) WHERE source_id IS NOT NULL
      DO UPDATE SET
        title = EXCLUDED.title,
        content = EXCLUDED.content,
        content_hash = EXCLUDED.content_hash,
        embedding = NULL,
        is_active = true,
        updated_at = NOW()
    `
  }

  async deactivateMissingMenuItems(): Promise<number> {
    return this.prisma.$executeRaw`
      UPDATE rag_documents AS document
      SET is_active = false, updated_at = NOW()
      WHERE document.doc_type = 'menu'
        AND document.locale = 'vi'
        AND document.source_id IS NOT NULL
        AND document.is_active = true
        AND NOT EXISTS (
          SELECT 1
          FROM menu_items AS item
          INNER JOIN categories AS category ON category.id = item.category_id
          WHERE item.id::text = document.source_id
            AND item.is_available = true
            AND category.is_visible = true
        )
    `
  }

  async deactivateMissingRestaurants(): Promise<number> {
    return this.prisma.$executeRaw`
      UPDATE rag_documents AS document
      SET is_active = false, updated_at = NOW()
      WHERE document.doc_type = 'restaurant'
        AND document.locale = 'vi'
        AND document.source_id IS NOT NULL
        AND document.is_active = true
        AND NOT EXISTS (
          SELECT 1
          FROM restaurants AS restaurant
          WHERE restaurant.id::text = document.source_id
            AND restaurant.is_active = true
            AND restaurant.is_open = true
            AND restaurant.approval_status = 'approved'
        )
    `
  }

  private hash(entry: KnowledgeEntry): string {
    return createHash('sha256')
      .update([entry.docType, entry.locale, entry.title, entry.content].join('\u0000'))
      .digest('hex')
  }
}

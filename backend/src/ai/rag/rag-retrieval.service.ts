import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../../database/prisma.service'
import { RagEmbeddingService } from './rag-embedding.service'
import type { RagChunk, RagSearchOptions } from './rag-document.types'

@Injectable()
export class RagRetrievalService {
  private readonly logger = new Logger(RagRetrievalService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly embedding: RagEmbeddingService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Search the knowledge base for chunks most relevant to `query`.
   * Returns an empty array when RAG is disabled or embedding fails.
   */
  async search(query: string, options: RagSearchOptions = {}): Promise<RagChunk[]> {
    if (!this.ragEnabled()) return []

    const topK = options.topK ?? this.topK()
    const minSimilarity = options.minSimilarity ?? this.minSimilarity()
    const locale = options.locale ?? 'vi'

    const vector = await this.embedding.embed(this.buildQueryText(query))
    if (!vector) return []

    try {
      const literal = this.embedding.vectorLiteral(vector)
      const docTypeFilter = options.docTypes?.length
        ? options.docTypes
        : ['faq', 'policy', 'menu', 'restaurant']

      // pgvector cosine distance: 1 - cosine_similarity
      // cosine_distance < (1 - minSimilarity) means similarity >= minSimilarity
      const maxDistance = 1 - minSimilarity

      const rows = await this.prisma.$queryRaw<RagRow[]>`
        SELECT
          id,
          doc_type  AS "docType",
          locale,
          title,
          content,
          source_id AS "sourceId",
          1 - (embedding <=> ${literal}::vector) AS similarity
        FROM rag_documents
        WHERE
          is_active = true
          AND locale = ${locale}
          AND doc_type = ANY(${docTypeFilter}::text[])
          AND embedding IS NOT NULL
          AND (embedding <=> ${literal}::vector) < ${maxDistance}
        ORDER BY embedding <=> ${literal}::vector
        LIMIT ${topK}
      `

      return rows.map(row => ({
        id: row.id,
        docType: row.docType as RagChunk['docType'],
        locale: row.locale,
        title: row.title,
        content: row.content,
        sourceId: row.sourceId ?? null,
        similarity: Number(row.similarity),
      }))
    } catch (err) {
      // pgvector extension might not be installed – degrade gracefully
      this.logger.warn(`RAG retrieval failed: ${err instanceof Error ? err.message : 'UNKNOWN'}`)
      return []
    }
  }

  /**
   * Format retrieved chunks for injection into the LLM prompt.
   * Returns empty string when no chunks are available.
   */
  formatForPrompt(chunks: RagChunk[]): string {
    if (!chunks.length) return ''
    const items = chunks.map((chunk, i) =>
      `[${i + 1}] ${chunk.title}\n${chunk.content}`,
    )
    return items.join('\n\n')
  }

  private buildQueryText(query: string): string {
    return query.trim().slice(0, 512)
  }

  private ragEnabled(): boolean {
    const val = this.config.get<string>('RAG_ENABLED')
    return val !== 'false'
  }

  private topK(): number {
    const val = Number(this.config.get<string>('RAG_TOP_K') ?? '3')
    return Number.isFinite(val) ? Math.min(Math.max(1, Math.trunc(val)), 10) : 3
  }

  private minSimilarity(): number {
    const val = Number(this.config.get<string>('RAG_MIN_SIMILARITY') ?? '0.70')
    return Number.isFinite(val) ? Math.min(Math.max(0, val), 1) : 0.70
  }
}

interface RagRow {
  id: string
  docType: string
  locale: string
  title: string
  content: string
  sourceId: string | null
  similarity: string | number
}

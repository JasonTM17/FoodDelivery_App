import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Inject } from '@nestjs/common'
import type Redis from 'ioredis'

const CACHE_PREFIX = 'rag:emb:'
const CACHE_TTL_SECONDS = 3600

@Injectable()
export class RagEmbeddingService {
  private readonly logger = new Logger(RagEmbeddingService.name)
  private readonly defaultBaseUrl = 'https://api.deepseek.com'
  private readonly defaultEmbeddingModel = 'text-embedding-v3'
  private readonly embeddingDimension = 1536

  constructor(
    private readonly config: ConfigService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {}

  /**
   * Embed a single text string.
   * Returns null if embedding is unavailable (API not configured or error).
   */
  async embed(text: string): Promise<number[] | null> {
    const apiKey = this.apiKey()
    if (!apiKey) return null

    const cacheKey = `${CACHE_PREFIX}${this.hashText(text)}`
    const cached = await this.readCache(cacheKey)
    if (cached) return cached

    try {
      const response = await fetch(`${this.baseUrl()}/embeddings`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.embeddingModel(),
          input: text.trim().slice(0, 8192),
          encoding_format: 'float',
          dimensions: this.embeddingDimension,
        }),
        signal: AbortSignal.timeout(10_000),
      })

      if (!response.ok) {
        this.logger.warn(`RAG embedding API error: ${response.status}`)
        return null
      }

      const payload = await response.json() as EmbeddingResponse
      const vector = payload.data?.[0]?.embedding
      if (!Array.isArray(vector) || vector.length === 0) {
        this.logger.warn('RAG embedding returned empty vector')
        return null
      }

      await this.writeCache(cacheKey, vector)
      return vector
    } catch (err) {
      this.logger.warn(`RAG embedding failed: ${err instanceof Error ? err.message : 'UNKNOWN'}`)
      return null
    }
  }

  /**
   * Embed multiple texts in batches of 20.
   * Returns null entries where embedding failed.
   */
  async embedBatch(texts: string[]): Promise<Array<number[] | null>> {
    const results: Array<number[] | null> = []
    const batchSize = 20

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize)
      const batchResults = await Promise.all(batch.map(text => this.embed(text)))
      results.push(...batchResults)
    }

    return results
  }

  /** Format a vector for pgvector `[x,y,z,...]` literal */
  vectorLiteral(embedding: number[]): string {
    return `[${embedding.join(',')}]`
  }

  private apiKey(): string | undefined {
    return this.config.get<string>('DEEPSEEK_API_KEY')?.trim() || undefined
  }

  private baseUrl(): string {
    return (this.config.get<string>('DEEPSEEK_BASE_URL')?.trim() || this.defaultBaseUrl).replace(/\/+$/, '')
  }

  private embeddingModel(): string {
    return this.config.get<string>('DEEPSEEK_EMBEDDING_MODEL')?.trim() || this.defaultEmbeddingModel
  }

  private async readCache(key: string): Promise<number[] | null> {
    try {
      const raw = await this.redis.get(key)
      if (!raw) return null
      return JSON.parse(raw) as number[]
    } catch {
      return null
    }
  }

  private async writeCache(key: string, vector: number[]): Promise<void> {
    try {
      await this.redis.set(key, JSON.stringify(vector), 'EX', CACHE_TTL_SECONDS)
    } catch {
      // non-fatal
    }
  }

  /** Simple deterministic hash for cache key */
  private hashText(text: string): string {
    let hash = 5381
    for (let i = 0; i < text.length; i++) {
      hash = ((hash << 5) + hash) ^ text.charCodeAt(i)
      hash = hash & hash // Convert to 32-bit int
    }
    return Math.abs(hash).toString(36)
  }
}

interface EmbeddingResponse {
  data?: Array<{ embedding?: number[] }>
}

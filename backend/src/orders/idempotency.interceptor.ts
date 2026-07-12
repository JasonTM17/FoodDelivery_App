import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
  Logger,
} from '@nestjs/common'
import { Request } from 'express'
import { Observable, of } from 'rxjs'
import { tap } from 'rxjs/operators'
import Redis from 'ioredis'

export const IDEMPOTENCY_KEY = 'idempotency-key'

const KEY_PREFIX = 'idem'
const TTL_SECONDS = 300
const UUID_V4_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/**
 * Deduplicates POST/PATCH requests using an X-Idempotency-Key header.
 *
 * Flow:
 * 1. Extract X-Idempotency-Key (must be UUID v4).
 * 2. Build Redis key: idem:{userId}:{key}, TTL 300s.
 * 3. If key exists in Redis: return cached response body (HTTP 200 from cache).
 * 4. If key missing: execute handler, cache the response body, return normally.
 *
 * Applied per-handler via @UseInterceptors(IdempotencyInterceptor) or
 * per-controller via @Controller decorator.
 */
@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  private readonly logger = new Logger(IdempotencyInterceptor.name)

  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const request = context.switchToHttp().getRequest<Request>()

    // Only intercept mutating methods
    const method = (request.method ?? '').toUpperCase()
    if (method !== 'POST' && method !== 'PATCH') {
      return next.handle()
    }

    const idempotencyKey = request.headers['x-idempotency-key'] as string | undefined
    if (!idempotencyKey) {
      // No key provided — pass through without caching
      return next.handle()
    }

    if (!UUID_V4_RE.test(idempotencyKey)) {
      this.logger.warn(`Invalid idempotency key format: ${idempotencyKey.substring(0, 8)}`)
      // Pass through — do not block the request, but do not cache
      return next.handle()
    }

    // Build composite key: idem:{userId}:{key}
    // Use request.ip as fallback when no authenticated user
    const reqAny = request as unknown as Record<string, unknown>
    const userSub = (reqAny.user as Record<string, string> | undefined)?.['sub']
    const userId = userSub ?? request.ip ?? 'anon'

    const redisKey = `${KEY_PREFIX}:${userId}:${idempotencyKey}`

    try {
      const cached = await this.redis.get(redisKey)
      if (cached !== null) {
        // Wait if in-flight claim
        if (cached === 'IN_FLIGHT') {
          const waited = await this.waitForCachedResult(redisKey)
          if (waited) {
            const parsed = JSON.parse(waited) as { status: number; body: unknown }
            const response = context.switchToHttp().getResponse()
            response.status(parsed.status)
            return of(parsed.body)
          }
        } else {
          this.logger.debug(`Idempotency hit: ${redisKey}`)
          const parsed = JSON.parse(cached) as { status: number; body: unknown }
          const response = context.switchToHttp().getResponse()
          response.status(parsed.status)
          return of(parsed.body)
        }
      }

      // Claim before executing handler so concurrent POSTs cannot double-apply
      const claimed = await this.redis.set(redisKey, 'IN_FLIGHT', 'EX', TTL_SECONDS, 'NX')
      if (!claimed) {
        const waited = await this.waitForCachedResult(redisKey)
        if (waited && waited !== 'IN_FLIGHT') {
          const parsed = JSON.parse(waited) as { status: number; body: unknown }
          const response = context.switchToHttp().getResponse()
          response.status(parsed.status)
          return of(parsed.body)
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      this.logger.warn(`Redis read failed for idempotency key, proceeding uncached: ${message}`)
    }

    return next.handle().pipe(
      tap({
        next: (data) => {
          this.cacheResponse(redisKey, data, context.switchToHttp().getResponse().statusCode)
        },
        error: () => {
          // Release claim so client may retry with same key
          void this.redis.del(redisKey)
        },
      }),
    )
  }

  private async waitForCachedResult(redisKey: string, attempts = 20): Promise<string | null> {
    for (let i = 0; i < attempts; i += 1) {
      await new Promise((r) => setTimeout(r, 50))
      const value = await this.redis.get(redisKey)
      if (value && value !== 'IN_FLIGHT') return value
    }
    return null
  }

  private cacheResponse(redisKey: string, body: unknown, status: number): void {
    const payload = JSON.stringify({ status, body })
    this.redis
      .set(redisKey, payload, 'EX', TTL_SECONDS)
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err)
        this.logger.warn(`Failed to cache idempotency response: ${message}`)
      })
  }
}

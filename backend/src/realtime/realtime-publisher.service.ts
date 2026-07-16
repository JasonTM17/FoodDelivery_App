import { Injectable, Logger, Optional } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { sign } from 'jsonwebtoken'
import { normalizePem } from '../common/supabase/supabase-config'
import { RealtimeMetrics } from './realtime.metrics'

interface PublishResult {
  provider: 'socketio' | 'supabase'
  queued: boolean
}

const BROADCAST_TOKEN_TTL_SECONDS = 60
const DEFAULT_BROADCAST_TIMEOUT_MS = 5_000

@Injectable()
export class RealtimePublisherService {
  private readonly logger = new Logger(RealtimePublisherService.name)

  constructor(
    private readonly config: ConfigService,
    @Optional() private readonly metrics?: RealtimeMetrics,
  ) {}

  isSupabaseEnabled(): boolean {
    return this.config.get<string>('REALTIME_PROVIDER') === 'supabase'
  }

  async publishBestEffort(
    channel: string,
    event: string,
    payload: object,
  ): Promise<PublishResult> {
    try {
      return await this.publish(channel, event, payload)
    } catch {
      return { provider: this.isSupabaseEnabled() ? 'supabase' : 'socketio', queued: false }
    }
  }

  async publish(
    channel: string,
    event: string,
    payload: object,
  ): Promise<PublishResult> {
    if (!this.isSupabaseEnabled()) {
      return { provider: 'socketio', queued: false }
    }

    const startedAt = Date.now()
    let requestTimeout: ReturnType<typeof setTimeout> | undefined
    try {
      const supabaseUrl = this.config.getOrThrow<string>('SUPABASE_URL').replace(/\/+$/, '')
      const publishableKey = this.config.getOrThrow<string>('SUPABASE_PUBLISHABLE_KEY').trim()
      const privateKey = this.config.getOrThrow<string>('SUPABASE_REALTIME_JWT_PRIVATE_KEY')
      const keyId = this.config.getOrThrow<string>('SUPABASE_REALTIME_JWT_KEY_ID').trim()
      const nowSeconds = Math.floor(Date.now() / 1000)
      const serviceToken = sign(
        {
          iss: `${supabaseUrl}/auth/v1`,
          role: 'service_role',
          iat: nowSeconds,
          exp: nowSeconds + BROADCAST_TOKEN_TTL_SECONDS,
        },
        normalizePem(privateKey),
        { algorithm: 'ES256', keyid: keyId },
      )
      const endpoint = `${supabaseUrl}/realtime/v1/api/broadcast/${encodeURIComponent(channel)}/events/${encodeURIComponent(event)}?private=true`
      const timeoutMs = this.config.get<number>('SUPABASE_REALTIME_PUBLISH_TIMEOUT_MS')
        ?? DEFAULT_BROADCAST_TIMEOUT_MS
      const abortController = new AbortController()
      requestTimeout = setTimeout(() => abortController.abort(), timeoutMs)
      requestTimeout.unref?.()
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          apikey: publishableKey,
          Authorization: `Bearer ${serviceToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: abortController.signal,
      })
      if (!response.ok) throw new Error(`Supabase Broadcast returned HTTP ${response.status}`)
      this.metrics?.observeBroadcast(Date.now() - startedAt, 'success')
      return { provider: 'supabase', queued: true }
    } catch (err) {
      this.metrics?.observeBroadcast(Date.now() - startedAt, 'failure')
      const message = err instanceof Error ? err.message : String(err)
      this.logger.error(`Supabase private Broadcast failed for ${channel}/${event}: ${message}`)
      throw err
    } finally {
      if (requestTimeout) clearTimeout(requestTimeout)
    }
  }
}

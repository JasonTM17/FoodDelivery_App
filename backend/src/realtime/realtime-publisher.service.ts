import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { sign } from 'jsonwebtoken'
import { normalizePem } from '../common/supabase/supabase-config'

interface PublishResult {
  provider: 'socketio' | 'supabase'
  queued: boolean
}

const BROADCAST_TOKEN_TTL_SECONDS = 60

@Injectable()
export class RealtimePublisherService {
  private readonly logger = new Logger(RealtimePublisherService.name)

  constructor(
    private readonly config: ConfigService,
  ) {}

  isSupabaseEnabled(): boolean {
    return this.config.get<string>('REALTIME_PROVIDER') === 'supabase'
  }

  async publish(
    channel: string,
    event: string,
    payload: object,
  ): Promise<PublishResult> {
    if (!this.isSupabaseEnabled()) {
      return { provider: 'socketio', queued: false }
    }

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
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          apikey: publishableKey,
          Authorization: `Bearer ${serviceToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
      if (!response.ok) throw new Error(`Supabase Broadcast returned HTTP ${response.status}`)
      return { provider: 'supabase', queued: true }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      this.logger.error(`Supabase private Broadcast failed for ${channel}/${event}: ${message}`)
      throw err
    }
  }
}

import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { getSupabaseSecretKey } from '../common/supabase/supabase-config'

interface PublishResult {
  provider: 'socketio' | 'supabase'
  queued: boolean
}

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
      const secretKey = getSupabaseSecretKey(this.config)
      const endpoint = `${supabaseUrl}/realtime/v1/api/broadcast/${encodeURIComponent(channel)}/events/${encodeURIComponent(event)}?private=true`
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          apikey: secretKey,
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

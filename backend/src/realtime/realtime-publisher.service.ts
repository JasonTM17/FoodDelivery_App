import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../database/prisma.service'

interface PublishResult {
  provider: 'socketio' | 'supabase'
  queued: boolean
}

@Injectable()
export class RealtimePublisherService {
  private readonly logger = new Logger(RealtimePublisherService.name)

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
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
      await this.prisma.realtimeOutbox.create({
        data: {
          channel,
          event,
          payload: payload as Prisma.InputJsonValue,
        },
      })
      return { provider: 'supabase', queued: true }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      this.logger.error(`Supabase realtime outbox write failed for ${channel}/${event}: ${message}`)
      throw err
    }
  }
}

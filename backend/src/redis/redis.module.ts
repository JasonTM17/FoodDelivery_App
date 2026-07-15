import { Global, Inject, Injectable, Logger, Module, OnApplicationShutdown } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'

const REDIS_SHUTDOWN_TIMEOUT_MS = 3_000

@Injectable()
export class RedisLifecycleService implements OnApplicationShutdown {
  private readonly logger = new Logger(RedisLifecycleService.name)

  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  async onApplicationShutdown(): Promise<void> {
    if (this.redis.status === 'end') return

    let shutdownTimeout: ReturnType<typeof setTimeout> | undefined
    try {
      await Promise.race([
        this.redis.quit(),
        new Promise<never>((_resolve, reject) => {
          shutdownTimeout = setTimeout(
            () => reject(new Error('Redis shutdown timed out')),
            REDIS_SHUTDOWN_TIMEOUT_MS,
          )
          shutdownTimeout.unref?.()
        }),
      ])
    } catch (error) {
      this.redis.disconnect(false)
      this.logger.warn(
        `Redis graceful shutdown failed; connection forced closed: ${error instanceof Error ? error.message : 'UNKNOWN'}`,
      )
    } finally {
      if (shutdownTimeout) clearTimeout(shutdownTimeout)
    }
  }
}

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: (config: ConfigService) => {
        const redisUrl = config.get<string>('REDIS_URL')
        if (!redisUrl) throw new Error('REDIS_URL environment variable is not set')

        return new Redis(redisUrl, {
          maxRetriesPerRequest: 3,
          lazyConnect: true,
        })
      },
      inject: [ConfigService],
    },
    RedisLifecycleService,
  ],
  exports: ['REDIS_CLIENT'],
})
export class RedisModule {}

import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { PrismaModule } from '../database/prisma.module'
import { RedisModule } from '../redis/redis.module'
import { DispatchModule } from '../dispatch/dispatch.module'
import { OrdersModule } from '../orders/orders.module'
import { validateEnv } from '../config/env.validation'
import { QueueProviderModule } from '../common/queue/queue-provider.module'
import { JobOutboxModule } from '../common/queue/job-outbox.module'
import { NotificationsModule } from '../notifications/notifications.module'
import { PaymentsModule } from '../payments/payments.module'
import { TrackingModule } from '../tracking/tracking.module'
import { PostgresJobOutboxWorkerService } from './postgres-job-outbox-worker.service'
import { RagModule } from '../ai/rag/rag.module'
import { RagSyncWorkerService } from './rag-sync-worker.service'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    QueueProviderModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const redisUrl = config.get<string>('REDIS_URL')
        if (!redisUrl) throw new Error('REDIS_URL environment variable is not set')
        return { connection: { url: redisUrl } }
      },
    }),
    PrismaModule,
    RedisModule,
    DispatchModule,
    OrdersModule,
    NotificationsModule,
    PaymentsModule,
    TrackingModule,
    RagModule,
    JobOutboxModule,
  ],
  providers: [PostgresJobOutboxWorkerService, RagSyncWorkerService],
})
export class WorkersModule {}

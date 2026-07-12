import { DynamicModule, FactoryProvider, Module } from '@nestjs/common'
import { BullModule, SharedBullAsyncConfiguration, getQueueToken } from '@nestjs/bullmq'
import { PrismaModule } from '../../database/prisma.module'
import { PrismaService } from '../../database/prisma.service'
import { PostgresQueue } from './postgres-queue'

type QueueRegistration = { name: string }

@Module({})
export class QueueProviderModule {
  static forRootAsync(options: SharedBullAsyncConfiguration): DynamicModule {
    if (!usePostgresQueueProvider()) {
      return BullModule.forRootAsync(options)
    }

    return {
      module: QueueProviderModule,
      global: true,
    }
  }

  static registerQueue(...queues: QueueRegistration[]): DynamicModule {
    if (!usePostgresQueueProvider()) {
      return BullModule.registerQueue(...queues)
    }

    const providers: FactoryProvider[] = queues.map(queue => ({
      provide: getQueueToken(queue.name),
      useFactory: (prisma: PrismaService) => new PostgresQueue(prisma, queue.name),
      inject: [PrismaService],
    }))

    return {
      module: QueueProviderModule,
      imports: [PrismaModule],
      providers,
      exports: providers.map(provider => provider.provide),
    }
  }
}

function usePostgresQueueProvider(): boolean {
  return process.env.QUEUE_PROVIDER === 'supabase-postgres'
}

import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { BullModule } from '@nestjs/bullmq'
import { PrismaModule } from '../database/prisma.module'
import { RedisModule } from '../redis/redis.module'
import { DispatchModule } from '../dispatch/dispatch.module'
import { OrdersModule } from '../orders/orders.module'
import { validateEnv } from '../config/env.validation'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    BullModule.forRootAsync({
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
  ],
})
export class WorkersModule {}

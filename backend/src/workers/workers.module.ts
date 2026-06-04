import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { BullModule } from '@nestjs/bullmq'
import { PrismaModule } from '../database/prisma.module'
import { RedisModule } from '../redis/redis.module'
import { DispatchModule } from '../dispatch/dispatch.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRoot({ connection: { url: process.env.REDIS_URL ?? 'redis://localhost:6379' } }),
    PrismaModule,
    RedisModule,
    DispatchModule,
  ],
})
export class WorkersModule {}

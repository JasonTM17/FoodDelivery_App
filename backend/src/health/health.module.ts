import { Module } from '@nestjs/common'
import { HealthController } from './health.controller'
import { DatabaseHealthIndicator } from './indicators/database.health'
import { RedisHealthIndicator } from './indicators/redis.health'
import { MinioHealthIndicator } from './indicators/minio.health'

@Module({
  controllers: [HealthController],
  providers: [DatabaseHealthIndicator, RedisHealthIndicator, MinioHealthIndicator],
})
export class HealthModule {}

import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bullmq'
import { DispatchService } from './dispatch.service'
import { DispatchProcessor } from './dispatch.processor'
import { DispatchGateway } from './dispatch.gateway'
import { RedisModule } from '../redis/redis.module'

@Module({
  imports: [BullModule.registerQueue({ name: 'dispatch' }), RedisModule],
  providers: [DispatchService, DispatchProcessor, DispatchGateway],
  exports: [DispatchService, DispatchGateway],
})
export class DispatchModule {}

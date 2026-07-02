import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bullmq'
import { TrackingGateway } from './tracking.gateway'
import { TrackingService } from './tracking.service'
import { TrackingController } from './tracking.controller'
import { DirectionsApiService } from './directions-api.service'
import { EtaCacheService } from './eta-cache.service'
import { EtaRecomputeProcessor } from './eta-recompute.processor'
import { RedisModule } from '../redis/redis.module'
import { OrdersModule } from '../orders/orders.module'

@Module({
  imports: [
    BullModule.registerQueue({ name: 'tracking-eta' }),
    RedisModule,
    OrdersModule,
  ],
  providers: [
    TrackingGateway,
    TrackingService,
    DirectionsApiService,
    EtaCacheService,
    EtaRecomputeProcessor,
  ],
  controllers: [TrackingController],
  exports: [TrackingGateway, TrackingService],
})
export class TrackingModule {}

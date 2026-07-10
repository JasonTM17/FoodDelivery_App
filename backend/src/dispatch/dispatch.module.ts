import { Module, forwardRef } from '@nestjs/common'
import { DispatchService } from './dispatch.service'
import { DispatchProcessor } from './dispatch.processor'
import { DispatchGateway } from './dispatch.gateway'
import { DriverScoringService } from './driver-scoring.service'
import { CooldownService } from './cooldown.service'
import { SurgePricingService } from './surge-pricing.service'
import { DispatchMetrics } from './dispatch.metrics'
import { RedisModule } from '../redis/redis.module'
import { AuthModule } from '../auth/auth.module'
import { OrdersModule } from '../orders/orders.module'
import { QueueProviderModule } from '../common/queue/queue-provider.module'
import { DispatchOfferService } from './dispatch-offer.service'
import { DispatchNotifierService } from './dispatch-notifier.service'
import { DispatchController } from './dispatch.controller'

@Module({
  imports: [
    AuthModule,
    QueueProviderModule.registerQueue({ name: 'dispatch' }),
    RedisModule,
    forwardRef(() => OrdersModule),
  ],
  controllers: [DispatchController],
  providers: [
    DispatchService,
    DispatchOfferService,
    DispatchNotifierService,
    DispatchProcessor,
    DispatchGateway,
    DriverScoringService,
    CooldownService,
    SurgePricingService,
    DispatchMetrics,
  ],
  exports: [DispatchService, DispatchGateway, DispatchOfferService],
})
export class DispatchModule {}

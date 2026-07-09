import { Module, forwardRef } from '@nestjs/common'
import { BullModule } from '@nestjs/bullmq'
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

@Module({
  imports: [
    AuthModule,
    BullModule.registerQueue({ name: 'dispatch' }),
    RedisModule,
    forwardRef(() => OrdersModule),
  ],
  providers: [
    DispatchService,
    DispatchProcessor,
    DispatchGateway,
    DriverScoringService,
    CooldownService,
    SurgePricingService,
    DispatchMetrics,
  ],
  exports: [DispatchService, DispatchGateway],
})
export class DispatchModule {}

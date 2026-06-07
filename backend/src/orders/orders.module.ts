import { Module, forwardRef } from '@nestjs/common'
import { BullModule } from '@nestjs/bullmq'
import { OrdersController } from './orders.controller'
import { OrdersService } from './orders.service'
import { OrdersGateway } from './orders.gateway'
import { PaymentsService } from './payments.service'
import { IdempotencyInterceptor } from './idempotency.interceptor'
import { CancellationService } from './cancellation.service'
import { RefundProcessor } from './refund.processor'
import { AutoTimeoutProcessor } from './auto-timeout.processor'
import { PartialFulfillmentService } from './partial-fulfillment.service'
import { CartModule } from '../cart/cart.module'

@Module({
  imports: [
    forwardRef(() => CartModule),
    BullModule.registerQueue({ name: 'dispatch' }),
    BullModule.registerQueue({ name: 'refund' }),
    BullModule.registerQueue({ name: 'order-timeout' }),
  ],
  controllers: [OrdersController],
  providers: [
    OrdersService,
    PaymentsService,
    OrdersGateway,
    IdempotencyInterceptor,
    CancellationService,
    RefundProcessor,
    AutoTimeoutProcessor,
    PartialFulfillmentService,
  ],
  exports: [OrdersService, OrdersGateway],
})
export class OrdersModule {}


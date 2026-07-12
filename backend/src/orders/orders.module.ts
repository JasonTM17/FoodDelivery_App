import { Module, forwardRef } from '@nestjs/common'
import { OrdersController } from './orders.controller'
import { OrdersService } from './orders.service'
import { OrdersGateway } from './orders.gateway'
import { PaymentsService } from './payments.service'
import { IdempotencyInterceptor } from './idempotency.interceptor'
import { CancellationService } from './cancellation.service'
import { AutoTimeoutProcessor } from './auto-timeout.processor'
import { PartialFulfillmentService } from './partial-fulfillment.service'
import { CartModule } from '../cart/cart.module'
import { PaymentsModule } from '../payments/payments.module'
import { WalletPaymentCaptureService } from './wallet-payment-capture.service'
import { OrderChatService } from './order-chat.service'
import { DeliveryPricingService } from './delivery-pricing.service'
import { AuthModule } from '../auth/auth.module'
import { RealtimeRoomAccessService } from './realtime-room-access.service'
import { PromotionsModule } from '../promotions/promotions.module'
import { QueueProviderModule } from '../common/queue/queue-provider.module'

@Module({
  imports: [
    AuthModule,
    forwardRef(() => CartModule),
    PaymentsModule,
    PromotionsModule,
    QueueProviderModule.registerQueue({ name: 'dispatch' }),
    QueueProviderModule.registerQueue({ name: 'payment-refund' }),
    QueueProviderModule.registerQueue({ name: 'order-timeout' }),
    QueueProviderModule.registerQueue({ name: 'commission-split' }),
  ],
  controllers: [OrdersController],
  providers: [
    OrdersService,
    PaymentsService,
    WalletPaymentCaptureService,
    OrdersGateway,
    IdempotencyInterceptor,
    CancellationService,
    AutoTimeoutProcessor,
    PartialFulfillmentService,
    OrderChatService,
    DeliveryPricingService,
    RealtimeRoomAccessService,
  ],
  exports: [OrdersService, OrdersGateway, RealtimeRoomAccessService],
})
export class OrdersModule {}


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
import { PaymentsModule } from '../payments/payments.module'
import { WalletPaymentCaptureService } from './wallet-payment-capture.service'
import { OrderChatService } from './order-chat.service'
import { AuthModule } from '../auth/auth.module'
import { RealtimeRoomAccessService } from './realtime-room-access.service'
import { PromotionsModule } from '../promotions/promotions.module'

@Module({
  imports: [
    AuthModule,
    forwardRef(() => CartModule),
    PaymentsModule,
    PromotionsModule,
    BullModule.registerQueue({ name: 'dispatch' }),
    BullModule.registerQueue({ name: 'refund' }),
    BullModule.registerQueue({ name: 'order-timeout' }),
  ],
  controllers: [OrdersController],
  providers: [
    OrdersService,
    PaymentsService,
    WalletPaymentCaptureService,
    OrdersGateway,
    IdempotencyInterceptor,
    CancellationService,
    RefundProcessor,
    AutoTimeoutProcessor,
    PartialFulfillmentService,
    OrderChatService,
    RealtimeRoomAccessService,
  ],
  exports: [OrdersService, OrdersGateway, RealtimeRoomAccessService],
})
export class OrdersModule {}


import { Module } from '@nestjs/common'
import { WebhooksController } from './webhooks.controller'
import { WebhooksService } from './webhooks.service'
import { PaymentsModule } from '../payments/payments.module'
import { OrdersModule } from '../orders/orders.module'
import { QueueProviderModule } from '../common/queue/queue-provider.module'

@Module({
  imports: [
    PaymentsModule,
    OrdersModule,
    QueueProviderModule.registerQueue({ name: 'order-timeout' }),
  ],
  controllers: [WebhooksController],
  providers: [WebhooksService],
  exports: [WebhooksService],
})
export class WebhooksModule {}

import { Module, forwardRef } from '@nestjs/common'
import { BullModule } from '@nestjs/bullmq'
import { OrdersController } from './orders.controller'
import { OrdersService } from './orders.service'
import { OrdersGateway } from './orders.gateway'
import { PaymentsService } from './payments.service'
import { CartModule } from '../cart/cart.module'

@Module({
  imports: [
    forwardRef(() => CartModule),
    BullModule.registerQueue({ name: 'dispatch' }),
  ],
  controllers: [OrdersController],
  providers: [OrdersService, PaymentsService, OrdersGateway],
  exports: [OrdersService, OrdersGateway],
})
export class OrdersModule {}

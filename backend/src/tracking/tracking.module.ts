import { Module } from '@nestjs/common'
import { TrackingGateway } from './tracking.gateway'
import { TrackingService } from './tracking.service'
import { TrackingController } from './tracking.controller'

@Module({
  providers: [TrackingGateway, TrackingService],
  controllers: [TrackingController],
  exports: [TrackingGateway, TrackingService],
})
export class TrackingModule {}

import { Module } from '@nestjs/common'
import { AdminController } from './admin.controller'
import { AdminService } from './admin.service'
import { AdminTrackingController } from './admin-tracking.controller'

@Module({
  controllers: [AdminController, AdminTrackingController],
  providers: [AdminService],
})
export class AdminModule {}

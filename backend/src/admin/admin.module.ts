import { Module } from '@nestjs/common'
import { AdminController } from './admin.controller'
import { AdminDashboardController } from './admin-dashboard.controller'
import { AdminDashboardService } from './admin-dashboard.service'
import { AdminResourcesController } from './admin-resources.controller'
import { AdminResourcesService } from './admin-resources.service'
import { AdminService } from './admin.service'
import { AdminSupportController } from './admin-support.controller'
import { AdminSupportService } from './admin-support.service'
import { AdminTrackingController } from './admin-tracking.controller'
import { NotificationsModule } from '../notifications/notifications.module'
import { OrdersModule } from '../orders/orders.module'

@Module({
  imports: [OrdersModule, NotificationsModule],
  controllers: [
    AdminController,
    AdminTrackingController,
    AdminDashboardController,
    AdminResourcesController,
    AdminSupportController,
  ],
  providers: [
    AdminService,
    AdminDashboardService,
    AdminResourcesService,
    AdminSupportService,
  ],
})
export class AdminModule {}

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
import { AdminAuditController } from './admin-audit.controller'
import { AdminAuditService } from './admin-audit.service'
import { AdminExportController } from './admin-export.controller'
import { AdminExportService } from './admin-export.service'
import { AdminSettingsController } from './admin-settings.controller'
import { AdminSettingsService } from './admin-settings.service'

@Module({
  imports: [OrdersModule, NotificationsModule],
  controllers: [
    AdminController,
    AdminTrackingController,
    AdminDashboardController,
    AdminResourcesController,
    AdminSupportController,
    AdminAuditController,
    AdminExportController,
    AdminSettingsController,
  ],
  providers: [
    AdminService,
    AdminDashboardService,
    AdminResourcesService,
    AdminSupportService,
    AdminAuditService,
    AdminExportService,
    AdminSettingsService,
  ],
})
export class AdminModule {}

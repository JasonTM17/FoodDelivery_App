import { Module } from '@nestjs/common'
import { NotificationsModule } from '../notifications/notifications.module'
import { RestaurantAccessService } from './restaurant-access.service'
import { RestaurantAnalyticsController } from './restaurant-analytics.controller'
import { RestaurantDashboardService } from './restaurant-dashboard.service'
import { RestaurantInsightsService } from './restaurant-insights.service'
import { RestaurantProfileController } from './restaurant-profile.controller'
import { RestaurantProfileService } from './restaurant-profile.service'
import { RestaurantPromotionsController } from './restaurant-promotions.controller'
import { RestaurantPromotionTargetingService } from './restaurant-promotion-targeting.service'
import { RestaurantPromotionsService } from './restaurant-promotions.service'
import { RestaurantRevenueService } from './restaurant-revenue.service'
import { RestaurantStaffController } from './restaurant-staff.controller'
import { RestaurantStaffService } from './restaurant-staff.service'

@Module({
  imports: [NotificationsModule],
  controllers: [
    RestaurantProfileController,
    RestaurantAnalyticsController,
    RestaurantPromotionsController,
    RestaurantStaffController,
  ],
  providers: [
    RestaurantAccessService,
    RestaurantProfileService,
    RestaurantDashboardService,
    RestaurantRevenueService,
    RestaurantInsightsService,
    RestaurantPromotionTargetingService,
    RestaurantPromotionsService,
    RestaurantStaffService,
  ],
})
export class RestaurantPortalModule {}

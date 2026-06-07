import { Module } from '@nestjs/common'
import { ReviewsService } from './reviews.service'
import { ReviewsController, RestaurantReviewsController } from './reviews.controller'
import { ModerationService } from './moderation.service'
import { AggregationService } from './aggregation.service'
import { ReviewsPhotoService } from './reviews-photo.service'
import { NotificationsModule } from '../notifications/notifications.module'

@Module({
  imports: [NotificationsModule],
  controllers: [ReviewsController, RestaurantReviewsController],
  providers: [ReviewsService, ModerationService, AggregationService, ReviewsPhotoService],
  exports: [ReviewsService],
})
export class ReviewsModule {}

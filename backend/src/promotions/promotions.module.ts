import { Module } from '@nestjs/common'
import { PromotionsController } from './promotions.controller'
import { PromotionsService } from './promotions.service'
import { EligibilityService } from './eligibility.service'
import { StackingService } from './stacking.service'
import { FraudDetectionService } from './fraud-detection.service'

@Module({
  controllers: [PromotionsController],
  providers: [PromotionsService, EligibilityService, StackingService, FraudDetectionService],
  exports: [PromotionsService, EligibilityService, StackingService],
})
export class PromotionsModule {}

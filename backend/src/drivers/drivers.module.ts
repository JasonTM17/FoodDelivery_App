import { Module } from '@nestjs/common'
import { DriversController } from './drivers.controller'
import { DriversService } from './drivers.service'
import { DriverBankAccountsController } from './driver-bank-accounts.controller'
import { DriverBankAccountsService } from './driver-bank-accounts.service'
import { DriverOnboardingAgreementController } from './driver-onboarding-agreement.controller'
import { DriverOnboardingAgreementService } from './driver-onboarding-agreement.service'
import { DriverTripTipsController } from './driver-trip-tips.controller'
import { DriverTripTipsService } from './driver-trip-tips.service'
import { IncentivesController } from './incentives.controller'
import { IncentivesService } from './incentives.service'

@Module({
  controllers: [
    DriversController,
    DriverBankAccountsController,
    DriverOnboardingAgreementController,
    DriverTripTipsController,
    IncentivesController,
  ],
  providers: [
    DriversService,
    DriverBankAccountsService,
    DriverOnboardingAgreementService,
    DriverTripTipsService,
    IncentivesService,
  ],
  exports: [DriversService, DriverBankAccountsService, DriverOnboardingAgreementService, DriverTripTipsService],
})
export class DriversModule {}

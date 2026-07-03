import { Module } from '@nestjs/common'
import { DriversController } from './drivers.controller'
import { DriversService } from './drivers.service'
import { DriverBankAccountsController } from './driver-bank-accounts.controller'
import { DriverBankAccountsService } from './driver-bank-accounts.service'
import { DriverTripTipsController } from './driver-trip-tips.controller'
import { DriverTripTipsService } from './driver-trip-tips.service'
import { IncentivesController } from './incentives.controller'
import { IncentivesService } from './incentives.service'

@Module({
  controllers: [DriversController, DriverBankAccountsController, DriverTripTipsController, IncentivesController],
  providers: [DriversService, DriverBankAccountsService, DriverTripTipsService, IncentivesService],
  exports: [DriversService, DriverBankAccountsService, DriverTripTipsService],
})
export class DriversModule {}

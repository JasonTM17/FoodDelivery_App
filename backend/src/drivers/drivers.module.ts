import { Module } from '@nestjs/common'
import { DriversController } from './drivers.controller'
import { DriversService } from './drivers.service'
import { DriverBankAccountsController } from './driver-bank-accounts.controller'
import { DriverBankAccountsService } from './driver-bank-accounts.service'
import { IncentivesController } from './incentives.controller'
import { IncentivesService } from './incentives.service'

@Module({
  controllers: [DriversController, DriverBankAccountsController, IncentivesController],
  providers: [DriversService, DriverBankAccountsService, IncentivesService],
  exports: [DriversService, DriverBankAccountsService],
})
export class DriversModule {}

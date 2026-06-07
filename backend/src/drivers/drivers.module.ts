import { Module } from '@nestjs/common'
import { DriversController } from './drivers.controller'
import { DriversService } from './drivers.service'
import { IncentivesController } from './incentives.controller'
import { IncentivesService } from './incentives.service'

@Module({
  controllers: [DriversController, IncentivesController],
  providers: [DriversService, IncentivesService],
  exports: [DriversService],
})
export class DriversModule {}

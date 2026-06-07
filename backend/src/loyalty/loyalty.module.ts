import { Module } from '@nestjs/common'
import { PrismaModule } from '../database/prisma.module'
import { LoyaltyController } from './loyalty.controller'
import { LoyaltyService } from './loyalty.service'

@Module({
  imports: [PrismaModule],
  controllers: [LoyaltyController],
  providers: [LoyaltyService],
  exports: [LoyaltyService],
})
export class LoyaltyModule {}

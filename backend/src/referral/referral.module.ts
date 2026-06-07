import { Module } from '@nestjs/common'
import { PrismaModule } from '../database/prisma.module'
import { ReferralController } from './referral.controller'
import { ReferralService } from './referral.service'

@Module({
  imports: [PrismaModule],
  controllers: [ReferralController],
  providers: [ReferralService],
  exports: [ReferralService],
})
export class ReferralModule {}

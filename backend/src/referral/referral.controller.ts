import { Controller, Get, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { CurrentUser } from '../auth/current-user.decorator'
import type { JwtPayload } from '../auth/jwt-payload.interface'
import { ReferralService } from './referral.service'

@Controller('users/referral')
@UseGuards(JwtAuthGuard)
export class ReferralController {
  constructor(private readonly referralService: ReferralService) {}

  @Get()
  getReferral(@CurrentUser() user: JwtPayload) {
    return this.referralService.getOrCreateSnapshot(user.sub)
  }
}

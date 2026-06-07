import { Controller, Get, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { CurrentUser } from '../auth/current-user.decorator'
import type { JwtPayload } from '../auth/jwt-payload.interface'
import { LoyaltyService } from './loyalty.service'

@Controller('users/loyalty')
@UseGuards(JwtAuthGuard)
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  @Get()
  getLoyalty(@CurrentUser() user: JwtPayload) {
    return this.loyaltyService.getSnapshot(user.sub)
  }
}

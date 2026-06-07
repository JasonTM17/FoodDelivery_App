import { Controller, Get, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { Roles } from '../auth/roles.decorator'
import { CurrentUser } from '../auth/current-user.decorator'
import { JwtPayload } from '../auth/jwt-payload.interface'
import { IncentivesService } from './incentives.service'

@ApiTags('drivers')
@ApiBearerAuth()
@Controller('driver')
@UseGuards(JwtAuthGuard)
@Roles('driver')
export class IncentivesController {
  constructor(private readonly incentivesService: IncentivesService) {}

  @Get('incentives')
  getIncentives(@CurrentUser() user: JwtPayload) {
    return this.incentivesService.getDriverIncentives(user.sub)
  }
}

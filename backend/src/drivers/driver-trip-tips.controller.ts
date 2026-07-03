import { Body, Controller, Param, Post, UseGuards, UsePipes } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../auth/current-user.decorator'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { JwtPayload } from '../auth/jwt-payload.interface'
import { Roles } from '../auth/roles.decorator'
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe'
import { DriverTripTipsService } from './driver-trip-tips.service'
import { DriverTipReportInput, driverTipReportSchema } from './driver-trip-tips.zod'

@ApiTags('drivers')
@ApiBearerAuth()
@Controller('driver/trips')
@UseGuards(JwtAuthGuard)
@Roles('driver')
export class DriverTripTipsController {
  constructor(private readonly tripTipsService: DriverTripTipsService) {}

  @Post(':tripId/tip-report')
  @UsePipes(new ZodValidationPipe(driverTipReportSchema))
  reportCashTip(
    @CurrentUser() user: JwtPayload,
    @Param('tripId') tripId: string,
    @Body() body: DriverTipReportInput,
  ) {
    return this.tripTipsService.reportCashTip(user.sub, tripId, body)
  }
}

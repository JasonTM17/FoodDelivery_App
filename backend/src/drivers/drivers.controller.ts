import { Controller, Post, Get, Query, Body, UseGuards, UsePipes } from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { Roles } from '../auth/roles.decorator'
import { CurrentUser } from '../auth/current-user.decorator'
import { JwtPayload } from '../auth/jwt-payload.interface'
import { DriversService } from './drivers.service'
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe'
import { goOnlineSchema } from './drivers.zod'

@ApiTags('drivers')
@ApiBearerAuth()
@Controller('driver')
@UseGuards(JwtAuthGuard)
@Roles('driver')
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  @Post('online')
  @UsePipes(new ZodValidationPipe(goOnlineSchema))
  goOnline(@CurrentUser() user: JwtPayload, @Body() body: { lat: number; lng: number }) {
    return this.driversService.goOnline(user.sub, body.lat, body.lng)
  }

  @Post('offline')
  goOffline(@CurrentUser() user: JwtPayload) {
    return this.driversService.goOffline(user.sub)
  }

  @Get('earnings')
  getEarnings(@CurrentUser() user: JwtPayload, @Query('period') period: string = 'today') {
    return this.driversService.getEarnings(user.sub, period as 'today' | 'week' | 'month')
  }
}

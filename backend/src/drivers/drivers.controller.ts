import { Controller, Post, Get, Query, Body, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { Roles } from '../auth/roles.decorator'
import { CurrentUser } from '../auth/current-user.decorator'
import { JwtPayload } from '../auth/jwt-payload.interface'
import { DriversService } from './drivers.service'

@Controller('driver')
@UseGuards(JwtAuthGuard)
@Roles('driver')
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  @Post('online')
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

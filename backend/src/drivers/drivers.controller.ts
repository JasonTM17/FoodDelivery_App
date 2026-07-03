import { Controller, Post, Get, Query, Param, Body, UseGuards, UsePipes } from '@nestjs/common'
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
    return this.driversService.getEarnings(user.sub, period)
  }

  @Get('earnings/summary')
  getEarningsSummary(@CurrentUser() user: JwtPayload, @Query('period') period?: string) {
    return this.driversService.getEarningsSummary(user.sub, period)
  }

  @Get('ratings')
  getRatings(@CurrentUser() user: JwtPayload, @Query('star') star?: string) {
    return this.driversService.getRatings(user.sub, star)
  }

  @Get('orders/active')
  getActiveOrder(@CurrentUser() user: JwtPayload) {
    return this.driversService.getActiveOrder(user.sub)
  }

  @Get('orders/history')
  getOrderHistory(
    @CurrentUser() user: JwtPayload,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('limit') limit?: string,
  ) {
    return this.driversService.getOrderHistory(
      user.sub,
      fromDate,
      toDate,
      limit ? Number(limit) : undefined,
    )
  }

  @Get('trips/:tripId/route')
  getTripRoute(@CurrentUser() user: JwtPayload, @Param('tripId') tripId: string) {
    return this.driversService.getTripRoute(user.sub, tripId)
  }

  @Get('heatmap')
  getHeatmap(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radius') radius?: string,
    @Query('window') window: string = 'now',
  ) {
    return this.driversService.getHeatmap({
      lat: Number(lat),
      lng: Number(lng),
      radiusKm: radius ? Number(radius) : undefined,
      window,
    })
  }
}

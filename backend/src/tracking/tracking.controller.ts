import { Controller, Get, Param, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { CurrentUser } from '../auth/current-user.decorator'
import { JwtPayload } from '../auth/jwt-payload.interface'
import { TrackingService } from './tracking.service'

@Controller()
@UseGuards(JwtAuthGuard)
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Get('orders/:id/tracking')
  async getTracking(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    const driverLocation = await this.trackingService.getDriverLocation(id)
    return { orderId: id, driverLocation }
  }
}

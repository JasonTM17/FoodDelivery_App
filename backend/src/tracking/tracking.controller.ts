import { Controller, Get, Param, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { CurrentUser } from '../auth/current-user.decorator'
import { JwtPayload } from '../auth/jwt-payload.interface'
import { TrackingService } from './tracking.service'

@ApiTags('tracking')
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

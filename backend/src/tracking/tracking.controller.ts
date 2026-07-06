import { Controller, Get, Param, UseGuards } from '@nestjs/common'
import { UserRole } from '@prisma/client'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { CurrentUser } from '../auth/current-user.decorator'
import { JwtPayload } from '../auth/jwt-payload.interface'
import { Roles } from '../auth/roles.decorator'
import { RolesGuard } from '../auth/roles.guard'
import { OrdersService } from '../orders/orders.service'
import { routePhaseForStatus, TrackingService } from './tracking.service'

@ApiTags('tracking')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class TrackingController {
  constructor(
    private readonly trackingService: TrackingService,
    private readonly ordersService: OrdersService,
  ) {}

  @Get('orders/:id/tracking')
  @Roles(UserRole.customer, UserRole.restaurant, UserRole.driver, UserRole.admin)
  async getTracking(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    const order = await this.ordersService.getTracking(id, user.sub, user.role)
    const routePhase = routePhaseForStatus(order.status)
    const [driverLocation, cachedRoute] = await Promise.all([
      order.driverId
        ? this.trackingService.getDriverLocation(order.driverId)
        : Promise.resolve(null),
      this.trackingService.getCachedRoute(order.id, routePhase),
    ])

    return {
      orderId: order.id,
      status: order.status,
      routePhase,
      driverLocation: driverLocation
        ? {
            lat: driverLocation.lat,
            lng: driverLocation.lng,
            lastUpdated: driverLocation.timestamp,
          }
        : null,
      etaMinutes: cachedRoute
        ? Math.max(1, Math.round(cachedRoute.durationSeconds / 60))
        : null,
      routePolyline: cachedRoute?.polyline ?? order.routePolyline,
    }
  }
}

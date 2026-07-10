import { Controller, Get, Param, Post, Body, UseGuards, UnprocessableEntityException } from '@nestjs/common'
import { UserRole } from '@prisma/client'
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { CurrentUser } from '../auth/current-user.decorator'
import { JwtPayload } from '../auth/jwt-payload.interface'
import { Roles } from '../auth/roles.decorator'
import { RolesGuard } from '../auth/roles.guard'
import { OrdersService } from '../orders/orders.service'
import { routePhaseForStatus, TrackingService } from './tracking.service'
import { TrackingGateway } from './tracking.gateway'
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe'
import { DriverLocationUpdateBody, driverLocationUpdateSchema } from './tracking.zod'

@ApiTags('tracking')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class TrackingController {
  constructor(
    private readonly trackingService: TrackingService,
    private readonly ordersService: OrdersService,
    private readonly trackingGateway: TrackingGateway,
  ) {}

  @Post('driver/location')
  @Roles(UserRole.driver)
  @ApiOperation({ summary: 'Submit an authenticated live GPS sample for the driver' })
  @ApiResponse({ status: 201, description: 'Location accepted and realtime tracking updated' })
  @ApiResponse({ status: 422, description: 'Location rejected as stale, invalid, or implausible' })
  async updateDriverLocation(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(driverLocationUpdateSchema)) body: DriverLocationUpdateBody,
  ) {
    const result = await this.trackingGateway.processLocationUpdate(user.sub, body)
    if (!result.accepted) {
      throw new UnprocessableEntityException({
        code: 'DRIVER_LOCATION_REJECTED',
        reason: result.reason,
      })
    }
    return result
  }

  @Get('orders/:id/tracking')
  @Roles(UserRole.customer, UserRole.restaurant, UserRole.driver, UserRole.admin)
  async getTracking(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    const order = await this.ordersService.getTracking(id, user.sub, user.role)
    const routePhase = routePhaseForStatus(order.status)
    const [driverLocation, cachedRoute, persistedRoute] = await Promise.all([
      order.driverId
        ? this.trackingService.getDriverLocation(order.driverId)
        : Promise.resolve(null),
      this.trackingService.getCachedRoute(order.id, routePhase),
      this.trackingService.getPersistedRoute(order.id, routePhase),
    ])
    const route = cachedRoute ?? persistedRoute

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
      etaMinutes: route
        ? Math.max(1, Math.round(route.durationSeconds / 60))
        : null,
      routePolyline: route?.polyline ?? null,
    }
  }
}

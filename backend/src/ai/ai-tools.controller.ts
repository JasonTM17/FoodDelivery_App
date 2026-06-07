import { Controller, Get, Post, Param, Query, Body, UseGuards, ParseFloatPipe } from '@nestjs/common'
import { AiServiceJwtGuard } from './ai-service-jwt.guard'
import { AiToolsService } from './ai-tools.service'

@Controller('ai/tools')
@UseGuards(AiServiceJwtGuard)
export class AiToolsController {
  constructor(private readonly aiToolsService: AiToolsService) {}

  @Get('order-status/:orderId')
  getOrderStatus(@Param('orderId') orderId: string) {
    return this.aiToolsService.getOrderStatus(orderId)
  }

  @Get('driver-location/:orderId')
  getDriverLocation(@Param('orderId') orderId: string) {
    return this.aiToolsService.getDriverLocation(orderId)
  }

  @Get('restaurant-status/:orderId')
  getRestaurantStatus(@Param('orderId') orderId: string) {
    return this.aiToolsService.getRestaurantStatus(orderId)
  }

  @Get('refund-eligibility/:orderId')
  getRefundEligibility(@Param('orderId') orderId: string) {
    return this.aiToolsService.getRefundEligibility(orderId)
  }

  @Post('create-ticket')
  createSupportTicket(
    @Body() body: { userId: string; orderId: string; issueType: string; summary: string },
  ) {
    return this.aiToolsService.createSupportTicket(body.userId, body.orderId, body.issueType, body.summary)
  }

  @Get('nearby-restaurants')
  getNearbyRestaurants(
    @Query('lat', ParseFloatPipe) lat: number,
    @Query('lng', ParseFloatPipe) lng: number,
    @Query('cuisine') cuisine?: string,
  ) {
    return this.aiToolsService.getNearbyRestaurants(lat, lng, cuisine)
  }

  @Get('recommended-foods/:userId')
  getRecommendedFoods(@Param('userId') userId: string) {
    return this.aiToolsService.getRecommendedFoods(userId)
  }

  @Post('notify-admin')
  notifyAdmin(@Body() body: { ticketId: string; severity: string }) {
    return this.aiToolsService.notifyAdmin(body.ticketId, body.severity)
  }
}

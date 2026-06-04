import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { Roles } from '../auth/roles.decorator'
import { CurrentUser } from '../auth/current-user.decorator'
import { JwtPayload } from '../auth/jwt-payload.interface'
import { OrdersService } from './orders.service'
import { PlaceOrderDto, CancelOrderDto, CreateReviewDto, UpdateOrderStatusDto } from './orders.dto'

@Controller()
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('orders')
  @Roles('customer')
  placeOrder(@CurrentUser() user: JwtPayload, @Body() dto: PlaceOrderDto) {
    return this.ordersService.placeOrder(user.sub, dto)
  }

  @Get('orders')
  @Roles('customer')
  getMyOrders(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.ordersService.getCustomerOrders(
      user.sub, parseInt(page ?? '1'), parseInt(limit ?? '20'), status,
    )
  }

  @Get('orders/:id')
  getOrderDetail(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.ordersService.getOrderDetail(id, user.sub, user.role)
  }

  @Get('orders/:id/tracking')
  @Roles('customer')
  getTracking(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.ordersService.getTracking(id, user.sub)
  }

  @Post('orders/:id/cancel')
  @Roles('customer')
  cancelOrder(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto?: CancelOrderDto) {
    return this.ordersService.cancelOrder(id, user.sub, user.role, dto)
  }

  @Post('orders/:id/review')
  @Roles('customer')
  submitReview(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: CreateReviewDto) {
    return this.ordersService.submitReview(id, user.sub, dto)
  }

  // ── Restaurant endpoints ──

  @Get('restaurant/orders')
  @Roles('restaurant')
  async getRestaurantOrders(@CurrentUser() user: JwtPayload, @Query('status') status?: string) {
    return this.ordersService.getRestaurantOrders(user.sub, status)
  }

  @Patch('restaurant/orders/:id/status')
  @Roles('restaurant')
  updateRestaurantOrderStatus(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateOrderStatus(id, dto.status, user.sub, user.role, dto.note)
  }

  // ── Driver endpoints ──

  @Patch('driver/orders/:id/status')
  @Roles('driver')
  updateDriverOrderStatus(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateOrderStatus(id, dto.status, user.sub, user.role, dto.note)
  }
}

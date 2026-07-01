import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, UsePipes, UseInterceptors } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { Roles } from '../auth/roles.decorator'
import { CurrentUser } from '../auth/current-user.decorator'
import { JwtPayload } from '../auth/jwt-payload.interface'
import { OrdersService } from './orders.service'
import { PlaceOrderDto, CancelOrderDto, CreateReviewDto, UpdateOrderStatusDto } from './orders.dto'
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe'
import { placeOrderSchema, cancelOrderSchema, createReviewSchema, updateOrderStatusSchema } from './orders.zod'
import { IdempotencyInterceptor } from './idempotency.interceptor'

@ApiTags('orders')
@Controller()
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('orders')
  @Roles('customer')
  @UseInterceptors(IdempotencyInterceptor)
  @UsePipes(new ZodValidationPipe(placeOrderSchema))
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

  @Post('orders/:id/cancel')
  @Roles('customer')
  @UsePipes(new ZodValidationPipe(cancelOrderSchema))
  cancelOrder(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto?: CancelOrderDto) {
    return this.ordersService.cancelOrder(id, user.sub, user.role, dto)
  }

  @Post('orders/:id/review')
  @Roles('customer')
  @UsePipes(new ZodValidationPipe(createReviewSchema))
  submitReview(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: CreateReviewDto) {
    return this.ordersService.submitReview(id, user.sub, dto)
  }

  // ── Restaurant endpoints ──

  @Get('restaurant/orders')
  @Roles('restaurant')
  async getRestaurantOrders(@CurrentUser() user: JwtPayload, @Query('status') status?: string) {
    return this.ordersService.getRestaurantOrders(user.sub, status)
  }

  @Get('restaurant/orders/:id')
  @Roles('restaurant')
  getRestaurantOrderDetail(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.ordersService.getRestaurantOrderDetail(id, user.sub)
  }

  @Patch('restaurant/orders/:id/status')
  @Roles('restaurant')
  @UsePipes(new ZodValidationPipe(updateOrderStatusSchema))
  async updateRestaurantOrderStatus(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    await this.ordersService.updateOrderStatus(id, dto.status, user.sub, user.role, dto.note)
    return this.ordersService.getRestaurantOrderDetail(id, user.sub)
  }

  // ── Driver endpoints ──

  @Patch('driver/orders/:id/status')
  @Roles('driver')
  @UsePipes(new ZodValidationPipe(updateOrderStatusSchema))
  updateDriverOrderStatus(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateOrderStatus(id, dto.status, user.sub, user.role, dto.note)
  }
}

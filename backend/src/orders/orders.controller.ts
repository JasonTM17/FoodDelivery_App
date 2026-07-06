import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, UseInterceptors } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { Roles } from '../auth/roles.decorator'
import { RolesGuard } from '../auth/roles.guard'
import { CurrentUser } from '../auth/current-user.decorator'
import { JwtPayload } from '../auth/jwt-payload.interface'
import { OrdersService } from './orders.service'
import { DeliveryPricingService } from './delivery-pricing.service'
import { PlaceOrderDto, CancelOrderDto, CreateReviewDto, UpdateOrderStatusDto, CreateOrderChatMessageDto } from './orders.dto'
import { OrderChatService } from './order-chat.service'
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe'
import { placeOrderSchema, cancelOrderSchema, createReviewSchema, updateOrderStatusSchema, createOrderChatMessageSchema } from './orders.zod'
import { IdempotencyInterceptor } from './idempotency.interceptor'

@ApiTags('orders')
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly orderChatService: OrderChatService,
    private readonly deliveryPricing: DeliveryPricingService,
  ) {}

  @Post('orders')
  @Roles('customer')
  @UseInterceptors(IdempotencyInterceptor)
  placeOrder(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(placeOrderSchema)) dto: PlaceOrderDto,
  ) {
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

  @Get('orders/delivery-pricing')
  @Roles('customer')
  getDeliveryPricing() {
    return { baseDeliveryFeeVnd: this.deliveryPricing.getBaseDeliveryFeeVnd() }
  }

  @Get('orders/:id')
  getOrderDetail(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.ordersService.getOrderDetail(id, user.sub, user.role)
  }

  @Post('orders/:id/cancel')
  @Roles('customer')
  cancelOrder(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(cancelOrderSchema)) dto?: CancelOrderDto,
  ) {
    return this.ordersService.cancelOrder(id, user.sub, user.role, dto)
  }

  @Post('orders/:id/review')
  @Roles('customer')
  submitReview(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(createReviewSchema)) dto: CreateReviewDto,
  ) {
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

  @Get('restaurant/orders/:id/messages')
  @Roles('restaurant')
  getRestaurantOrderMessages(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.orderChatService.getRestaurantOrderMessages(id, user.sub)
  }

  @Post('restaurant/orders/:id/messages')
  @Roles('restaurant')
  createRestaurantOrderMessage(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(createOrderChatMessageSchema)) dto: CreateOrderChatMessageDto,
  ) {
    return this.orderChatService.createRestaurantOrderMessage(id, user.sub, dto)
  }

  @Patch('restaurant/orders/:id/status')
  @Roles('restaurant')
  async updateRestaurantOrderStatus(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateOrderStatusSchema)) dto: UpdateOrderStatusDto,
  ) {
    await this.ordersService.updateOrderStatus(id, dto.status, user.sub, user.role, dto.note)
    return this.ordersService.getRestaurantOrderDetail(id, user.sub)
  }

  // ── Driver endpoints ──

  @Patch('driver/orders/:id/status')
  @Roles('driver')
  updateDriverOrderStatus(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateOrderStatusSchema)) dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateOrderStatus(id, dto.status, user.sub, user.role, dto.note)
  }
}

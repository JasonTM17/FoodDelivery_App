import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { UserRole } from '@prisma/client'
import { CurrentUser } from '../auth/current-user.decorator'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { JwtPayload } from '../auth/jwt-payload.interface'
import { Roles } from '../auth/roles.decorator'
import { RolesGuard } from '../auth/roles.guard'
import { AuditLog } from '../common/interceptors/audit-log.decorator'
import {
  AdminOrderStatusDto,
  KycReviewDto,
  RestaurantMenuAvailabilityDto,
  RestaurantReviewDto,
} from './admin-resources.dto'
import { AdminResourcesService } from './admin-resources.service'

@ApiTags('admin-resources')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.admin)
export class AdminResourcesController {
  constructor(private readonly resources: AdminResourcesService) {}

  @Get('orders/:id')
  getOrder(@Param('id') id: string) { return this.resources.getOrder(id) }

  @Patch('orders/:id/status')
  @AuditLog({ action: 'order.status.update', targetType: 'order', targetIdResolver: (_result, req) => String(req.params.id) })
  updateOrder(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: AdminOrderStatusDto,
  ) { return this.resources.updateOrder(id, dto.status, user.sub, dto.note) }

  @Get('restaurants/:id')
  getRestaurant(@Param('id') id: string) { return this.resources.getRestaurant(id) }

  @Get('restaurants/:id/overview')
  getRestaurantOverview(@Param('id') id: string) { return this.resources.getRestaurantOverview(id) }

  @Get('restaurants/:id/menu')
  getRestaurantMenu(@Param('id') id: string) { return this.resources.getRestaurantMenu(id) }

  @Patch('restaurants/:id/menu/:itemId')
  @AuditLog({ action: 'restaurant.menu.availability', targetType: 'menu_item', targetIdResolver: (_result, req) => String(req.params.itemId) })
  updateRestaurantMenu(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: RestaurantMenuAvailabilityDto,
  ) { return this.resources.toggleRestaurantMenuItem(id, itemId, dto.available) }

  @Get('restaurants/:id/orders')
  getRestaurantOrders(
    @Param('id') id: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) { return this.resources.getRestaurantOrders(id, Number(page), Number(limit)) }

  @Get('restaurants/:id/reviews')
  getRestaurantReviews(
    @Param('id') id: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) { return this.resources.getRestaurantReviews(id, Number(page), Number(limit)) }

  @Get('restaurants/:id/finance')
  getRestaurantFinance(@Param('id') id: string) { return this.resources.getRestaurantFinance(id) }

  @Post('restaurants/:id/approve')
  @AuditLog({ action: 'restaurant.approve', targetType: 'restaurant', targetIdResolver: (_result, req) => String(req.params.id) })
  approveRestaurant(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: RestaurantReviewDto,
  ) { return this.resources.reviewRestaurant(id, user.sub, 'approved', dto.notes ?? dto.reason) }

  @Post('restaurants/:id/reject')
  @AuditLog({ action: 'restaurant.reject', targetType: 'restaurant', targetIdResolver: (_result, req) => String(req.params.id) })
  rejectRestaurant(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: RestaurantReviewDto,
  ) { return this.resources.reviewRestaurant(id, user.sub, 'rejected', dto.notes ?? dto.reason) }

  @Get('users/:id')
  getUser(@Param('id') id: string) { return this.resources.getUser(id) }

  @Get('users/:id/wallet')
  getUserWallet(@Param('id') id: string) { return this.resources.getUserWallet(id) }

  @Get('users/:id/vouchers')
  getUserVouchers(@Param('id') id: string) { return this.resources.getUserVouchers(id) }

  @Get('users/:id/refunds')
  getUserRefunds(@Param('id') id: string) { return this.resources.getUserRefunds(id) }

  @Get('users/:id/kyc')
  getUserKyc(@Param('id') id: string) { return this.resources.getUserKyc(id) }

  @Post('users/:id/kyc/review')
  @AuditLog({ action: 'driver.kyc.review', targetType: 'user', targetIdResolver: (_result, req) => String(req.params.id) })
  reviewUserKyc(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: KycReviewDto,
  ) { return this.resources.reviewUserKyc(id, dto.submissionId, dto.status, user.sub, dto.reason) }

  @Get('promotions/:id/analytics')
  getPromotionAnalytics(@Param('id') id: string) { return this.resources.getPromotionAnalytics(id) }

  @Get('promotions/:id')
  getPromotion(@Param('id') id: string) { return this.resources.getPromotion(id) }
}

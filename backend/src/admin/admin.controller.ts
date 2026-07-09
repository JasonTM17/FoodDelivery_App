import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards, UsePipes } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { UserRole } from '@prisma/client'
import { CurrentUser } from '../auth/current-user.decorator'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { JwtPayload } from '../auth/jwt-payload.interface'
import { Roles } from '../auth/roles.decorator'
import { RolesGuard } from '../auth/roles.guard'
import { AdminService } from './admin.service'
import { CreatePromotionDto, UpdatePromotionDto, PromotionQueryDto } from './dto/promotion.dto'
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe'
import {
  createPromotionSchema, updatePromotionSchema,
  toggleUserStatusSchema, toggleRestaurantStatusSchema,
  updateSupportTicketSchema,
} from './admin.zod'

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.admin)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  getDashboard() { return this.adminService.getDashboard() }

  @Get('dashboard/top-restaurants')
  getTopRestaurants(@Query('days') days?: string) {
    return this.adminService.getTopRestaurants(Number(days) || 7)
  }

  @Get('dashboard/revenue-chart')
  getRevenueChart(@Query('days') days?: string) {
    return this.adminService.getRevenueChart(Number(days) || 7)
  }

  @Get('orders')
  getOrders(@Query('status') status?: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.adminService.getOrders({
      status,
      page: this.optionalPositiveInt(page),
      limit: this.optionalPositiveInt(limit),
    })
  }

  @Get('users')
  getUsers(@Query('role') role?: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.adminService.getUsers({
      role,
      page: this.optionalPositiveInt(page),
      limit: this.optionalPositiveInt(limit),
    })
  }

  @Patch('users/:id/status')
  @UsePipes(new ZodValidationPipe(toggleUserStatusSchema))
  toggleUserStatus(
    @Param('id') id: string,
    @Body() body: { isActive?: boolean; status?: string },
  ) {
    return this.adminService.toggleUserStatus(id, body)
  }

  @Get('restaurants')
  getRestaurants(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.adminService.getRestaurants({
      page: this.optionalPositiveInt(page),
      limit: this.optionalPositiveInt(limit),
    })
  }

  @Patch('restaurants/:id/status')
  @UsePipes(new ZodValidationPipe(toggleRestaurantStatusSchema))
  toggleRestaurantStatus(
    @Param('id') id: string,
    @Body() body: { isActive?: boolean; status?: string },
  ) {
    return this.adminService.toggleRestaurantStatus(id, body)
  }

  @Get('support-tickets')
  getSupportTickets(@Query('status') status?: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.adminService.getSupportTickets({
      status,
      page: this.optionalPositiveInt(page),
      limit: this.optionalPositiveInt(limit),
    })
  }

  /** Avoid Number(undefined) === NaN which breaks Prisma take/skip. */
  private optionalPositiveInt(raw?: string): number | undefined {
    if (raw === undefined || raw === null || raw === '') return undefined
    const n = Number(raw)
    return Number.isFinite(n) && n > 0 ? Math.trunc(n) : undefined
  }

  @Patch('support-tickets/:id')
  @UsePipes(new ZodValidationPipe(updateSupportTicketSchema))
  updateSupportTicket(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: {
      status?: string
      assignedAdminId?: string
      assignedTo?: string
      resolutionNotes?: string
    },
  ) {
    const assignedAdminId =
      body.assignedAdminId ??
      (body.assignedTo === 'self' ? user.sub : undefined)
    return this.adminService.updateSupportTicket(id, {
      status: body.status,
      assignedAdminId,
      resolutionNotes: body.resolutionNotes,
    })
  }

  @Get('promotions')
  async getPromotions(@Query() query: PromotionQueryDto) {
    return this.adminService.getPromotions(query)
  }

  @Post('promotions')
  @UsePipes(new ZodValidationPipe(createPromotionSchema))
  async createPromotion(@Body() dto: CreatePromotionDto) {
    return this.adminService.createPromotion(dto)
  }

  @Patch('promotions/:id')
  @UsePipes(new ZodValidationPipe(updatePromotionSchema))
  async updatePromotion(@Param('id') id: string, @Body() dto: UpdatePromotionDto) {
    return this.adminService.updatePromotion(id, dto)
  }

  @Delete('promotions/:id')
  async deletePromotion(@Param('id') id: string) {
    return this.adminService.deletePromotion(id)
  }

  @Patch('promotions/:id/toggle')
  async togglePromotionActive(@Param('id') id: string) {
    return this.adminService.togglePromotionActive(id)
  }

  @Get('dispatch/heatmap')
  getDispatchHeatmap(@Query('since') since: unknown) {
    return this.adminService.getDispatchHeatmap(since)
  }

  @Get('restaurants/:id/kpi')
  getRestaurantKpi(@Param('id') id: string, @Query('period') period: string = '7d') {
    return this.adminService.getRestaurantKpi(id, period)
  }
}

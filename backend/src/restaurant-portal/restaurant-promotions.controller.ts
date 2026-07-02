import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { UserRole } from '@prisma/client'
import { CurrentUser } from '../auth/current-user.decorator'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { JwtPayload } from '../auth/jwt-payload.interface'
import { Roles } from '../auth/roles.decorator'
import { RolesGuard } from '../auth/roles.guard'
import {
  BulkPromotionDto,
  CreateRestaurantPromotionDto,
  PromotionTargetingPreviewQueryDto,
  UpdateRestaurantPromotionDto,
} from './restaurant-promotion.dto'
import { RestaurantPromotionTargetingService } from './restaurant-promotion-targeting.service'
import { RestaurantPromotionsService } from './restaurant-promotions.service'

@ApiTags('restaurant-promotions')
@ApiBearerAuth()
@Controller('restaurant/promotions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.restaurant)
export class RestaurantPromotionsController {
  constructor(
    private readonly service: RestaurantPromotionsService,
    private readonly targeting: RestaurantPromotionTargetingService,
  ) {}

  @Get()
  list(
    @CurrentUser() user: JwtPayload,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.service.list(user.sub, { status, search, page: Number(page), limit: Number(limit) })
  }

  @Get('targeting-preview')
  previewTargeting(
    @CurrentUser() user: JwtPayload,
    @Query() query: PromotionTargetingPreviewQueryDto,
  ) {
    return this.targeting.preview(user.sub, query)
  }

  @Get(':id')
  get(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.get(user.sub, id)
  }

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateRestaurantPromotionDto) {
    return this.service.create(user.sub, dto)
  }

  @Patch(':id')
  update(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: UpdateRestaurantPromotionDto) {
    return this.service.update(user.sub, id, dto)
  }

  @Delete(':id')
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.remove(user.sub, id)
  }

  @Post('bulk')
  bulk(@CurrentUser() user: JwtPayload, @Body() dto: BulkPromotionDto) {
    return this.service.bulk(user.sub, dto)
  }

  @Post(':id/broadcast')
  broadcast(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.broadcast(user.sub, id)
  }
}

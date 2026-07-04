import { BadRequestException, Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common'
import { PromotionsService } from './promotions.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { CurrentUser } from '../auth/current-user.decorator'
import type { JwtPayload } from '../auth/jwt-payload.interface'

type ValidatePromotionBody = {
  code?: unknown
  restaurantId?: unknown
  subtotal?: unknown
}

@UseGuards(JwtAuthGuard)
@Controller('promotions')
export class PromotionsController {
  constructor(private readonly service: PromotionsService) {}

  @Post('validate')
  validate(@CurrentUser() user: JwtPayload, @Body() body: ValidatePromotionBody) {
    const code = typeof body.code === 'string' ? body.code.trim() : ''
    const restaurantId = typeof body.restaurantId === 'string' ? body.restaurantId : ''
    const subtotal = typeof body.subtotal === 'number' ? body.subtotal : Number(body.subtotal)
    if (!code || !restaurantId || !Number.isFinite(subtotal) || subtotal < 0) {
      throw new BadRequestException('PROMOTION_VALIDATE_INVALID_BODY')
    }
    return this.service.preview(code, { restaurantId, subtotal }, user.sub)
  }

  @Get('available')
  listAvailable(@CurrentUser() user: JwtPayload) {
    return this.service.listAvailable(user.sub)
  }

  @Get('my')
  listMine(@CurrentUser() user: JwtPayload) {
    return this.service.listMine(user.sub)
  }

  @Get(':code')
  getByCode(@Param('code') code: string) {
    return this.service.findByCode(code)
  }
}

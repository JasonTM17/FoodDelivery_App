import { Controller, Get, Param, UseGuards } from '@nestjs/common'
import { PromotionsService } from './promotions.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@UseGuards(JwtAuthGuard)
@Controller('promotions')
export class PromotionsController {
  constructor(private readonly service: PromotionsService) {}

  @Get(':code')
  getByCode(@Param('code') code: string) {
    return this.service.findByCode(code)
  }
}

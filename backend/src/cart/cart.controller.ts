import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, UsePipes } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { Roles } from '../auth/roles.decorator'
import { CurrentUser } from '../auth/current-user.decorator'
import { JwtPayload } from '../auth/jwt-payload.interface'
import { CartService } from './cart.service'
import { AddCartItemDto, UpdateCartItemDto, ApplyPromotionDto } from './cart.dto'
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe'
import { addCartItemSchema, updateCartItemSchema, applyPromotionSchema } from './cart.zod'

@ApiTags('cart')
@Controller('cart')
@UseGuards(JwtAuthGuard)
@Roles('customer')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(@CurrentUser() user: JwtPayload) {
    return this.cartService.getCart(user.sub)
  }

  @Post('items')
  @UsePipes(new ZodValidationPipe(addCartItemSchema))
  addItem(@CurrentUser() user: JwtPayload, @Body() dto: AddCartItemDto) {
    return this.cartService.addItem(user.sub, dto)
  }

  @Patch('items/:id')
  @UsePipes(new ZodValidationPipe(updateCartItemSchema))
  updateItem(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: UpdateCartItemDto) {
    return this.cartService.updateItem(user.sub, id, dto)
  }

  @Delete('items/:id')
  removeItem(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.cartService.removeItem(user.sub, id)
  }

  @Delete()
  clearCart(@CurrentUser() user: JwtPayload) {
    return this.cartService.clearCart(user.sub)
  }

  @Post('apply-promotion')
  @UsePipes(new ZodValidationPipe(applyPromotionSchema))
  applyPromotion(@CurrentUser() user: JwtPayload, @Body() dto: ApplyPromotionDto) {
    return this.cartService.applyPromotion(user.sub, dto)
  }
}

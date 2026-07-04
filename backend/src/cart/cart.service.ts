import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../database/prisma.service'
import { AddCartItemDto, UpdateCartItemDto, ApplyPromotionDto } from './cart.dto'
import { PromotionsService } from '../promotions/promotions.service'

@Injectable()
export class CartService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly promotionsService: PromotionsService,
  ) {}

  async getCart(userId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: { include: { menuItem: { include: { options: { include: { values: true } } } } } },
      },
    })
    if (!cart) return { items: [], restaurantId: null, promotionCode: null }
    return cart
  }

  async addItem(userId: string, dto: AddCartItemDto) {
    const menuItem = await this.prisma.menuItem.findUnique({
      where: { id: dto.menuItemId },
      include: { restaurant: true },
    })
    if (!menuItem || !menuItem.isAvailable) {
      throw new NotFoundException('MENU_ITEM_NOT_FOUND')
    }
    if (menuItem.restaurantId !== dto.restaurantId) {
      throw new BadRequestException('ITEM_NOT_IN_RESTAURANT')
    }
    if (!menuItem.restaurant.isOpen || !menuItem.restaurant.isActive) {
      throw new BadRequestException('RESTAURANT_UNAVAILABLE')
    }

    let cart = await this.prisma.cart.findUnique({ where: { userId } })

    if (cart && cart.restaurantId !== dto.restaurantId) {
      await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } })
      await this.prisma.cart.update({ where: { id: cart.id }, data: { restaurantId: dto.restaurantId, promotionCode: null } })
    }

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId, restaurantId: dto.restaurantId },
      })
    }

    const existing = await this.prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        menuItemId: dto.menuItemId,
        selectedOptions: { equals: dto.selectedOptions ?? [] },
      },
    })

    if (existing) {
      return this.prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + dto.quantity },
      })
    }

    return this.prisma.cartItem.create({
      data: {
        cartId: cart.id,
        menuItemId: dto.menuItemId,
        quantity: dto.quantity,
        selectedOptions: dto.selectedOptions ?? [],
        unitPrice: menuItem.basePrice,
        notes: dto.notes,
      },
    })
  }

  async updateItem(userId: string, itemId: string, dto: UpdateCartItemDto) {
    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cart: { userId } },
    })
    if (!item) throw new NotFoundException('CART_ITEM_NOT_FOUND')
    return this.prisma.cartItem.update({ where: { id: itemId }, data: dto })
  }

  async removeItem(userId: string, itemId: string) {
    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cart: { userId } },
    })
    if (!item) throw new NotFoundException('CART_ITEM_NOT_FOUND')
    await this.prisma.cartItem.delete({ where: { id: itemId } })
    return { deleted: true }
  }

  async clearCart(userId: string) {
    const cart = await this.prisma.cart.findUnique({ where: { userId } })
    if (cart) {
      await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } })
      await this.prisma.cart.delete({ where: { id: cart.id } })
    }
    return { cleared: true }
  }

  async applyPromotion(userId: string, dto: ApplyPromotionDto) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: { items: true },
    })
    if (!cart || cart.items.length === 0) throw new BadRequestException('CART_EMPTY')
    if (!cart.restaurantId) throw new BadRequestException('CART_NO_RESTAURANT')

    const subtotal = cart.items.reduce((sum, i) => sum + Number(i.unitPrice) * i.quantity, 0)
    const { discountAmount } = await this.promotionsService.preview(
      dto.code,
      { subtotal, restaurantId: cart.restaurantId },
      userId,
    )

    await this.prisma.cart.update({
      where: { id: cart.id },
      data: { promotionCode: dto.code },
    })

    return { code: dto.code, discount: discountAmount, subtotal: Number(subtotal) }
  }
}

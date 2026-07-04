import { Test, TestingModule } from '@nestjs/testing'
import { CartService } from './cart.service'
import { PrismaService } from '../database/prisma.service'
import { BadRequestException } from '@nestjs/common'
import { PromotionsService } from '../promotions/promotions.service'

describe('CartService', () => {
  let service: CartService
  const mockPrisma = {
    cart: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    cartItem: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), deleteMany: jest.fn() },
    menuItem: { findUnique: jest.fn() },
  }
  const mockPromotionsService = {
    preview: jest.fn(),
  }

  beforeEach(async () => {
    jest.clearAllMocks()
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: PromotionsService, useValue: mockPromotionsService },
      ],
    }).compile()
    service = module.get(CartService)
  })

  describe('getCart', () => {
    it('returns empty cart for new user', async () => {
      mockPrisma.cart.findUnique.mockResolvedValueOnce(null)
      const result = await service.getCart('user-1')
      expect(result.items).toEqual([])
    })
  })

  describe('applyPromotion', () => {
    it('previews promotion eligibility with the authenticated user cart context', async () => {
      mockPrisma.cart.findUnique.mockResolvedValue({
        id: 'cart-1',
        restaurantId: 'restaurant-1',
        items: [{ unitPrice: 50000, quantity: 2 }],
      })
      mockPromotionsService.preview.mockResolvedValue({ discountAmount: 10000 })
      mockPrisma.cart.update.mockResolvedValue({})

      const result = await service.applyPromotion('user-1', { code: 'SAVE10' })

      expect(mockPromotionsService.preview).toHaveBeenCalledWith(
        'SAVE10',
        { subtotal: 100000, restaurantId: 'restaurant-1' },
        'user-1',
      )
      expect(mockPrisma.cart.update).toHaveBeenCalledWith({
        where: { id: 'cart-1' },
        data: { promotionCode: 'SAVE10' },
      })
      expect(result).toEqual({ code: 'SAVE10', discount: 10000, subtotal: 100000 })
    })

    it('rejects carts without a restaurant before previewing promotion', async () => {
      mockPrisma.cart.findUnique.mockResolvedValue({
        id: 'cart-1',
        restaurantId: null,
        items: [{ unitPrice: 50000, quantity: 1 }],
      })

      await expect(service.applyPromotion('user-1', { code: 'SAVE10' }))
        .rejects.toThrow(BadRequestException)
      expect(mockPromotionsService.preview).not.toHaveBeenCalled()
    })
  })
})

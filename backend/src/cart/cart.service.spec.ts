import { Test, TestingModule } from '@nestjs/testing'
import { CartService } from './cart.service'
import { PrismaService } from '../database/prisma.service'
import { BadRequestException } from '@nestjs/common'

describe('CartService', () => {
  let service: CartService
  const mockPrisma = {
    cart: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    cartItem: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), deleteMany: jest.fn() },
    menuItem: { findUnique: jest.fn() },
    promotion: { findUnique: jest.fn() },
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CartService, { provide: PrismaService, useValue: mockPrisma }],
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
})

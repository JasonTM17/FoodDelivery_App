import { ForbiddenException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { MenuService } from './menu.service'
import { PrismaService } from '../database/prisma.service'

describe('MenuService', () => {
  let service: MenuService
  const mockPrisma = {
    category: { findMany: jest.fn().mockResolvedValue([]), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    menuItem: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    restaurantProfile: {
      findUnique: jest.fn().mockResolvedValue({ restaurantId: 'rest-1' }),
      findFirst: jest.fn().mockResolvedValue({ restaurantId: 'rest-1' }),
    },
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MenuService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile()
    service = module.get(MenuService)
  })

  it('should be defined', () => expect(service).toBeDefined())

  it('denies menu writes for a deactivated restaurant profile', async () => {
    mockPrisma.restaurantProfile.findFirst.mockResolvedValueOnce(null)

    await expect(
      service.createCategory('user-1', { name: 'Drinks' } as never),
    ).rejects.toThrow(ForbiddenException)
    expect(mockPrisma.category.create).not.toHaveBeenCalled()
  })
})

import { Test, TestingModule } from '@nestjs/testing'
import { MenuService } from './menu.service'
import { PrismaService } from '../database/prisma.service'

describe('MenuService', () => {
  let service: MenuService
  const mockPrisma = {
    category: { findMany: jest.fn().mockResolvedValue([]), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    menuItem: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    restaurantProfile: { findUnique: jest.fn() },
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MenuService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile()
    service = module.get(MenuService)
  })

  it('should be defined', () => expect(service).toBeDefined())
})

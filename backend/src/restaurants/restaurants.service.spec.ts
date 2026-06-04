import { Test, TestingModule } from '@nestjs/testing'
import { RestaurantsService } from './restaurants.service'
import { PrismaService } from '../database/prisma.service'

describe('RestaurantsService', () => {
  let service: RestaurantsService
  const mockPrisma = {
    $queryRawUnsafe: jest.fn().mockResolvedValue([]),
    restaurant: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn() },
    review: { findMany: jest.fn().mockResolvedValue([]), count: jest.fn().mockResolvedValue(0) },
    category: { findMany: jest.fn().mockResolvedValue([]) },
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RestaurantsService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile()
    service = module.get(RestaurantsService)
  })

  it('should be defined', () => expect(service).toBeDefined())

  describe('findNearby', () => {
    it('returns empty when no restaurants nearby', async () => {
      const result = await service.findNearby(10.8, 106.7, 5)
      expect(result).toEqual([])
    })
  })
})

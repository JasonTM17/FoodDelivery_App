import { Test, TestingModule } from '@nestjs/testing'
import { RestaurantsService } from './restaurants.service'
import { PrismaService } from '../database/prisma.service'

describe('RestaurantsService', () => {
  let service: RestaurantsService
  const mockPrisma = {
    $queryRaw: jest.fn().mockResolvedValue([]),
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
      const result = await service.findNearby({ lat: 10.8, lng: 106.7, radius: 5, page: 1, limit: 10 })
      expect(result).toEqual({ items: [], limit: 10, page: 1, total: 0 })
    })
  })
})

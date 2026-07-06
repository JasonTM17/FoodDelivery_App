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

  describe('getMenu', () => {
    it('serializes public menu categories without leaking raw Prisma shape', async () => {
      mockPrisma.restaurant.findUnique.mockResolvedValueOnce({
        id: 'restaurant-1',
        categories: [
          {
            id: 'category-1',
            name: 'Phở',
            sortOrder: 1,
            menuItems: [
              {
                id: 'item-1',
                name: 'Phở bò',
                description: null,
                imageUrl: null,
                basePrice: 65000,
                isAvailable: true,
                isPopular: true,
                options: [
                  {
                    id: 'option-1',
                    name: 'Size',
                    isRequired: true,
                    isMultiple: false,
                    values: [
                      { id: 'value-1', value: 'Lớn', priceModifier: 15000 },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      })

      const result = await service.getMenu('restaurant-1')

      expect(result).toEqual({
        categories: [
          {
            id: 'category-1',
            name: 'Phở',
            sortOrder: 1,
            items: [
              {
                id: 'item-1',
                restaurantId: 'restaurant-1',
                name: 'Phở bò',
                description: '',
                imageUrl: '',
                basePrice: 65000,
                isAvailable: true,
                isPopular: true,
                options: [
                  {
                    id: 'option-1',
                    name: 'Size',
                    isRequired: true,
                    isMultiple: false,
                    values: [
                      { id: 'value-1', value: 'Lớn', priceModifier: 15000 },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      })
      expect(mockPrisma.restaurant.findUnique).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'restaurant-1' },
        select: expect.objectContaining({ categories: expect.any(Object) }),
      }))
    })
  })
})

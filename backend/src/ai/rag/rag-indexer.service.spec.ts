import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../../database/prisma.service'
import { RagDocumentRepository } from './rag-document.repository'
import { RagIndexerService } from './rag-indexer.service'

function menuItem(id: string) {
  return {
    id,
    name: `Món ${id}`,
    description: null,
    basePrice: 50_000,
    isPopular: false,
    category: { name: 'Món chính' },
    restaurant: { name: 'FoodFlow', cuisineTypes: ['Vietnamese'], city: 'TP.HCM' },
  }
}

function restaurant(id: string) {
  return {
    id,
    name: `Nhà hàng ${id}`,
    description: null,
    cuisineTypes: ['Vietnamese'],
    priceRange: 'medium' as const,
    rating: 4.8,
    city: 'TP.HCM',
    prepTimeAvgMinutes: 15,
    addressLine: 'Quận 1',
  }
}

describe('RagIndexerService', () => {
  const config = {
    get: jest.fn((key: string, fallback: number) => ({
      RAG_SYNC_BATCH_SIZE: 2,
      RAG_SYNC_CONCURRENCY: 2,
    })[key] ?? fallback),
  } as unknown as ConfigService

  it('reads all live business rows by cursor and upserts them idempotently', async () => {
    const menuFindMany = jest.fn()
      .mockResolvedValueOnce([menuItem('menu-1'), menuItem('menu-2')])
      .mockResolvedValueOnce([menuItem('menu-3')])
    const restaurantFindMany = jest.fn().mockResolvedValueOnce([restaurant('restaurant-1')])
    const prisma = {
      menuItem: { findMany: menuFindMany },
      restaurant: { findMany: restaurantFindMany },
    } as unknown as PrismaService
    const documents = {
      prepareChanged: jest.fn(async (entries: Array<{ sourceId: string }>) => ({
        changed: entries.map((entry: { sourceId: string }) => ({ entry, contentHash: `hash-${entry.sourceId}` })),
        unchanged: 0,
      })),
      upsert: jest.fn().mockResolvedValue(undefined),
      deactivateMissingMenuItems: jest.fn().mockResolvedValue(0),
      deactivateMissingRestaurants: jest.fn().mockResolvedValue(0),
    } as unknown as RagDocumentRepository

    const result = await new RagIndexerService(prisma, documents, config).syncDynamicData()

    expect(result).toEqual({ indexed: 4, unchanged: 0, failed: 0, deactivated: 0 })
    expect(menuFindMany).toHaveBeenNthCalledWith(1, expect.objectContaining({
      take: 2,
      orderBy: { id: 'asc' },
    }))
    expect(menuFindMany).toHaveBeenNthCalledWith(2, expect.objectContaining({
      cursor: { id: 'menu-2' },
      skip: 1,
    }))
    expect(restaurantFindMany).toHaveBeenCalledWith(expect.objectContaining({ take: 2 }))
    expect(documents.upsert).toHaveBeenCalledTimes(4)
  })

  it('does not deactivate menu documents after a partial indexing failure', async () => {
    const prisma = {
      menuItem: { findMany: jest.fn().mockResolvedValueOnce([menuItem('menu-1')]) },
      restaurant: { findMany: jest.fn().mockResolvedValueOnce([]) },
    } as unknown as PrismaService
    const documents = {
      prepareChanged: jest.fn(async (entries: Array<{ sourceId: string }>) => ({
        changed: entries.map((entry: { sourceId: string }) => ({ entry, contentHash: `hash-${entry.sourceId}` })),
        unchanged: 0,
      })),
      upsert: jest.fn().mockRejectedValueOnce(new Error('database unavailable')),
      deactivateMissingMenuItems: jest.fn().mockResolvedValue(0),
      deactivateMissingRestaurants: jest.fn().mockResolvedValue(0),
    } as unknown as RagDocumentRepository

    const result = await new RagIndexerService(prisma, documents, config).syncDynamicData()

    expect(result).toEqual({ indexed: 0, unchanged: 0, failed: 1, deactivated: 0 })
    expect(documents.deactivateMissingMenuItems).not.toHaveBeenCalled()
    expect(documents.deactivateMissingRestaurants).toHaveBeenCalledTimes(1)
  })
})

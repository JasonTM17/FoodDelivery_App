import { Test, TestingModule } from '@nestjs/testing'
import { DriversService } from './drivers.service'
import { PrismaService } from '../database/prisma.service'
import { BadRequestException } from '@nestjs/common'

describe('DriversService', () => {
  let service: DriversService
  const mockRedis = {
    geoadd: jest.fn(), set: jest.fn(), setex: jest.fn(), del: jest.fn(), zrem: jest.fn(),
  }
  const mockPrisma = {
    driverProfile: { findUniqueOrThrow: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    payment: { findMany: jest.fn() },
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DriversService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: 'REDIS_CLIENT', useValue: mockRedis },
      ],
    }).compile()
    service = module.get(DriversService)
  })

  describe('goOnline', () => {
    it('throws if driver not verified', async () => {
      mockPrisma.driverProfile.findUniqueOrThrow.mockResolvedValueOnce({ isVerified: false, rating: '4.0' })
      await expect(service.goOnline('d1', 10.8, 106.7)).rejects.toThrow(BadRequestException)
    })

    it('adds driver to Redis GEO and sets status', async () => {
      mockPrisma.driverProfile.findUniqueOrThrow.mockResolvedValueOnce({ isVerified: true, rating: '4.5' })
      mockPrisma.driverProfile.update.mockResolvedValueOnce({})
      await service.goOnline('d1', 10.8, 106.7)
      expect(mockRedis.geoadd).toHaveBeenCalled()
      expect(mockRedis.set).toHaveBeenCalledWith('driver:d1:status', 'online')
      expect(mockRedis.setex).toHaveBeenCalledWith(
        'driver:d1:last_seen_at',
        35,
        expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
      )
    })
  })
})

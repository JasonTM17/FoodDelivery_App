import { Test, TestingModule } from '@nestjs/testing'
import { IncentivesService } from './incentives.service'
import { PrismaService } from '../database/prisma.service'

describe('IncentivesService', () => {
  let service: IncentivesService
  const mockPrisma = {
    driverIncentiveCampaign: {
      findMany: jest.fn(),
    },
    deliveryTask: {
      count: jest.fn(),
    },
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IncentivesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile()
    service = module.get(IncentivesService)
    jest.clearAllMocks()
  })

  describe('getDriverIncentives', () => {
    it('returns real empty lists when no durable campaigns exist', async () => {
      mockPrisma.driverIncentiveCampaign.findMany.mockResolvedValue([])

      await expect(service.getDriverIncentives('driver-001')).resolves.toEqual({
        active: [],
        completed: [],
      })
      expect(mockPrisma.deliveryTask.count).not.toHaveBeenCalled()
    })

    it('calculates active and completed incentives from delivered driver tasks', async () => {
      const now = new Date()
      const activeCampaign = {
        id: 'campaign-active',
        title: 'Complete 5 lunch trips',
        rewardAmount: 50_000,
        targetOrders: 5,
        startsAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        endsAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        createdAt: now,
      }
      const completedCampaign = {
        id: 'campaign-completed',
        title: 'Complete 2 weekend trips',
        rewardAmount: 20_000,
        targetOrders: 2,
        startsAt: new Date(now.getTime() - 48 * 60 * 60 * 1000),
        endsAt: new Date(now.getTime() + 48 * 60 * 60 * 1000),
        createdAt: now,
      }
      mockPrisma.driverIncentiveCampaign.findMany.mockResolvedValue([activeCampaign, completedCampaign])
      mockPrisma.deliveryTask.count
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(2)

      const result = await service.getDriverIncentives('driver-001')

      expect(result).toEqual({
        active: [{
          id: 'campaign-active',
          title: 'Complete 5 lunch trips',
          rewardAmount: 50_000,
          progress: 3,
          target: 5,
          endsAt: activeCampaign.endsAt.toISOString(),
        }],
        completed: [{
          id: 'campaign-completed',
          title: 'Complete 2 weekend trips',
          rewardAmount: 20_000,
          progress: 2,
          target: 2,
          endsAt: completedCampaign.endsAt.toISOString(),
        }],
      })
      expect(mockPrisma.deliveryTask.count).toHaveBeenCalledWith({
        where: {
          driverId: 'driver-001',
          status: 'delivered',
          deliveredAt: {
            gte: activeCampaign.startsAt,
            lte: activeCampaign.endsAt,
          },
        },
      })
    })

    it('omits expired campaigns that the driver did not complete', async () => {
      const endedCampaign = {
        id: 'campaign-ended',
        title: 'Expired campaign',
        rewardAmount: 10_000,
        targetOrders: 3,
        startsAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        endsAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      }
      mockPrisma.driverIncentiveCampaign.findMany.mockResolvedValue([endedCampaign])
      mockPrisma.deliveryTask.count.mockResolvedValueOnce(1)

      await expect(service.getDriverIncentives('driver-001')).resolves.toEqual({
        active: [],
        completed: [],
      })
    })
  })
})

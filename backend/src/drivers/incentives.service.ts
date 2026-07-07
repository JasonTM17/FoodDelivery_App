import { Injectable } from '@nestjs/common'
import { DeliveryTaskStatus } from '@prisma/client'
import { PrismaService } from '../database/prisma.service'

export interface IncentiveItem {
  id: string
  title: string
  rewardAmount: number
  progress: number
  target: number
  endsAt: string
}

export interface IncentivesResponse {
  active: IncentiveItem[]
  completed: IncentiveItem[]
}

@Injectable()
export class IncentivesService {
  constructor(private readonly prisma: PrismaService) {}

  async getDriverIncentives(driverId: string): Promise<IncentivesResponse> {
    const now = new Date()
    const historyCutoff = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    const campaigns = await this.prisma.driverIncentiveCampaign.findMany({
      where: {
        isActive: true,
        startsAt: { lte: now },
        endsAt: { gte: historyCutoff },
      },
      orderBy: [
        { endsAt: 'asc' },
        { createdAt: 'desc' },
      ],
    })

    if (campaigns.length === 0) return { active: [], completed: [] }

    const progressByCampaign = await Promise.all(campaigns.map(async (campaign) => {
      const progress = await this.prisma.deliveryTask.count({
        where: {
          driverId,
          status: DeliveryTaskStatus.delivered,
          deliveredAt: {
            gte: campaign.startsAt,
            lte: campaign.endsAt,
          },
        },
      })
      return { campaign, progress }
    }))

    const response: IncentivesResponse = { active: [], completed: [] }
    for (const { campaign, progress } of progressByCampaign) {
      const item: IncentiveItem = {
        id: campaign.id,
        title: campaign.title,
        rewardAmount: campaign.rewardAmount,
        progress,
        target: campaign.targetOrders,
        endsAt: campaign.endsAt.toISOString(),
      }

      if (progress >= campaign.targetOrders) {
        response.completed.push(item)
      } else if (campaign.endsAt >= now) {
        response.active.push(item)
      }
    }

    return response
  }
}

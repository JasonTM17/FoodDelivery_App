import { Injectable } from '@nestjs/common'

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
  getDriverIncentives(_driverId: string): IncentivesResponse {
    const endsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    return {
      active: [
        {
          id: 'incentive-001',
          title: 'Weekend Rush Bonus',
          rewardAmount: 100000,
          progress: 3,
          target: 10,
          endsAt,
        },
      ],
      completed: [],
    }
  }
}

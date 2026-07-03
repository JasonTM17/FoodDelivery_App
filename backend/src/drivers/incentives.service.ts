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
    return {
      active: [],
      completed: [],
    }
  }
}

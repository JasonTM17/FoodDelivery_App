import { Injectable, NotImplementedException } from '@nestjs/common'

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
    throw new NotImplementedException('DRIVER_INCENTIVES_NOT_MODELLED')
  }
}

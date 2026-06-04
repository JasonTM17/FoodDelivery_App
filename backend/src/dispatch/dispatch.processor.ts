import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq'
import { Job } from 'bullmq'
import { Logger } from '@nestjs/common'
import { DispatchService } from './dispatch.service'

interface DispatchJobData {
  orderId: string
  restaurantLat: number
  restaurantLng: number
  radius?: number
}

@Processor('dispatch')
export class DispatchProcessor extends WorkerHost {
  private readonly logger = new Logger(DispatchProcessor.name)

  constructor(private readonly dispatchService: DispatchService) {
    super()
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Dispatch job ${job.id} completed for order ${job.data.orderId}`)
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Dispatch job ${job.id} failed for order ${job.data.orderId}: ${error.message}`)
  }

  async process(job: Job<DispatchJobData>): Promise<{ assigned: boolean; driverId?: string }> {
    const { orderId, restaurantLat, restaurantLng, radius } = job.data
    this.logger.log(`Processing dispatch for order ${orderId} (radius: ${radius ?? 5}km)`)

    const result = await this.dispatchService.dispatchOrder(
      orderId, restaurantLat, restaurantLng, radius ?? 5,
    )

    if (!result.assigned) {
      this.logger.warn(`No driver found for order ${orderId}`)
    } else {
      this.logger.log(`Driver ${result.driverId} assigned to order ${orderId}`)
    }

    return result
  }
}

import { Processor, WorkerHost, OnWorkerEvent, InjectQueue } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { Job, Queue } from 'bullmq'
import { DispatchService } from './dispatch.service'

interface DispatchJobData {
  orderId: string
  restaurantLat: number
  restaurantLng: number
  attempt: number
}

// Radius per attempt: 3km → 5km → 8km (stays at 8km for attempts 4+)
const DISPATCH_RADII_KM = [3, 5, 8, 8, 8] as const
const MAX_ATTEMPTS = 5
const RETRY_DELAY_MS = 15_000

@Processor('dispatch')
export class DispatchProcessor extends WorkerHost {
  private readonly logger = new Logger(DispatchProcessor.name)

  constructor(
    private readonly dispatchService: DispatchService,
    @InjectQueue('dispatch') private readonly dispatchQueue: Queue,
  ) { super() }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Job ${job.id} completed for order ${job.data.orderId}`)
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} failed for order ${job.data.orderId}: ${error.message}`)
  }

  async process(job: Job<DispatchJobData>): Promise<{ assigned: boolean; driverId?: string }> {
    const { orderId, restaurantLat, restaurantLng, attempt } = job.data
    const radius = DISPATCH_RADII_KM[attempt - 1] ?? 8

    this.logger.log(`Dispatch attempt ${attempt}/${MAX_ATTEMPTS} for order ${orderId} (radius: ${radius}km)`)

    const result = await this.dispatchService.dispatchOrder(
      orderId, restaurantLat, restaurantLng, radius, attempt,
    )

    if (!result.assigned) {
      if (attempt >= MAX_ATTEMPTS) {
        this.logger.warn(`Auto-cancelling order ${orderId} after ${MAX_ATTEMPTS} failed attempts`)
        await this.dispatchService.autoCancelOrder(orderId)
      } else {
        await this.dispatchQueue.add(
          'dispatch.driver',
          { orderId, restaurantLat, restaurantLng, attempt: attempt + 1 },
          { delay: RETRY_DELAY_MS, jobId: `dispatch:${orderId}:${attempt + 1}` },
        )
        this.logger.log(`Requeued attempt ${attempt + 1} for order ${orderId}`)
      }
    } else {
      this.logger.log(`Driver ${result.driverId} assigned to order ${orderId} on attempt ${attempt}`)
    }

    return result
  }
}

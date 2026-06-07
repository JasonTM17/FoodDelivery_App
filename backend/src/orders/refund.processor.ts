import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { Job } from 'bullmq'
import { PaymentsService } from './payments.service'

export interface RefundJobData {
  orderId: string
  idempotencyKey: string
}

@Processor('refund')
export class RefundProcessor extends WorkerHost {
  private readonly logger = new Logger(RefundProcessor.name)

  constructor(private readonly paymentsService: PaymentsService) {
    super()
  }

  async process(job: Job<RefundJobData>): Promise<void> {
    const { orderId, idempotencyKey } = job.data
    this.logger.log(
      `Refund job attempt ${job.attemptsMade + 1} for order ${orderId} (key: ${idempotencyKey})`,
    )

    await this.paymentsService.refundPayment(orderId)
    this.logger.log(`Refund completed for order ${orderId}`)
  }
}

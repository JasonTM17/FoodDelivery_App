import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { Job } from 'bullmq'
import { PrismaService } from '../database/prisma.service'
import { OrderStatus } from './order-state-machine'

export interface TimeoutJobData {
  orderId: string
  expectedStatus: OrderStatus
  targetStatus: OrderStatus
  reason: string
}

// Forward-declare to avoid circular dep at module level; injected via DI
export interface IOrdersService {
  transition(orderId: string, toStatus: OrderStatus, actor: string, reason?: string): Promise<unknown>
}

export const ORDERS_SERVICE_TOKEN = 'ORDERS_SERVICE_FOR_TIMEOUT'

@Processor('order-timeout')
export class AutoTimeoutProcessor extends WorkerHost {
  private readonly logger = new Logger(AutoTimeoutProcessor.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly ordersService: IOrdersService,
  ) {
    super()
  }

  async process(job: Job<TimeoutJobData>): Promise<void> {
    const { orderId, expectedStatus, targetStatus, reason } = job.data
    this.logger.log(
      `Timeout check: order ${orderId} expected=${expectedStatus} → target=${targetStatus}`,
    )

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true },
    })

    if (!order) {
      this.logger.warn(`Order ${orderId} not found, skipping timeout`)
      return
    }

    // Idempotency: skip if order already moved past expected status
    if (order.status !== expectedStatus) {
      this.logger.log(
        `Order ${orderId} is now ${order.status}, skip auto-timeout to ${targetStatus}`,
      )
      return
    }

    await this.ordersService.transition(orderId, targetStatus, 'system', reason)
    this.logger.warn(`Order ${orderId} auto-timed-out: ${expectedStatus} → ${targetStatus}`)
  }
}

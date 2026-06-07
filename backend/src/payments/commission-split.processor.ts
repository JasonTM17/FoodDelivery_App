import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { Job } from 'bullmq'
import { PrismaService } from '../database/prisma.service'
import { CommissionService } from './commission.service'
import { PayoutLedgerService, LedgerEntryInput } from './payout-ledger.service'

export interface CommissionSplitJobData {
  orderId: string
}

@Processor('commission-split')
export class CommissionSplitProcessor extends WorkerHost {
  private readonly logger = new Logger(CommissionSplitProcessor.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly commission: CommissionService,
    private readonly ledger: PayoutLedgerService,
  ) {
    super()
  }

  async process(job: Job<CommissionSplitJobData>): Promise<void> {
    const { orderId } = job.data

    const order = await this.prisma.order.findUniqueOrThrow({
      where: { id: orderId },
      select: {
        id: true,
        total: true,
        deliveryFee: true,
        driverId: true,
        restaurantId: true,
        commissionRateAtOrderTime: true,
      },
    })

    const split = this.commission.calculateSplit({
      total: Number(order.total),
      deliveryFee: Number(order.deliveryFee),
      restaurantId: order.restaurantId,
      commissionRate: Number(order.commissionRateAtOrderTime),
    })

    const entries: LedgerEntryInput[] = [
      {
        orderId,
        recipientType: 'restaurant',
        recipientId: order.restaurantId,
        amount: split.restaurantPayout,
      },
      {
        orderId,
        recipientType: 'platform',
        amount: split.platformCut + split.platformDriverFee,
      },
    ]

    if (order.driverId) {
      entries.push({
        orderId,
        recipientType: 'driver',
        recipientId: order.driverId,
        amount: split.driverPayout,
      })
    }

    await this.ledger.insertEntries(entries)

    this.logger.log(
      `Commission split for order ${orderId}: restaurant=${split.restaurantPayout} driver=${split.driverPayout} platform=${split.platformCut + split.platformDriverFee}`,
    )
  }
}

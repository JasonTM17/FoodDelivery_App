import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { DriverTipReport, OrderStatus } from '@prisma/client'
import { PrismaService } from '../database/prisma.service'
import { DriverTipReportInput } from './driver-trip-tips.zod'

export interface DriverTipReportView {
  id: string
  tripId: string
  amount: number
  currency: string
  status: string
  createdAt: string
  updatedAt: string
}

@Injectable()
export class DriverTripTipsService {
  constructor(private readonly prisma: PrismaService) {}

  async reportCashTip(driverId: string, tripId: string, input: DriverTipReportInput): Promise<DriverTipReportView> {
    const order = await this.prisma.order.findFirst({
      where: {
        driverId,
        OR: [
          ...(isUuid(tripId) ? [{ id: tripId }] : []),
          { orderCode: tripId },
        ],
      },
      select: { id: true, status: true },
    })
    if (!order) throw new NotFoundException('DRIVER_TRIP_NOT_FOUND')
    if (!isCompletedTripStatus(order.status)) {
      throw new BadRequestException({
        code: 'DRIVER_TRIP_NOT_COMPLETED',
        message: 'Tip reports are accepted only after delivery is completed',
      })
    }

    const report = await this.prisma.driverTipReport.upsert({
      where: { orderId_driverId: { orderId: order.id, driverId } },
      create: {
        orderId: order.id,
        driverId,
        amount: input.amount,
        status: 'reported',
      },
      update: {
        amount: input.amount,
        status: 'reported',
      },
    })
    return toView(report)
  }
}

function isCompletedTripStatus(status: OrderStatus): boolean {
  return status === OrderStatus.delivered || status === OrderStatus.completed
}

function toView(report: DriverTipReport): DriverTipReportView {
  return {
    id: report.id,
    tripId: report.orderId,
    amount: report.amount,
    currency: report.currency,
    status: report.status,
    createdAt: report.createdAt.toISOString(),
    updatedAt: report.updatedAt.toISOString(),
  }
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

import { BadRequestException, NotFoundException } from '@nestjs/common'
import { OrderStatus } from '@prisma/client'
import { PrismaService } from '../database/prisma.service'
import { DriverTripTipsService } from './driver-trip-tips.service'

const now = new Date('2026-07-03T12:00:00Z')

describe('DriverTripTipsService', () => {
  const prisma = {
    order: { findFirst: jest.fn() },
    driverTipReport: { upsert: jest.fn() },
  } as unknown as PrismaService & {
    order: { findFirst: jest.Mock }
    driverTipReport: { upsert: jest.Mock }
  }
  let service: DriverTripTipsService

  beforeEach(() => {
    jest.clearAllMocks()
    service = new DriverTripTipsService(prisma)
  })

  it('upserts a driver-owned completed trip tip report without touching payout ledger', async () => {
    prisma.order.findFirst.mockResolvedValueOnce({ id: 'order-1', status: OrderStatus.delivered })
    prisma.driverTipReport.upsert.mockResolvedValueOnce(reportRow({ id: 'tip-1', orderId: 'order-1' }))

    const result = await service.reportCashTip('driver-1', 'FD0000000001', { amount: 20000 })

    expect(prisma.order.findFirst).toHaveBeenCalledWith({
      where: { driverId: 'driver-1', OR: [{ orderCode: 'FD0000000001' }] },
      select: { id: true, status: true },
    })
    expect(prisma.driverTipReport.upsert).toHaveBeenCalledWith({
      where: { orderId_driverId: { orderId: 'order-1', driverId: 'driver-1' } },
      create: { orderId: 'order-1', driverId: 'driver-1', amount: 20000, status: 'reported' },
      update: { amount: 20000, status: 'reported' },
    })
    expect(result).toEqual({
      id: 'tip-1',
      tripId: 'order-1',
      amount: 20000,
      currency: 'VND',
      status: 'reported',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    })
  })

  it('rejects trips not owned by the authenticated driver', async () => {
    prisma.order.findFirst.mockResolvedValueOnce(null)

    await expect(service.reportCashTip('driver-1', 'order-1', { amount: 20000 })).rejects.toThrow(NotFoundException)
    expect(prisma.driverTipReport.upsert).not.toHaveBeenCalled()
  })

  it('rejects active trips before delivery is completed', async () => {
    prisma.order.findFirst.mockResolvedValueOnce({ id: 'order-1', status: OrderStatus.delivering })

    await expect(service.reportCashTip('driver-1', 'order-1', { amount: 20000 })).rejects.toThrow(BadRequestException)
    expect(prisma.driverTipReport.upsert).not.toHaveBeenCalled()
  })
})

function reportRow(overrides: { id: string; orderId: string }) {
  return {
    driverId: 'driver-1',
    amount: 20000,
    currency: 'VND',
    status: 'reported',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

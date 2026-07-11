import { Test, TestingModule } from '@nestjs/testing'
import { CommissionSplitProcessor, CommissionSplitJobData } from './commission-split.processor'
import { PrismaService } from '../database/prisma.service'
import { CommissionService } from './commission.service'
import { PayoutLedgerService } from './payout-ledger.service'
import type { Job } from 'bullmq'

describe('CommissionSplitProcessor', () => {
  let processor: CommissionSplitProcessor

  const mockPrisma = { order: { findUniqueOrThrow: jest.fn() } }
  const mockLedger = { insertEntries: jest.fn() }

  const makeJob = (data: CommissionSplitJobData) =>
    ({ data } as Job<CommissionSplitJobData>)

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommissionSplitProcessor,
        CommissionService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: PayoutLedgerService, useValue: mockLedger },
      ],
    }).compile()

    processor = module.get(CommissionSplitProcessor)
    jest.clearAllMocks()
  })

  const mockOrder = {
    id: 'order-1',
    total: '100000',
    deliveryFee: '20000',
    driverId: 'driver-1',
    restaurantId: 'rest-1',
    commissionRateAtOrderTime: '15',
  }

  it('inserts ledger entries for restaurant, driver, and platform', async () => {
    mockPrisma.order.findUniqueOrThrow.mockResolvedValueOnce(mockOrder)
    mockLedger.insertEntries.mockResolvedValueOnce(undefined)

    await processor.process(makeJob({ orderId: 'order-1' }))

    expect(mockLedger.insertEntries).toHaveBeenCalledTimes(1)
    const entries = mockLedger.insertEntries.mock.calls[0][0]

    const restaurant = entries.find((e: { recipientType: string }) => e.recipientType === 'restaurant')
    const driver = entries.find((e: { recipientType: string }) => e.recipientType === 'driver')
    const platform = entries.find((e: { recipientType: string }) => e.recipientType === 'platform')

    expect(restaurant).toBeDefined()
    expect(restaurant.recipientId).toBe('rest-1')
    expect(restaurant.dedupeKey).toBe('commission-order-1-restaurant')
    expect(driver).toBeDefined()
    expect(driver.recipientId).toBe('driver-1')
    expect(platform).toBeDefined()
    expect(platform.dedupeKey).toBe('commission-order-1-platform')

    // foodAmount=80k, rate=15% → platformCut=12k, restaurant=68k
    expect(restaurant.amount).toBe(68_000)
    // deliveryFee=20k * 85% = 17k
    expect(driver.amount).toBe(17_000)
    // platformCut(12k) + platformDriverFee(3k) = 15k
    expect(platform.amount).toBe(15_000)
  })

  it('omits driver entry when order has no driverId', async () => {
    mockPrisma.order.findUniqueOrThrow.mockResolvedValueOnce({
      ...mockOrder,
      driverId: null,
    })
    mockLedger.insertEntries.mockResolvedValueOnce(undefined)

    await processor.process(makeJob({ orderId: 'order-1' }))

    const entries = mockLedger.insertEntries.mock.calls[0][0]
    const driverEntries = entries.filter((e: { recipientType: string }) => e.recipientType === 'driver')
    expect(driverEntries).toHaveLength(0)
    expect(entries).toHaveLength(2)
  })

  it('passes orderId to all ledger entries', async () => {
    mockPrisma.order.findUniqueOrThrow.mockResolvedValueOnce(mockOrder)
    mockLedger.insertEntries.mockResolvedValueOnce(undefined)

    await processor.process(makeJob({ orderId: 'order-1' }))

    const entries = mockLedger.insertEntries.mock.calls[0][0]
    entries.forEach((e: { orderId: string }) => {
      expect(e.orderId).toBe('order-1')
    })
  })
})

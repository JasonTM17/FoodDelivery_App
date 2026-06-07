import { Test, TestingModule } from '@nestjs/testing'
import { RefundProcessor, PaymentRefundJobData } from './refund.processor'
import { PrismaService } from '../database/prisma.service'
import { SepayProvider } from './providers/sepay.provider'
import { PayoutLedgerService } from './payout-ledger.service'
import type { Job } from 'bullmq'

describe('RefundProcessor', () => {
  let processor: RefundProcessor

  const mockPrisma = {
    payment: { update: jest.fn() },
  }
  const mockSepay = { refund: jest.fn() }
  const mockLedger = { insertEntry: jest.fn() }
  const mockRedis = { get: jest.fn(), set: jest.fn() }

  const makeJob = (data: PaymentRefundJobData) =>
    ({ data } as Job<PaymentRefundJobData>)

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefundProcessor,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: SepayProvider, useValue: mockSepay },
        { provide: PayoutLedgerService, useValue: mockLedger },
        { provide: 'REDIS_CLIENT', useValue: mockRedis },
      ],
    }).compile()

    processor = module.get(RefundProcessor)
    jest.clearAllMocks()
  })

  const baseJobData: PaymentRefundJobData = {
    orderId: 'order-1',
    transactionRef: 'TXN-001',
    amount: 50_000,
    reason: 'customer request',
    attemptNo: 1,
  }

  it('skips processing when dedup key exists in Redis', async () => {
    mockRedis.get.mockResolvedValueOnce('1')

    await processor.process(makeJob(baseJobData))

    expect(mockSepay.refund).not.toHaveBeenCalled()
    expect(mockPrisma.payment.update).not.toHaveBeenCalled()
  })

  it('processes refund successfully and sets dedup key', async () => {
    mockRedis.get.mockResolvedValueOnce(null)
    mockSepay.refund.mockResolvedValueOnce(undefined)
    mockPrisma.payment.update.mockResolvedValueOnce({})
    mockLedger.insertEntry.mockResolvedValueOnce(undefined)
    mockRedis.set.mockResolvedValueOnce('OK')

    await processor.process(makeJob(baseJobData))

    expect(mockSepay.refund).toHaveBeenCalledWith('TXN-001', 50_000, 'customer request')
    expect(mockPrisma.payment.update).toHaveBeenCalledWith({
      where: { orderId: 'order-1' },
      data: { status: 'refunded' },
    })
    expect(mockLedger.insertEntry).toHaveBeenCalledWith(
      expect.objectContaining({ amount: -50_000, recipientType: 'platform' }),
    )
    expect(mockRedis.set).toHaveBeenCalledWith(
      'refund:order-1:1',
      '1',
      'EX',
      7 * 24 * 3600,
    )
  })

  it('returns early when attemptNo exceeds max retries (3)', async () => {
    mockRedis.get.mockResolvedValueOnce(null)
    const job = makeJob({ ...baseJobData, attemptNo: 4 })

    await processor.process(job)

    expect(mockSepay.refund).not.toHaveBeenCalled()
  })

  it('throws on SePay failure so BullMQ can retry', async () => {
    mockRedis.get.mockResolvedValueOnce(null)
    mockSepay.refund.mockRejectedValueOnce(new Error('gateway timeout'))

    await expect(processor.process(makeJob(baseJobData))).rejects.toThrow('gateway timeout')
    expect(mockPrisma.payment.update).not.toHaveBeenCalled()
  })
})

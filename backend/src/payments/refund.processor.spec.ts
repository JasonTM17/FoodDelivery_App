import { Test, TestingModule } from '@nestjs/testing'
import { RefundProcessor, PaymentRefundJobData } from './refund.processor'
import { PrismaService } from '../database/prisma.service'
import { SepayProvider } from './providers/sepay.provider'
import type { Job } from 'bullmq'

describe('RefundProcessor', () => {
  let processor: RefundProcessor

  const mockTx = {
    $executeRaw: jest.fn(),
    walletTransaction: { create: jest.fn() },
    payment: { update: jest.fn() },
    order: { update: jest.fn() },
    orderStatusHistory: { create: jest.fn() },
    payoutLedger: { create: jest.fn() },
  }
  const mockPrisma = {
    payment: { findUnique: jest.fn() },
    $transaction: jest.fn().mockImplementation(
      (fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx),
    ),
  }
  const mockSepay = { refund: jest.fn() }
  const mockRedis = { get: jest.fn(), set: jest.fn() }

  const makeJob = (data: PaymentRefundJobData) =>
    ({ data } as Job<PaymentRefundJobData>)

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefundProcessor,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: SepayProvider, useValue: mockSepay },
        { provide: 'REDIS_CLIENT', useValue: mockRedis },
      ],
    }).compile()

    processor = module.get(RefundProcessor)
    jest.clearAllMocks()
  })

  const baseJobData: PaymentRefundJobData = {
    refundId: 'full-order-1',
    orderId: 'order-1',
    transactionRef: 'TXN-001',
    amount: 50_000,
    reason: 'customer request',
    kind: 'full',
    attemptNo: 1,
  }

  const completedSepayPayment = {
    orderId: 'order-1',
    amount: 50_000,
    method: 'sepay',
    status: 'completed',
    transactionId: 'TXN-001',
    order: { customerId: 'customer-1', status: 'cancelled' },
  }

  it('skips processing when dedup key exists in Redis', async () => {
    mockRedis.get.mockResolvedValueOnce('1')

    await processor.process(makeJob(baseJobData))

    expect(mockSepay.refund).not.toHaveBeenCalled()
    expect(mockTx.payment.update).not.toHaveBeenCalled()
  })

  it('processes refund successfully and sets dedup key', async () => {
    mockRedis.get.mockResolvedValueOnce(null)
    mockPrisma.payment.findUnique.mockResolvedValueOnce(completedSepayPayment)
    mockSepay.refund.mockResolvedValueOnce(undefined)
    mockRedis.set.mockResolvedValueOnce('OK')

    await processor.process(makeJob(baseJobData))

    expect(mockSepay.refund).toHaveBeenCalledWith('TXN-001', 50_000, 'customer request')
    expect(mockTx.payment.update).toHaveBeenCalledWith({
      where: { orderId: 'order-1' },
      data: { status: 'refunded' },
    })
    expect(mockTx.order.update).toHaveBeenCalledWith({
      where: { id: 'order-1' },
      data: { status: 'refunded' },
    })
    expect(mockTx.payoutLedger.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ amount: -50_000, recipientType: 'platform' }),
    })
    expect(mockRedis.set).toHaveBeenCalledWith(
      'refund:full-order-1:attempt:1',
      '1',
      'EX',
      7 * 24 * 3600,
    )
  })

  it('credits wallet refunds without calling SePay or marking a partial refund as fully refunded', async () => {
    mockRedis.get.mockResolvedValueOnce(null)
    mockPrisma.payment.findUnique.mockResolvedValueOnce({
      ...completedSepayPayment,
      method: 'wallet',
      amount: 100_000,
      order: { customerId: 'customer-1', status: 'preparing' },
    })

    await processor.process(makeJob({
      ...baseJobData,
      refundId: 'partial-order-1-item-1',
      amount: 30_000,
      kind: 'partial',
      reason: 'item unavailable',
    }))

    expect(mockSepay.refund).not.toHaveBeenCalled()
    expect(mockTx.walletTransaction.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'customer-1',
        amountDelta: 30_000,
        type: 'credit',
        reason: 'order_refund',
        refId: 'order-1',
      }),
    })
    expect(mockTx.payment.update).not.toHaveBeenCalled()
    expect(mockTx.order.update).not.toHaveBeenCalled()
    expect(mockTx.orderStatusHistory.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        status: 'preparing',
        note: expect.stringContaining('Partial refund processed'),
      }),
    })
  })

  it('returns early when attemptNo exceeds max retries (3)', async () => {
    mockRedis.get.mockResolvedValueOnce(null)
    const job = makeJob({ ...baseJobData, attemptNo: 4 })

    await processor.process(job)

    expect(mockSepay.refund).not.toHaveBeenCalled()
  })

  it('throws on SePay failure so BullMQ can retry', async () => {
    mockRedis.get.mockResolvedValueOnce(null)
    mockPrisma.payment.findUnique.mockResolvedValueOnce(completedSepayPayment)
    mockSepay.refund.mockRejectedValueOnce(new Error('gateway timeout'))

    await expect(processor.process(makeJob(baseJobData))).rejects.toThrow('gateway timeout')
    expect(mockTx.payment.update).not.toHaveBeenCalled()
  })
})

import { PaymentMethod, PaymentStatus } from '@prisma/client'
import type { Job } from 'bullmq'
import { PrismaService } from '../database/prisma.service'
import { RefundProcessor, type PaymentRefundJobData } from './refund.processor'
import { SepayProvider } from './providers/sepay.provider'

describe('RefundProcessor', () => {
  const request = {
    id: 'refund-request-1',
    refundKey: 'full-order-1',
    orderId: 'order-1',
    paymentId: 'payment-1',
    amount: 50_000,
    kind: 'full',
    reason: 'customer request',
    method: PaymentMethod.wallet,
    status: 'queued',
    attempts: 0,
    processingJobId: null,
    failureCode: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    completedAt: null,
  }
  const payment = {
    id: 'payment-1',
    orderId: 'order-1',
    amount: 50_000,
    method: PaymentMethod.wallet,
    status: PaymentStatus.completed,
    transactionId: 'TXN-001',
    order: { customerId: 'customer-1', status: 'cancelled' },
  }
  const tx = {
    $executeRaw: jest.fn(),
    payment: { findUnique: jest.fn(), update: jest.fn() },
    paymentRefundRequest: { aggregate: jest.fn(), update: jest.fn() },
    walletTransaction: { create: jest.fn() },
    order: { update: jest.fn() },
    orderStatusHistory: { create: jest.fn() },
    payoutLedger: { create: jest.fn() },
  }
  const prisma = {
    payment: { findUnique: jest.fn() },
    paymentRefundRequest: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
  }
  const sepay = { refund: jest.fn() }
  const processor = new RefundProcessor(
    prisma as unknown as PrismaService,
    sepay as unknown as SepayProvider,
  )

  const baseJobData: PaymentRefundJobData = {
    refundId: 'full-order-1',
    orderId: 'order-1',
    transactionRef: 'TXN-001',
    amount: 50_000,
    reason: 'customer request',
    kind: 'full',
  }
  const makeJob = (data: PaymentRefundJobData = baseJobData) => ({
    id: `payment-refund-${data.refundId}`,
    data,
  }) as Job<PaymentRefundJobData>

  beforeEach(() => {
    jest.clearAllMocks()
    prisma.payment.findUnique.mockResolvedValue(payment)
    prisma.paymentRefundRequest.findUnique.mockResolvedValue(null)
    prisma.paymentRefundRequest.create.mockResolvedValue(request)
    prisma.paymentRefundRequest.updateMany.mockResolvedValue({ count: 1 })
    prisma.paymentRefundRequest.update.mockResolvedValue(request)
    prisma.$transaction.mockImplementation(
      (fn: (client: typeof tx) => Promise<unknown>) => fn(tx),
    )
    tx.$executeRaw.mockResolvedValue(1)
    tx.payment.findUnique.mockResolvedValue(payment)
    tx.payment.update.mockResolvedValue({})
    tx.paymentRefundRequest.aggregate.mockResolvedValue({ _sum: { amount: null } })
    tx.paymentRefundRequest.update.mockResolvedValue(request)
    tx.walletTransaction.create.mockResolvedValue({})
    tx.order.update.mockResolvedValue({})
    tx.orderStatusHistory.create.mockResolvedValue({})
    tx.payoutLedger.create.mockResolvedValue({})
  })

  it('completes a wallet refund atomically with durable request and ledger keys', async () => {
    await processor.process(makeJob())

    expect(prisma.paymentRefundRequest.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        refundKey: 'full-order-1',
        paymentId: 'payment-1',
        method: PaymentMethod.wallet,
      }),
    })
    expect(tx.walletTransaction.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        refundRequestId: 'refund-request-1',
        userId: 'customer-1',
        amountDelta: 50_000,
      }),
    })
    expect(tx.payment.update).toHaveBeenCalledWith({
      where: { orderId: 'order-1' },
      data: { status: PaymentStatus.refunded },
    })
    expect(tx.payoutLedger.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        dedupeKey: 'refund-refund-request-1-platform',
        refundRequestId: 'refund-request-1',
        amount: -50_000,
      }),
    })
    expect(tx.paymentRefundRequest.update).toHaveBeenLastCalledWith({
      where: { id: 'refund-request-1' },
      data: expect.objectContaining({ status: 'completed', failureCode: null }),
    })
  })

  it('does not replay an already completed durable refund request', async () => {
    prisma.paymentRefundRequest.findUnique.mockResolvedValueOnce({
      ...request,
      status: 'completed',
    })

    await processor.process(makeJob())

    expect(prisma.paymentRefundRequest.updateMany).not.toHaveBeenCalled()
    expect(prisma.$transaction).not.toHaveBeenCalled()
  })

  it('routes SePay bank-transfer refunds to audited manual review without mutating payment state', async () => {
    const sepayPayment = { ...payment, method: PaymentMethod.sepay }
    prisma.payment.findUnique.mockResolvedValueOnce(sepayPayment)
    prisma.paymentRefundRequest.create.mockResolvedValueOnce({
      ...request,
      method: PaymentMethod.sepay,
    })
    sepay.refund.mockRejectedValueOnce(
      new Error('SEPAY_BANK_TRANSFER_REFUND_REQUIRES_MANUAL_REVIEW'),
    )

    await processor.process(makeJob())

    expect(prisma.paymentRefundRequest.update).toHaveBeenCalledWith({
      where: { id: 'refund-request-1' },
      data: {
        status: 'manual_review',
        failureCode: 'SEPAY_BANK_TRANSFER_REFUND_REQUIRES_MANUAL_REVIEW',
      },
    })
    expect(prisma.$transaction).not.toHaveBeenCalled()
  })

  it('keeps a partial wallet refund from marking the full order refunded', async () => {
    const data: PaymentRefundJobData = {
      ...baseJobData,
      refundId: 'partial-order-1-item-1',
      amount: 30_000,
      kind: 'partial',
    }
    prisma.paymentRefundRequest.create.mockResolvedValueOnce({
      ...request,
      refundKey: data.refundId,
      amount: data.amount,
      kind: data.kind,
    })

    await processor.process(makeJob(data))

    expect(tx.payment.update).not.toHaveBeenCalled()
    expect(tx.order.update).not.toHaveBeenCalled()
    expect(tx.orderStatusHistory.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        status: 'cancelled',
        note: expect.stringContaining('Partial refund processed'),
      }),
    })
  })

  it('moves over-refunds to manual review under the per-order advisory lock', async () => {
    tx.payment.findUnique.mockResolvedValueOnce({ ...payment, amount: 100_000 })
    tx.paymentRefundRequest.aggregate.mockResolvedValueOnce({ _sum: { amount: 75_000 } })

    await processor.process(makeJob())

    expect(tx.walletTransaction.create).not.toHaveBeenCalled()
    expect(tx.paymentRefundRequest.update).toHaveBeenCalledWith({
      where: { id: 'refund-request-1' },
      data: {
        status: 'manual_review',
        failureCode: 'REFUND_AMOUNT_EXCEEDS_REMAINING_CAPTURE',
      },
    })
  })

  it('fails conflicting reuse of a refund id without processing money', async () => {
    prisma.paymentRefundRequest.findUnique.mockResolvedValueOnce({
      ...request,
      amount: 1,
    })

    await expect(processor.process(makeJob())).rejects.toThrow('REFUND_REQUEST_CONFLICT')
    expect(prisma.paymentRefundRequest.updateMany).not.toHaveBeenCalled()
    expect(prisma.$transaction).not.toHaveBeenCalled()
  })

  it.each([0, -1, 1.5, Number.NaN])('rejects invalid refund amount %s', async amount => {
    await expect(processor.process(makeJob({ ...baseJobData, amount })))
      .rejects.toThrow('REFUND_AMOUNT_INVALID')
    expect(prisma.payment.findUnique).not.toHaveBeenCalled()
  })

  it('marks transient provider failures retryable without exposing raw details in the database', async () => {
    const sepayPayment = { ...payment, method: PaymentMethod.sepay }
    prisma.payment.findUnique.mockResolvedValueOnce(sepayPayment)
    prisma.paymentRefundRequest.create.mockResolvedValueOnce({
      ...request,
      method: PaymentMethod.sepay,
    })
    sepay.refund.mockRejectedValueOnce(new Error('upstream included sensitive response'))

    await expect(processor.process(makeJob())).rejects.toThrow('upstream included sensitive response')
    expect(prisma.paymentRefundRequest.updateMany).toHaveBeenLastCalledWith({
      where: { id: 'refund-request-1', status: 'processing' },
      data: {
        status: 'failed',
        failureCode: 'REFUND_PROCESSING_FAILED',
      },
    })
  })
})

import { PrismaService } from '../database/prisma.service'
import { WalletPaymentCaptureService } from './wallet-payment-capture.service'

describe('WalletPaymentCaptureService', () => {
  let service: WalletPaymentCaptureService

  const mockTx = {
    $executeRaw: jest.fn().mockResolvedValue(1),
    walletTransaction: {
      aggregate: jest.fn(),
      create: jest.fn().mockResolvedValue({}),
    },
    payment: { update: jest.fn().mockResolvedValue({}) },
    orderStatusHistory: { createMany: jest.fn().mockResolvedValue({}) },
    order: { update: jest.fn().mockResolvedValue({}) },
  }

  const mockPrisma = {
    $transaction: jest.fn((callback: (tx: typeof mockTx) => Promise<unknown>) => callback(mockTx)),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    service = new WalletPaymentCaptureService(mockPrisma as unknown as PrismaService)
  })

  it('debits confirmed wallet balance and releases order to restaurant', async () => {
    mockTx.walletTransaction.aggregate.mockResolvedValue({ _sum: { amountDelta: 100_000 } })

    const result = await service.capture({
      order: { id: 'order-1', customerId: 'customer-1' },
      paymentId: 'pay-1',
      amount: 50_000,
    })

    expect(result).toEqual({ success: true })
    expect(mockTx.walletTransaction.create).toHaveBeenCalledWith({
      data: {
        userId: 'customer-1',
        amountDelta: -50_000,
        type: 'debit',
        reason: 'order_payment',
        refId: 'order-1',
        status: 'CONFIRMED',
      },
    })
    expect(mockTx.payment.update).toHaveBeenCalledWith({
      where: { id: 'pay-1' },
      data: expect.objectContaining({ status: 'completed' }),
    })
    expect(mockTx.order.update).toHaveBeenCalledWith({
      where: { id: 'order-1' },
      data: { status: 'restaurant_pending' },
    })
  })

  it('returns insufficient balance without committing wallet debit', async () => {
    mockTx.walletTransaction.aggregate.mockResolvedValue({ _sum: { amountDelta: 10_000 } })

    const result = await service.capture({
      order: { id: 'order-1', customerId: 'customer-1' },
      paymentId: 'pay-1',
      amount: 50_000,
    })

    expect(result).toEqual({ success: false, failureCode: 'INSUFFICIENT_WALLET_BALANCE' })
    expect(mockTx.walletTransaction.create).not.toHaveBeenCalled()
    expect(mockTx.payment.update).not.toHaveBeenCalled()
  })

  it('maps unexpected transaction errors to wallet payment failure', async () => {
    mockPrisma.$transaction.mockRejectedValueOnce(new Error('db unavailable'))

    const result = await service.capture({
      order: { id: 'order-1', customerId: 'customer-1' },
      paymentId: 'pay-1',
      amount: 50_000,
    })

    expect(result).toEqual({ success: false, failureCode: 'WALLET_PAYMENT_FAILED' })
  })
})

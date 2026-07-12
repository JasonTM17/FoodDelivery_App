import { PaymentMethod, PaymentStatus } from '@prisma/client'
import { PaymentsService } from './payments.service'

describe('PaymentsService', () => {
  const promoDelete = jest.fn()
  const promoUpdate = jest.fn()
  const txPaymentUpdate = jest.fn()
  const txHistoryCreate = jest.fn()
  const txOrderUpdate = jest.fn()

  const prisma = {
    order: {
      findUniqueOrThrow: jest.fn(),
      update: jest.fn().mockResolvedValue({}),
    },
    payment: {
      create: jest.fn(),
      update: jest.fn(),
    },
    paymentIntent: {
      create: jest.fn(),
    },
    orderStatusHistory: { create: jest.fn() },
    promotionUsage: { findMany: jest.fn().mockResolvedValue([]) },
    $transaction: jest.fn(async (arg: unknown) => {
      if (typeof arg === 'function') {
        return (arg as (tx: unknown) => Promise<unknown>)({
          payment: { update: txPaymentUpdate },
          orderStatusHistory: { create: txHistoryCreate },
          order: { update: txOrderUpdate },
          promotionUsage: {
            findMany: prisma.promotionUsage.findMany,
            delete: promoDelete,
          },
          promotion: { update: promoUpdate },
        })
      }
      // createSepayIntent uses array form of $transaction
      if (Array.isArray(arg)) {
        return Promise.all(arg)
      }
      return arg
    }),
  }
  const sepay = { createPaymentIntent: jest.fn() }
  const walletCapture = { capture: jest.fn() }
  const service = new PaymentsService(prisma as never, sepay as never, walletCapture as never)

  beforeEach(() => {
    jest.clearAllMocks()
    prisma.order.findUniqueOrThrow.mockResolvedValue({
      id: 'order-1',
      status: 'created',
      customerId: 'customer-1',
    })
    prisma.payment.create.mockImplementation(({ data }) => Promise.resolve({ id: 'payment-1', ...data }))
    prisma.orderStatusHistory.create.mockResolvedValue({})
    prisma.order.update.mockResolvedValue({})
    prisma.promotionUsage.findMany.mockResolvedValue([])
    walletCapture.capture.mockResolvedValue({ success: true })
  })

  it('captures wallet payments through wallet ledger and uses public transaction naming', async () => {
    const result = await service.processPayment('order-1', 50_000, PaymentMethod.wallet)

    expect(result).toEqual({ readyForRestaurant: true })
    expect(prisma.order.update).toHaveBeenCalledWith({
      where: { id: 'order-1' },
      data: { status: 'pending_payment' },
    })
    expect(prisma.payment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        orderId: 'order-1',
        amount: 50_000,
        method: PaymentMethod.wallet,
        status: PaymentStatus.pending,
        transactionId: 'WALLET-order-1',
      }),
    })
    expect(walletCapture.capture).toHaveBeenCalledWith({
      order: { id: 'order-1', status: 'created', customerId: 'customer-1' },
      paymentId: 'payment-1',
      amount: 50_000,
    })
    expect(sepay.createPaymentIntent).not.toHaveBeenCalled()
  })

  it('persists pending_payment before creating SePay intent (B-PAY-01)', async () => {
    const expires = new Date(Date.now() + 15 * 60_000)
    sepay.createPaymentIntent.mockResolvedValueOnce({
      qr_code_url: 'https://qr.example/1',
      transaction_ref: 'FF-ORDER1',
      expires_at: expires,
    })
    prisma.payment.update.mockResolvedValue({})
    prisma.paymentIntent.create.mockResolvedValue({})

    const result = await service.processPayment('order-1', 75_000, PaymentMethod.sepay)

    expect(prisma.order.update).toHaveBeenCalledWith({
      where: { id: 'order-1' },
      data: { status: 'pending_payment' },
    })
    // History for pending_payment is recorded after the order update
    expect(prisma.orderStatusHistory.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        orderId: 'order-1',
        status: 'pending_payment',
        changedBy: 'system',
      }),
    })
    expect(sepay.createPaymentIntent).toHaveBeenCalledWith('order-1', 75_000)
    expect(result.readyForRestaurant).toBe(false)
    expect(result.paymentIntent).toEqual(
      expect.objectContaining({ transaction_ref: 'FF-ORDER1' }),
    )
  })

  it('releases promo usage on payment failure (B-ORD-04 / B-PROMO-03)', async () => {
    walletCapture.capture.mockResolvedValueOnce({
      success: false,
      failureCode: 'INSUFFICIENT_WALLET_BALANCE',
    })
    prisma.promotionUsage.findMany.mockResolvedValueOnce([
      { id: 'usage-1', promotionId: 'promo-1', discountAmount: 10_000 },
    ])

    const result = await service.processPayment('order-1', 50_000, PaymentMethod.wallet)

    expect(result.failureCode).toBe('INSUFFICIENT_WALLET_BALANCE')
    expect(result.readyForRestaurant).toBe(false)
    expect(promoDelete).toHaveBeenCalledWith({ where: { id: 'usage-1' } })
    expect(promoUpdate).toHaveBeenCalledWith({
      where: { id: 'promo-1' },
      data: {
        usageCount: { decrement: 1 },
        currentUsageCount: { decrement: 1 },
        usedBudget: { decrement: 10_000 },
      },
    })
    expect(txOrderUpdate).toHaveBeenCalledWith({
      where: { id: 'order-1' },
      data: expect.objectContaining({ status: 'cancelled' }),
    })
  })
})

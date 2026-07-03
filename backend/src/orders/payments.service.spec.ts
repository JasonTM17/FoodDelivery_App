import { PaymentMethod, PaymentStatus } from '@prisma/client'
import { PaymentsService } from './payments.service'

describe('PaymentsService', () => {
  const prisma = {
    order: {
      findUniqueOrThrow: jest.fn(),
      update: jest.fn(),
    },
    payment: {
      create: jest.fn(),
      update: jest.fn(),
    },
    orderStatusHistory: { create: jest.fn() },
    $transaction: jest.fn(),
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
    walletCapture.capture.mockResolvedValue({ success: true })
  })

  it('captures wallet payments through wallet ledger and uses public transaction naming', async () => {
    const result = await service.processPayment('order-1', 50_000, PaymentMethod.wallet)

    expect(result).toEqual({ readyForRestaurant: true })
    expect(prisma.payment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        orderId: 'order-1',
        amount: 50_000,
        method: PaymentMethod.wallet,
        status: PaymentStatus.pending,
        transactionId: expect.stringMatching(/^WALLET-/),
      }),
    })
    expect(walletCapture.capture).toHaveBeenCalledWith({
      order: { id: 'order-1', status: 'created', customerId: 'customer-1' },
      paymentId: 'payment-1',
      amount: 50_000,
    })
    expect(sepay.createPaymentIntent).not.toHaveBeenCalled()
  })
})

import { Test, TestingModule } from '@nestjs/testing'
import { PaymentsService } from '../orders/payments.service'
import { PrismaService } from '../database/prisma.service'
import { SepayProvider } from './providers/sepay.provider'
import { WalletPaymentCaptureService } from '../orders/wallet-payment-capture.service'

describe('PaymentsService', () => {
  let service: PaymentsService

  const mockPrisma = {
    order: {
      findUniqueOrThrow: jest.fn(),
      update: jest.fn().mockResolvedValue({}),
    },
    payment: {
      create: jest.fn(),
      update: jest.fn().mockResolvedValue({}),
      findUnique: jest.fn(),
    },
    paymentIntent: { create: jest.fn().mockResolvedValue({}) },
    orderStatusHistory: { create: jest.fn().mockResolvedValue({}) },
    $transaction: jest.fn((input: unknown) => {
      return Promise.all(input as Array<Promise<unknown>>)
    }),
  }

  const mockSepay = {
    createPaymentIntent: jest.fn(),
  }

  const mockWalletCapture = {
    capture: jest.fn(),
  }

  beforeEach(async () => {
    jest.clearAllMocks()
    mockPrisma.order.findUniqueOrThrow.mockResolvedValue({
      id: 'order-1',
      status: 'created',
      customerId: 'customer-1',
    })
    mockPrisma.payment.create.mockResolvedValue({
      id: 'pay-1',
      status: 'pending',
      transactionId: 'TXN-test',
    })

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: SepayProvider, useValue: mockSepay },
        { provide: WalletPaymentCaptureService, useValue: mockWalletCapture },
      ],
    }).compile()
    service = module.get(PaymentsService)
  })

  it('releases cash-on-delivery orders without marking payment completed', async () => {
    const result = await service.processPayment('order-1', 50_000, 'cash')

    expect(result).toEqual({ readyForRestaurant: true })
    expect(mockPrisma.payment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          orderId: 'order-1',
          amount: 50_000,
          method: 'cash',
          status: 'pending',
        }),
      }),
    )
    expect(mockPrisma.payment.update).not.toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'completed' }) }),
    )
    expect(mockPrisma.order.update).toHaveBeenCalledWith({
      where: { id: 'order-1' },
      data: { status: 'restaurant_pending' },
    })
  })

  it('captures wallet payment only when confirmed balance is enough', async () => {
    mockWalletCapture.capture.mockResolvedValue({ success: true })

    const result = await service.processPayment('order-1', 50_000, 'wallet')

    expect(result).toEqual({ readyForRestaurant: true })
    expect(mockWalletCapture.capture).toHaveBeenCalledWith({
      order: { id: 'order-1', status: 'created', customerId: 'customer-1' },
      paymentId: 'pay-1',
      amount: 50_000,
    })
  })

  it('fails and cancels the order when wallet balance is insufficient', async () => {
    mockWalletCapture.capture.mockResolvedValue({
      success: false,
      failureCode: 'INSUFFICIENT_WALLET_BALANCE',
    })

    const result = await service.processPayment('order-1', 50_000, 'wallet')

    expect(result).toEqual({
      readyForRestaurant: false,
      failureCode: 'INSUFFICIENT_WALLET_BALANCE',
    })
    expect(mockPrisma.payment.update).toHaveBeenCalledWith({
      where: { id: 'pay-1' },
      data: { status: 'failed' },
    })
    expect(mockPrisma.order.update).toHaveBeenCalledWith({
      where: { id: 'order-1' },
      data: {
        status: 'cancelled',
        cancelledReason: 'Payment failed: INSUFFICIENT_WALLET_BALANCE',
      },
    })
  })

  it('creates a real SePay intent and keeps order pending payment', async () => {
    const expiresAt = new Date(Date.now() + 900_000)
    mockSepay.createPaymentIntent.mockResolvedValue({
      qr_code_url: 'https://qr.sepay.vn/real-ref',
      transaction_ref: 'REAL-REF-001',
      expires_at: expiresAt,
    })

    const result = await service.processPayment('order-1', 50_000, 'sepay')

    expect(result).toEqual({
      readyForRestaurant: false,
      paymentIntent: {
        qr_code_url: 'https://qr.sepay.vn/real-ref',
        transaction_ref: 'REAL-REF-001',
        expires_at: expiresAt,
      },
    })
    expect(mockPrisma.paymentIntent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        orderId: 'order-1',
        provider: 'sepay',
        transactionRef: 'REAL-REF-001',
        status: 'pending',
      }),
    })
  })

  it('fails payment instead of creating a fallback SePay intent when provider is unavailable', async () => {
    mockSepay.createPaymentIntent.mockRejectedValue(new Error('SEPAY_PROVIDER_NOT_CONFIGURED'))

    const result = await service.processPayment('order-1', 50_000, 'sepay')

    expect(result).toEqual({
      readyForRestaurant: false,
      failureCode: 'SEPAY_INTENT_UNAVAILABLE',
    })
    expect(mockPrisma.paymentIntent.create).not.toHaveBeenCalled()
  })

  it('returns payment by order', async () => {
    mockPrisma.payment.findUnique.mockResolvedValueOnce({
      id: 'pay-1',
      orderId: 'order-1',
      status: 'completed',
    })

    const result = await service.getPaymentByOrder('order-1')
    expect(result).toBeDefined()
    expect(result!.status).toBe('completed')
  })

  it('refunds a completed payment', async () => {
    mockPrisma.payment.findUnique.mockResolvedValueOnce({
      id: 'pay-1',
      orderId: 'order-1',
      status: 'completed',
    })
    mockPrisma.payment.update.mockResolvedValueOnce({
      id: 'pay-1',
      status: 'refunded',
    })

    await service.refundPayment('order-1')

    expect(mockPrisma.payment.update).toHaveBeenCalledWith({
      where: { id: 'pay-1' },
      data: { status: 'refunded' },
    })
  })
})

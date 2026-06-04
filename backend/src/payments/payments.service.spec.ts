import { Test, TestingModule } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { PaymentsService } from '../orders/payments.service'
import { PrismaService } from '../database/prisma.service'
import { getQueueToken } from '@nestjs/bullmq'

describe('PaymentsService', () => {
  let service: PaymentsService

  const mockPrisma = {
    order: {
      findUniqueOrThrow: jest.fn().mockResolvedValue({
        id: 'order-1',
        status: 'created',
        orderCode: 'FF-001',
      }),
      update: jest.fn(),
    },
    payment: {
      create: jest.fn().mockResolvedValue({ id: 'pay-1', status: 'pending' }),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    orderStatusHistory: { create: jest.fn() },
  }

  const mockQueue = { add: jest.fn() }

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: string) => {
      const env: Record<string, string> = {
        PAYMENT_MOCK_MODE: 'true',
        PAYMENT_MOCK_SUCCESS_RATE: '0.95',
        PAYMENT_MOCK_MIN_DELAY_MS: '10',
        PAYMENT_MOCK_MAX_DELAY_MS: '20',
        PAYMENT_MOCK_FAILURE_CODE: 'INSUFFICIENT_FUNDS',
      }
      return env[key] ?? defaultValue
    }),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: getQueueToken('dispatch'), useValue: mockQueue },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile()
    service = module.get(PaymentsService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('should process payment successfully', async () => {
    mockPrisma.order.findUniqueOrThrow.mockResolvedValueOnce({
      id: 'order-1',
      status: 'created',
      orderCode: 'FF-001',
    })
    mockPrisma.payment.create.mockResolvedValueOnce({
      id: 'pay-1',
      status: 'pending',
      transactionId: 'TXN-test',
    })

    await service.processPayment('order-1', 50000, 'mock_wallet')

    expect(mockPrisma.payment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          orderId: 'order-1',
          amount: 50000,
          method: 'mock_wallet',
          status: 'pending',
        }),
      }),
    )
  })

  it('should return payment by order', async () => {
    mockPrisma.payment.findUnique.mockResolvedValueOnce({
      id: 'pay-1',
      orderId: 'order-1',
      status: 'completed',
    })

    const result = await service.getPaymentByOrder('order-1')
    expect(result).toBeDefined()
    expect(result!.status).toBe('completed')
  })

  it('should refund a completed payment', async () => {
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

    expect(mockPrisma.payment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'pay-1' },
        data: { status: 'refunded' },
      }),
    )
  })
})

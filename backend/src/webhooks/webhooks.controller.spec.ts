import { BadRequestException } from '@nestjs/common'
import { createHmac } from 'crypto'
import { WebhooksController } from './webhooks.controller'
import { SepayProvider } from '../payments/providers/sepay.provider'

describe('WebhooksController sepayPaymentSuccess', () => {
  const secret = 'test-sepay-webhook-secret'
  let controller: WebhooksController

  const sepay = {
    verifyWebhookSignature: jest.fn(),
  }
  const prisma = {
    paymentIntent: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    order: { findUnique: jest.fn() },
    payment: { upsert: jest.fn() },
  }
  const orders = {
    transition: jest.fn(),
  }
  const ordersGateway = {
    notifyRestaurant: jest.fn(),
  }
  const commissionQueue = { add: jest.fn() }
  const orderTimeoutQueue = { add: jest.fn() }
  const redis = {
    set: jest.fn(),
    del: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.SEPAY_WEBHOOK_SECRET = secret
    // Real HMAC verification path through provider
    const provider = new SepayProvider()
    sepay.verifyWebhookSignature.mockImplementation((raw: string, sig: string) =>
      provider.verifyWebhookSignature(raw, sig),
    )

    controller = new WebhooksController(
      sepay as never,
      prisma as never,
      orders as never,
      ordersGateway as never,
      commissionQueue as never,
      orderTimeoutQueue as never,
      redis as never,
    )

    redis.set.mockResolvedValue('OK')
    redis.del.mockResolvedValue(1)
  })

  function sign(rawBody: string): string {
    return createHmac('sha256', secret).update(rawBody).digest('hex')
  }

  it('rejects invalid HMAC (rawBody preferred)', async () => {
    const body = { transaction_ref: 'TXN-1', amount: 10000 }
    const raw = JSON.stringify(body)
    await expect(
      controller.sepayPaymentSuccess(
        { rawBody: Buffer.from(raw) } as never,
        body,
        'deadbeef',
      ),
    ).rejects.toThrow(BadRequestException)
    expect(redis.set).not.toHaveBeenCalled()
  })

  it('rejects amount mismatch against payment intent', async () => {
    const body = { transaction_ref: 'TXN-1', amount: 9_000 }
    const raw = JSON.stringify(body)
    redis.set.mockResolvedValueOnce('OK') // NX claim
    prisma.paymentIntent.findUnique.mockResolvedValueOnce({
      id: 'intent-1',
      orderId: 'order-1',
      amount: 10_000,
      status: 'pending',
      expiresAt: new Date(Date.now() + 60_000),
      transactionRef: 'TXN-1',
    })

    await expect(
      controller.sepayPaymentSuccess(
        { rawBody: Buffer.from(raw) } as never,
        body,
        sign(raw),
      ),
    ).rejects.toThrow(/Amount mismatch/)
    expect(redis.del).toHaveBeenCalled()
    expect(prisma.payment.upsert).not.toHaveBeenCalled()
  })

  it('rejects cancelled orders (non-payable)', async () => {
    const body = { transaction_ref: 'TXN-2', amount: 10_000 }
    const raw = JSON.stringify(body)
    redis.set.mockResolvedValueOnce('OK')
    prisma.paymentIntent.findUnique.mockResolvedValueOnce({
      id: 'intent-2',
      orderId: 'order-2',
      amount: 10_000,
      status: 'pending',
      expiresAt: new Date(Date.now() + 60_000),
      transactionRef: 'TXN-2',
    })
    prisma.order.findUnique.mockResolvedValueOnce({
      id: 'order-2',
      status: 'cancelled',
      restaurantId: 'rest-1',
      orderCode: 'FD1',
      total: 10_000,
      orderItems: [],
    })

    await expect(
      controller.sepayPaymentSuccess(
        { rawBody: Buffer.from(raw) } as never,
        body,
        sign(raw),
      ),
    ).rejects.toThrow(/not payable/)
    expect(prisma.payment.upsert).not.toHaveBeenCalled()
  })

  it('advances pending_payment order on valid signed webhook', async () => {
    const body = { transaction_ref: 'TXN-3', amount: 25_000 }
    const raw = JSON.stringify(body)
    redis.set.mockResolvedValueOnce('OK') // claim
    redis.set.mockResolvedValueOnce('OK') // durable dedupe
    prisma.paymentIntent.findUnique.mockResolvedValueOnce({
      id: 'intent-3',
      orderId: 'order-3',
      amount: 25_000,
      status: 'pending',
      expiresAt: new Date(Date.now() + 60_000),
      transactionRef: 'TXN-3',
    })
    prisma.order.findUnique.mockResolvedValueOnce({
      id: 'order-3',
      status: 'pending_payment',
      restaurantId: 'rest-1',
      orderCode: 'FD3',
      total: 25_000,
      orderItems: [{ nameSnapshot: 'Pho', quantity: 1 }],
    })
    prisma.payment.upsert.mockResolvedValue({})
    prisma.paymentIntent.update.mockResolvedValue({})
    orders.transition.mockResolvedValue({})

    const result = await controller.sepayPaymentSuccess(
      { rawBody: Buffer.from(raw) } as never,
      body,
      sign(raw),
    )

    expect(result).toEqual({ received: true })
    expect(sepay.verifyWebhookSignature).toHaveBeenCalledWith(raw, sign(raw))
    expect(orders.transition).toHaveBeenCalledWith(
      'order-3',
      'paid',
      'system',
      'system',
      expect.any(String),
    )
    expect(orders.transition).toHaveBeenCalledWith(
      'order-3',
      'restaurant_pending',
      'system',
      'system',
      expect.any(String),
    )
    expect(commissionQueue.add).toHaveBeenCalled()
  })
})

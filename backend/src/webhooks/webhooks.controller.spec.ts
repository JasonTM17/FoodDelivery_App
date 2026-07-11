import type { RawBodyRequest } from '@nestjs/common'
import type { Queue } from 'bullmq'
import type { Request } from 'express'
import { PrismaService } from '../database/prisma.service'
import { OrdersGateway } from '../orders/orders.gateway'
import { OrdersService } from '../orders/orders.service'
import { SepayProvider } from '../payments/providers/sepay.provider'
import { WebhooksController } from './webhooks.controller'

describe('WebhooksController SePay contract', () => {
  const sepay = {
    verifyWebhookSignature: jest.fn().mockReturnValue(true),
    matchesPaymentAccount: jest.fn().mockReturnValue(true),
  }
  const prisma = {
    paymentWebhookReceipt: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    paymentIntent: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    payment: { upsert: jest.fn() },
    order: { findUnique: jest.fn() },
    orderStatusHistory: { create: jest.fn() },
    $transaction: jest.fn(),
  }
  const orders = { transition: jest.fn() }
  const ordersGateway = {
    notifyRestaurant: jest.fn(),
    notifyAdmins: jest.fn(),
  }
  const commissionQueue = { add: jest.fn() }
  const orderTimeoutQueue = { add: jest.fn() }

  const controller = new WebhooksController(
    sepay as unknown as SepayProvider,
    prisma as unknown as PrismaService,
    orders as unknown as OrdersService,
    ordersGateway as unknown as OrdersGateway,
    commissionQueue as unknown as Queue,
    orderTimeoutQueue as unknown as Queue,
  )

  const payload = {
    id: 92704,
    gateway: 'Vietcombank',
    transactionDate: '2026-07-11 14:30:00',
    accountNumber: '123456789',
    subAccount: '',
    code: 'FF-ORDER1',
    content: 'FF-ORDER1 thanh toan',
    transferType: 'in',
    description: 'CUSTOMER transfer',
    transferAmount: 125_000,
    accumulated: 2_000_000,
    referenceCode: 'FT2607110001',
  }
  const intent = {
    id: 'intent-1',
    orderId: 'order-1',
    transactionRef: 'FF-ORDER1',
    amount: 125_000,
    status: 'pending',
  }
  const order = {
    id: 'order-1',
    orderCode: 'FF0000000001',
    restaurantId: 'restaurant-1',
    status: 'pending_payment',
    total: 125_000,
    payment: null,
    orderItems: [{ nameSnapshot: 'Pho', quantity: 1 }],
  }
  const receipt = {
    id: 'receipt-1',
    status: 'processing',
    updatedAt: new Date(),
  }

  const request = (body: Record<string, unknown> = payload) => ({
    rawBody: Buffer.from(JSON.stringify(body)),
  }) as RawBodyRequest<Request>

  const invoke = (body: Record<string, unknown> = payload) => controller.sepayPaymentSuccess(
    request(body),
    body,
    `sha256=${'a'.repeat(64)}`,
    '1783774200',
  )

  beforeEach(() => {
    jest.clearAllMocks()
    sepay.verifyWebhookSignature.mockReturnValue(true)
    sepay.matchesPaymentAccount.mockReturnValue(true)
    prisma.paymentWebhookReceipt.create.mockResolvedValue(receipt)
    prisma.paymentWebhookReceipt.findUnique.mockResolvedValue(receipt)
    prisma.paymentWebhookReceipt.update.mockResolvedValue(receipt)
    prisma.paymentWebhookReceipt.updateMany.mockResolvedValue({ count: 1 })
    prisma.paymentIntent.findUnique.mockResolvedValue(intent)
    prisma.paymentIntent.update.mockResolvedValue({})
    prisma.payment.upsert.mockResolvedValue({})
    prisma.order.findUnique.mockResolvedValue(order)
    prisma.orderStatusHistory.create.mockResolvedValue({})
    prisma.$transaction.mockResolvedValue([])
    orders.transition.mockResolvedValue({})
    commissionQueue.add.mockResolvedValue({})
    orderTimeoutQueue.add.mockResolvedValue({})
  })

  it('accepts the official inbound payload and returns SePay exact success response', async () => {
    await expect(invoke()).resolves.toEqual({ success: true })

    expect(sepay.verifyWebhookSignature).toHaveBeenCalledWith(
      request().rawBody,
      `sha256=${'a'.repeat(64)}`,
      '1783774200',
    )
    expect(prisma.paymentWebhookReceipt.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        provider: 'sepay',
        providerTransactionId: '92704',
        amount: 125_000,
      }),
    })
    expect(prisma.payment.upsert).toHaveBeenCalledWith(expect.objectContaining({
      update: expect.objectContaining({
        status: 'completed',
        transactionId: 'SEPAY-92704',
        paidAt: new Date('2026-07-11T07:30:00.000Z'),
      }),
    }))
    expect(prisma.$transaction).toHaveBeenCalledTimes(1)
    expect(orders.transition).toHaveBeenNthCalledWith(
      1,
      'order-1',
      'paid',
      'system',
      'system',
      'SePay payment confirmed',
    )
    expect(orders.transition).toHaveBeenNthCalledWith(
      2,
      'order-1',
      'restaurant_pending',
      'system',
      'system',
      'SePay payment confirmed',
    )
    expect(orderTimeoutQueue.add).toHaveBeenCalledWith(
      'restaurant-accept-timeout',
      expect.objectContaining({ orderId: 'order-1' }),
      expect.objectContaining({ jobId: 'timeout-order-1-restaurant-accept' }),
    )
    expect(commissionQueue.add).toHaveBeenCalledWith(
      'commission-split',
      { orderId: 'order-1' },
      { jobId: 'commission-split-order-1', removeOnComplete: true },
    )
    expect(prisma.paymentWebhookReceipt.update).toHaveBeenLastCalledWith({
      where: { id: 'receipt-1' },
      data: expect.objectContaining({ status: 'completed', failureCode: null }),
    })
  })

  it('records an amount mismatch for manual review without capturing payment', async () => {
    await expect(invoke({ ...payload, transferAmount: 1 })).resolves.toEqual({ success: true })

    expect(prisma.payment.upsert).not.toHaveBeenCalled()
    expect(prisma.orderStatusHistory.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        orderId: 'order-1',
        note: expect.stringContaining('SEPAY_WEBHOOK_AMOUNT_MISMATCH'),
      }),
    })
    expect(ordersGateway.notifyAdmins).toHaveBeenCalledWith(
      'admin:sepay_payment_review',
      expect.objectContaining({ orderId: 'order-1', amount: 1 }),
    )
    expect(prisma.paymentWebhookReceipt.update).toHaveBeenLastCalledWith({
      where: { id: 'receipt-1' },
      data: expect.objectContaining({
        status: 'manual_review',
        failureCode: 'SEPAY_WEBHOOK_AMOUNT_MISMATCH',
      }),
    })
  })

  it('acknowledges outbound transfers as ignored without touching an order', async () => {
    await expect(invoke({ ...payload, transferType: 'out' })).resolves.toEqual({ success: true })

    expect(prisma.paymentIntent.findUnique).not.toHaveBeenCalled()
    expect(prisma.paymentWebhookReceipt.update).toHaveBeenLastCalledWith({
      where: { id: 'receipt-1' },
      data: expect.objectContaining({ status: 'ignored' }),
    })
  })

  it('audits beneficiary account mismatches and acknowledges them to prevent retry storms', async () => {
    sepay.matchesPaymentAccount.mockReturnValue(false)

    await expect(invoke()).resolves.toEqual({ success: true })
    expect(prisma.paymentIntent.findUnique).not.toHaveBeenCalled()
    expect(ordersGateway.notifyAdmins).toHaveBeenCalledWith(
      'admin:sepay_payment_review',
      expect.objectContaining({ reason: 'SEPAY_WEBHOOK_ACCOUNT_MISMATCH' }),
    )
  })

  it('deduplicates historical replays through the durable provider transaction id', async () => {
    prisma.paymentWebhookReceipt.create.mockRejectedValueOnce({ code: 'P2002' })
    prisma.paymentWebhookReceipt.findUnique.mockResolvedValueOnce({
      ...receipt,
      status: 'completed',
    })

    await expect(invoke()).resolves.toEqual({ success: true })
    expect(prisma.paymentIntent.findUnique).not.toHaveBeenCalled()
    expect(prisma.payment.upsert).not.toHaveBeenCalled()
  })

  it('returns a retryable error while another worker owns a fresh receipt', async () => {
    prisma.paymentWebhookReceipt.create.mockRejectedValueOnce({ code: 'P2002' })
    prisma.paymentWebhookReceipt.findUnique.mockResolvedValueOnce({
      ...receipt,
      updatedAt: new Date(),
    })

    await expect(invoke()).rejects.toThrow('SEPAY_WEBHOOK_RECEIPT_PROCESSING')
    expect(prisma.paymentWebhookReceipt.updateMany).not.toHaveBeenCalled()
  })

  it('reclaims a failed receipt and resumes an interrupted captured payment', async () => {
    prisma.paymentWebhookReceipt.create.mockRejectedValueOnce({ code: 'P2002' })
    prisma.paymentWebhookReceipt.findUnique.mockResolvedValueOnce({
      ...receipt,
      status: 'failed',
    })
    prisma.paymentIntent.findUnique.mockResolvedValueOnce({ ...intent, status: 'completed' })
    prisma.order.findUnique.mockResolvedValueOnce({
      ...order,
      status: 'restaurant_pending',
      payment: { transactionId: 'SEPAY-92704' },
    })

    await expect(invoke()).resolves.toEqual({ success: true })
    expect(prisma.paymentWebhookReceipt.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'processing', failureCode: null }),
    }))
    expect(orders.transition).not.toHaveBeenCalled()
    expect(ordersGateway.notifyRestaurant).toHaveBeenCalledTimes(1)
  })

  it('flags a second bank transaction for an already completed intent', async () => {
    prisma.paymentIntent.findUnique.mockResolvedValueOnce({ ...intent, status: 'completed' })
    prisma.order.findUnique.mockResolvedValueOnce({
      ...order,
      status: 'restaurant_pending',
      payment: { transactionId: 'SEPAY-90000' },
    })

    await expect(invoke()).resolves.toEqual({ success: true })
    expect(prisma.payment.upsert).not.toHaveBeenCalled()
    expect(ordersGateway.notifyAdmins).toHaveBeenCalledWith(
      'admin:sepay_payment_review',
      expect.objectContaining({ reason: 'SEPAY_WEBHOOK_DUPLICATE_PAYMENT' }),
    )
  })

  it('records a late payment without releasing a cancelled order', async () => {
    prisma.order.findUnique.mockResolvedValueOnce({ ...order, status: 'cancelled' })

    await expect(invoke()).resolves.toEqual({ success: true })
    expect(prisma.payment.upsert).toHaveBeenCalledTimes(1)
    expect(prisma.orderStatusHistory.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        orderId: 'order-1',
        status: 'cancelled',
        note: expect.stringContaining('SEPAY_WEBHOOK_LATE_PAYMENT'),
      }),
    })
    expect(orders.transition).not.toHaveBeenCalled()
    expect(commissionQueue.add).not.toHaveBeenCalled()
    expect(prisma.paymentWebhookReceipt.update).toHaveBeenLastCalledWith({
      where: { id: 'receipt-1' },
      data: expect.objectContaining({ status: 'manual_review' }),
    })
  })

  it('rejects invalid signatures before writing a receipt', async () => {
    sepay.verifyWebhookSignature.mockReturnValueOnce(false)

    await expect(invoke()).rejects.toThrow('SEPAY_WEBHOOK_SIGNATURE_INVALID')
    expect(prisma.paymentWebhookReceipt.create).not.toHaveBeenCalled()
  })
})

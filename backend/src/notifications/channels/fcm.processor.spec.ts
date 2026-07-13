import type { Job } from 'bullmq'
import { PrismaService } from '../../database/prisma.service'
import { FcmJobData } from './fcm.channel'
import { FcmProcessor } from './fcm.processor'
import type { FirebaseMessagingClient } from './firebase-admin-messaging.client'

describe('FcmProcessor', () => {
  const prisma = {
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
  }
  const messaging = { sendEach: jest.fn() }
  let processor: FcmProcessor

  beforeEach(() => {
    jest.clearAllMocks()
    prisma.$executeRaw.mockResolvedValue(1)
    processor = new FcmProcessor(
      prisma as unknown as PrismaService,
      messaging as unknown as FirebaseMessagingClient,
    )
  })

  it('uses Firebase Admin batch sending and marks permanently invalid tokens stale', async () => {
    prisma.$queryRaw.mockResolvedValue([
      { id: 'token-1', token: 'valid-token' },
      { id: 'token-2', token: 'stale-token' },
    ])
    messaging.sendEach.mockResolvedValue({
      successCount: 1,
      failureCount: 1,
      responses: [
        { success: true },
        {
          success: false,
          error: { code: 'messaging/registration-token-not-registered' },
        },
      ],
    })

    const result = await processor.process(jobWith({
      userId: 'user-1',
      title: 'Order accepted',
      body: 'Your order is being prepared',
      data: { eventType: 'order_accepted', retry: 2, nested: { id: 'order-1' } },
    }))

    expect(result).toEqual({ sent: 1, failed: 1 })
    expect(messaging.sendEach).toHaveBeenCalledWith([
      expect.objectContaining({
        token: 'valid-token',
        notification: { title: 'Order accepted', body: 'Your order is being prepared' },
        data: { eventType: 'order_accepted', retry: '2', nested: '{"id":"order-1"}' },
      }),
      expect.objectContaining({ token: 'stale-token' }),
    ])
    expect(prisma.$executeRaw).toHaveBeenCalledTimes(1)
  })

  it('rejects provider failures so the queue can retry the original job', async () => {
    prisma.$queryRaw.mockResolvedValue([{ id: 'token-1', token: 'valid-token' }])
    messaging.sendEach.mockRejectedValue(new Error('FCM unavailable'))

    await expect(processor.process(jobWith({
      userId: 'user-1',
      title: 'Order accepted',
      body: 'Your order is being prepared',
    }))).rejects.toThrow('FCM unavailable')

    expect(prisma.$executeRaw).not.toHaveBeenCalled()
  })
})

function jobWith(data: FcmJobData): Job<FcmJobData> {
  return { id: 'fcm-job-1', data } as Job<FcmJobData>
}

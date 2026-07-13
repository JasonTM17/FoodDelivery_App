jest.mock('nodemailer', () => ({ createTransport: jest.fn() }))

import type { Job } from 'bullmq'
import { ConfigService } from '@nestjs/config'
import { createTransport } from 'nodemailer'
import { PrismaService } from '../../database/prisma.service'
import { SmtpJobData } from './smtp.channel'
import { SmtpProcessor } from './smtp.processor'

const mockCreateTransport = jest.mocked(createTransport)

describe('SmtpProcessor', () => {
  const prisma = { $queryRaw: jest.fn() }
  const redis = {}
  const twilioQueue = { add: jest.fn() }
  const transporter = {
    sendMail: jest.fn(),
    close: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    prisma.$queryRaw.mockResolvedValue([{ email: 'customer@example.com', full_name: 'Customer' }])
    mockCreateTransport.mockReturnValue(transporter as never)
    twilioQueue.add.mockResolvedValue({ id: 'fallback-1' })
  })

  it('uses one durable, cross-provider-compatible fallback job ID across SMTP retries', async () => {
    transporter.sendMail.mockRejectedValue(new Error('SMTP unavailable'))
    const processor = new SmtpProcessor(
      prisma as unknown as PrismaService,
      configFor({ SMTP_HOST: 'smtp.foodflow.test' }),
      redis as never,
      twilioQueue as never,
    )
    const job = jobWith({
      userId: 'user-1',
      title: 'Critical order update',
      body: 'Order cancelled',
      critical: true,
    })

    await expect(processor.process(job)).rejects.toThrow('SMTP unavailable')
    await expect(processor.process(job)).rejects.toThrow('SMTP unavailable')

    expect(twilioQueue.add).toHaveBeenCalledTimes(2)
    expect(twilioQueue.add).toHaveBeenNthCalledWith(
      1,
      'send-sms',
      { userId: 'user-1', body: 'Order cancelled', eventType: 'email_fallback' },
      { jobId: 'smtp-fallback-smtp-job-1' },
    )
    expect(twilioQueue.add).toHaveBeenNthCalledWith(
      2,
      'send-sms',
      { userId: 'user-1', body: 'Order cancelled', eventType: 'email_fallback' },
      { jobId: 'smtp-fallback-smtp-job-1' },
    )
  })

  it('does not enqueue an SMS fallback for non-critical email failures', async () => {
    transporter.sendMail.mockRejectedValue(new Error('SMTP unavailable'))
    const processor = new SmtpProcessor(
      prisma as unknown as PrismaService,
      configFor({ SMTP_HOST: 'smtp.foodflow.test' }),
      redis as never,
      twilioQueue as never,
    )

    await expect(processor.process(jobWith({
      userId: 'user-1',
      title: 'Order update',
      body: 'Order accepted',
      critical: false,
    }))).rejects.toThrow('SMTP unavailable')

    expect(twilioQueue.add).not.toHaveBeenCalled()
  })

  it('escapes user and notification content before rendering email HTML', async () => {
    prisma.$queryRaw.mockResolvedValue([{
      email: 'customer@example.com',
      full_name: '<img src=x onerror=alert(1)>',
    }])
    transporter.sendMail.mockResolvedValue({ messageId: 'message-1' })
    const processor = new SmtpProcessor(
      prisma as unknown as PrismaService,
      configFor({ SMTP_HOST: 'smtp.foodflow.test' }),
      redis as never,
      twilioQueue as never,
    )

    await expect(processor.process(jobWith({
      userId: 'user-1',
      title: '<script>alert(1)</script>',
      body: 'First line\n<a href="https://attacker.test">click</a>',
      critical: false,
    }))).resolves.toEqual({ sent: true })

    const sentMessage = transporter.sendMail.mock.calls[0][0]
    expect(sentMessage.html).not.toContain('<script>')
    expect(sentMessage.html).not.toContain('<img')
    expect(sentMessage.html).not.toContain('<a href=')
    expect(sentMessage.html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
    expect(sentMessage.html).toContain('First line<br/>&lt;a href=&quot;https://attacker.test&quot;&gt;click&lt;/a&gt;')
  })
})

function configFor(values: Record<string, string | number | boolean | undefined>): ConfigService {
  return {
    get: jest.fn((key: string) => values[key]),
  } as unknown as ConfigService
}

function jobWith(data: SmtpJobData): Job<SmtpJobData> {
  return { id: 'smtp-job-1', data } as Job<SmtpJobData>
}

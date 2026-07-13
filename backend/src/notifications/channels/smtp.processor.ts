import { Processor, WorkerHost, OnWorkerEvent, InjectQueue } from '@nestjs/bullmq'
import { Job, Queue } from 'bullmq'
import { Logger, Inject } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../../database/prisma.service'
import { QUEUE_SMTP, QUEUE_TWILIO } from '../notifications.constants'
import { SmtpJobData } from './smtp.channel'
import Redis from 'ioredis'
import { createTransport } from 'nodemailer'

interface UserEmailRow {
  email: string
  full_name: string
}

@Processor(QUEUE_SMTP)
export class SmtpProcessor extends WorkerHost {
  private readonly logger = new Logger(SmtpProcessor.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    @InjectQueue(QUEUE_TWILIO) private readonly twilioQueue: Queue,
  ) {
    super()
  }

  async process(job: Job<SmtpJobData>): Promise<{ sent: boolean }> {
    const { userId, title, body, critical } = job.data

    const smtpHost = this.config.get<string>('SMTP_HOST')
    if (!smtpHost) {
      this.logger.warn('SMTP_HOST not configured; skipping email')
      return { sent: false }
    }

    const rows = await this.prisma.$queryRaw<UserEmailRow[]>`
      SELECT email, full_name FROM users WHERE id = ${userId}::uuid LIMIT 1
    `
    if (rows.length === 0) {
      this.logger.warn(`User ${userId} not found for email`)
      return { sent: false }
    }

    const { email, full_name } = rows[0]

    const transporter = createTransport({
      host: smtpHost,
      port: this.config.get<number>('SMTP_PORT') ?? 587,
      secure: this.resolveSmtpSecure(),
      auth: {
        user: this.config.get<string>('SMTP_USER'),
        pass: this.config.get<string>('SMTP_PASS'),
      },
    })

    try {
      const info = await transporter.sendMail({
        from: this.config.get<string>('SMTP_FROM') ?? 'noreply@foodflow.vn',
        to: email,
        subject: title,
        html: this.renderHtml(full_name, title, body),
      })
      this.logger.log(`Email sent to ${email}: ${info.messageId}`)
      return { sent: true }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      this.logger.error(`SMTP send failed for ${email}: ${msg}`)

      // For critical messages, fall back to SMS queue
      if (critical) {
        const sourceJobId = job.id
        if (!sourceJobId) {
          throw new Error('SMTP_FALLBACK_SOURCE_JOB_ID_MISSING')
        }

        await this.twilioQueue.add(
          'send-sms',
          { userId, body, eventType: 'email_fallback' },
          { jobId: `smtp-fallback-${sourceJobId}` },
        )
        this.logger.warn(`Critical email failed for ${userId}; pushed to SMS fallback`)
      }

      throw err
    } finally {
      transporter.close()
    }
  }

  private resolveSmtpSecure(): boolean {
    const value = this.config.get<string | boolean>('SMTP_SECURE')
    return value === true || value === 'true'
  }

  private renderHtml(name: string, subject: string, content: string): string {
    const safeName = escapeHtml(name)
    const safeSubject = escapeHtml(subject)
    const safeContent = escapeHtml(content).replace(/\r?\n/g, '<br/>')

    return `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px">
        <h2 style="color:#e65100">${safeSubject}</h2>
        <p>Xin chào ${safeName},</p>
        <p>${safeContent}</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
        <p style="color:#999;font-size:12px">FoodFlow — Giao đồ ăn nhanh tại Việt Nam</p>
      </div>
    `.trim()
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<SmtpJobData>, error: Error): void {
    this.logger.error(`SMTP job ${job.id} failed for user ${job.data.userId}: ${error.message}`)
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, character => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }
    return entities[character]
  })
}

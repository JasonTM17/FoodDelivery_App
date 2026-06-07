import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq'
import { Job } from 'bullmq'
import { Logger, Inject } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../../database/prisma.service'
import { QUEUE_TWILIO, TWILIO_DAILY_USD_CAP } from '../notifications.constants'
import { TwilioJobData } from './twilio.channel'
import Redis from 'ioredis'

interface UserPhoneRow {
  phone: string
}

const TWILIO_COST_PER_SMS_USD = 0.0079

@Processor(QUEUE_TWILIO)
export class TwilioProcessor extends WorkerHost {
  private readonly logger = new Logger(TwilioProcessor.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {
    super()
  }

  async process(job: Job<TwilioJobData>): Promise<{ sent: boolean }> {
    const { userId, body } = job.data

    const accountSid = this.config.get<string>('TWILIO_ACCOUNT_SID')
    const authToken = this.config.get<string>('TWILIO_AUTH_TOKEN')
    const fromNumber = this.config.get<string>('TWILIO_FROM_NUMBER')

    if (!accountSid || !authToken || !fromNumber) {
      this.logger.warn('Twilio credentials not configured; skipping SMS')
      return { sent: false }
    }

    // Daily cap check
    const capKey = `twilio:daily:${new Date().toISOString().slice(0, 10)}`
    const spent = parseFloat((await this.redis.get(capKey)) ?? '0')
    if (spent >= TWILIO_DAILY_USD_CAP) {
      this.logger.error(`Twilio daily cap $${TWILIO_DAILY_USD_CAP} reached; blocking SMS and alerting admin`)
      await this.alertAdminCapReached(capKey, spent)
      return { sent: false }
    }

    const rows = await this.prisma.$queryRaw<UserPhoneRow[]>`
      SELECT phone FROM users WHERE id = ${userId}::uuid AND phone IS NOT NULL LIMIT 1
    `
    if (rows.length === 0 || !rows[0].phone) {
      this.logger.warn(`No phone on file for user ${userId}`)
      return { sent: false }
    }

    const to = rows[0].phone
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`
    const creds = Buffer.from(`${accountSid}:${authToken}`).toString('base64')

    const params = new URLSearchParams({ To: to, From: fromNumber, Body: body })

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${creds}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`Twilio HTTP ${response.status}: ${text}`)
    }

    // Increment daily spend counter (TTL 25h to cover timezone skew)
    await this.redis.incrbyfloat(capKey, TWILIO_COST_PER_SMS_USD)
    await this.redis.expire(capKey, 90000)

    this.logger.log(`SMS sent to ${to} for user ${userId}`)
    return { sent: true }
  }

  private async alertAdminCapReached(capKey: string, spent: number): Promise<void> {
    await this.redis.set(`twilio:cap_alert:${capKey}`, String(spent), 'EX', 3600)
    this.logger.error(`ADMIN ALERT: Twilio daily SMS cap of $${TWILIO_DAILY_USD_CAP} reached. Current spend: $${spent}`)
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<TwilioJobData>, error: Error): void {
    this.logger.error(`Twilio job ${job.id} failed for user ${job.data.userId}: ${error.message}`)
  }
}

import { Injectable, Logger } from '@nestjs/common'
import { createHmac, timingSafeEqual } from 'crypto'

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name)

  signPayload(payload: string): string {
    const secret = process.env.WEBHOOK_SECRET
    if (!secret) {
      this.logger.warn('WEBHOOK_SECRET not set, webhook signing is disabled')
      return ''
    }
    return createHmac('sha256', secret).update(payload).digest('hex')
  }

  verifySignature(payload: string, signature: string): boolean {
    const secret = process.env.WEBHOOK_SECRET
    if (!secret) {
      this.logger.warn('WEBHOOK_SECRET not set, skipping signature verification')
      return true
    }
    const expected = createHmac('sha256', secret).update(payload).digest('hex')
    try {
      return timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
    } catch {
      return false
    }
  }

  async post(url: string, body: Record<string, unknown>): Promise<void> {
    const rawBody = JSON.stringify(body)
    const signature = this.signPayload(rawBody)

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (signature) {
      headers['X-Signature-SHA256'] = signature
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: rawBody,
      })
      if (!response.ok) {
        this.logger.warn(`Webhook to ${url} returned ${response.status}`)
      }
    } catch (error) {
      this.logger.error(`Webhook to ${url} failed: ${(error as Error).message}`)
    }
  }
}

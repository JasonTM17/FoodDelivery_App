import { registerAs } from '@nestjs/config'

export const n8nConfig = registerAs('n8n', () => ({
  webhookUrl: process.env.N8N_WEBHOOK_URL ?? 'http://n8n:5678/webhook',
  apiKey: process.env.N8N_API_KEY ?? 'dev-key',
}))

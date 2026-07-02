import { registerAs } from '@nestjs/config'

export const aiConfig = registerAs('ai', () => ({
  chatProvider: process.env.AI_CHAT_PROVIDER,
  deepseekApiKey: process.env.DEEPSEEK_API_KEY,
  deepseekBaseUrl: process.env.DEEPSEEK_BASE_URL ?? 'https://api.deepseek.com',
  deepseekModel: process.env.DEEPSEEK_MODEL ?? 'deepseek-v4-flash',
  deepseekThinking: process.env.DEEPSEEK_THINKING ?? 'disabled',
  geminiApiKey: process.env.GEMINI_API_KEY,
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
}))

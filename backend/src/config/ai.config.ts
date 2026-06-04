import { registerAs } from '@nestjs/config'

export const aiConfig = registerAs('ai', () => ({
  geminiApiKey: process.env.GEMINI_API_KEY,
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
}))

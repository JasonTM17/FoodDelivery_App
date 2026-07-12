import { ConfigService } from '@nestjs/config'
import { createFoodFlowApp } from './bootstrap/create-foodflow-app'

async function bootstrap() {
  const app = await createFoodFlowApp({
    enableWebSockets: process.env.REALTIME_PROVIDER !== 'supabase',
  })
  const configService = app.get(ConfigService)
  const port = configService.get<number>('PORT')
  if (!port) throw new Error('PORT environment variable is not set')

  await app.listen(port)
  console.log(`FoodFlow API listening on port ${port}`)
}

bootstrap()

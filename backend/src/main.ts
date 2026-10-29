import { ConfigService } from '@nestjs/config'
// Vercel's Nest detector inspects this entrypoint's direct core dependency.
// Application construction remains in the shared factory below.
import '@nestjs/core'
import { createFoodFlowApp } from './bootstrap/create-foodflow-app'
import { listenWithEmbeddedWorker } from './bootstrap/embedded-worker'

async function bootstrap() {
  const app = await createFoodFlowApp({
    enableWebSockets: process.env.REALTIME_PROVIDER !== 'supabase',
  })
  const configService = app.get(ConfigService)
  const port = configService.get<number>('PORT')
  if (!port) throw new Error('PORT environment variable is not set')

  const shutdown = await listenWithEmbeddedWorker(app, port)
  for (const signal of ['SIGTERM', 'SIGINT'] as const) {
    process.once(signal, () => { void shutdown().catch(() => { process.exitCode = 1 }) })
  }
  console.log(`FoodFlow API listening on port ${port}`)
}

void bootstrap().catch(() => {
  console.error('FoodFlow API failed to start')
  process.exitCode = 1
})

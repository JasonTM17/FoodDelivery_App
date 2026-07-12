import { NestFactory } from '@nestjs/core'
import { WorkersModule } from './workers.module'

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(WorkersModule)
  app.enableShutdownHooks()
  await app.init()
  console.log('FoodFlow Worker started')
}

void bootstrap().catch(() => {
  console.error('FoodFlow Worker failed to start')
  process.exitCode = 1
})

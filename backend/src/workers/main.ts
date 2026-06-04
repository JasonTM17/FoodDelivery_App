import { NestFactory } from '@nestjs/core'
import { WorkersModule } from './workers.module'

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(WorkersModule)
  console.log('FoodFlow Worker started')
  await app.init()
}
bootstrap()

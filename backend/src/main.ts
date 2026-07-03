import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { AppModule } from './app.module'
import { RedisIoAdapter } from './common/adapters/redis-io.adapter'
import { parseCorsOrigins } from './common/config/cors-origins'
import helmet from 'helmet'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const configService = app.get(ConfigService)
  const redisUrl = configService.get<string>('REDIS_URL')
  if (!redisUrl) throw new Error('REDIS_URL environment variable is not set')
  const corsOrigins = configService.get<string>('CORS_ORIGINS')
  if (!corsOrigins) throw new Error('CORS_ORIGINS environment variable is not set')
  const port = configService.get<number>('PORT')
  if (!port) throw new Error('PORT environment variable is not set')

  // Redis adapter for Socket.IO horizontal scaling
  const redisAdapter = new RedisIoAdapter(app)
  await redisAdapter.connectToRedis(redisUrl)
  app.useWebSocketAdapter(redisAdapter)

  app.use(helmet())
  app.enableCors({
    origin: parseCorsOrigins(corsOrigins),
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    credentials: true,
  })

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }))

  // Swagger / OpenAPI
  const config = new DocumentBuilder()
    .setTitle('FoodFlow API')
    .setDescription('Food delivery platform API — orders, restaurants, dispatch, tracking')
    .setVersion('0.1.0')
    .addBearerAuth()
    .addTag('auth')
    .addTag('orders')
    .addTag('restaurants')
    .addTag('menu')
    .addTag('drivers')
    .addTag('tracking')
    .addTag('notifications')
    .addTag('admin')
    .build()

  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api/docs', app, document)

  app.setGlobalPrefix('api')

  await app.listen(port)
  console.log(`FoodFlow API listening on port ${port}`)
}
bootstrap()

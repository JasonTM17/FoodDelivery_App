import { INestApplication, ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import helmet from 'helmet'
import { AppModule } from '../app.module'
import { RedisIoAdapter } from '../common/adapters/redis-io.adapter'
import { parseCorsOrigins } from '../common/config/cors-origins'

export interface CreateFoodFlowAppOptions {
  enableWebSockets?: boolean
  setupSwagger?: boolean
}

export async function createFoodFlowApp(
  options: CreateFoodFlowAppOptions = {},
): Promise<INestApplication> {
  const { enableWebSockets = true, setupSwagger = true } = options
  const app = await NestFactory.create(AppModule, { rawBody: true })
  const configService = app.get(ConfigService)

  const corsOrigins = configService.get<string>('CORS_ORIGINS')
  if (!corsOrigins) throw new Error('CORS_ORIGINS environment variable is not set')

  if (enableWebSockets) {
    const redisUrl = configService.get<string>('REDIS_URL')
    if (!redisUrl) throw new Error('REDIS_URL environment variable is not set')
    const redisAdapter = new RedisIoAdapter(app)
    await redisAdapter.connectToRedis(redisUrl)
    app.useWebSocketAdapter(redisAdapter)
  }

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

  if (setupSwagger) {
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
      .addTag('realtime')
      .build()

    const document = SwaggerModule.createDocument(app, config)
    SwaggerModule.setup('api/docs', app, document)
  }

  app.setGlobalPrefix('api')
  return app
}

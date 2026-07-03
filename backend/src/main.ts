import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { AppModule } from './app.module'
import { RedisIoAdapter } from './common/adapters/redis-io.adapter'
import helmet from 'helmet'

const DEFAULT_CORS_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3002',
  'http://localhost:3003',
]

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const configService = app.get(ConfigService)
  const redisUrl = configService.get<string>('REDIS_URL')
  if (!redisUrl) throw new Error('REDIS_URL environment variable is not set')

  // Redis adapter for Socket.IO horizontal scaling
  const redisAdapter = new RedisIoAdapter(app)
  await redisAdapter.connectToRedis(redisUrl)
  app.useWebSocketAdapter(redisAdapter)

  app.use(helmet())
  app.enableCors({
    origin: (process.env.CORS_ORIGINS ?? DEFAULT_CORS_ORIGINS.join(','))
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
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

  const port = process.env.PORT ?? 3001
  await app.listen(port)
  console.log(`FoodFlow API running on http://localhost:${port}`)
}
bootstrap()

import { INestApplication } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('FoodFlow API')
    .setDescription('Food delivery platform REST API with real-time WebSocket support')
    .setVersion('0.1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
    .addApiKey({ type: 'apiKey', name: 'x-api-key', in: 'header' }, 'api-key')
    .addServer('http://localhost:3001', 'Local development')
    .addTag('auth', 'Authentication')
    .addTag('restaurants', 'Restaurant discovery')
    .addTag('orders', 'Order management')
    .addTag('drivers', 'Driver operations')
    .addTag('admin', 'Administration')
    .build()

  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api/docs', app, document)
}

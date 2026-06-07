import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler'
import { BullModule } from '@nestjs/bullmq'
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core'
import { PrismaModule } from './database/prisma.module'
import { RedisModule } from './redis/redis.module'
import { AuthModule } from './auth/auth.module'
import { UsersModule } from './users/users.module'
import { RestaurantsModule } from './restaurants/restaurants.module'
import { MenuModule } from './menu/menu.module'
import { CartModule } from './cart/cart.module'
import { OrdersModule } from './orders/orders.module'
import { DispatchModule } from './dispatch/dispatch.module'
import { TrackingModule } from './tracking/tracking.module'
import { DriversModule } from './drivers/drivers.module'
import { AdminModule } from './admin/admin.module'
import { NotificationsModule } from './notifications/notifications.module'
import { ReviewsModule } from './reviews/reviews.module'
import { LoyaltyModule } from './loyalty/loyalty.module'
import { PaymentsModule } from './payments/payments.module'
import { WebhooksModule } from './webhooks/webhooks.module'
import { PromotionsModule } from './promotions/promotions.module'
import { HealthModule } from './health/health.module'
import { MetricsModule } from './metrics/metrics.module'
import { I18nSetupModule } from './i18n/i18n.module'
import { HttpExceptionFilter } from './common/filters/http-exception.filter'
import { ResponseInterceptor } from './common/interceptors/response.interceptor'
import { RequestIdMiddleware } from './common/middleware/request-id.middleware'
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware'
import { PrometheusMiddleware } from './common/middleware/prometheus.middleware'
import { ThrottlerStorageRedis } from './common/storage/throttler-storage-redis'
import Redis from 'ioredis'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRootAsync({
      imports: [RedisModule],
      inject: ['REDIS_CLIENT'],
      useFactory: (redis: Redis) => ({
        throttlers: [{ ttl: 60000, limit: 100 }],
        storage: new ThrottlerStorageRedis(redis),
      }),
    }),
    BullModule.forRoot({ connection: { url: process.env.REDIS_URL ?? 'redis://localhost:6379' } }),
    PrismaModule,
    RedisModule,
    HealthModule,
    MetricsModule,
    I18nSetupModule,
    AuthModule,
    UsersModule,
    RestaurantsModule,
    MenuModule,
    CartModule,
    OrdersModule,
    DispatchModule,
    TrackingModule,
    DriversModule,
    AdminModule,
    NotificationsModule,
    ReviewsModule,
    LoyaltyModule,
    PaymentsModule,
    WebhooksModule,
    PromotionsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestIdMiddleware, RequestLoggerMiddleware, PrometheusMiddleware)
      .forRoutes('*')
  }
}

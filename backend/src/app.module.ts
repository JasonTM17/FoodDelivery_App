import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler'
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
import { WalletModule } from './wallet/wallet.module'
import { PaymentsModule } from './payments/payments.module'
import { WebhooksModule } from './webhooks/webhooks.module'
import { PromotionsModule } from './promotions/promotions.module'
import { ReferralModule } from './referral/referral.module'
import { RestaurantPortalModule } from './restaurant-portal/restaurant-portal.module'
import { AiModule } from './ai/ai.module'
import { HealthModule } from './health/health.module'
import { MetricsModule } from './metrics/metrics.module'
import { RealtimeModule } from './realtime/realtime.module'
import { I18nSetupModule } from './i18n/i18n.module'
import { HttpExceptionFilter } from './common/filters/http-exception.filter'
import { ResponseInterceptor } from './common/interceptors/response.interceptor'
import { AuditLogInterceptor } from './common/interceptors/audit-log.interceptor'
import { RequestIdMiddleware } from './common/middleware/request-id.middleware'
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware'
import { PrometheusMiddleware } from './common/middleware/prometheus.middleware'
import { QueueProviderModule } from './common/queue/queue-provider.module'
import { ThrottlerStorageRedis } from './common/storage/throttler-storage-redis'
import { validateEnv } from './config/env.validation'
import Redis from 'ioredis'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    ThrottlerModule.forRootAsync({
      imports: [RedisModule],
      inject: ['REDIS_CLIENT', ConfigService],
      useFactory: (redis: Redis, config: ConfigService) => ({
        throttlers: [{
          ttl: config.get<number>('THROTTLER_TTL_MS', 60_000),
          limit: config.get<number>('THROTTLER_LIMIT', 100),
        }],
        storage: new ThrottlerStorageRedis(redis, {
          allowInMemoryFallback: config.get<string>('THROTTLER_MEMORY_FALLBACK') === 'true',
        }),
      }),
    }),
    QueueProviderModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const redisUrl = config.get<string>('REDIS_URL')
        if (!redisUrl) throw new Error('REDIS_URL environment variable is not set')
        return { connection: { url: redisUrl } }
      },
    }),
    PrismaModule,
    RedisModule,
    HealthModule,
    MetricsModule,
    RealtimeModule,
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
    WalletModule,
    PaymentsModule,
    WebhooksModule,
    PromotionsModule,
    ReferralModule,
    RestaurantPortalModule,
    AiModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    { provide: APP_INTERCEPTOR, useClass: AuditLogInterceptor },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestIdMiddleware, RequestLoggerMiddleware, PrometheusMiddleware)
      .forRoutes('*')
  }
}

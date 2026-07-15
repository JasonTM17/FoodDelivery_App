import { Global, Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { PrismaModule } from '../database/prisma.module'
import { RealtimePublisherService } from './realtime-publisher.service'
import { RealtimeTokenController } from './realtime-token.controller'
import { RealtimeTokenService } from './realtime-token.service'
import { RealtimeMetrics } from './realtime.metrics'

@Global()
@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [RealtimeTokenController],
  providers: [RealtimeMetrics, RealtimePublisherService, RealtimeTokenService],
  exports: [RealtimeMetrics, RealtimePublisherService, RealtimeTokenService],
})
export class RealtimeModule {}

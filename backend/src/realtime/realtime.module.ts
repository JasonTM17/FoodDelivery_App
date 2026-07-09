import { Global, Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { PrismaModule } from '../database/prisma.module'
import { RealtimePublisherService } from './realtime-publisher.service'
import { RealtimeTokenController } from './realtime-token.controller'
import { RealtimeTokenService } from './realtime-token.service'

@Global()
@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [RealtimeTokenController],
  providers: [RealtimePublisherService, RealtimeTokenService],
  exports: [RealtimePublisherService, RealtimeTokenService],
})
export class RealtimeModule {}

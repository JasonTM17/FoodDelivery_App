import { Module, Global } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { MetricsController } from './metrics.controller'

@Global()
@Module({
  imports: [ConfigModule],
  controllers: [MetricsController],
})
export class MetricsModule {}

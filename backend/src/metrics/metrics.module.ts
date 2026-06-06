import { Module, Global } from '@nestjs/common'
import { MetricsController } from './metrics.controller'

@Global()
@Module({
  controllers: [MetricsController],
})
export class MetricsModule {}

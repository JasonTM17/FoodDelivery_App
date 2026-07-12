import { Module } from '@nestjs/common'
import { JobOutboxController } from './job-outbox.controller'
import { JobOutboxService } from './job-outbox.service'

@Module({
  controllers: [JobOutboxController],
  providers: [JobOutboxService],
  exports: [JobOutboxService],
})
export class JobOutboxModule {}

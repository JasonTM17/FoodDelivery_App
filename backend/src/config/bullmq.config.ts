import { BullRootModuleOptions } from '@nestjs/bullmq'

export const bullmqConfig: BullRootModuleOptions = {
  connection: { url: process.env.REDIS_URL ?? 'redis://localhost:6379' },
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
}

import { ThrottlerModuleOptions } from '@nestjs/throttler'

export const throttleConfig: ThrottlerModuleOptions[] = [
  {
    ttl: 60000,
    limit: 100,
  },
]

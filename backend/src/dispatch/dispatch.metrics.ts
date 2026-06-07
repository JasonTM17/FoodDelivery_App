import { Injectable, OnModuleInit } from '@nestjs/common'
import { Counter, Histogram, Gauge, register } from 'prom-client'

function reuseOrCreate<T>(name: string, factory: () => T): T {
  const existing = register.getSingleMetric(name)
  if (existing) return existing as unknown as T
  return factory()
}

@Injectable()
export class DispatchMetrics implements OnModuleInit {
  attemptsTotal!: Counter<string>
  successTotal!: Counter<string>
  noDriverTotal!: Counter<string>
  timeToAssign!: Histogram<string>
  availableDriversPerZone!: Gauge<string>

  onModuleInit(): void {
    this.attemptsTotal = reuseOrCreate('dispatch_attempts_total', () =>
      new Counter({
        name: 'dispatch_attempts_total',
        help: 'Total dispatch job attempts',
        labelNames: ['attempt_no'],
      }),
    )

    this.successTotal = reuseOrCreate('dispatch_success_total', () =>
      new Counter({
        name: 'dispatch_success_total',
        help: 'Total successful driver assignments',
        labelNames: [],
      }),
    )

    this.noDriverTotal = reuseOrCreate('dispatch_no_driver_total', () =>
      new Counter({
        name: 'dispatch_no_driver_total',
        help: 'Dispatch rounds where no driver was available',
        labelNames: ['reason'],
      }),
    )

    this.timeToAssign = reuseOrCreate('dispatch_time_to_assign_seconds', () =>
      new Histogram({
        name: 'dispatch_time_to_assign_seconds',
        help: 'Seconds from first dispatch attempt to driver assignment',
        buckets: [1, 5, 10, 20, 30, 45, 60, 90, 120],
      }),
    )

    this.availableDriversPerZone = reuseOrCreate('available_drivers_per_zone', () =>
      new Gauge({
        name: 'available_drivers_per_zone',
        help: 'Available drivers in a dispatch zone',
        labelNames: ['zone'],
      }),
    )
  }
}

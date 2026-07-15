import { Injectable, OnModuleInit } from '@nestjs/common'
import { Counter, Histogram, register } from 'prom-client'

function reuseOrCreate<T>(name: string, factory: () => T): T {
  const existing = register.getSingleMetric(name)
  return existing ? existing as unknown as T : factory()
}

@Injectable()
export class RealtimeMetrics implements OnModuleInit {
  private broadcastLatencySeconds!: Histogram<string>
  private broadcastFailuresTotal!: Counter<string>

  onModuleInit(): void {
    this.broadcastLatencySeconds = reuseOrCreate('foodflow_realtime_broadcast_latency_seconds', () =>
      new Histogram({
        name: 'foodflow_realtime_broadcast_latency_seconds',
        help: 'Supabase private Broadcast HTTP latency',
        labelNames: ['outcome'],
        buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 3, 5],
      }),
    )
    this.broadcastFailuresTotal = reuseOrCreate('foodflow_realtime_broadcast_failures_total', () =>
      new Counter({
        name: 'foodflow_realtime_broadcast_failures_total',
        help: 'Failed Supabase private Broadcast requests',
      }),
    )
  }

  observeBroadcast(durationMs: number, outcome: 'success' | 'failure'): void {
    this.broadcastLatencySeconds.observe({ outcome }, durationMs / 1000)
    if (outcome === 'failure') this.broadcastFailuresTotal.inc()
  }
}

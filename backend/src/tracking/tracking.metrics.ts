import { Injectable, OnModuleInit } from '@nestjs/common'
import { Counter, Histogram, register } from 'prom-client'

function reuseOrCreate<T>(name: string, factory: () => T): T {
  const existing = register.getSingleMetric(name)
  return existing ? existing as unknown as T : factory()
}

@Injectable()
export class TrackingMetrics implements OnModuleInit {
  private gpsUpdatesTotal!: Counter<string>
  private gpsSampleAgeSeconds!: Histogram<string>
  private socketConnectionsTotal!: Counter<string>
  private routeProviderFailuresTotal!: Counter<string>
  private locationBatchFlushFailuresTotal!: Counter<string>

  onModuleInit(): void {
    this.gpsUpdatesTotal = reuseOrCreate('foodflow_gps_updates_total', () =>
      new Counter({
        name: 'foodflow_gps_updates_total',
        help: 'Accepted and rejected live GPS updates',
        labelNames: ['outcome', 'reason'],
      }),
    )
    this.gpsSampleAgeSeconds = reuseOrCreate('foodflow_gps_sample_age_seconds', () =>
      new Histogram({
        name: 'foodflow_gps_sample_age_seconds',
        help: 'Age of valid GPS samples when received by the API',
        buckets: [0.1, 0.5, 1, 2, 3, 5, 10, 20, 30, 45],
      }),
    )
    this.socketConnectionsTotal = reuseOrCreate('foodflow_tracking_socket_connections_total', () =>
      new Counter({
        name: 'foodflow_tracking_socket_connections_total',
        help: 'Tracking Socket.IO connection authentication outcomes',
        labelNames: ['outcome'],
      }),
    )
    this.routeProviderFailuresTotal = reuseOrCreate('foodflow_route_provider_failures_total', () =>
      new Counter({
        name: 'foodflow_route_provider_failures_total',
        help: 'Directions provider failures that degraded ETA calculation',
        labelNames: ['provider'],
      }),
    )
    this.locationBatchFlushFailuresTotal = reuseOrCreate('foodflow_gps_batch_flush_failures_total', () =>
      new Counter({
        name: 'foodflow_gps_batch_flush_failures_total',
        help: 'PostGIS GPS batch flush failures retained for retry',
      }),
    )
  }

  recordGpsAccepted(sampleAgeMs: number): void {
    this.gpsUpdatesTotal.inc({ outcome: 'accepted', reason: 'none' })
    this.gpsSampleAgeSeconds.observe(Math.max(0, sampleAgeMs) / 1000)
  }

  recordGpsRejected(reason: string): void {
    this.gpsUpdatesTotal.inc({ outcome: 'rejected', reason })
  }

  recordSocketConnection(outcome: 'authenticated' | 'recovered' | 'rejected'): void {
    this.socketConnectionsTotal.inc({ outcome })
  }

  recordRouteProviderFailure(provider: 'google' | 'osrm' | 'unconfigured'): void {
    this.routeProviderFailuresTotal.inc({ provider })
  }

  recordLocationBatchFlushFailure(): void {
    this.locationBatchFlushFailuresTotal.inc()
  }
}

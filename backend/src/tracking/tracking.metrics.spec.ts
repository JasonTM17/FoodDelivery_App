import { register } from 'prom-client'
import { TrackingMetrics } from './tracking.metrics'

describe('TrackingMetrics', () => {
  beforeEach(() => register.clear())

  it('records GPS, socket, route-provider and retained-batch outcomes', async () => {
    const metrics = new TrackingMetrics()
    metrics.onModuleInit()

    metrics.recordGpsAccepted(1250)
    metrics.recordGpsRejected('poor_accuracy')
    metrics.recordSocketConnection('authenticated')
    metrics.recordSocketConnection('recovered')
    metrics.recordSocketConnection('rejected')
    metrics.recordRouteProviderFailure('osrm')
    metrics.recordLocationBatchFlushFailure()

    const output = await register.metrics()
    expect(output).toContain('foodflow_gps_updates_total{outcome="accepted",reason="none"} 1')
    expect(output).toContain('foodflow_gps_updates_total{outcome="rejected",reason="poor_accuracy"} 1')
    expect(output).toContain('foodflow_tracking_socket_connections_total{outcome="authenticated"} 1')
    expect(output).toContain('foodflow_tracking_socket_connections_total{outcome="recovered"} 1')
    expect(output).toContain('foodflow_route_provider_failures_total{provider="osrm"} 1')
    expect(output).toContain('foodflow_gps_batch_flush_failures_total 1')
  })

  it('reuses registered collectors when initialized more than once', () => {
    const first = new TrackingMetrics()
    const second = new TrackingMetrics()

    expect(() => {
      first.onModuleInit()
      second.onModuleInit()
    }).not.toThrow()
  })
})

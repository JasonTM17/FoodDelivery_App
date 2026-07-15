import { register } from 'prom-client'
import { RealtimeMetrics } from './realtime.metrics'

describe('RealtimeMetrics', () => {
  beforeEach(() => register.clear())

  it('records successful latency and failed Broadcast requests', async () => {
    const metrics = new RealtimeMetrics()
    metrics.onModuleInit()

    metrics.observeBroadcast(250, 'success')
    metrics.observeBroadcast(750, 'failure')

    const output = await register.metrics()
    expect(output).toContain('foodflow_realtime_broadcast_latency_seconds_count{outcome="success"} 1')
    expect(output).toContain('foodflow_realtime_broadcast_latency_seconds_count{outcome="failure"} 1')
    expect(output).toContain('foodflow_realtime_broadcast_failures_total 1')
  })
})

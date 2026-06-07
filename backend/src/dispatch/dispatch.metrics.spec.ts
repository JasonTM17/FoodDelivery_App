import { Test, TestingModule } from '@nestjs/testing'
import { DispatchMetrics } from './dispatch.metrics'

describe('DispatchMetrics', () => {
  let metrics: DispatchMetrics

  beforeEach(async () => {
    // Clear prom-client default registry between tests to avoid duplicate metric errors
    const { register } = await import('prom-client')
    register.clear()

    const module: TestingModule = await Test.createTestingModule({
      providers: [DispatchMetrics],
    }).compile()

    metrics = module.get(DispatchMetrics)
    metrics.onModuleInit()
  })

  it('should be defined', () => {
    expect(metrics).toBeDefined()
  })

  it('exposes attemptsTotal counter and can increment it', () => {
    expect(metrics.attemptsTotal).toBeDefined()
    expect(() => metrics.attemptsTotal.inc({ attempt_no: '1' })).not.toThrow()
  })

  it('exposes successTotal counter and can increment it', () => {
    expect(metrics.successTotal).toBeDefined()
    expect(() => metrics.successTotal.inc()).not.toThrow()
  })

  it('exposes noDriverTotal counter and can increment with reason label', () => {
    expect(metrics.noDriverTotal).toBeDefined()
    expect(() => metrics.noDriverTotal.inc({ reason: 'no_candidates' })).not.toThrow()
    expect(() => metrics.noDriverTotal.inc({ reason: 'all_rejected' })).not.toThrow()
  })

  it('exposes timeToAssign histogram and can observe values', () => {
    expect(metrics.timeToAssign).toBeDefined()
    expect(() => metrics.timeToAssign.observe(5.5)).not.toThrow()
    expect(() => metrics.timeToAssign.observe(45)).not.toThrow()
  })

  it('exposes availableDriversPerZone gauge and can set value per zone', () => {
    expect(metrics.availableDriversPerZone).toBeDefined()
    expect(() => metrics.availableDriversPerZone.set({ zone: '217:2133' }, 5)).not.toThrow()
    expect(() => metrics.availableDriversPerZone.set({ zone: '218:2134' }, 0)).not.toThrow()
  })

  it('onModuleInit is idempotent — reusing existing metrics does not throw', () => {
    expect(() => metrics.onModuleInit()).not.toThrow()
  })
})

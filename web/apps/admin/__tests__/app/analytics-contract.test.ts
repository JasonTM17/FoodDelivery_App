import { describe, expect, it } from 'vitest'
import { parseAnalyticsCharts, parseAnalyticsKpis } from '@/app/[locale]/analytics/analytics-contract'

describe('Admin analytics runtime contracts', () => {
  it('accepts explicit empty analytics arrays', () => {
    expect(parseAnalyticsKpis({ kpis: [] })).toEqual({ kpis: [] })
    expect(parseAnalyticsCharts({ orderStatus: [], topRestaurants: [], retention: [] })).toEqual({
      orderStatus: [],
      topRestaurants: [],
      retention: [],
    })
  })

  it('rejects missing KPI arrays instead of rendering fake empty cards', () => {
    expect(() => parseAnalyticsKpis({})).toThrow('ADMIN_ANALYTICS_KPI_CONTRACT')
    expect(() => parseAnalyticsKpis({ kpis: [{ key: 'revenue', value: 0 }] })).toThrow('ADMIN_ANALYTICS_KPI_CONTRACT')
  })

  it('rejects malformed chart arrays instead of rendering fake empty charts', () => {
    expect(() => parseAnalyticsCharts({ orderStatus: [], topRestaurants: [] })).toThrow('ADMIN_ANALYTICS_CHARTS_CONTRACT')
    expect(() => parseAnalyticsCharts({
      orderStatus: [{ date: '2026-07-01', pending: 1, confirmed: 0, delivering: 0, completed: 0, cancelled: '0' }],
      topRestaurants: [],
      retention: [],
    })).toThrow('ADMIN_ANALYTICS_CHARTS_CONTRACT')
  })
})

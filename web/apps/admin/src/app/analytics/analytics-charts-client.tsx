'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const funnelSteps = [
  { label: 'Đặt hàng', value: 1842, pct: 100 },
  { label: 'Thanh toán', value: 1786, pct: 97.0 },
  { label: 'Đang giao', value: 1740, pct: 94.5 },
  { label: 'Hoàn thành', value: 1691, pct: 91.8 },
]

const topRestaurants = [
  { name: 'Phở Thìn', orders: 312, revenue: '₫28.4M', pct: 100 },
  { name: 'Bún bò Huế Mẹ Thoa', orders: 278, revenue: '₫24.1M', pct: 89 },
  { name: 'Cơm tấm Sài Gòn', orders: 241, revenue: '₫19.8M', pct: 77 },
  { name: 'Bánh mì Phương', orders: 198, revenue: '₫14.2M', pct: 63 },
  { name: 'Lẩu Thái Lan', orders: 176, revenue: '₫18.9M', pct: 56 },
]

const cohortWeeks = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8']
const cohortData = [
  { cohort: 'Tháng 5', values: [100, 68, 52, 44, 38, 34, 31, 29] as (number | null)[] },
  { cohort: 'Tháng 4', values: [100, 65, 50, 42, 36, 32, 29, null] as (number | null)[] },
  { cohort: 'Tháng 3', values: [100, 70, 55, 46, 40, 35, null, null] as (number | null)[] },
  { cohort: 'Tháng 2', values: [100, 62, 48, 40, 34, null, null, null] as (number | null)[] },
]

function cohortCellClass(val: number | null): string {
  if (val === null) return 'bg-muted text-muted-foreground'
  if (val >= 80) return 'bg-emerald-500/20 text-emerald-700'
  if (val >= 50) return 'bg-primary/10 text-primary'
  if (val >= 30) return 'bg-amber-500/10 text-amber-700'
  return 'bg-muted text-muted-foreground'
}

export default function AnalyticsChartsClient() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Phễu chuyển đổi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {funnelSteps.map((step) => (
              <div key={step.label}>
                <div className="mb-1 flex justify-between">
                  <span className="text-sm text-muted-foreground">{step.label}</span>
                  <span className="text-sm font-medium">
                    {step.value.toLocaleString('vi-VN')} ({step.pct}%)
                  </span>
                </div>
                <div className="h-6 overflow-hidden rounded bg-muted">
                  <div className="h-full rounded bg-primary/70 transition-all" style={{ width: `${step.pct}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Top nhà hàng</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topRestaurants.map((r, i) => (
              <div key={r.name} className="flex items-center gap-3">
                <span className="w-4 text-xs font-medium text-muted-foreground">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex justify-between">
                    <span className="truncate text-sm font-medium">{r.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{r.revenue}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded bg-muted">
                    <div className="h-full rounded bg-primary/60" style={{ width: `${r.pct}%` }} />
                  </div>
                </div>
                <Badge variant="secondary" className="shrink-0 text-xs">{r.orders}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Retention khách hàng (%)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="pb-2 pr-4 text-left font-medium text-muted-foreground">Cohort</th>
                  {cohortWeeks.map((w) => (
                    <th key={w} className="w-10 px-1 pb-2 text-center font-medium text-muted-foreground">{w}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cohortData.map((row) => (
                  <tr key={row.cohort}>
                    <td className="py-1 pr-4 font-medium text-muted-foreground">{row.cohort}</td>
                    {row.values.map((val, j) => (
                      <td key={j} className="px-1 py-1">
                        <div className={`rounded px-1 py-1 text-center text-xs font-medium ${cohortCellClass(val)}`}>
                          {val !== null ? `${val}%` : '—'}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

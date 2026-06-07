'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TrendingUp, TrendingDown, ShoppingBag, Users, Car, DollarSign } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

type Period = 'today' | 'week' | 'month' | 'custom'

interface KpiItem {
  label: string
  value: string
  change: number
  icon: LucideIcon
  invertTrend?: boolean
}

const periods: { value: Period; label: string }[] = [
  { value: 'today', label: 'Hôm nay' },
  { value: 'week', label: 'Tuần' },
  { value: 'month', label: 'Tháng' },
  { value: 'custom', label: 'Tùy chỉnh' },
]

const kpiData: Record<Period, KpiItem[]> = {
  today: [
    { label: 'GMV', value: '₫124.5M', change: 12.4, icon: DollarSign },
    { label: 'Đơn hàng', value: '1,842', change: 8.1, icon: ShoppingBag },
    { label: 'Khách mới', value: '312', change: -3.2, icon: Users },
    { label: 'Tài xế active', value: '86', change: 5.7, icon: Car },
    { label: 'AOV', value: '₫67,590', change: 4.0, icon: DollarSign },
    { label: 'Tỉ lệ hủy', value: '2.8%', change: -0.4, icon: ShoppingBag, invertTrend: true },
  ],
  week: [
    { label: 'GMV', value: '₫892M', change: 9.2, icon: DollarSign },
    { label: 'Đơn hàng', value: '12,340', change: 6.5, icon: ShoppingBag },
    { label: 'Khách mới', value: '2,108', change: 14.3, icon: Users },
    { label: 'Tài xế active', value: '142', change: 2.1, icon: Car },
    { label: 'AOV', value: '₫72,287', change: 2.5, icon: DollarSign },
    { label: 'Tỉ lệ hủy', value: '3.1%', change: 0.2, icon: ShoppingBag, invertTrend: true },
  ],
  month: [
    { label: 'GMV', value: '₫3.64B', change: 18.7, icon: DollarSign },
    { label: 'Đơn hàng', value: '52,800', change: 15.2, icon: ShoppingBag },
    { label: 'Khách mới', value: '8,940', change: 22.1, icon: Users },
    { label: 'Tài xế active', value: '178', change: 11.3, icon: Car },
    { label: 'AOV', value: '₫68,958', change: 3.0, icon: DollarSign },
    { label: 'Tỉ lệ hủy', value: '2.9%', change: -0.6, icon: ShoppingBag, invertTrend: true },
  ],
  custom: [
    { label: 'GMV', value: '—', change: 0, icon: DollarSign },
    { label: 'Đơn hàng', value: '—', change: 0, icon: ShoppingBag },
    { label: 'Khách mới', value: '—', change: 0, icon: Users },
    { label: 'Tài xế active', value: '—', change: 0, icon: Car },
    { label: 'AOV', value: '—', change: 0, icon: DollarSign },
    { label: 'Tỉ lệ hủy', value: '—', change: 0, icon: ShoppingBag, invertTrend: true },
  ],
}

export default function AnalyticsKpiClient() {
  const [period, setPeriod] = useState<Period>('today')
  const kpis = kpiData[period]

  return (
    <div className="space-y-4">
      <div className="flex w-fit gap-1 rounded-lg bg-muted p-1">
        {periods.map((p) => (
          <Button
            key={p.value}
            variant="ghost"
            size="sm"
            onClick={() => setPeriod(p.value)}
            className={cn('px-4 text-sm', period === p.value && 'bg-background shadow-sm text-foreground')}
          >
            {p.label}
          </Button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          const isPositive = kpi.change > 0
          const isNeutral = kpi.change === 0
          const isGood = kpi.invertTrend ? !isPositive : isPositive
          return (
            <Card key={kpi.label} className="hover:shadow-elevated hover:-translate-y-0.5 transition-all">
              <CardContent className="p-5">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{kpi.label}</span>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold">{kpi.value}</p>
                {!isNeutral && (
                  <div className={cn('mt-1 flex items-center gap-1 text-xs', isGood ? 'text-emerald-600' : 'text-destructive')}>
                    {isGood ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {Math.abs(kpi.change)}% so với kỳ trước
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

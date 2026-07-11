'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useLocale, useTranslations } from 'next-intl'
import type { LucideIcon } from 'lucide-react'
import { Car, DollarSign, ShoppingBag, Store, TrendingDown, TrendingUp, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { apiGet } from '@/lib/api'
import { cn } from '@/lib/utils'
import { parseAnalyticsKpis, type ApiKpiResponse } from './analytics-contract'

type Period = 'today' | '7d' | '30d'

const periods: Period[] = ['today', '7d', '30d']

const iconByKey: Record<string, LucideIcon> = {
  revenue: DollarSign,
  orders: ShoppingBag,
  users: Users,
  restaurants: Store,
  drivers: Car,
}

const kpiLabelKeys: Record<string, string> = {
  revenue: 'kpis.revenue',
  orders: 'kpis.orders',
  users: 'kpis.users',
  restaurants: 'kpis.restaurants',
  drivers: 'kpis.drivers',
}

const localeTags: Record<string, string> = {
  en: 'en-US',
  ja: 'ja-JP',
  vi: 'vi-VN',
}

function formatDelta(delta: number, locale: string): string {
  return new Intl.NumberFormat(localeTags[locale] ?? 'vi-VN', {
    maximumFractionDigits: 1,
    style: 'percent',
  }).format(Math.abs(delta))
}

function KpiSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton key={index} className="h-28 rounded-lg" />
      ))}
    </div>
  )
}

export default function AnalyticsKpiClient() {
  const t = useTranslations('analytics')
  const locale = useLocale()
  const [period, setPeriod] = useState<Period>('today')

  const { data, error, isError, isLoading, refetch } = useQuery<ApiKpiResponse>({
    queryKey: ['admin-analytics-kpis', period],
    queryFn: async () => parseAnalyticsKpis(await apiGet<unknown>('/admin/kpis', { params: { period } })),
  })

  const isForbidden = (error as { status?: number } | null)?.status === 403
  const kpis = data?.kpis

  return (
    <div className="space-y-4">
      <div className="flex w-fit gap-1 rounded-lg bg-muted p-1">
        {periods.map(value => (
          <Button
            key={value}
            variant="ghost"
            size="sm"
            onClick={() => setPeriod(value)}
            className={cn('px-4 text-sm', period === value && 'bg-background text-foreground shadow-sm')}
          >
            {t(`periods.${value}`)}
          </Button>
        ))}
      </div>

      {isLoading ? <KpiSkeleton /> : null}

      {isError ? (
        <Card>
          <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">{isForbidden ? t('errors.permissionTitle') : t('errors.loadTitle')}</p>
              <p className="text-sm text-muted-foreground">
                {isForbidden ? t('errors.permissionDescription') : t('errors.loadDescription')}
              </p>
            </div>
            {!isForbidden ? (
              <Button variant="outline" onClick={() => void refetch()}>
                {t('actions.retry')}
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && !isError && kpis?.length === 0 ? (
        <Card>
          <CardContent className="p-5">
            <p className="font-medium">{t('empty.kpisTitle')}</p>
            <p className="text-sm text-muted-foreground">{t('empty.kpisDescription')}</p>
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && !isError && kpis && kpis.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {kpis.map(kpi => {
            const Icon = iconByKey[kpi.key] ?? TrendingUp
            const isNeutral = kpi.delta === 0
            const isPositive = kpi.delta > 0
            const labelKey = kpiLabelKeys[kpi.key]

            return (
              <Card key={kpi.key} className="transition-all hover:-translate-y-0.5 hover:shadow-elevated">
                <CardContent className="p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {labelKey ? t(labelKey) : kpi.label}
                    </span>
                    <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  </div>
                  <p className="text-2xl font-bold">{kpi.formattedValue}</p>
                  {!isNeutral ? (
                    <div
                      className={cn(
                        'mt-1 flex items-center gap-1 text-xs',
                        isPositive ? 'text-emerald-700 dark:text-emerald-400' : 'text-destructive',
                      )}
                    >
                      {isPositive ? (
                        <TrendingUp className="h-3 w-3" aria-hidden="true" />
                      ) : (
                        <TrendingDown className="h-3 w-3" aria-hidden="true" />
                      )}
                      {t('deltaCompared', { value: formatDelta(kpi.delta, locale) })}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

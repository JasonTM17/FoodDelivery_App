'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useLocale, useTranslations } from 'next-intl'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { apiGet } from '@/lib/api'
import { parseAnalyticsCharts } from './analytics-contract'
import { buildFunnel, formatCurrency, formatInteger, formatPercent, type AdminChartsData } from './analytics-chart-data'

const dateLocaleTags: Record<string, string> = {
  en: 'en-US',
  ja: 'ja-JP',
  vi: 'vi-VN',
}

function formatDateLabel(date: string, locale: string): string {
  return new Intl.DateTimeFormat(dateLocaleTags[locale] ?? 'vi-VN', {
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(`${date}T00:00:00`))
}

function ChartSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-64 rounded-lg" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
      <Skeleton className="h-40 rounded-lg" />
    </div>
  )
}

export default function AnalyticsChartsClient() {
  const t = useTranslations('analytics')
  const locale = useLocale()

  const { data, error, isError, isLoading, refetch } = useQuery<AdminChartsData>({
    queryKey: ['admin-analytics-charts', '30d'],
    queryFn: async () => parseAnalyticsCharts(await apiGet<unknown>('/admin/charts', { params: { period: '30d' } })),
  })

  const isForbidden = (error as { status?: number } | null)?.status === 403
  const funnelSteps = useMemo(() => buildFunnel(data?.orderStatus ?? []), [data?.orderStatus])
  const topRestaurants = data?.topRestaurants ?? []
  const retention = data?.retention ?? []
  const maxRevenue = Math.max(...topRestaurants.map(restaurant => restaurant.revenue), 0)
  const hasFunnelData = funnelSteps.some(step => step.value > 0)
  const hasRestaurants = topRestaurants.length > 0
  const totalNewCustomers = retention.reduce((sum, row) => sum + row.newCustomers, 0)
  const totalRetainedCustomers = retention.reduce((sum, row) => sum + row.retainedCustomers, 0)
  const overallRetentionRate = totalNewCustomers > 0 ? (totalRetainedCustomers / totalNewCustomers) * 100 : 0
  const visibleRetention = retention.filter(row => row.newCustomers > 0).slice(-14)
  const hasRetention = totalNewCustomers > 0

  if (isLoading) return <ChartSkeleton />

  if (isError) {
    return (
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
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t('charts.funnelTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {hasFunnelData ? (
              funnelSteps.map(step => (
                <div key={step.key}>
                  <div className="mb-1 flex justify-between gap-3">
                    <span className="text-sm text-muted-foreground">{t(`charts.funnel.${step.key}`)}</span>
                    <span className="text-sm font-medium">
                      {formatInteger(step.value, locale)} ({step.percent.toFixed(1)}%)
                    </span>
                  </div>
                  <div
                    className="h-6 overflow-hidden rounded bg-muted"
                    role="meter"
                    aria-label={t(`charts.funnel.${step.key}`)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(step.percent)}
                  >
                    <div className="h-full rounded bg-primary/70 transition-all" style={{ width: `${step.percent}%` }} />
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed p-4">
                <p className="font-medium">{t('empty.funnelTitle')}</p>
                <p className="text-sm text-muted-foreground">{t('empty.funnelDescription')}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t('charts.topRestaurantsTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {hasRestaurants ? (
              topRestaurants.map((restaurant, index) => {
                const percent = maxRevenue > 0 ? (restaurant.revenue / maxRevenue) * 100 : 0

                return (
                  <div key={restaurant.id} className="flex items-center gap-3">
                    <span className="w-4 text-xs font-medium text-muted-foreground">{index + 1}</span>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex justify-between gap-3">
                        <span className="truncate text-sm font-medium">{restaurant.name}</span>
                        <span className="ml-2 text-xs text-muted-foreground">
                          {formatCurrency(restaurant.revenue, locale)}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded bg-muted">
                        <div className="h-full rounded bg-primary/60" style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                    <Badge variant="secondary" className="shrink-0 text-xs">
                      {formatInteger(restaurant.orderCount, locale)}
                    </Badge>
                  </div>
                )
              })
            ) : (
              <div className="rounded-lg border border-dashed p-4">
                <p className="font-medium">{t('empty.restaurantsTitle')}</p>
                <p className="text-sm text-muted-foreground">{t('empty.restaurantsDescription')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t('charts.retentionTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasRetention ? (
            <>
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-2xl font-semibold">{formatPercent(overallRetentionRate, locale)}</p>
                <p className="text-sm text-muted-foreground">
                  {t('charts.retentionSummary', {
                    retained: formatInteger(totalRetainedCustomers, locale),
                    total: formatInteger(totalNewCustomers, locale),
                  })}
                </p>
              </div>
              <div className="space-y-3">
                {visibleRetention.map(row => {
                  const dateLabel = formatDateLabel(row.date, locale)

                  return (
                    <div key={row.date} className="grid gap-2 sm:grid-cols-[7rem,1fr,9rem] sm:items-center">
                      <div>
                        <p className="text-sm font-medium">{dateLabel}</p>
                        <p className="text-xs text-muted-foreground">
                          {t('charts.retentionNewCustomers', { count: formatInteger(row.newCustomers, locale) })}
                        </p>
                      </div>
                      <div
                        className="h-3 overflow-hidden rounded-full bg-muted"
                        role="meter"
                        aria-label={t('charts.retentionCohortLabel', {
                          date: dateLabel,
                          newCustomers: formatInteger(row.newCustomers, locale),
                          retained: formatInteger(row.retainedCustomers, locale),
                        })}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={Math.round(row.retentionRate)}
                      >
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${Math.min(Math.max(row.retentionRate, 0), 100)}%` }}
                        />
                      </div>
                      <div className="text-sm text-muted-foreground sm:text-right">
                        <span className="font-medium text-foreground">{formatPercent(row.retentionRate, locale)}</span>
                        {' · '}
                        {t('charts.retentionRetainedCustomers', {
                          count: formatInteger(row.retainedCustomers, locale),
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          ) : (
            <div className="rounded-lg border border-dashed p-4">
              <p className="font-medium">{t('empty.retentionTitle')}</p>
              <p className="text-sm text-muted-foreground">{t('empty.retentionDescription')}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

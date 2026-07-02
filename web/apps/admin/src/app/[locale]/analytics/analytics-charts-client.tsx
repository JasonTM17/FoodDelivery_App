'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useLocale, useTranslations } from 'next-intl'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { apiGet } from '@/lib/api'
import { buildFunnel, formatCurrency, formatInteger, type AdminChartsData } from './analytics-chart-data'

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
    queryFn: () => apiGet<AdminChartsData>('/admin/charts', { params: { period: '30d' } }),
  })

  const isForbidden = (error as { status?: number } | null)?.status === 403
  const funnelSteps = useMemo(() => buildFunnel(data?.orderStatus ?? []), [data?.orderStatus])
  const topRestaurants = data?.topRestaurants ?? []
  const maxRevenue = Math.max(...topRestaurants.map(restaurant => restaurant.revenue), 0)
  const hasFunnelData = funnelSteps.some(step => step.value > 0)
  const hasRestaurants = topRestaurants.length > 0

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
        <CardContent>
          <div className="rounded-lg border border-dashed p-4">
            <p className="font-medium">{t('degraded.retentionTitle')}</p>
            <p className="text-sm text-muted-foreground">{t('degraded.retentionDescription')}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

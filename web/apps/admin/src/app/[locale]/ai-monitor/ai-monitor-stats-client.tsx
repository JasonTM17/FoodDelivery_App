'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, CheckCheck, DollarSign, MessageSquare } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAiMonitorOverview } from './ai-monitor-query';
import type { AiMonitorStats } from './ai-monitor-types';

export default function AiMonitorStatsClient() {
  const t = useTranslations('aiMonitor');
  const { data, isLoading } = useAiMonitorOverview();
  const stats = data?.stats;

  if (isLoading) return <Skeleton className="h-48 rounded-lg" />;

  const chatStats = [
    {
      label: t('totalConversations'),
      value: formatMetric(stats?.totalConversations),
      icon: MessageSquare,
      color: 'text-primary',
    },
    {
      label: t('selfResolved'),
      value: formatMetric(stats?.selfResolved),
      icon: CheckCheck,
      color: 'text-emerald-500',
    },
    {
      label: t('escalated'),
      value: formatMetric(stats?.escalated),
      icon: AlertCircle,
      color: 'text-amber-500',
    },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="h-4 w-4 text-primary" />
            {t('chatStats')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {chatStats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                    <span className="text-sm text-muted-foreground">{stat.label}</span>
                  </div>
                  <span className="text-sm font-semibold">{stat.value}</span>
                </div>
              );
            })}
            <div className="border-t pt-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('resolutionRate')}</span>
                <span className="text-sm font-semibold text-emerald-600">
                  {formatPercent(stats?.resolutionRate)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <DollarSign className="h-4 w-4 text-primary" />
            {t('aiCostToday')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold">{formatCurrency(stats?.costTodayUsd)}</span>
              <span className="mb-1 text-sm text-muted-foreground">
                / {t('budget')} {formatCurrency(stats?.budgetTodayUsd)}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${budgetUsage(stats)}%` }} />
            </div>
            <div className="grid grid-cols-2 gap-4 pt-1">
              <div>
                <p className="text-xs text-muted-foreground">Input tokens</p>
                <p className="text-sm font-medium">{formatMetric(stats?.inputTokens)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Output tokens</p>
                <p className="text-sm font-medium">{formatMetric(stats?.outputTokens)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Requests</p>
                <p className="text-sm font-medium">{formatMetric(stats?.requests)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Avg latency</p>
                <p className="text-sm font-medium">
                  {stats?.averageLatencyMs != null ? `${stats.averageLatencyMs}ms` : t('notAvailable')}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function formatMetric(value: number | null | undefined): string {
  return value == null ? '—' : new Intl.NumberFormat('en-US').format(value);
}

function formatPercent(value: number | null | undefined): string {
  return value == null ? '—' : `${value.toFixed(1)}%`;
}

function formatCurrency(value: number | null | undefined): string {
  return value == null ? '—' : `$${value.toFixed(2)}`;
}

function budgetUsage(stats: Pick<AiMonitorStats, 'costTodayUsd' | 'budgetTodayUsd'> | undefined): number {
  if (!stats?.costTodayUsd || !stats.budgetTodayUsd) return 0;
  return Math.min(100, Math.max(0, (stats.costTodayUsd / stats.budgetTodayUsd) * 100));
}

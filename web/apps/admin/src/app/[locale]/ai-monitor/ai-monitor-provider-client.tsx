'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@foodflow/ui/empty-state';
import { Bot, ExternalLink, Gauge, ServerCog, XCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAiMonitorOverview } from './ai-monitor-query';
import type { AiMonitorStatus } from './ai-monitor-types';

function StatusBadge({ status }: { status: AiMonitorStatus }) {
  const t = useTranslations('aiMonitor');

  if (status === 'online') {
    return (
      <Badge className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20">
        <span aria-hidden="true">●</span> {t('statusOnline')}
      </Badge>
    );
  }

  if (status === 'degraded') {
    return <Badge variant="warning"><span aria-hidden="true">●</span> {t('statusDegraded')}</Badge>;
  }

  return <Badge variant="secondary"><span aria-hidden="true">●</span> {t('statusNotConfigured')}</Badge>;
}

export default function AiMonitorProviderClient() {
  const t = useTranslations('aiMonitor');
  const { data, isError, isLoading, refetch } = useAiMonitorOverview();

  if (isLoading) return <ProviderSkeleton />;

  if (isError || !data) {
    return (
      <EmptyState
        icon={XCircle}
        title={t('loadErrorTitle')}
        description={t('loadErrorDescription')}
        actionLabel={t('retry')}
        onAction={() => refetch()}
      />
    );
  }

  return (
    <Card className="overflow-hidden border-border/70 shadow-sm">
      <CardHeader className="border-b bg-muted/30">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bot className="h-5 w-5 text-primary" />
            {t('providerInstance', { provider: 'DeepSeek' })}
          </CardTitle>
          <StatusBadge status={data.instance.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-5 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border bg-background p-4">
            <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
              <ServerCog className="h-4 w-4" />
              {t('model')}
            </div>
            <p className="font-mono text-sm font-semibold">{data.instance.model}</p>
          </div>
          <div className="rounded-lg border bg-background p-4">
            <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Gauge className="h-4 w-4" />
              {t('telemetry')}
            </div>
            <p className="text-sm font-semibold">{t('telemetryUnavailable')}</p>
          </div>
        </div>

        {data.instance.degradedReason ? (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-900">
            {t('degradedReason')}: <span className="font-mono">{data.instance.degradedReason}</span>
          </div>
        ) : null}

        {data.instance.dashboardUrl ? (
          <Button variant="outline" size="sm" asChild>
            <a href={data.instance.dashboardUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              {t('openDashboard')}
            </a>
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">{t('dashboardUnavailable')}</p>
        )}
      </CardContent>
    </Card>
  );
}

function ProviderSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full rounded-lg" />
      <Skeleton className="h-56 rounded-lg" />
    </div>
  );
}

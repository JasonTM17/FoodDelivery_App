'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@foodflow/ui/empty-state';
import {
  Bot,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Gauge,
  Radio,
  RefreshCw,
  ServerCog,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useAiMonitorOverview } from './ai-monitor-query';
import type { AiMonitorStatus, AiTelemetryStatus } from './ai-monitor-types';

function StatusBadge({ status }: { status: AiMonitorStatus }) {
  const t = useTranslations('aiMonitor');

  if (status === 'online') {
    return (
      <Badge className="gap-1.5 border border-emerald-600/20 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-400">
        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
        {t('statusOnline')}
      </Badge>
    );
  }

  if (status === 'degraded') {
    return (
      <Badge variant="warning" className="gap-1.5">
        <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
        {t('statusDegraded')}
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="gap-1.5">
      <ServerCog className="h-3.5 w-3.5" aria-hidden="true" />
      {t('statusNotConfigured')}
    </Badge>
  );
}

function TelemetryBadge({ status }: { status: AiTelemetryStatus }) {
  const t = useTranslations('aiMonitor');
  const labels: Record<AiTelemetryStatus, string> = {
    live: t('telemetryLive'),
    awaiting_requests: t('telemetryAwaiting'),
    unavailable: t('telemetryUnavailable'),
  };

  return (
    <Badge variant={status === 'live' ? 'outline' : 'secondary'} className="gap-1.5 font-medium">
      <Radio className={status === 'live' ? 'h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400' : 'h-3.5 w-3.5'} aria-hidden="true" />
      {labels[status]}
    </Badge>
  );
}

export default function AiMonitorProviderClient() {
  const t = useTranslations('aiMonitor');
  const locale = useLocale();
  const { data, isError, isLoading, isFetching, refetch } = useAiMonitorOverview();

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

  const telemetry = data.instance.telemetry;
  const needsConfiguration = data.instance.status === 'not_configured';

  return (
    <Card className="overflow-hidden border-border/80 shadow-sm">
      <CardHeader className="border-b border-border/80 bg-muted/20 px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/15 bg-primary/10 text-primary">
                <Bot className="h-4 w-4" aria-hidden="true" />
              </span>
              {t('providerInstance', { provider: 'DeepSeek' })}
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{t('providerDescription')}</p>
          </div>
          <StatusBadge status={data.instance.status} />
        </div>
      </CardHeader>

      <CardContent className="space-y-4 p-0">
        <div className="grid gap-px bg-border/80 md:grid-cols-[minmax(0,1.15fr)_minmax(15rem,0.85fr)]">
          <section className="bg-background p-5" aria-labelledby="ai-model-heading">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ServerCog className="h-4 w-4" aria-hidden="true" />
              <h3 id="ai-model-heading" className="font-medium">{t('model')}</h3>
            </div>
            <p className="mt-2 break-all font-mono text-base font-semibold tabular-nums text-foreground">
              {data.instance.model}
            </p>
            <p className="mt-2 max-w-prose text-sm leading-6 text-muted-foreground">
              {t('modelDescription')}
            </p>
          </section>

          <section className="bg-background p-5" aria-labelledby="ai-telemetry-heading">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Gauge className="h-4 w-4" aria-hidden="true" />
                <h3 id="ai-telemetry-heading" className="font-medium">{t('telemetry')}</h3>
              </div>
              <TelemetryBadge status={telemetry.status} />
            </div>
            <dl className="mt-4 space-y-3 text-sm">
              <MetricRow
                label={t('lastRequest')}
                value={formatDate(telemetry.lastRequestAt, locale, t('notAvailable'))}
              />
              <MetricRow
                label={t('lastSuccessfulRequest')}
                value={formatDate(telemetry.lastSuccessfulRequestAt, locale, t('notAvailable'))}
              />
              {telemetry.lastFailureCode ? (
                <MetricRow label={t('lastFailure')} value={telemetry.lastFailureCode} mono />
              ) : null}
            </dl>
          </section>
        </div>

        {needsConfiguration ? (
          <section
            className="mx-5 rounded-lg border border-amber-500/35 bg-amber-500/5 p-4"
            aria-live="polite"
            data-testid="ai-monitor-configuration-needed"
          >
            <div className="flex gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-400" aria-hidden="true" />
              <div>
                <h3 className="font-medium text-foreground">{t('configurationRequiredTitle')}</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{t('configurationRequiredDescription')}</p>
              </div>
            </div>
          </section>
        ) : null}

        {data.instance.degradedReason && !needsConfiguration ? (
          <section className="mx-5 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-sm" aria-live="polite">
            <span className="font-medium text-foreground">{t('degradedReason')}: </span>
            <code className="break-all font-mono text-xs text-amber-800 dark:text-amber-300">
              {data.instance.degradedReason}
            </code>
          </section>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/80 px-5 py-4">
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
            {t('telemetrySourceNote')}
          </p>
          <div className="flex items-center gap-2">
            {data.instance.dashboardUrl ? (
              <Button variant="outline" size="sm" className="min-h-11" asChild>
                <a href={data.instance.dashboardUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" aria-hidden="true" />
                  {t('openDashboard')}
                </a>
              </Button>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="min-h-11"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={isFetching ? 'mr-2 h-4 w-4 animate-spin' : 'mr-2 h-4 w-4'} aria-hidden="true" />
              {t('refresh')}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MetricRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={mono ? 'break-all text-right font-mono text-xs font-medium text-foreground' : 'text-right font-medium tabular-nums text-foreground'}>
        {value}
      </dd>
    </div>
  );
}

function formatDate(value: string | null, locale: string, unavailable: string): string {
  if (!value) return unavailable;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return unavailable;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function ProviderSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-14 w-full rounded-lg" />
      <Skeleton className="h-72 rounded-lg" />
    </div>
  );
}

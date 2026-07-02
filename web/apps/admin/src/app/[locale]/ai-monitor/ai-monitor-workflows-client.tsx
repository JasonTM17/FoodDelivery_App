'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState } from '@foodflow/ui/empty-state';
import { Activity, CheckCircle2, Clock, ExternalLink, XCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAiMonitorOverview } from './ai-monitor-query';
import type { AiMonitorExecution, AiMonitorStatus } from './ai-monitor-types';

function StatusBadge({ status }: { status: AiMonitorStatus }) {
  if (status === 'online') {
    return (
      <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20">
        ● Online
      </Badge>
    );
  }
  if (status === 'degraded') return <Badge variant="warning">● Degraded</Badge>;
  return <Badge variant="secondary">● Not configured</Badge>;
}

function ExecutionStatusIcon({ status }: { status: AiMonitorExecution['status'] }) {
  if (status === 'success') return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
  if (status === 'running') return <Clock className="h-4 w-4 text-amber-500" />;
  return <XCircle className="h-4 w-4 text-destructive" />;
}

export default function AiMonitorWorkflowsClient() {
  const t = useTranslations('aiMonitor');
  const { data, isError, isLoading, refetch } = useAiMonitorOverview();

  if (isLoading) return <WorkflowSkeleton />;

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

  const providerName = data.instance.provider === 'deepseek' ? 'DeepSeek' : 'N8N';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Activity className="h-4 w-4 text-emerald-500" />
          <span className="text-sm font-medium">{t('providerInstance', { provider: providerName })}</span>
          {data.instance.model ? (
            <Badge variant="outline" className="font-mono text-xs">{data.instance.model}</Badge>
          ) : null}
          <StatusBadge status={data.instance.status} />
        </div>
        {data.instance.dashboardUrl ? (
          <Button variant="outline" size="sm" asChild>
            <a href={data.instance.dashboardUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              {t('openDashboard')}
            </a>
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled>
            <ExternalLink className="mr-2 h-4 w-4" />
            {t('dashboardUnavailable')}
          </Button>
        )}
      </div>

      {data.instance.degradedReason && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4 text-sm text-amber-800">
            {t('degradedReason')}: <span className="font-mono">{data.instance.degradedReason}</span>
          </CardContent>
        </Card>
      )}

      {data.workflows.length === 0 ? (
        <EmptyState
          icon={Activity}
          title={t('noWorkflowsTitle')}
          description={t('noWorkflowsDescription')}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {data.workflows.map((workflow) => (
            <Card key={workflow.id} className="transition-all hover:-translate-y-0.5 hover:shadow-elevated">
              <CardContent className="p-4">
                <p className="mb-2 text-xs font-medium text-muted-foreground">{workflow.name}</p>
                <StatusBadge status={workflow.status} />
                <p className="mt-2 text-xs text-muted-foreground">
                  {t('runs')}: {workflow.runs ?? t('unknown')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {workflow.lastRunAt ?? t('notAvailable')}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t('recentExecutions')}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {data.executions.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={Clock}
                title={t('noExecutionsTitle')}
                description={t('noExecutionsDescription')}
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Workflow</TableHead>
                  <TableHead>Trigger</TableHead>
                  <TableHead>{t('duration')}</TableHead>
                  <TableHead>{t('status')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.executions.map((execution) => (
                  <TableRow key={execution.id}>
                    <TableCell className="font-medium">{execution.workflowName}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {execution.trigger ?? t('notAvailable')}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {execution.durationMs != null
                        ? `${(execution.durationMs / 1000).toFixed(2)}s`
                        : t('notAvailable')}
                    </TableCell>
                    <TableCell>
                      <ExecutionStatusIcon status={execution.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function WorkflowSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full rounded-lg" />
      <Skeleton className="h-32 rounded-lg" />
      <Skeleton className="h-64 rounded-lg" />
    </div>
  );
}

'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { apiGet } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { PageHeader } from '@/components/layout/admin-page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, CheckCircle2, XCircle, Clock, Activity } from 'lucide-react';
import { Link } from '@/navigation';

interface WorkflowRun {
  id: string;
  workflowName: string;
  trigger: string;
  status: 'success' | 'error' | 'running';
  startedAt: string;
  finishedAt: string | null;
  durationMs: number | null;
  inputData: Record<string, unknown> | null;
  outputData: Record<string, unknown> | null;
  errorMessage: string | null;
  executionId: string;
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'success')
    return <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"><CheckCircle2 className="mr-1 h-3 w-3" />Thành công</Badge>;
  if (status === 'error')
    return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" />Lỗi</Badge>;
  return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" />Đang chạy</Badge>;
}

export default function AiMonitorRunDetailPage({
  params,
}: {
  params: { runId: string };
}) {
  const { runId } = params;
  const t = useTranslations('aiMonitorDetail');

  const { data: run, isLoading } = useQuery<WorkflowRun>({
    queryKey: ['ai-monitor-run', runId],
    queryFn: () => apiGet<WorkflowRun>(`/admin/ai-monitor/runs/${runId}`),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-72 animate-pulse rounded bg-muted" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 h-48 animate-pulse rounded-lg bg-muted" />
          <div className="h-48 animate-pulse rounded-lg bg-muted" />
        </div>
      </div>
    );
  }

  if (!run) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <p className="text-destructive">Không tìm thấy lần chạy này</p>
        <Button asChild><Link href="/ai-monitor">Quay lại</Link></Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: 'Admin' },
          { label: t('breadcrumbParent'), href: '/ai-monitor' },
          { label: `#${run.executionId}` },
        ]}
        title={run.workflowName}
        description={t('description')}
        actions={
          <Button variant="ghost" size="sm" asChild>
            <Link href="/ai-monitor">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('back')}
            </Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="h-4 w-4 text-primary" />
                {t('executionDetails')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('executionId')}</span>
                <span className="font-mono text-xs">{run.executionId}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('trigger')}</span>
                <Badge variant="outline">{run.trigger}</Badge>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('startedAt')}</span>
                <span>{formatDate(run.startedAt)}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('finishedAt')}</span>
                <span>{run.finishedAt ? formatDate(run.finishedAt) : '—'}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('duration')}</span>
                <span>{run.durationMs != null ? `${(run.durationMs / 1000).toFixed(2)}s` : '—'}</span>
              </div>
            </CardContent>
          </Card>

          {run.errorMessage && (
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-destructive">
                  <XCircle className="h-4 w-4" />
                  {t('errorMessage')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="overflow-auto rounded bg-destructive/10 p-3 text-xs text-destructive">
                  {run.errorMessage}
                </pre>
              </CardContent>
            </Card>
          )}

          {run.inputData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('inputData')}</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="overflow-auto rounded bg-muted p-3 text-xs">
                  {JSON.stringify(run.inputData, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}

          {run.outputData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('outputData')}</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="overflow-auto rounded bg-muted p-3 text-xs">
                  {JSON.stringify(run.outputData, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('summary')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t('status')}</span>
                <StatusBadge status={run.status} />
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t('workflow')}</span>
                <span className="text-right text-xs font-medium">{run.workflowName}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

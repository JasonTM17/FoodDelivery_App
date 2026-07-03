'use client';

import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

type WorkflowRunStatus = 'success' | 'error' | 'running';

export function AiMonitorRunStatusBadge({ status }: { status: WorkflowRunStatus }) {
  const t = useTranslations('aiMonitorDetail');

  if (status === 'success') {
    return (
      <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20">
        <CheckCircle2 className="mr-1 h-3 w-3" />
        {t('statusSuccess')}
      </Badge>
    );
  }

  if (status === 'error') {
    return (
      <Badge variant="destructive">
        <XCircle className="mr-1 h-3 w-3" />
        {t('statusError')}
      </Badge>
    );
  }

  return (
    <Badge variant="secondary">
      <Clock className="mr-1 h-3 w-3" />
      {t('statusRunning')}
    </Badge>
  );
}

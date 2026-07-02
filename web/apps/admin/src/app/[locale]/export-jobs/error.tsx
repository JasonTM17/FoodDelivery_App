'use client';

import { AlertTriangle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

export default function ExportJobsError({ reset }: { reset: () => void }) {
  const t = useTranslations('exportJobs');

  return (
    <div className="flex h-96 flex-col items-center justify-center gap-4">
      <AlertTriangle aria-hidden="true" className="h-12 w-12 text-destructive" />
      <div className="text-center">
        <p className="text-lg font-semibold">{t('loadError')}</p>
        <p className="text-sm text-muted-foreground">{t('loadErrorDescription')}</p>
      </div>
      <Button onClick={reset}>{t('retry')}</Button>
    </div>
  );
}

'use client';

import { useTranslations } from 'next-intl';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OverviewError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('overview');

  return (
    <div role="alert" className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" aria-hidden="true" />
      <div>
        <h2 className="font-semibold">{t('errorTitle')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('errorDescription')}</p>
      </div>
      <Button onClick={reset}>{t('retry')}</Button>
    </div>
  );
}

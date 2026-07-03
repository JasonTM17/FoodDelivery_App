'use client';

import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { AlertTriangle } from 'lucide-react';

export default function RootError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('rootStates.error');

  return (
    <div className="flex h-96 flex-col items-center justify-center gap-4" role="alert">
      <AlertTriangle className="h-12 w-12 text-destructive" />
      <div className="text-center">
        <h2 className="text-lg font-semibold">{t('title')}</h2>
        <p className="text-sm text-muted-foreground">
          {t('description')}
        </p>
      </div>
      <Button onClick={reset}>{t('retry')}</Button>
    </div>
  );
}

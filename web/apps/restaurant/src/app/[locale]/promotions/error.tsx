'use client';

import { AlertTriangle } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function PromotionsListError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('promotions');
  return (
    <div className="flex h-64 flex-col items-center justify-center gap-4 text-center">
      <AlertTriangle className="h-10 w-10 text-destructive" />
      <p className="text-sm font-medium">{t('listError')}</p>
      <p className="text-xs text-muted-foreground">{error.message}</p>
      <button
        onClick={reset}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
      >
        {t('retry')}
      </button>
    </div>
  );
}

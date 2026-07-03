'use client';

import { useTranslations } from 'next-intl';

export default function RootLoading() {
  const t = useTranslations('rootStates.loading');

  return (
    <div
      className="flex h-96 items-center justify-center"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-2">
        <div
          className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"
          aria-hidden="true"
        />
        <p className="text-sm text-muted-foreground">{t('label')}</p>
      </div>
    </div>
  );
}

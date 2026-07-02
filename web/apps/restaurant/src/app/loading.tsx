'use client';

import { useTranslations } from 'next-intl';

export default function RestaurantRootLoading() {
  const t = useTranslations('rootStates.loading');

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-gray-50"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-3">
        <div
          className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"
          aria-hidden="true"
        />
        <p className="text-sm text-gray-500">{t('label')}</p>
      </div>
    </div>
  );
}

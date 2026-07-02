'use client';

import { useTranslations } from 'next-intl';

export default function OrderDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('orderDetail');

  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
        <span className="text-2xl font-bold text-red-600">!</span>
      </div>
      <h2 className="mb-2 text-lg font-semibold text-gray-900">{t('errorTitle')}</h2>
      <p className="mb-6 max-w-md text-center text-sm text-gray-500">
        {error.message || t('loadError')}
      </p>
      <button onClick={reset} className="btn-primary">
        {t('retry')}
      </button>
    </div>
  );
}

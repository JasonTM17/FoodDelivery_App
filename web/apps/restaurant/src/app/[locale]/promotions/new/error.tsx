'use client';

import { useTranslations } from 'next-intl';

export default function PromotionNewError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('promotions.newPage.errorBoundary');

  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-4">
        <span className="text-red-600 text-2xl font-bold">!</span>
      </div>
      <h2 className="text-lg font-semibold text-gray-900 mb-2">{t('title')}</h2>
      <p className="text-sm text-gray-500 mb-6 text-center max-w-md">
        {error.message || t('description')}
      </p>
      <button onClick={reset} className="btn-primary">
        {t('retry')}
      </button>
    </div>
  );
}

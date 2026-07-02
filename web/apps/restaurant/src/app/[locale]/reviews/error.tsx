'use client';

import { useTranslations } from 'next-intl';

export default function ReviewsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('reviews.errorBoundary');

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-4">
        <span className="text-red-600 text-2xl font-bold">!</span>
      </div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('title')}</h2>
      <p className="text-sm text-gray-500 mb-6 max-w-md text-center">
        {error.message || t('description')}
      </p>
      <button onClick={reset} className="btn-primary">{t('retry')}</button>
    </div>
  );
}

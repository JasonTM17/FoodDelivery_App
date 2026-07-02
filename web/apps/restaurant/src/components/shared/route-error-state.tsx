'use client';

import { cn } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useId } from 'react';

export type RouteErrorFeature =
  | 'analytics'
  | 'insights'
  | 'login'
  | 'menuEdit'
  | 'menuCategories'
  | 'menu'
  | 'menuNew'
  | 'notifications'
  | 'orderDetail'
  | 'orders'
  | 'promotions'
  | 'promotionNew'
  | 'revenue'
  | 'reviews'
  | 'settings'
  | 'settingsHours'
  | 'settingsProfile'
  | 'staff'
  | 'root';

export interface RouteErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

interface RouteErrorStateProps extends RouteErrorProps {
  feature: RouteErrorFeature;
  fullScreen?: boolean;
}

export function RouteErrorState({
  error,
  reset,
  feature,
  fullScreen = false,
}: RouteErrorStateProps) {
  const t = useTranslations('routeErrors');
  const titleId = useId();
  const reference = error.digest?.slice(0, 64);

  return (
    <section
      className={cn(
        'flex flex-col items-center justify-center px-4 py-20 text-center',
        fullScreen && 'min-h-screen bg-gradient-to-br from-brand-50 to-orange-100',
        !fullScreen && 'min-h-[60vh]',
      )}
      role="alert"
      aria-labelledby={titleId}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
        <AlertTriangle className="h-7 w-7 text-red-600" aria-hidden="true" />
      </div>
      <h1 id={titleId} className="mb-2 text-xl font-semibold text-gray-900">
        {t(`${feature}.title`)}
      </h1>
      <p className="mb-4 max-w-md text-sm text-gray-500">
        {t(`${feature}.description`)}
      </p>
      {reference && (
        <p className="mb-6 text-xs text-gray-400">
          {t('reference', { reference })}
        </p>
      )}
      <button type="button" onClick={reset} className="btn-primary">
        {t('retry')}
      </button>
    </section>
  );
}

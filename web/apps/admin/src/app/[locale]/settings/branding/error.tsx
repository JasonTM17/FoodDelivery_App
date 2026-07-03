'use client';

import { AdminRouteErrorState } from '@/components/shared/admin-route-error-state';
import { useTranslations } from 'next-intl';

export default function SettingsBrandingError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('routeErrors');

  return (
    <AdminRouteErrorState
      title={t('settingsBranding.title')}
      description={t('genericDescription')}
      retryLabel={t('retry')}
      reset={reset}
      backHref="/settings"
      backLabel={t('backToSettings')}
    />
  );
}

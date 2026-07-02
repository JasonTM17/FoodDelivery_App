'use client';

import { useTranslations } from 'next-intl';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DriverMapError({ reset }: { error: Error; reset: () => void }) {
  const t = useTranslations('driverMap');

  return (
    <div className="flex min-h-[480px] items-center justify-center rounded-lg border bg-card p-6 text-center">
      <div className="max-w-md space-y-4">
        <AlertTriangle className="mx-auto h-10 w-10 text-destructive" />
        <div>
          <h2 className="text-lg font-semibold">{t('renderErrorTitle')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t('renderErrorDescription')}</p>
        </div>
        <Button onClick={reset}>{t('retry')}</Button>
      </div>
    </div>
  );
}

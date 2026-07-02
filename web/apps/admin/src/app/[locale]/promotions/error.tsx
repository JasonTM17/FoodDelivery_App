'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function PromotionsError({ reset }: { reset: () => void }) {
  const t = useTranslations('adminPromotionManagement');

  return (
    <div className="flex h-64 flex-col items-center justify-center gap-4">
      <AlertTriangle className="h-12 w-12 text-destructive" />
      <div className="text-center">
        <h2 className="text-lg font-semibold">{t('loadError')}</h2>
        <p className="text-sm text-muted-foreground">{t('loadErrorDescription')}</p>
      </div>
      <Button onClick={reset}>{t('retry')}</Button>
    </div>
  );
}

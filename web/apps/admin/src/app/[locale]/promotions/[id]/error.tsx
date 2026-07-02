'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { Link } from '@/navigation';

export default function PromotionDetailError({ reset }: { reset: () => void }) {
  const t = useTranslations('promotionDetail');

  return (
    <div className="flex h-64 flex-col items-center justify-center gap-4">
      <AlertTriangle className="h-12 w-12 text-destructive" />
      <div className="text-center">
        <h2 className="text-lg font-semibold">{t('loadError')}</h2>
        <p className="text-sm text-muted-foreground">{t('loadErrorDescription')}</p>
      </div>
      <div className="flex gap-2">
        <Button onClick={reset}>{t('retry')}</Button>
        <Button variant="outline" asChild>
          <Link href="/promotions">{t('back')}</Link>
        </Button>
      </div>
    </div>
  );
}

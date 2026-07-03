'use client';

import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/navigation';

export default function RestaurantApproveError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('restaurantApprove');

  return (
    <div className="flex h-64 flex-col items-center justify-center gap-4" role="alert">
      <AlertTriangle className="h-12 w-12 text-destructive" />
      <div className="text-center">
        <h2 className="text-lg font-semibold">{t('errorTitle')}</h2>
        <p className="text-sm text-muted-foreground">{t('errorDescription')}</p>
      </div>
      <div className="flex gap-2">
        <Button onClick={reset}>{t('retry')}</Button>
        <Button variant="outline" asChild>
          <Link href="/restaurants">{t('back')}</Link>
        </Button>
      </div>
    </div>
  );
}

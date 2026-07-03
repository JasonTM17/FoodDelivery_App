'use client';

import { useTranslations } from 'next-intl';
import { AlertTriangle } from 'lucide-react';
import { Link } from '@/navigation';
import { Button } from '@/components/ui/button';

export default function UserDetailError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('userDetail');

  return (
    <div role="alert" className="flex h-64 flex-col items-center justify-center gap-4">
      <AlertTriangle className="h-12 w-12 text-destructive" aria-hidden="true" />
      <div className="text-center">
        <h2 className="text-lg font-semibold">{t('errorTitle')}</h2>
        <p className="text-sm text-muted-foreground">{t('errorDescription')}</p>
      </div>
      <div className="flex gap-2">
        <Button onClick={reset}>{t('retry')}</Button>
        <Button variant="outline" asChild>
          <Link href="/users">{t('back')}</Link>
        </Button>
      </div>
    </div>
  );
}

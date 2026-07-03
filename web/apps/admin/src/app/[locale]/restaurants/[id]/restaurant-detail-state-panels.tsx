'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/navigation';
import { Button } from '@/components/ui/button';

export function RestaurantDetailLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 animate-pulse rounded bg-muted" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="h-48 animate-pulse rounded-lg bg-muted lg:col-span-2" />
        <div className="h-48 animate-pulse rounded-lg bg-muted" />
      </div>
    </div>
  );
}

export function RestaurantDetailEmptyState() {
  const t = useTranslations('restaurantDetail');

  return (
    <div className="flex h-64 flex-col items-center justify-center gap-4">
      <p className="text-destructive">{t('notFound')}</p>
      <Button asChild>
        <Link href="/restaurants">{t('back')}</Link>
      </Button>
    </div>
  );
}

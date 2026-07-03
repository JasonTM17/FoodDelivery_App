'use client';

import { useTranslations } from 'next-intl';
import { ArrowLeft } from 'lucide-react';
import { Link } from '@/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import type { Restaurant } from './restaurant-detail-types';

export function RestaurantDetailHeader({
  restaurant,
  onToggleStatus,
}: {
  restaurant: Restaurant;
  onToggleStatus: () => void;
}) {
  const t = useTranslations('restaurantDetail');
  const isActive = restaurant.status === 'active';

  return (
    <div className="flex items-center gap-4">
      <Button variant="ghost" size="icon" asChild>
        <Link href="/restaurants" aria-label={t('back')}>
          <ArrowLeft className="h-5 w-5" />
        </Link>
      </Button>
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">{restaurant.name}</h1>
          <Badge variant={isActive ? 'success' : 'secondary'}>
            {isActive ? t('statusActive') : t('statusDisabled')}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{restaurant.cuisine}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">{t('activationLabel')}</span>
        <Switch
          checked={isActive}
          onCheckedChange={onToggleStatus}
          aria-label={t('toggleStatus', { name: restaurant.name })}
        />
      </div>
    </div>
  );
}

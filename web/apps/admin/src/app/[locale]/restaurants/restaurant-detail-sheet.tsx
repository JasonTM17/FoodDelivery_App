'use client';

import { useTranslations } from 'next-intl';
import { Star, Store } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

export interface RestaurantDetail {
  id: string;
  name: string;
  owner?: { name?: string; email?: string; phone?: string };
  cuisine: string;
  rating: number;
  totalOrders: number;
  status: string;
  address: string;
  createdAt: string;
}

interface RestaurantDetailSheetProps {
  restaurant: RestaurantDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: (id: string, currentStatus: string) => void;
}

export default function RestaurantDetailSheet({
  restaurant,
  open,
  onOpenChange,
  onStatusChange,
}: RestaurantDetailSheetProps) {
  const t = useTranslations('restaurantDetail');

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{t('title')}</SheetTitle>
          <SheetDescription>{restaurant?.name || ''}</SheetDescription>
        </SheetHeader>
        {restaurant && (
          <div className="mt-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Store className="h-5 w-5 text-primary" />
                <span className="text-lg font-semibold">{restaurant.name}</span>
              </div>
              <Badge variant={restaurant.status === 'active' ? 'success' : 'secondary'}>
                {restaurant.status === 'active' ? t('statusActive') : t('statusDisabled')}
              </Badge>
            </div>

            <Separator />

            <div className="space-y-3 text-sm">
              <h4 className="font-medium">{t('ownerTitle')}</h4>
              <div className="space-y-1 rounded-lg bg-muted/50 p-3">
                <p>
                  <span className="text-muted-foreground">{t('ownerFields.name')}:</span>{' '}
                  {restaurant.owner?.name ?? '—'}
                </p>
                <p>
                  <span className="text-muted-foreground">{t('ownerFields.email')}:</span>{' '}
                  {restaurant.owner?.email ?? '—'}
                </p>
                <p>
                  <span className="text-muted-foreground">{t('ownerFields.phone')}:</span>{' '}
                  {restaurant.owner?.phone ?? '—'}
                </p>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <DetailRow label={t('cuisine')} value={restaurant.cuisine} />
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('rating')}</span>
                <div className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                  {restaurant.rating.toFixed(1)}
                </div>
              </div>
              <DetailRow label={t('totalOrders')} value={restaurant.totalOrders} />
              <DetailRow label={t('address')} value={restaurant.address} alignRight />
              <DetailRow label={t('createdAt')} value={formatDate(restaurant.createdAt)} />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{t('activationLabel')}</span>
              <Switch
                checked={restaurant.status === 'active'}
                onCheckedChange={() => onStatusChange(restaurant.id, restaurant.status)}
                aria-label={t('toggleStatus', { name: restaurant.name })}
              />
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function DetailRow({
  label,
  value,
  alignRight,
}: {
  label: string;
  value: string | number;
  alignRight?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={alignRight ? 'max-w-[200px] text-right' : undefined}>{value}</span>
    </div>
  );
}

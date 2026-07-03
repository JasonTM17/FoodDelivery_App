'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatDate } from '@/lib/utils';
import { Mail, MapPin, Phone, Store } from 'lucide-react';
import { useTranslations } from 'next-intl';

export interface PendingRestaurant {
  id: string;
  name: string;
  cuisine: string;
  address: string;
  owner: { name: string; email: string; phone: string };
  description: string;
  submittedAt: string;
  status: string;
  businessLicense: string | null;
}

function getStatusVariant(status: string): 'default' | 'secondary' | 'destructive' {
  if (status === 'active') return 'default';
  if (status === 'pending') return 'secondary';
  return 'destructive';
}

export function RestaurantApprovalInfoCards({ restaurant }: { restaurant: PendingRestaurant }) {
  const t = useTranslations('restaurantApprove');
  const statusLabels: Record<string, string> = {
    active: t('statusActive'),
    deleted: t('statusDeleted'),
    disabled: t('statusDisabled'),
    pending: t('statusPending'),
    rejected: t('statusRejected'),
  };
  const statusLabel = statusLabels[restaurant.status] ?? t('statusUnknown', {
    status: restaurant.status,
  });

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Store className="h-4 w-4 text-primary" />
            {t('restaurantInfo')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('name')}</span>
            <span className="font-medium">{restaurant.name}</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('cuisine')}</span>
            <span>{restaurant.cuisine}</span>
          </div>
          <Separator />
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <span>{restaurant.address}</span>
          </div>
          {restaurant.description && (
            <>
              <Separator />
              <p className="text-muted-foreground">{restaurant.description}</p>
            </>
          )}
          <Separator />
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('submittedAt')}</span>
            <span>{formatDate(restaurant.submittedAt)}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('ownerInfo')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center gap-2">
            <Store className="h-4 w-4 text-muted-foreground" />
            <span>{restaurant.owner?.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span>{restaurant.owner?.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{restaurant.owner?.phone}</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('currentStatus')}</span>
            <Badge variant={getStatusVariant(restaurant.status)}>{statusLabel}</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

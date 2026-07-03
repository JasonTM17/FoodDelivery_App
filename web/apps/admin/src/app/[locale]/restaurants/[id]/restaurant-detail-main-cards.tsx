'use client';

import { useTranslations } from 'next-intl';
import { MapPin, Store } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import OrderStatusBadge from '@/components/badges/order-status-badge';
import type { Restaurant } from './restaurant-detail-types';

export function RestaurantMainCards({ restaurant }: { restaurant: Restaurant }) {
  return (
    <div className="space-y-6 lg:col-span-2">
      <RestaurantInformationCard restaurant={restaurant} />
      <RecentOrdersCard restaurant={restaurant} />
    </div>
  );
}

function RestaurantInformationCard({ restaurant }: { restaurant: Restaurant }) {
  const t = useTranslations('restaurantDetail');

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('informationTitle')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {restaurant.description && (
          <p className="text-sm text-muted-foreground">{restaurant.description}</p>
        )}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{restaurant.address}</span>
          </div>
          <div className="flex items-center gap-2">
            <Store className="h-4 w-4 text-muted-foreground" />
            <span>{restaurant.cuisine}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RecentOrdersCard({ restaurant }: { restaurant: Restaurant }) {
  const t = useTranslations('restaurantDetail');
  const recentOrders = restaurant.recentOrders ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('recentOrdersTitle')}</CardTitle>
        <CardDescription>{t('recentOrdersDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        {recentOrders.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('columns.orderCode')}</TableHead>
                <TableHead>{t('columns.customer')}</TableHead>
                <TableHead>{t('columns.status')}</TableHead>
                <TableHead className="text-right">{t('columns.total')}</TableHead>
                <TableHead>{t('columns.date')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.orderCode}</TableCell>
                  <TableCell>{order.customer?.name ?? '—'}</TableCell>
                  <TableCell>
                    <OrderStatusBadge status={order.status} />
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(order.total)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(order.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {t('emptyRecentOrders')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

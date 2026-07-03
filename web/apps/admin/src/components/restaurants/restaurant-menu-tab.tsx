'use client';

import { useTranslations } from 'next-intl';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Utensils } from 'lucide-react';
import { EmptyState } from '@foodflow/ui/empty-state';
import { apiGet, apiPatch } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  available: boolean;
}

interface MenuCategory {
  category: string;
  items: MenuItem[];
}

export default function RestaurantMenuTab({ restaurantId }: { restaurantId: string }) {
  const t = useTranslations('restaurantMenuTab');
  const queryClient = useQueryClient();
  const query = useQuery<{ categories: MenuCategory[] }>({
    queryKey: ['restaurant-menu', restaurantId],
    queryFn: () => apiGet(`/admin/restaurants/${restaurantId}/menu`),
  });
  const availabilityMutation = useMutation({
    mutationFn: ({ itemId, available }: { itemId: string; available: boolean }) =>
      apiPatch(`/admin/restaurants/${restaurantId}/menu/${itemId}`, { available }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['restaurant-menu', restaurantId] }),
  });

  if (query.isLoading) {
    return (
      <div role="status" aria-live="polite" aria-label={t('loading')} className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-32 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  if (query.isError) {
    return (
      <div role="alert">
        <EmptyState
          icon={AlertCircle}
          title={t('loadErrorTitle')}
          description={t('loadErrorDescription')}
          actionLabel={t('retry')}
          onAction={() => void query.refetch()}
        />
      </div>
    );
  }

  if (!query.data?.categories?.length) {
    return <EmptyState icon={Utensils} title={t('emptyTitle')} description={t('emptyDescription')} />;
  }

  return (
    <div className="space-y-6">
      {availabilityMutation.isError && (
        <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {t('updateError')}
        </p>
      )}

      {query.data.categories.map((category) => (
        <Card key={category.category}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{category.category}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('columns.name')}</TableHead>
                  <TableHead>{t('columns.price')}</TableHead>
                  <TableHead>{t('columns.status')}</TableHead>
                  <TableHead className="w-24">{t('columns.active')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {category.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{formatCurrency(item.price)}</TableCell>
                    <TableCell>
                      <Badge variant={item.available ? 'success' : 'secondary'}>
                        {item.available ? t('available') : t('hidden')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={item.available}
                        disabled={availabilityMutation.isPending}
                        aria-label={t('toggleAvailability', { name: item.name })}
                        onCheckedChange={(available) =>
                          availabilityMutation.mutate({ itemId: item.id, available })
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
